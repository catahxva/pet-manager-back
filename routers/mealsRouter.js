import mealsController from "../controllers/mealsController.js";
import authMiddleware from "../middleware/authMiddleware.js";
import petsMiddleware from "../middleware/petsMiddleware.js";
import daysMiddleware from "../middleware/daysMiddleware.js";
import mealsMiddleware from "../middleware/mealsMiddleware.js";
import mealsValidationMiddleware from "../middleware/mealsValidationMiddleware.js";
import generalMiddleware from "../middleware/generalMiddleware.js";
import blacklistedTokenMiddleware from "../middleware/blacklistedTokenMiddleware.js";

// router for:
//  - creating a meal
//  - updating meal
//  - removing meal

const mealsRouter = function (fastify, _options, done) {
  // decorators:
  fastify.decorate("token", "");
  fastify.decorate("jwtId", "");
  fastify.decorate("jwtIat", "");
  fastify.decorate("jwtExp", "");
  fastify.decorate("noUser", "");
  fastify.decorate("userData", "");
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
        blacklistedTokenMiddleware.checkForBlacklistedToken,
        authMiddleware.decodeAuthToken,
        authMiddleware.checkIfTokenExpired,
        authMiddleware.getUserDocById,
        authMiddleware.checkUserExists,
        authMiddleware.checkUserChangedPass,
        authMiddleware.checkIfUserNotVerified,
        petsMiddleware.extractPetIdBody,
        petsMiddleware.checkPetExists,
        daysMiddleware.checkDayExists,
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
        blacklistedTokenMiddleware.checkForBlacklistedToken,
        authMiddleware.decodeAuthToken,
        authMiddleware.checkIfTokenExpired,
        authMiddleware.getUserDocById,
        authMiddleware.checkUserExists,
        authMiddleware.checkUserChangedPass,
        authMiddleware.checkIfUserNotVerified,
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
        blacklistedTokenMiddleware.checkForBlacklistedToken,
        authMiddleware.decodeAuthToken,
        authMiddleware.checkIfTokenExpired,
        authMiddleware.getUserDocById,
        authMiddleware.checkUserExists,
        authMiddleware.checkUserChangedPass,
        authMiddleware.checkIfUserNotVerified,
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
