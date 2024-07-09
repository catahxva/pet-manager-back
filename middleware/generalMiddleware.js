import { GenericError } from "../utils/CustomErrors.js";
import { appointmentsErrorMessages } from "../utils/messages/appointmentsMessages.js";
import { dayErrorMessages } from "../utils/messages/dayMessages.js";

const isPositiveNumber = function (n) {
  return typeof n === "number" && !Number.isNaN(n) && n > 0;
};

const checkDateInfoFactory = function (message) {
  return function (req, _res, done) {
    const {
      body: { day, month, year },
    } = req;

    if (
      !isPositiveNumber(day) ||
      !isPositiveNumber(month) ||
      !isPositiveNumber(year)
    )
      throw new GenericError({ message });

    done();
  };
};

const checkDateInfoAppointment = checkDateInfoFactory(
  appointmentsErrorMessages.no_date_info
);
const checkDateInfoDay = checkDateInfoFactory(
  dayErrorMessages.no_required_data
);

const generalMiddleware = {
  checkDateInfoDay,
  checkDateInfoAppointment,
};

export default generalMiddleware;
