import db from "../db.js";
import { GenericError } from "../utils/CustomErrors.js";
import { getOneByCriteria, getOneById } from "../utils/dbMethods.js";
import getApptTimeStamps from "../utils/getApptTimeStamps.js";
import Criteria from "../utils/Criteria.js";

const checkForAppointmentInTimeFrame = async function (req, _res) {
  // extract data
  const { body } = req;
  const { day, month, year, startHour, startMinute, endHour, endMinute } = body;

  // build start and end time stamps
  const [startTimeStamp, endTimeStamp] = getApptTimeStamps(
    [year, month - 1, day, startHour, startMinute],
    [year, month - 1, day, endHour, endMinute]
  );

  // query for appointment based on time stamps
  const { empty: noAppointment } = await getOneByCriteria(
    db,
    process.env.DB_COLLECTION_APPOINTMENTS,
    [
      new Criteria("startTimeStamp", ">=", startTimeStamp),
      new Criteria("endTimeStamp", "<=", endTimeStamp),
    ]
  );

  // check if there is any appointment
  if (!noAppointment)
    throw new GenericError({
      message: "You already have an appoinment registered for this time frame",
    });

  // set timestamps on req obj
  req.startTimeStamp = startTimeStamp;
  req.endTimeStamp = endTimeStamp;
};

const checkAppointmentExists = async function (req, _res) {
  // extract id
  const {
    params: { id },
  } = req;

  // get appt doc
  const {
    doc: apptDoc,
    docData: apptData,
    docRef: apptRef,
  } = await getOneById(db, process.env.DB_COLLECTION_APPOINTMENTS, id);

  // check if it exists
  if (!apptDoc) throw new GenericError({ message: "", statusCode: 404 });

  // put ref on req obj
  req.apptData = apptData;
  req.apptRef = apptRef;
};

const appointmentsMiddleware = {
  checkForAppointmentInTimeFrame,
  checkAppointmentExists,
};

export default appointmentsMiddleware;
