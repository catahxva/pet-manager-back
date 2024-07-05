import { GenericError } from "../utils/CustomErrors.js";

const errorHandler = function (error, _req, res) {
  const customErr = error.isCustomError;
  const statusCode = customErr ? error.statusCode : 400;
  const errorObj = customErr
    ? error.errorWithoutStackTrace()
    : new GenericError({
        message: "Something went wrong. Please try again later!",
      }).errorWithoutStackTrace();

  res.code(statusCode).send(errorObj);
};

export default errorHandler;
