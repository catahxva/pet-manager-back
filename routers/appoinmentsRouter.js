import appointmentsController from "../controllers/appointmentsController.js";
import authMiddleware from "../middleware/authMiddleware.js";
import generalMiddleware from "../middleware/generalMiddleware.js";
import appointmentsMiddleware from "../middleware/appointmentsMiddleware.js";
import appointmentsValidationMiddleware from "../middleware/appointmentsValidationMiddleware.js";
import petsMiddleware from "../middleware/petsMiddleware.js";
import blacklistedTokenMiddleware from "../middleware/blacklistedTokenMiddleware.js";

const appoinmentsRouter = function (fastify, _options, done) {
  fastify.decorate("token", "");
  fastify.decorate("jwtId", "");
  fastify.decorate("jwtIat", "");
  fastify.decorate("jwtExp", "");
  fastify.decorate("noUser", "");
  fastify.decorate("userData", "");
  fastify.decorate("user", "");
  fastify.decorate("startTimeStamp", "");
  fastify.decorate("endTimeStamp", "");
  fastify.decorate("startTSDiff", "");
  fastify.decorate("endTSDiff", "");
  fastify.decorate("apptRef", "");
  fastify.decorate("apptData", "");
  fastify.decorate("validationErrors", "");

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
        generalMiddleware.checkDateInfoAppointment,
        appointmentsValidationMiddleware.validateCreateAppointment,
        generalMiddleware.checkValidationErrors,
        appointmentsMiddleware.setTimeStampsCreate,
        appointmentsMiddleware.checkForAppointmentInTimeFrame,
      ],
    },
    appointmentsController.createAppointment
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
        appointmentsMiddleware.checkAppointmentExists,
        appointmentsMiddleware.setTimeStampsPatch,
        appointmentsMiddleware.checkForAppointmentInTimeFrame,
        appointmentsValidationMiddleware.validateUpdateAppointment,
        generalMiddleware.checkValidationErrors,
      ],
    },
    appointmentsController.updateAppointment
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
        appointmentsMiddleware.checkAppointmentExists,
      ],
    },
    appointmentsController.removeAppointment
  );

  done();
};

export default appoinmentsRouter;
