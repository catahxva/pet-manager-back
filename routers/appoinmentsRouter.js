import appointmentsController from "../controllers/appointmentsController.js";
import authMiddleware from "../middleware/authMiddleware.js";
import generalMiddleware from "../middleware/generalMiddleware.js";
import appointmentsMiddleware from "../middleware/appointmentsMiddleware.js";
import petsMiddleware from "../middleware/petsMiddleware.js";

const appoinmentsRouter = function (fastify, _options, done) {
  fastify.decorate("user", "");
  fastify.decorate("startTimeStamp", "");
  fastify.decorate("endTimeStamp", "");

  fastify.post(
    "/",
    {
      preHandler: [
        authMiddleware.getTokenFromHeaders,
        authMiddleware.protectRoute,
        petsMiddleware.extractPetIdBody,
        petsMiddleware.checkPetExists,
        generalMiddleware.checkDateInfoAppointment,
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
      ],
    },
    appointmentsController.updateAppointment
  );

  done();
};

export default appoinmentsRouter;
