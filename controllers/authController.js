// imports:
import bcrypt from "bcrypt";
import db from "../db.js";
import validateData from "../utils/validateData.js";
import checkDataUniqueness from "../utils/checkDataUniqueness.js";
import FieldToValidate from "../utils/FieldToValidate.js";
import FieldToCheckUniqueness from "../utils/FieldToCheckUniqueness.js";
import isEmptyObject from "../utils/isEmptyObject.js";
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
import { ComplexError, GenericError } from "../utils/CustomErrors.js";
import createCrypto32Token from "../utils/createCrypto32Token.js";

// CONTROLLER FOR:
//              - SIGNUP
//              - RESENDING VERIFICATION LINK
//              - VERIFYING ACCOUNT
//              - LOGGING IN
//              - LOGGING OUT
//              - FORGOT PASS FN
//              - RESET PASS

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
    const [verifyEmailToken, verifyEmailTokenExpirationTime] =
      createCrypto32Token(process.env.VERIFY_ACCOUNT_TOKEN_EXPIRATION_TIME);

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
    await sendEmail({
      to: email,
      subject: "Verify account",
      text: verifyEmailToken,
    });
  });

  // send response
  res.code(200).send({
    status: process.env.RES_STATUS_SUCCESS,
    message: authSuccessMessages.signup(email),
  });
};

// function roles:
//  - extract data
//  - validate data
//  - update email token
//  - send new email
//  - send new res

// throws error if:
//  - invalid user input
//  - unexpected error

const resendVerification = async function (req, res) {
  // extract data
  const {
    userData,
    userRef,
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

  // update user with a new verification token && send email
  await db.runTransaction(async (transaction) => {
    // create token
    const [verifyEmailToken, verifyEmailTokenExpirationTime] =
      createCrypto32Token(process.env.VERIFY_ACCOUNT_TOKEN_EXPIRATION_TIME);

    // update user
    transaction.update(userRef, {
      verifyEmailToken,
      verifyEmailTokenExpirationTime,
    });

    // send email
    await sendEmail({
      to: userData.email,
      subject: "Verify Account",
      text: verifyEmailToken,
    });
  });

  // send response
  res.code(200).send({
    status: process.env.RES_STATUS_SUCCESS,
    message: authSuccessMessages.resend(userData.email),
  });
};

// function roles:
//  - extract data
//  - update user doc
//  - create jwt token
//  - send res

// throws error if:
//  - unexpected error

const verifyAccount = async function (req, res) {
  const { userDoc, userRef } = req;

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
//  - extract data
//  - validate data
//  - compare passwords
//  - create jwt token
//  - send res

// throws error if:
//  - passwords dont match
//  - unexpected error

const login = async function (req, res) {
  // extract data
  const {
    userDoc,
    userData,
    body: { username, email, password },
  } = req;

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

  // compare passwords
  const passwordsMatch = await bcrypt.compare(password, userData.password);

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
//  - unexpected error

const logout = async function (req, res) {
  // extract token
  const { token } = req;

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
//  - extract data
//  - validate data
//  - create token
//  - update user
//  - send email
//  - send response

// throws error if:
//  - invalid user input
//  - unexpected errof

const forgotPass = async function (req, res) {
  // extract data
  const {
    userData,
    userRef,
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

  // create token && update user && send email
  await db.runTransaction(async (transaction) => {
    // create token
    const [changePasswordToken, changePasswordTokenExpirationTime] =
      createCrypto32Token(process.env.CHANGE_PASS_TOKEN_EXPIRATION_TIME);

    // update user
    transaction.update(userRef, {
      changePasswordToken,
      changePasswordTokenExpirationTime,
    });

    // send email
    await sendEmail({
      to: userData.email,
      subject: "Forgot Pass",
      text: changePasswordToken,
    });
  });

  // send response
  res.code(200).send({
    status: process.env.RES_STATUS_SUCCESS,
    message: authSuccessMessages.forgot_pass(userData.email),
  });
};

// function roles:
//  - extract data
//  - validate data
//  - update the password

// throws error if:
//  - invalid user input
//  - unexpected error

const resetPass = async function (req, res) {
  // extract data
  const {
    userRef,
    body: { password },
  } = req;

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
