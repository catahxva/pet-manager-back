// imports:
import authController from "../controllers/authController.js";

// routing for auth (signup login etc)

const authRouter = function (fastify, _options, done) {
  // routing
  fastify.post("/signup", authController.signup);
  fastify.post("/resend-verification", authController.resendVerification);
  fastify.post("/verify-account", authController.verifyAccount);
  fastify.post("/login", authController.login);
  fastify.post("/logout", authController.logout);
  fastify.post("/forgot-pass", authController.forgotPass);
  fastify.post("/reset-pass", authController.resetPass);

  // done function
  done();
};

export default authRouter;
