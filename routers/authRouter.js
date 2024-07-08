// imports:
import authController from "../controllers/authController.js";
import authMiddleware from "../middleware/authMiddleware.js";

// routing for auth (signup login etc)

const authRouter = function (fastify, _options, done) {
  fastify.decorate("token", "");
  fastify.decorate("criteria", "");
  fastify.decorate("noUser", "");
  fastify.decorate("userDoc", "");
  fastify.decorate("userData", "");
  fastify.decorate("userRef", "");

  // routing
  fastify.post("/signup", authController.signup);
  fastify.post(
    "/resend-verification",
    {
      preHandler: [
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
      ],
    },
    authController.verifyAccount
  );
  fastify.post(
    "/login",
    {
      preHandler: [
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
        authMiddleware.setResetPassCriteria,
        authMiddleware.getUserDocByCriteria,
        authMiddleware.checkUserExists,
        authMiddleware.checkIfUserNotVerified,
      ],
    },
    authController.resetPass
  );

  // done function
  done();
};

export default authRouter;
