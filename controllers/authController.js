// imports:
import crypto from "crypto";
import bcrypt from "bcrypt";
import db from "../db.js";
import validateData from "../utils/validateData.js";
import checkDataUniqueness from "../utils/checkDataUniqueness.js";
import FieldToValidate from "../utils/FieldToValidate.js";
import FieldToCheckUniqueness from "../utils/FieldToCheckUniqueness.js";
import Criteria from "../utils/Criteria.js";
import isEmptyObject from "../utils/isEmptyObject.js";
import extractTokenFromHeaders from "../utils/extractTokenFromHeaders.js";
import keepAllowedFieldsOnObj from "../utils/keepAllowedFieldsOnObj.js";
import authAllowedFields from "../utils/allowedFields/authAllowedFields.js";
import sendEmail from "../utils/sendEmail.js";
import createJWTToken from "../utils/createJWTToken.js";
import {
  authValidationErrorMessages,
  authUniquenessErrorMessages,
  authErrorMessages,
  authSuccessMessages,
} from "../utils/messages/authMessages.js";
import { getOneByCriteria } from "../utils/dbMethods.js";
import { ComplexError, GenericError } from "../utils/CustomErrors.js";

// function roles:
//  - extract necessary data from request body
//  - validate data based on criteria
//  - create user account
//  - set a verification token on the user account
//      which is to be used later
//  - send email to the provided email address with
//      the verification token so the user can
//      verify their account

// throws error if:
//  - expected data is not provided
//  - data cannot be validated
//  - data is not unique
//  - user doc creation fails
//  - email sending fails
//  - unexpected error

const signup = async function (req, res, done) {
  // data extraction
  const body = req.body;
  const { username, email, password } = body;

  // data validation

  // validation error
  const validationErrors = validateData(
    [
      new FieldToValidate(!username, "username"),
      new FieldToValidate(!email, "email"),
      new FieldToValidate(!password, "password"),
      new FieldToValidate(username && username.length < 6, "username_length"),
      new FieldToValidate(email && !email.includes("@"), "email_valid"),
      new FieldToValidate(password && password.length < 8, "password_length"),
    ],
    authValidationErrorMessages
  );

  if (!isEmptyObject(validationErrors))
    throw new ComplexError({
      errorType: process.env.ERROR_TYPE_VALIDATION,
      errorsObject: validationErrors,
    });

  // uniqueness error
  const uniquenessErrors = await checkDataUniqueness(
    db,
    process.env.DB_COLLECTION_USERS,
    [
      new FieldToCheckUniqueness("username", username),
      new FieldToCheckUniqueness("email", email),
    ],
    authUniquenessErrorMessages
  );

  if (!isEmptyObject(uniquenessErrors))
    throw new ComplexError({
      errorType: process.env.ERROR_TYPE_UNIQUENESS,
      errorsObject: uniquenessErrors,
    });

  // create token && create user && send email
  await db.runTransaction(async (transaction) => {
    // create token
    const verifyEmailToken = crypto.randomBytes(32).toString("hex");
    const verifyEmailTokenExpirationTime =
      Date.now() + process.env.VERIFY_ACCOUNT_TOKEN_EXPIRATION_TIME;

    // set verified status as false
    const verified = false;

    // hash password
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // set created at
    const createdAt = Date.now();

    // create user
    const collectionRef = db.collection(process.env.DB_COLLECTION_USERS);
    const newUserRef = collectionRef.doc();

    const userData = {
      ...body,
      password: hashedPassword,
      verifyEmailToken,
      verifyEmailTokenExpirationTime,
      verified,
      createdAt,
    };

    transaction.set(
      newUserRef,
      keepAllowedFieldsOnObj(userData, authAllowedFields)
    );

    // send email
    const emailTo = email;
    const emailSubject = "Verify account";
    const emailText = verifyEmailToken;

    await sendEmail(emailTo, emailSubject, emailText);
  });

  // send response
  res.code(200).send({
    status: process.env.RES_STATUS_SUCCESS,
    message: authSuccessMessages.signup(email),
  });
};

// function roles:
//  - extract email/username from req body
//  - find user based on provided credential
//  - create verification token
//  - add the verification token to the found user doc
//  - send a new email to the email address of the user

// throws error if:
//  - no user was found based on received credentials
//  - unexpected error

