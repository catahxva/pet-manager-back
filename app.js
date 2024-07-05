// imports:
import Fastify from "fastify";
import authRouter from "./routers/authRouter.js";
import errorHandler from "./handlers/errorHandler.js";

// create app
const fastifyApp = Fastify({ logger: true });

const startingPrefix = `/pet-manager/api`;

// register routes
fastifyApp.register(authRouter, { prefix: `${startingPrefix}/auth` });

// global error handler
fastifyApp.setErrorHandler(errorHandler);

// export app
export default fastifyApp;
