import { GenericError, ComplexError } from "../utils/CustomErrors.js";
import { appointmentsErrorMessages } from "../utils/messages/appointmentsMessages.js";
import { dayErrorMessages } from "../utils/messages/dayMessages.js";
import isPositiveNumber from "../utils/isPositiveNumber.js";
import isEmptyObject from "../utils/isEmptyObject.js";

const checkValidationErrors = function (req, _res, done) {
  const { validationErrors } = req;

  if (!isEmptyObject(validationErrors))
    throw new ComplexError({
      errorType: process.env.ERROR_TYPE_VALIDATION,
      errorsObject: validationErrors,
    });

  done();
};

// factory function which returns a differen fn
// receives a message as arg
const checkDateInfoFactory = function (message) {
  // returned function
  return function (req, _res, done) {
    // extract the common date info for multiple routes: day, month, year
    const {
      body: { day, month, year },
    } = req;

    // check if they are valid positive numbers
    if (
      !isPositiveNumber(day) ||
      !isPositiveNumber(month) ||
      !isPositiveNumber(year)
    )
      throw new GenericError({ message });

    // go forward with the request
    done();
  };
};

// 2 fns based on factory fn
const checkDateInfoAppointment = checkDateInfoFactory(
  appointmentsErrorMessages.no_date_info
);
const checkDateInfoDay = checkDateInfoFactory(
  dayErrorMessages.no_required_data
);

const generalMiddleware = {
  checkValidationErrors,
  checkDateInfoDay,
  checkDateInfoAppointment,
};

export default generalMiddleware;