const resendVerification = async function (req, res) {
  // extract data
  const {
    body: { username, email },
  } = req;

  const validationErrors = validateData(
    [new FieldToValidate(!username && !email, "credential")],
    authValidationErrorMessages
  );

  if (!isEmptyObject(validationErrors))
    throw new ComplexError({
      errorType: process.env.ERROR_TYPE_VALIDATION,
      errorsObject: validationErrors,
    });

  // query for user based on given credential
  const receivedCredential = username || email;
  const fieldToQueryBy = username ? "username" : "email";

  const {
    empty,
    docData: userData,
    docRef: userRef,
  } = await getOneByCriteria(db, process.env.DB_COLLECTION_USERS, [
    new Criteria(fieldToQueryBy, "==", receivedCredential),
  ]);

  if (empty)
    throw new GenericError({ message: authErrorMessages.user_not_found });

  if (userData.verified)
    throw new GenericError({ message: authErrorMessages.user_not_verified });

  // update user with a new verification token && send email
  await db.runTransaction(async (transaction) => {
    // create token
    const verifyEmailToken = crypto.randomBytes(32).toString("hex");
    const verifyEmailTokenExpirationTime =
      Date.now() + process.env.VERIFY_ACCOUNT_TOKEN_EXPIRATION_TIME;

    // update user
    transaction.update(userRef, {
      verifyEmailToken,
      verifyEmailTokenExpirationTime,
    });

    // send email
    const emailTo = userData.email;
    const emailSubject = "Verify account";
    const emailText = verifyEmailToken;

    await sendEmail(emailTo, emailSubject, emailText);
  });

  // send response
  res.code(200).send({
    status: process.env.RES_STATUS_SUCCESS,
    message: authSuccessMessages.resend(userData.email),
  });
};

// function roles:
//  - extract verification token
//  - find user based on the verification token
//  - update the verified status of the user
//  - create a jwt token
//  - send the jwt token back to the client to store

// throws error if:
//  - token does not exist
//  - user is not found
//  - unexpected error

const verifyAccount = async function (req, res) {
  // extract token
  const token = extractTokenFromHeaders(req);

  if (!token)
    throw new GenericError({ message: authErrorMessages.token_not_received });

  // query for user based on token
  const {
    empty,
    doc: userDoc,
    docRef: userRef,
  } = await getOneByCriteria(db, process.env.DB_COLLECTION_USERS, [
    new Criteria("verifyEmailToken", "==", token),
  ]);

  if (empty)
    throw new GenericError({ message: authErrorMessages.user_not_found });

  // update verification status and remove current token
  await userRef.update({
    verified: true,
    verifyEmailToken: null,
    verifyEmailTokenExpirationTime: null,
  });

  // create new jwt token
  const jwt = createJWTToken({ id: userDoc.id });

  // send token to client
  res.code(200).send({
    status: process.env.RES_STATUS_SUCCESS,
    message: authSuccessMessages.verify,
    token: jwt,
  });
};

// function roles:
//  - extract data from req body
//  - find user based on the received credentials
//  - verify password
//  - verify the verified status of the account
//  - create jwt token
//  - send the jwt token back to the client

// throws error if:
//  - no user found
//  - user is not verified
//  - passwords dont match
//  - unexpected error

const login = async function (req, res) {
  // extract data
  const {
    body: { username, email, password },
  } = req;

  // validate data

  // validation error
  const validationErrors = validateData(
    [
      new FieldToValidate(!username && !email, "credential"),
      new FieldToValidate(!password, "password"),
    ],
    authValidationErrorMessages
  );

  if (!isEmptyObject(validationErrors))
    throw new ComplexError({
      errorType: process.env.ERROR_TYPE_VALIDATION,
      errorsObject: validationErrors,
    });

  // query user based on credentials
  const receivedCredential = username || email;
  const fieldToQueryBy = username ? "username" : "email";

  const {
    empty,
    doc: userDoc,
    docData: userData,
  } = await getOneByCriteria(db, process.env.DB_COLLECTION_USERS, [
    new Criteria(fieldToQueryBy, "==", receivedCredential),
  ]);

  // compare passwords
  const passwordsMatch = await bcrypt.compare(password, userData.password);

  // check if user was not found
  if (empty)
    throw new GenericError({ message: authErrorMessages.user_not_found });

  // check verified status
  if (!userData.verified)
    throw new GenericError({ message: authErrorMessages.user_not_verified });

  // check if passwords match
  if (!passwordsMatch)
    throw new GenericError({ message: authErrorMessages.pass_dont_match });

  // create jwt
  const jwt = createJWTToken({ id: userDoc.id });

  // send response
  res.code(200).send({
    status: process.env.RES_STATUS_SUCCESS,
    message: authSuccessMessages.login,
    token: jwt,
  });
};

