import mealsController from "../controllers/mealsController.js";
import authMiddleware from "../middleware/authMiddleware.js";
import petsMiddleware from "../middleware/petsMiddleware.js";
import daysMiddleware from "../middleware/daysMiddleware.js";
import mealsMiddleware from "../middleware/mealsMiddleware.js";
import mealsValidationMiddleware from "../middleware/mealsValidationMiddleware.js";
import generalMiddleware from "../middleware/generalMiddleware.js";

// router for:
//  - creating a meal
//  - updating meal
//  - removing meal

const mealsRouter = function (fastify, _options, done) {
  // decorators:
  fastify.decorate("token", "");
  fastify.decorate("user", "");
  fastify.decorate("pet", "");
  fastify.decorate("day", "");
  fastify.decorate("dayRef", "");
  fastify.decorate("monitoringByMeals", "");
  fastify.decorate("monitoringByCalories", "");
  fastify.decorate("validationErrors", "");
  fastify.decorate("meal", "");
  fastify.decorate("mealRef", "");

  // routes:
  fastify.post(
    "/",
    {
      preHandler: [
        authMiddleware.getTokenFromHeaders,
        authMiddleware.protectRoute,
        petsMiddleware.extractPetIdBody,
        petsMiddleware.checkPetExists,
        daysMiddleware.checkDayExists,
        mealsMiddleware.documentsCorrespond,
        mealsValidationMiddleware.validateMealPost,
        generalMiddleware.checkValidationErrors,
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
        petsMiddleware.extractPetIdBody,
        petsMiddleware.checkPetExists,
        daysMiddleware.checkDayExists,
        mealsMiddleware.documentsCorrespond,
        mealsValidationMiddleware.validateMealPatch,
        generalMiddleware.checkValidationErrors,
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
        petsMiddleware.extractPetIdBody,
        petsMiddleware.checkPetExists,
        daysMiddleware.checkDayExists,
        mealsMiddleware.documentsCorrespond,
        mealsMiddleware.checkMealExists,
      ],
    },
    mealsController.removeMeal
  );

  // done functoin call:
  done();
};

export default mealsRouter;
