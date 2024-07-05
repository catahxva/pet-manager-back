import petsController from "../controllers/petsController.js";
import authMiddleware from "../middleware/authMiddleware.js";

// router for creating a pet, updating, removing a pet

const petsRouter = function (fastify, _options, done) {
  // decorate req obj to allow user property
  fastify.decorate("user", "");

  // routing
  fastify.post(
    "/",
    { preHandler: authMiddleware.protectRoute },
    petsController.createPet
  );

  // done function
  done();
};

export default petsRouter;
