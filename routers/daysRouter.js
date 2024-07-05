import daysController from "../controllers/daysController.js";

const daysRouter = function (fastify, _options, done) {
  // routing
  fastify.post("/", daysController.createDay);

  // done function
  done();
};

export default daysRouter;
