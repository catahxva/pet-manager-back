import db from "../db.js";
import { GenericError } from "../utils/CustomErrors.js";
import { getOneById } from "../utils/dbMethods.js";

const checkDayExists = async function (req, res) {
  const {
    body: { dayId },
  } = req;

  if (!dayId)
    throw new GenericError({
      message: "Day ID is required in order to complete this action.",
    });

  const {
    doc: dayDoc,
    docData: dayData,
    docRef: dayRef,
  } = await getOneById(db, process.env.DB_COLLECTION_DAYS, dayId);

  if (!dayDoc) throw new GenericError({ message: "", statusCode: 404 });

  req.day = { id: dayDoc.id, ...dayData };
  req.dayRef = dayRef;
};

const daysMiddleware = { checkDayExists };

export default daysMiddleware;
