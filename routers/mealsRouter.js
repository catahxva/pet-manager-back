import mealsController from "../controllers/mealsController.js";
import authMiddleware from "../middleware/authMiddleware.js";
import petsMiddleware from "../middleware/petsMiddleware.js";
import daysMiddleware from "../middleware/daysMiddleware.js";
import mealsMiddleware from "../middleware/mealsMiddleware.js";

const mealsRouter = function (fastify, _options, done) {
  fastify.decorate("token", "");
  fastify.decorate("user", "");
  fastify.decorate("pet", "");
  fastify.decorate("day", "");
  fastify.decorate("dayRef", "");
  fastify.decorate("monitoringByMeals", "");
  fastify.decorate("monitoringByCalories", "");
  fastify.decorate("meal", "");
  fastify.decorate("mealRef", "");

  fastify.post(
    "/",
    {
      preHandler: [
        authMiddleware.getTokenFromHeaders,
        authMiddleware.protectRoute,
        petsMiddleware.checkPetExists,
        daysMiddleware.checkDayExists,
        mealsMiddleware.documentsCorrespond,
        mealsMiddleware.validateMealDataPost,
      ],
    },
    mealsController.createMeal
  );
  fastify.patch(
    "/update/:id",
    {
      preHandler: [
        authMiddleware.getTokenFromHeaders,
        authMiddleware.protectRoute,
        petsMiddleware.checkPetExists,
        daysMiddleware.checkDayExists,
        mealsMiddleware.documentsCorrespond,
        mealsMiddleware.validateMealDataPatch,
        mealsMiddleware.checkMealExists,
      ],
    },
    mealsController.updateMeal
  );
  fastify.delete(
    "/remove/:id",
    {
      preHandler: [
        authMiddleware.getTokenFromHeaders,
        authMiddleware.protectRoute,
        petsMiddleware.checkPetExists,
        daysMiddleware.checkDayExists,
        mealsMiddleware.documentsCorrespond,
        mealsMiddleware.checkMealExists,
      ],
    },
    mealsController.removeMeal
  );

  done();
};

export default mealsRouter;
