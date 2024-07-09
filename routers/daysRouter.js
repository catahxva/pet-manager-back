import daysController from "../controllers/daysController.js";
import authMiddleware from "../middleware/authMiddleware.js";
import petsMiddleware from "../middleware/petsMiddleware.js";
import generalMiddleware from "../middleware/generalMiddleware.js";

const daysRouter = function (fastify, _options, done) {
  fastify.decorate("token", "");
  fastify.decorate("user", "");
  fastify.decorate("pet", "");

  // routing
  fastify.post(
    "/",
    {
      preHandler: [
        authMiddleware.getTokenFromHeaders,
        authMiddleware.protectRoute,
        generalMiddleware.checkDateInfoDay,
        petsMiddleware.extractPetIdBody,
        petsMiddleware.checkPetExists,
      ],
    },
    daysController.createDay
  );

  // done function
  done();
};

export default daysRouter;
