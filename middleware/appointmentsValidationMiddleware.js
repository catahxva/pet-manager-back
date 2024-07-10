import validateData from "../utils/validateData.js";
import FieldToValidate from "../utils/FieldToValidate.js";
import { appointmentsValidationErrorMessages } from "../utils/messages/appointmentsMessages.js";
import isNumber from "../utils/isNumber.js";

const validateCreateAppointment = function (req, res, done) {
  const { startHour, startMinute, endHour, endMinute, description, type } =
    body;

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

  req.validationErrors = validationErrors;

  done();
};

const validateUpdateAppointment = function (req, _res, done) {
  const { startHour, startMinute, endHour, endMinute } = body;

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

  req.validationErrors = validationErrors;

  done();
};

const appointmentsValidationMiddleware = {
  validateCreateAppointment,
  validateUpdateAppointment,
};

export default appointmentsValidationMiddleware;
