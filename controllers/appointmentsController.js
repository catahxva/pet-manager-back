import db from "../db.js";
import appointmentAllowedFields from "../utils/allowedFields/appoinmentAllowedFields.js";
import validateData from "../utils/validateData.js";
import keepAllowedFieldsOnObj from "../utils/keepAllowedFieldsOnObj.js";
import FieldToValidate from "../utils/FieldToValidate.js";
import isEmptyObject from "../utils/isEmptyObject.js";
import { getOneByCriteria } from "../utils/dbMethods.js";
import Criteria from "../utils/Criteria.js";
import { ComplexError, GenericError } from "../utils/CustomErrors.js";
import { appointmentsValidationErrorMessages } from "../utils/messages/appointmentsMessages.js";

// function roles:
//  - extract data
//  - validate data
//  - create new appt
//  - send back res

// throws err if:
//  - invalid user input
//  - unexpected err

const createAppointment = async function (req, res) {
  // extract data
  const {
    user: { id: userId },
    body,
    startTimeStamp,
    endTimeStamp,
  } = req;
  const { startHour, startMinute, endHour, endMinute, description, type } =
    body;

  // validate data

  const validationErrors = validateData(
    [
      new FieldToValidate(typeof startHour !== "number", "start_hour_invalid"),
      new FieldToValidate(
        typeof startMinute !== "number",
        "start_minute_invalid"
      ),
      new FieldToValidate(typeof endHour !== "number", "end_hour_invalid"),
      new FieldToValidate(typeof endMinute !== "number", "end_minute_invalid"),
      new FieldToValidate(!description, "description"),
      new FieldToValidate(!type, "type"),
      new FieldToValidate(
        type !== process.env.APPOINTMENTS_TYPE_VET &&
          type !== process.env.APPOINTMENTS_TYPE_GROOM &&
          type !== process.env.APPOINTMENTS_TYPE_OTHER,
        "type_invalid"
      ),
    ],
    appointmentsValidationErrorMessages
  );

  if (!isEmptyObject(validationErrors))
    throw new ComplexError({
      errorType: process.env.ERROR_TYPE_VALIDATION,
      errorsObject: validationErrors,
    });

  // create new appointment
  const collectionRef = db.collection(process.env.DB_COLLECTION_APPOINTMENTS);
  const newAppointmentRef = collectionRef.doc();

  await newAppointmentRef.set(
    keepAllowedFieldsOnObj(
      { startTimeStamp, endTimeStamp, userId, ...body },
      appointmentAllowedFields
    )
  );

  // send back res
  res.code(200).send({
    status: process.env.RES_STATUS_SUCCESS,
    message: "Appointment created successfully",
  });
};

const updateAppointment = async function (req, res) {};

const appointmentsController = { createAppointment, updateAppointment };

export default appointmentsController;