// function roles
//  - extract token
//  - blacklist the given token

// throws error if:
//  - no token found
//  - unexpected error

const logout = async function (req, res) {
  // extract token
  const token = extractTokenFromHeaders(req);

  if (!token)
    throw new GenericError({ message: authErrorMessages.token_not_received });

  // blacklist token
  const collectionRef = db.collection(
    process.env.DB_COLLECTION_BLACKLISTED_TOKENS
  );
  const newBlacklistedTokenRef = collectionRef.doc();

  await newBlacklistedTokenRef.set({ token });

  // send response
  res.code(200).send({
    status: process.env.RES_STATUS_SUCCESS,
    message: authSuccessMessages.logout,
  });
};

// function roles
//  - extract data from req body
//  - find user based on received credentials
//  - check verified status
//  - create a password reset token
//  - update user doc with the new token
//  - send email to email address of user with the new
//      password reset token

// throws error if:
//  - no user found
//  - user is not verified
//  - unexpected error

const forgotPass = async function (req, res) {
  // extract data
  const {
    body: { username, email },
  } = req;

  // validate data
  // validation error
  const validationErrors = validateData(
    [new FieldToValidate(!username && !email, "credential")],
    authValidationErrorMessages
  );

  if (!isEmptyObject(validationErrors))
    throw new ComplexError({
      errorType: process.env.ERROR_TYPE_VALIDATION,
      errorsObject: validationErrors,
    });

  // query user based on credential
  const receivedCredential = username || email;
  const fieldToQueryBy = username ? "username" : "email";

  const {
    empty,
    docData: userData,
    docRef: userRef,
  } = await getOneByCriteria(db, process.env.DB_COLLECTION_USERS, [
    new Criteria(fieldToQueryBy, "==", receivedCredential),
  ]);

  if (empty)
    throw new GenericError({ message: authErrorMessages.user_not_found });

  if (!userData.verified)
    throw new GenericError({ message: authErrorMessages.user_not_verified });

  // create token && update user && send email
  await db.runTransaction(async (transaction) => {
    // create token
    const changePasswordToken = crypto.randomBytes(32).toString("hex");
    const changePasswordTokenExpirationTime =
      Date.now() + process.env.CHANGE_PASS_TOKEN_EXPIRATION_TIME;

    // update user
    transaction.update(userRef, {
      changePasswordToken,
      changePasswordTokenExpirationTime,
    });

    // send email
    const emailTo = userData.email;
    const emailSubject = "Forgot pass";
    const emailText = changePasswordToken;

    await sendEmail(emailTo, emailSubject, emailText);
  });

  // send response
  res.code(200).send({
    status: process.env.RES_STATUS_SUCCESS,
    message: authSuccessMessages.forgot_pass(userData.email),
  });
};

// function roles:
//  - extract data
//  - find user doc based on the extracted token
//  - update the password

// throws error if:
//  - no token
//  - no user
//  - unexpected error

const resetPass = async function (req, res) {
  // extract data
  const token = extractTokenFromHeaders(req);
  const {
    body: { password },
  } = req;

  // validate data
  if (!token)
    throw new GenericError({ message: authErrorMessages.token_not_received });

  // validation error
  const validationErrors = validateData(
    [new FieldToValidate(password.length < 8, "password_length")],
    authValidationErrorMessages
  );

  if (!isEmptyObject(validationErrors))
    throw new ComplexError({
      errorType: process.env.ERROR_TYPE_VALIDATION,
      errorsObject: validationErrors,
    });

  //query user
  const {
    empty,
    docData: userData,
    docRef: userRef,
  } = await getOneByCriteria(db, process.env.DB_COLLECTION_USERS, [
    new Criteria("changePasswordToken", "==", token),
  ]);

  if (empty)
    throw new GenericError({ message: authErrorMessages.user_not_found });

  if (!userData.verified)
    throw new GenericError({ message: authErrorMessages.user_not_verified });

  // update pass

  // hash pass
  const saltRounds = 12;
  const hashedPassword = await bcrypt.hash(password, saltRounds);

  // register the current time
  const changedPasswordAt = Date.now();

  await userRef.update({ password: hashedPassword, changedPasswordAt });

  // send response
  res.code(200).send({
    status: process.env.RES_STATUS_SUCCESS,
    message: authSuccessMessages.reset_pass,
  });
};

// auth controller is a simple object literal which will contain
// all the auth related controllers
const authController = {
  signup,
  verifyAccount,
  resendVerification,
  login,
  logout,
  forgotPass,
  resetPass,
};

export default authController;
