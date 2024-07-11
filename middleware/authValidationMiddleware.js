// imports
import validateData from "../utils/validateData.js";
import FieldToValidate from "../utils/FieldToValidate.js";
import { authValidationErrorMessages } from "../utils/messages/authMessages.js";

// Middlewares for validating user input for multiple auth functions

const validateSignupInput = function (req, _res, done) {
  const { body } = req;
  const { username, email, password } = body;

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

  req.validationErrors = validationErrors;

  done();
};

const validateResendVerification = function (req, _res, done) {
  const {
    body: { username, email },
  } = req;

  const validationErrors = validateData(
    [new FieldToValidate(!username && !email, "credential")],
    authValidationErrorMessages
  );

  req.validationErrors = validationErrors;

  done();
};

const validateLogin = function (req, _res, done) {
  const {
    body: { username, email, password },
  } = req;

  const validationErrors = validateData(
    [
      new FieldToValidate(!username && !email, "credential"),
      new FieldToValidate(!password, "password"),
    ],
    authValidationErrorMessages
  );

  req.validationErrors = validationErrors;

  done();
};

const validateForgotPass = function (req, _res, done) {
  const {
    body: { username, email },
  } = req;

  const validationErrors = validateData(
    [new FieldToValidate(!username && !email, "credential")],
    authValidationErrorMessages
  );

  req.validationErrors = validationErrors;

  done();
};

const validateResetPass = function (req, _res, done) {
  const {
    body: { password },
  } = req;

  const validationErrors = validateData(
    [new FieldToValidate(password.length < 8, "password_length")],
    authValidationErrorMessages
  );

  req.validationErrors = validationErrors;

  done();
};

const authValidationMiddleware = {
  validateSignupInput,
  validateResendVerification,
  validateLogin,
  validateForgotPass,
  validateResetPass,
};

export default authValidationMiddleware;
