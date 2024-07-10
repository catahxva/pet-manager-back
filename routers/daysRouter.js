import daysController from "../controllers/daysController.js";
import authMiddleware from "../middleware/authMiddleware.js";
import petsMiddleware from "../middleware/petsMiddleware.js";
import generalMiddleware from "../middleware/generalMiddleware.js";
import blacklistedTokenMiddleware from "../middleware/blacklistedTokenMiddleware.js";

// router for:
//  - create day

// router:
const daysRouter = function (fastify, _options, done) {
  // decorators:
  fastify.decorate("token", "");
  fastify.decorate("jwtId", "");
  fastify.decorate("jwtIat", "");
  fastify.decorate("jwtExp", "");
  fastify.decorate("noUser", "");
  fastify.decorate("userData", "");
  fastify.decorate("user", "");
  fastify.decorate("pet", "");

  // get token
  // check for blacklisted token
  // decode jwt token
  // check expired
  //

  // routes:
  fastify.post(
    "/",
    {
      preHandler: [
        authMiddleware.getTokenFromHeaders,
        blacklistedTokenMiddleware.checkForBlacklistedToken,
        authMiddleware.decodeAuthToken,
        authMiddleware.checkIfTokenExpired,
        authMiddleware.getUserDocById,
        authMiddleware.checkUserExists,
        authMiddleware.checkUserChangedPass,
        authMiddleware.checkIfUserNotVerified,
        petsMiddleware.extractPetIdBody,
        petsMiddleware.checkPetExists,
        generalMiddleware.checkDateInfoDay,
      ],
    },
    daysController.createDay
  );

  // done function call
  done();
};

export default daysRouter;
