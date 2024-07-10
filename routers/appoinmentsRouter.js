import appointmentsController from "../controllers/appointmentsController.js";
import authMiddleware from "../middleware/authMiddleware.js";
import generalMiddleware from "../middleware/generalMiddleware.js";
import appointmentsMiddleware from "../middleware/appointmentsMiddleware.js";
import appointmentsValidationMiddleware from "../middleware/appointmentsValidationMiddleware.js";
import petsMiddleware from "../middleware/petsMiddleware.js";

const appoinmentsRouter = function (fastify, _options, done) {
  fastify.decorate("user", "");
  fastify.decorate("startTimeStamp", "");
  fastify.decorate("endTimeStamp", "");
  fastify.decorate("apptRef", "");
  fastify.decorate("apptData", "");
  fastify.decorate("validationErrors", "");

  fastify.post(
    "/",
    {
      preHandler: [
        authMiddleware.getTokenFromHeaders,
        authMiddleware.protectRoute,
        petsMiddleware.extractPetIdBody,
        petsMiddleware.checkPetExists,
        generalMiddleware.checkDateInfoAppointment,
        appointmentsValidationMiddleware.validateCreateAppointment,
        generalMiddleware.checkValidationErrors,
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
        authMiddleware.protectRoute,
        petsMiddleware.extractPetIdBody,
        petsMiddleware.checkPetExists,
        appointmentsMiddleware.checkAppointmentExists,
        generalMiddleware.checkDateInfoAppointment,
        appointmentsValidationMiddleware.validateUpdateAppointment,
        generalMiddleware.checkValidationErrors,
      ],
    },
    appointmentsController.updateAppointment
  );

  done();
};

export default appoinmentsRouter;
