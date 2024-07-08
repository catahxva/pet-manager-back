import foodsController from "../controllers/foodsController.js";

const foodsRouter = function (fastify, _options, done) {
  fastify.post("/", foodsController.createFood);

  done();
};

export default foodsRouter;
