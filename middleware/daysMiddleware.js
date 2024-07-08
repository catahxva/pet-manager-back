import db from "../db.js";
import { GenericError } from "../utils/CustomErrors.js";
import { getOneById } from "../utils/dbMethods.js";
import { dayErrorMessages } from "../utils/messages/dayMessages.js";

const checkDayExists = async function (req, res) {
  const {
    body: { dayId },
  } = req;

  if (!dayId)
    throw new GenericError({
      message: dayErrorMessages.no_day_id,
    });

  const {
    doc: dayDoc,
    docData: dayData,
    docRef: dayRef,
  } = await getOneById(db, process.env.DB_COLLECTION_DAYS, dayId);

  if (!dayDoc)
    throw new GenericError({
      message: dayErrorMessages.day_does_not_exist,
      statusCode: 404,
    });

  req.day = { id: dayDoc.id, ...dayData };
  req.dayRef = dayRef;
  req.monitoringByMeals =
    dayData.monitoringDietBy === process.env.PET_FIELD_DIET_BY_MEALS;
  req.monitoringByCalories =
    dayData.monitoringDietBy === process.env.PET_FIELD_DIET_BY_CALORIES;
};

const daysMiddleware = { checkDayExists };

export default daysMiddleware;
