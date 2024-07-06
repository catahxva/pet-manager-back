import mealsController from "../controllers/mealsController.js";
import authMiddleware from "../middleware/authMiddleware.js";

const mealsRouter = function (fastify, _options, done) {
  fastify.decorate("user", "");

  fastify.post(
    "/",
    { preHandler: authMiddleware.protectRoute },
    mealsController.createMeal
  );

  done();
};

export default mealsRouter;
