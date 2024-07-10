// imports:
import bcrypt from "bcrypt";
import db from "../db.js";
import checkDataUniqueness from "../utils/checkDataUniqueness.js";
import FieldToCheckUniqueness from "../utils/FieldToCheckUniqueness.js";
import isEmptyObject from "../utils/isEmptyObject.js";
import keepAllowedFieldsOnObj from "../utils/keepAllowedFieldsOnObj.js";
import authAllowedFields from "../utils/allowedFields/authAllowedFields.js";
import sendEmail from "../utils/sendEmail.js";
import createJWTToken from "../utils/createJWTToken.js";
import {
  authUniquenessErrorMessages,
  authErrorMessages,
  authSuccessMessages,
} from "../utils/messages/authMessages.js";
import { ComplexError, GenericError } from "../utils/CustomErrors.js";
import createCrypto32Token from "../utils/createCrypto32Token.js";

// function roles:
//  - extract data (1)
//  - create user (2)
//  - send email (3)
//  - send response back to client (4)

// throws err if:
//  - unexpected err

const signup = async function (req, res) {
  // 1
  const body = req.body;
  const { username, email, password } = body;

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

  // 2 && 3
  await db.runTransaction(async (transaction) => {
    const [verifyEmailToken, verifyEmailTokenExpirationTime] =
      createCrypto32Token(process.env.VERIFY_ACCOUNT_TOKEN_EXPIRATION_TIME);

    const hashedPassword = await bcrypt.hash(password, 12);

    // 2
    const collectionRef = db.collection(process.env.DB_COLLECTION_USERS);
    const newUserRef = collectionRef.doc();

    const userData = {
      ...body,
      password: hashedPassword,
      verifyEmailToken,
      verifyEmailTokenExpirationTime,
      verified: false,
      createdAt: Date.now(),
    };

    transaction.set(
      newUserRef,
      keepAllowedFieldsOnObj(userData, authAllowedFields)
    );

    // 3
    await sendEmail({
      to: email,
      subject: "Verify account",
      text: verifyEmailToken,
    });
  });

  // 4
  res.code(200).send({
    status: process.env.RES_STATUS_SUCCESS,
    message: authSuccessMessages.signup(email),
  });
};

// function roles:
//  - extract data (1)
//  - update user with new token (2)
//  - send email (3)
//  - send res back to client (4)

// throws error if:
//  - unexpected error

const resendVerification = async function (req, res) {
  // 1
  const { userData, userRef } = req;

  // 2 && 3
  await db.runTransaction(async (transaction) => {
    // 2
    const [verifyEmailToken, verifyEmailTokenExpirationTime] =
      createCrypto32Token(process.env.VERIFY_ACCOUNT_TOKEN_EXPIRATION_TIME);

    transaction.update(userRef, {
      verifyEmailToken,
      verifyEmailTokenExpirationTime,
    });

    // 3
    await sendEmail({
      to: userData.email,
      subject: "Verify Account",
      text: verifyEmailToken,
    });
  });

  // 4
  res.code(200).send({
    status: process.env.RES_STATUS_SUCCESS,
    message: authSuccessMessages.resend(userData.email),
  });
};

// function roles:
//  - extract data (1)
//  - update user doc (2)
//  - create jwt token (3)
//  - send res (4)

// throws error if:
//  - unexpected error

const verifyAccount = async function (req, res) {
  // 1
  const { userDoc, userRef } = req;

  // 2
  await userRef.update({
    verified: true,
    verifyEmailToken: null,
    verifyEmailTokenExpirationTime: null,
  });

  // 3
  const jwt = createJWTToken({ id: userDoc.id });

  // 4
  res.code(200).send({
    status: process.env.RES_STATUS_SUCCESS,
    message: authSuccessMessages.verify,
    token: jwt,
  });
};

// function roles:
//  - extract data (1)
//  - check if pass matches (2)
//  - create jwt token (3)
//  - send res to client (4)

// throws error if:
//  - passwords dont match
//  - unexpected error

const login = async function (req, res) {
  // 1
  const {
    userDoc,
    userData,
    body: { password },
  } = req;

  // 2
  const passwordsMatch = await bcrypt.compare(password, userData.password);

  if (!passwordsMatch)
    throw new GenericError({ message: authErrorMessages.pass_dont_match });

  // 3
  const jwt = createJWTToken({ id: userDoc.id });

  // 4
  res.code(200).send({
    status: process.env.RES_STATUS_SUCCESS,
    message: authSuccessMessages.login,
    token: jwt,
  });
};

// function roles
//  - extract token (1)
//  - blacklist the given token (2)
//  - send back res (3)

// throws error if:
//  - unexpected error

const logout = async function (req, res) {
  //1
  const { token } = req;

  // 2
  const collectionRef = db.collection(
    process.env.DB_COLLECTION_BLACKLISTED_TOKENS
  );
  const newBlacklistedTokenRef = collectionRef.doc();

  await newBlacklistedTokenRef.set({ token });

  // 3
  res.code(200).send({
    status: process.env.RES_STATUS_SUCCESS,
    message: authSuccessMessages.logout,
  });
};

// function roles
//  - extract data (1)
//  - update user with token (2)
//  - send email (3)
//  - send response (4)

// throws error if:
//  - unexpected error

const forgotPass = async function (req, res) {
  // 1
  const { userData, userRef } = req;

  // 2 && 3
  await db.runTransaction(async (transaction) => {
    // 2
    const [changePasswordToken, changePasswordTokenExpirationTime] =
      createCrypto32Token(process.env.CHANGE_PASS_TOKEN_EXPIRATION_TIME);

    transaction.update(userRef, {
      changePasswordToken,
      changePasswordTokenExpirationTime,
    });

    // 3
    await sendEmail({
      to: userData.email,
      subject: "Forgot Pass",
      text: changePasswordToken,
    });
  });

  // 4
  res.code(200).send({
    status: process.env.RES_STATUS_SUCCESS,
    message: authSuccessMessages.forgot_pass(userData.email),
  });
};

// function roles:
//  - extract data (1)
//  - update user with new pass (2)
//  - send back res (3)

// throws error if:
//  - unexpected error

const resetPass = async function (req, res) {
  // 1
  const {
    userRef,
    body: { password },
  } = req;

  // 2
  const saltRounds = 12;
  const hashedPassword = await bcrypt.hash(password, saltRounds);

  const changedPasswordAt = Date.now();

  await userRef.update({ password: hashedPassword, changedPasswordAt });

  // 3
  res.code(200).send({
    status: process.env.RES_STATUS_SUCCESS,
    message: authSuccessMessages.reset_pass,
  });
};

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
