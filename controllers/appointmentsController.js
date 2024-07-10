import db from "../db.js";
import appointmentAllowedFields from "../utils/allowedFields/appoinmentAllowedFields.js";
import keepAllowedFieldsOnObj from "../utils/keepAllowedFieldsOnObj.js";

// function roles:
//  - extract data (1)
//  - create appointment (2)
//  - send back res

// throws err if:
//  - unexpected err

const createAppointment = async function (req, res) {
  // 1
  const {
    user: { id: userId },
    body,
    startTimeStamp,
    endTimeStamp,
  } = req;

  // 2
  const collectionRef = db.collection(process.env.DB_COLLECTION_APPOINTMENTS);
  const newAppointmentRef = collectionRef.doc();

  await newAppointmentRef.set(
    keepAllowedFieldsOnObj(
      { startTimeStamp, endTimeStamp, userId, ...body },
      appointmentAllowedFields
    )
  );

  // 3
  res.code(200).send({
    status: process.env.RES_STATUS_SUCCESS,
    message: "Appointment created successfully",
  });
};

const updateAppointment = async function (req, res) {
  const { apptRef, body } = req;

  await apptRef.update(keepAllowedFieldsOnObj(body, appointmentAllowedFields));

  res.code(200).send({
    status: process.env.RES_STATUS_SUCCESS,
    message: "Appointment updated successfully",
  });
};

const removeAppointment = async function (req, res) {
  const { apptRef } = req;

  await apptRef.delete();

  res.code(204).send({});
};

const appointmentsController = {
  createAppointment,
  updateAppointment,
  removeAppointment,
};

export default appointmentsController;
