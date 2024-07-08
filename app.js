// imports:
import Fastify from "fastify";
import authRouter from "./routers/authRouter.js";
import petsRouter from "./routers/petsRouter.js";
import daysRouter from "./routers/daysRouter.js";
import mealsRouter from "./routers/mealsRouter.js";
import foodsRouter from "./routers/foodsRouter.js";
import errorHandler from "./handlers/errorHandler.js";

// create app
const fastifyApp = Fastify({ logger: true });

const startingPrefix = `/pet-manager/api`;

// register routes
fastifyApp.register(authRouter, { prefix: `${startingPrefix}/auth` });
fastifyApp.register(petsRouter, { prefix: `${startingPrefix}/pets` });
fastifyApp.register(daysRouter, { prefix: `${startingPrefix}/days` });
fastifyApp.register(mealsRouter, { prefix: `${startingPrefix}/meals` });
fastifyApp.register(foodsRouter, { prefix: `${startingPrefix}/foods` });

// global error handler
fastifyApp.setErrorHandler(errorHandler);

// export app
export default fastifyApp;
