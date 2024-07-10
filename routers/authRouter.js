// imports:
import authController from "../controllers/authController.js";
import authMiddleware from "../middleware/authMiddleware.js";
import authValidationMiddleware from "../middleware/authValidationMiddleware.js";
import generalMiddleware from "../middleware/generalMiddleware.js";

// router for:
//  - signup
//  - resend verification link
//  - verify account
//  - login
//  - logout
//  - forgot pass
//  - reset pass

// router:
const authRouter = function (fastify, _options, done) {
  // decorators:
  fastify.decorate("token", "");
  fastify.decorate("validationErrors", "");
  fastify.decorate("criteria", "");
  fastify.decorate("noUser", "");
  fastify.decorate("userDoc", "");
  fastify.decorate("userData", "");
  fastify.decorate("userRef", "");

  // routes:
  fastify.post(
    "/signup",
    {
      preHandler: [
        authValidationMiddleware.validateSignupInput,
        generalMiddleware.checkValidationErrors,
      ],
    },
    authController.signup
  );
  fastify.post(
    "/resend-verification",
    {
      preHandler: [
        authValidationMiddleware.validateResendVerification,
        generalMiddleware.checkValidationErrors,
        authMiddleware.setReceivedCredentialCriteria,
        authMiddleware.getUserDocByCriteria,
        authMiddleware.checkUserExists,
        authMiddleware.checkIfUserAlreadyVerified,
      ],
    },
    authController.resendVerification
  );
  fastify.post(
    "/verify-account",
    {
      preHandler: [
        authMiddleware.getTokenFromHeaders,
        authMiddleware.setVerifyAccountCriteria,
        authMiddleware.getUserDocByCriteria,
        authMiddleware.checkUserExists,
        authMiddleware.checkIfUserAlreadyVerified,
      ],
    },
    authController.verifyAccount
  );
  fastify.post(
    "/login",
    {
      preHandler: [
        authValidationMiddleware.validateLogin,
        generalMiddleware.checkValidationErrors,
        authMiddleware.setReceivedCredentialCriteria,
        authMiddleware.getUserDocByCriteria,
        authMiddleware.checkUserExists,
        authMiddleware.checkIfUserNotVerified,
      ],
    },
    authController.login
  );
  fastify.post(
    "/logout",
    {
      preHandler: [authMiddleware.getTokenFromHeaders],
    },
    authController.logout
  );
  fastify.post(
    "/forgot-pass",
    {
      preHandler: [
        authValidationMiddleware.validateForgotPass,
        generalMiddleware.checkValidationErrors,
        authMiddleware.setReceivedCredentialCriteria,
        authMiddleware.getUserDocByCriteria,
        authMiddleware.checkUserExists,
        authMiddleware.checkIfUserNotVerified,
      ],
    },
    authController.forgotPass
  );
  fastify.post(
    "/reset-pass",
    {
      preHandler: [
        authMiddleware.getTokenFromHeaders,
        authValidationMiddleware.validateResetPass,
        generalMiddleware.checkValidationErrors,
        authMiddleware.setResetPassCriteria,
        authMiddleware.getUserDocByCriteria,
        authMiddleware.checkUserExists,
        authMiddleware.checkIfUserNotVerified,
      ],
    },
    authController.resetPass
  );

  // done function call
  done();
};

export default authRouter;
