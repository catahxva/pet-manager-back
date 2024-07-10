import db from "../db.js";
import { GenericError } from "../utils/CustomErrors.js";
import { getOneByCriteria, getOneById } from "../utils/dbMethods.js";
import getApptTimeStamps from "../utils/getApptTimeStamps.js";
import Criteria from "../utils/Criteria.js";
import isNumber from "../utils/isNumber.js";

const setTimeStampsCreate = function (req, _res, done) {
  const { body } = req;
  const { day, month, year, startHour, startMinute, endHour, endMinute } = body;

  // build start and end time stamps
  const [startTimeStamp, endTimeStamp] = getApptTimeStamps(
    [year, month - 1, day, startHour, startMinute],
    [year, month - 1, day, endHour, endMinute]
  );

  req.startTimeStamp = startTimeStamp;
  req.endTimeStamp = endTimeStamp;
  req.startTSDiff = true;
  req.endTSDiff = true;

  done();
};

const setTimeStampsPatch = function (req, _res, done) {
  const { apptData, body } = req;

  const {
    day,
    month,
    year,
    startHour: startHourDB,
    startMinute: startMinuteDB,
    endHour: endHourDB,
    endMinute: endMinuteDB,
    startTimeStamp: startTimeStampDB,
    endTimeStamp: endTimeStampDB,
  } = apptData;
  const { startHour, startMinute, endHour, endMinute } = body;

  let newStartTimeStamp = startTimeStampDB;
  let newEndTimeStamp = endTimeStampDB;

  const userChangedStartHourAndMinute =
    isNumber(startHour) &&
    startHour !== startHourDB &&
    isNumber(startMinute) &&
    startMinute !== startMinuteDB;
  const userChangedStartHour =
    isNumber(startHour) && startHour !== startHourDB && !isNumber(startMinute);
  const userChangedStartMinute =
    isNumber(startMinute) &&
    startMinute !== startMinuteDB &&
    !isNumber(startHour);
  const userChangedEndHourAndMinute =
    isNumber(endHour) &&
    endHour !== endHourDB &&
    isNumber(endMinute) &&
    endMinute !== endMinuteDB;
  const userChangedEndHour =
    isNumber(endHour) && endHour !== endHourDB && !isNumber(endMinute);
  const userChangedEndMinute =
    isNumber(endMinute) && endMinute !== endMinuteDB && !isNumber(endHour);

  if (userChangedStartHourAndMinute)
    newStartTimeStamp = getApptTimeStamps([
      year,
      month - 1,
      day,
      startHour,
      startMinute,
    ])[0];

  if (userChangedStartHour)
    newStartTimeStamp = getApptTimeStamps([
      year,
      month - 1,
      day,
      startHour,
      startMinuteDB,
    ])[0];

  if (userChangedStartMinute)
    newStartTimeStamp = getApptTimeStamps([
      year,
      month - 1,
      day,
      startHourDB,
      startMinute,
    ])[0];

  if (userChangedEndHourAndMinute)
    newEndTimeStamp = getApptTimeStamps(null, [
      year,
      month - 1,
      day,
      endHour,
      endMinute,
    ])[1];

  if (userChangedEndHour)
    newEndTimeStamp = getApptTimeStamps(null, [
      year,
      month - 1,
      day,
      endHour,
      endMinuteDB,
    ])[1];

  if (userChangedEndMinute)
    newEndTimeStamp = getApptTimeStamps(null, [
      year,
      month - 1,
      day,
      endHourDB,
      endMinute,
    ])[1];

  req.startTimeStamp = newStartTimeStamp;
  req.endTimeStamp = newEndTimeStamp;
  req.startTSDiff = newStartTimeStamp !== startTimeStampDB;
  req.endTSDiff = newEndTimeStamp !== endTimeStampDB;

  done();
};

const checkForAppointmentInTimeFrame = async function (req, _res) {
  // extract data
  const { startTimeStamp, endTimeStamp, startTSDiff, endTSDiff } = req;

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
  if (!noAppointment && (startTSDiff || endTSDiff))
    throw new GenericError({
      message: "You already have an appoinment registered for this time frame",
    });
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
  setTimeStampsCreate,
  setTimeStampsPatch,
  checkForAppointmentInTimeFrame,
  checkAppointmentExists,
};

export default appointmentsMiddleware;
