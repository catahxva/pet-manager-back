import petsController from "../controllers/petsController.js";
import authMiddleware from "../middleware/authMiddleware.js";
import petsMiddleware from "../middleware/petsMiddleware.js";
import petsValidationMiddleware from "../middleware/petsValidationMiddleware.js";
import generalMiddleware from "../middleware/generalMiddleware.js";

// router for:
//  - create pet
//  - update pet
//  - remove pet

// router:
const petsRouter = function (fastify, _options, done) {
  // decorators:
  fastify.decorate("token", "");
  fastify.decorate("validationErrors", "");
  fastify.decorate("user", "");
  fastify.decorate("petRef", "");

  // routes:
  fastify.post(
    "/",
    {
      preHandler: [
        authMiddleware.getTokenFromHeaders,
        authMiddleware.protectRoute,
        petsValidationMiddleware.validateCreatePet,
        generalMiddleware.checkValidationErrors,
      ],
    },
    petsController.createPet
  );
  fastify.patch(
    "/update/:id",
    {
      preHandler: [
        authMiddleware.getTokenFromHeaders,
        authMiddleware.protectRoute,
        petsValidationMiddleware.validateUpdatePet,
        generalMiddleware.checkValidationErrors,
        petsMiddleware.extractPetIdParams,
        petsMiddleware.checkPetExists,
      ],
    },
    petsController.updatePet
  );
  fastify.delete(
    "/remove/:id",
    {
      preHandler: [
        authMiddleware.getTokenFromHeaders,
        authMiddleware.protectRoute,
        petsMiddleware.extractPetIdParams,
        petsMiddleware.checkPetExists,
      ],
    },
    petsController.removePet
  );

  // done function call
  done();
};

export default petsRouter;
