// imports:
import fastifyApp from "./app.js";
import dotenv from "dotenv";

import crypto from "crypto";

console.log(crypto.randomBytes(128).toString("hex"));

// read config file
dotenv.config({ path: "./config.env" });

const port = process.env.SERVER_PORT;

// function to start server
const startServer = function () {
  try {
    fastifyApp.listen({ port });

    console.log(`Server is running on: ${port}`);
  } catch (err) {
    console.log(`Error with server: `, err);
  }
};

startServer();
