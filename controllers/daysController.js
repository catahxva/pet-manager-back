import db from "../db.js";
import keepAllowedFieldsOnObj from "../utils/keepAllowedFieldsOnObj.js";
import Criteria from "../utils/Criteria.js";
import { GenericError } from "../utils/CustomErrors.js";
import { getOneByCriteria, getOneById } from "../utils/dbMethods.js";
import {
  dayAllowedFields,
  monthAllowedFields,
  yearAllowedFields,
} from "../utils/allowedFields/dayAllowedFields.js";
import { dayErrorMessages } from "../utils/messages/dayMessages.js";

// function roles:
//  - extract data (1)
//  - check if d/m/y exist (2)
//  - create d/m/y if needed (3)
//  - send back res (4)

// throws err if:
//  - day already exists
//  - unexpected err

const createDay = async function (req, res) {
  // 1
  const {
    body,
    user: { id: userId },
    pet: { id: petId, monitoringDietBy, dietGoal },
  } = req;
  const { day, month, year } = body;

  // 2
  const commonCriteria = [
    new Criteria("petId", "==", petId),
    new Criteria("year", "==", year),
  ];

  const [{ empty: noDay }, { empty: noMonth }, { empty: noYear }] =
    await Promise.all([
      getOneByCriteria(db, process.env.DB_COLLECTION_DAYS, [
        new Criteria("day", "==", day),
        new Criteria("month", "==", month),
        ...commonCriteria,
      ]),
      getOneByCriteria(db, process.env.DB_COLLECTION_MONTHS, [
        new Criteria("month", "==", month),
        ...commonCriteria,
      ]),
      getOneByCriteria(db, process.env.DB_COLLECTION_YEARS, commonCriteria),
    ]);

  console.log(noMonth);
  console.log(noYear);

  if (!noDay) throw new GenericError({ message: dayErrorMessages.day_exists });

  // 3
  await db.runTransaction(async (transaction) => {
    const daysCollection = db.collection(process.env.DB_COLLECTION_DAYS);
    const monthsCollection = db.collection(process.env.DB_COLLECTION_MONTHS);
    const yearsCollection = db.collection(process.env.DB_COLLECTION_YEARS);

    const newDayRef = daysCollection.doc();

    transaction.set(
      newDayRef,
      keepAllowedFieldsOnObj(
        { userId, monitoringDietBy, dietGoal, dietGoalProgress: 0, ...body },
        dayAllowedFields
      )
    );

    if (noMonth) {
      const newMonthRef = monthsCollection.doc();
      transaction.set(
        newMonthRef,
        keepAllowedFieldsOnObj({ userId, ...body }, monthAllowedFields)
      );
    }

    if (noYear) {
      const newYearRef = yearsCollection.doc();
      transaction.set(
        newYearRef,
        keepAllowedFieldsOnObj({ userId, ...body }, yearAllowedFields)
      );
    }
  });

  // 4
  res.code(200).send({
    status: process.env.RES_STATUS_SUCCESS,
    message: "Day added successfully!",
  });
};

const daysController = { createDay };

export default daysController;
