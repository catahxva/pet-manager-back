import mealsController from "../controllers/mealsController.js";
import authMiddleware from "../middleware/authMiddleware.js";
import petsMiddleware from "../middleware/petsMiddleware.js";
import daysMiddleware from "../middleware/daysMiddleware.js";

const mealsRouter = function (fastify, _options, done) {
  fastify.decorate("user", "");
  fastify.decorate("pet", "");
  fastify.decorate("day", "");
  fastify.decorate("dayRef", "");

  fastify.post(
    "/",
    {
      preHandler: [
        authMiddleware.protectRoute,
        petsMiddleware.checkPetExists,
        daysMiddleware.checkDayExists,
      ],
    },
    mealsController.createMeal
  );
  fastify.patch(
    "/update/:id",
    {
      preHandler: [
        authMiddleware.protectRoute,
        petsMiddleware.checkPetExists,
        daysMiddleware.checkDayExists,
      ],
    },
    mealsController.updateMeal
  );

  done();
};

export default mealsRouter;
