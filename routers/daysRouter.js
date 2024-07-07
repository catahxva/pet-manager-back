import daysController from "../controllers/daysController.js";
import authMiddleware from "../middleware/authMiddleware.js";
import petsMiddleware from "../middleware/petsMiddleware.js";

const daysRouter = function (fastify, _options, done) {
  fastify.decorate("user", "");
  fastify.decorate("pet", "");

  // routing
  fastify.post(
    "/",
    {
      preHandler: [authMiddleware.protectRoute, petsMiddleware.checkPetExists],
    },
    daysController.createDay
  );

  // done function
  done();
};

export default daysRouter;
