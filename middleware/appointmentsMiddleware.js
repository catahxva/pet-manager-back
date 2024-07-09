import db from "../db.js";
import { GenericError } from "../utils/CustomErrors.js";
import { getOneByCriteria, getOneById } from "../utils/dbMethods.js";
import Criteria from "../utils/Criteria.js";

const checkAppointmentExistsPost = async function (req, _res) {
  // extract data
  const { body } = req;
  const { day, month, year, startHour, startMinute, endHour, endMinute } = body;

  const startTimeStamp = new Date(
    year,
    month - 1,
    day,
    startHour,
    startMinute
  ).getTime();
  const endTimeStamp = new Date(
    year,
    month - 1,
    day,
    endHour,
    endMinute
  ).getTime();

  const { empty: noAppointment } = await getOneByCriteria(
    db,
    process.env.DB_COLLECTION_APPOINTMENTS,
    [
      new Criteria("startTimeStamp", ">=", startTimeStamp),
      new Criteria("endTimeStamp", "<=", endTimeStamp),
    ]
  );

  if (!noAppointment)
    throw new GenericError({
      message: "You already have an appoinment registered for this time frame",
    });

  req.startTimeStamp = startTimeStamp;
  req.endTimeStamp = endTimeStamp;
};

const checkAppointmentExistsPatch = async function (req, _res) {
  const {
    params: { id },
  } = req;

  const { doc: apptDoc, docRef: apptRef } = await getOneById(
    db,
    process.env.DB_COLLECTION_APPOINTMENTS,
    id
  );

  if (!apptDoc) throw new GenericError({ message: "", statusCode: 404 });

  req.apptRef = apptRef;
};

const appointmentsMiddleware = {
  checkAppointmentExistsPost,
  checkAppointmentExistsPatch,
};

export default appointmentsMiddleware;
