import daysController from "../controllers/daysController.js";
import authMiddleware from "../middleware/authMiddleware.js";

const daysRouter = function (fastify, _options, done) {
  // routing
  fastify.post(
    "/",
    { preHandler: authMiddleware.protectRoute },
    daysController.createDay
  );

  // done function
  done();
};

export default daysRouter;
