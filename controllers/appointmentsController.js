import db from "../db.js";
import appointmentAllowedFields from "../utils/allowedFields/appoinmentAllowedFields.js";
import validateData from "../utils/validateData.js";
import keepAllowedFieldsOnObj from "../utils/keepAllowedFieldsOnObj.js";
import FieldToValidate from "../utils/FieldToValidate.js";
import isEmptyObject from "../utils/isEmptyObject.js";
import { ComplexError } from "../utils/CustomErrors.js";
import { appointmentsValidationErrorMessages } from "../utils/messages/appointmentsMessages.js";
import isNumber from "../utils/isNumber.js";

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
      new FieldToValidate(!startHour, "startHour"),
      new FieldToValidate(!isNumber(startHour), "startHour_invalid"),
      new FieldToValidate(!startMinute, "startMinute_invalid"),
      new FieldToValidate(!isNumber(startMinute), "startMinute_invalid"),
      new FieldToValidate(!endHour, "endHour"),
      new FieldToValidate(!isNumber(endHour), "endHour_invalid"),
      new FieldToValidate(!endMinute, "endMinute"),
      new FieldToValidate(!isNumber(endMinute), "endMinute_invalid"),
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

// function roles:
//  - extract data
//  - validate data
const updateAppointment = async function (req, res) {
  // extract data
  const { apptRef, body } = req;
  const { startHour, startMinute, endHour, endMinute, description, type } =
    body;

  // validate data
  const validationErrors = validateData(
    [
      new FieldToValidate(
        startHour !== undefined && !isNumber(startHour),
        "startHour_invalid"
      ),
      new FieldToValidate(
        startMinute !== undefined && !isNumber(startMinute),
        "startMinute_invalid"
      ),
      new FieldToValidate(
        endHour !== undefined && !isNumber(endHour),
        "endHour_invalid"
      ),
      new FieldToValidate(
        endMinute !== undefined && !isNumber(endMinute),
        "endMinute_invalid"
      ),
    ],
    appointmentsValidationErrorMessages
  );

  if (!isEmptyObject(validationErrors))
    throw new ComplexError({
      errorType: process.env.ERROR_TYPE_VALIDATION,
      errorsObject: validationErrors,
    });

  //
};

const removeAppointment = async function (req, res) {};

const appointmentsController = { createAppointment, updateAppointment };

export default appointmentsController;
