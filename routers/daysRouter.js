import daysController from "../controllers/daysController.js";
import authMiddleware from "../middleware/authMiddleware.js";
import petsMiddleware from "../middleware/petsMiddleware.js";
import generalMiddleware from "../middleware/generalMiddleware.js";

// router for:
//  - create day

// router:
const daysRouter = function (fastify, _options, done) {
  // decorators:
  fastify.decorate("token", "");
  fastify.decorate("user", "");
  fastify.decorate("pet", "");

  // routes:
  fastify.post(
    "/",
    {
      preHandler: [
        authMiddleware.getTokenFromHeaders,
        authMiddleware.protectRoute,
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
