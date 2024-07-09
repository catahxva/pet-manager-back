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

// CONTROLLER FOR:
//              - CREATING A NEW DAY

// Notes: - Days should contain a reference to the user which
//      creats them => - for querying
//                     - if users deletes account, easy to delete
//                          all related data
//        - Days should contain a reference to the pet which
//          they are added to => - for querying
//                               - if pet is removed, easy to delete
//                                  all related data
//        - Days should contain a reference to the current
//          month => - for querying when implementing diet history
//                      feature
//        - Days should contain a reference to the current
//          year => - same reason as for the month ref

// function roles:
//  - extract data
//  - validate data
//  - check if the pet does exist && extract some data
//  - check if exact day (d && m && y) already exists
//      for this pet
//  - create day doc if not
//  - check if exact month (m && y) already exists for
//      this pet
//  - create month doc if not
//  - check if exact year already exists for this pet
//  - create year doc if not
//  - send response

// throws err if:
//  - no data received
//  - pet doesnt exist
//  - day already exists
//  - unexpected err

const createDay = async function (req, res) {
  // extract data
  const {
    body,
    user: { id: userId },
    pet: { id: petId, monitoringDietBy, dietGoal },
  } = req;
  const { day, month, year } = body;

  // common criteria for queries
  const commonCriteria = [
    new Criteria("petId", "==", petId),
    new Criteria("year", "==", year),
  ];

  // check if exact d && m && year exists
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

  // if day exists, throw err
  if (!noDay) throw new GenericError({ message: dayErrorMessages.day_exists });

  // start transaction to create day && month && year (m && y conditionally)
  await db.runTransaction(async (transaction) => {
    // get collection refs
    const daysCollection = db.collection(process.env.DB_COLLECTION_DAYS);
    const monthsCollection = db.collection(process.env.DB_COLLECTION_MONTHS);
    const yearsCollection = db.collection(process.env.DB_COLLECTION_YEARS);

    // create day
    const newDayRef = daysCollection.doc();

    transaction.set(
      newDayRef,
      keepAllowedFieldsOnObj(
        { userId, monitoringDietBy, dietGoal, dietGoalProgress: 0, ...body },
        dayAllowedFields
      )
    );

    // create new month if there isn't already a month
    if (noMonth) {
      const newMonthRef = monthsCollection.doc();
      transaction.set(
        newMonthRef,
        keepAllowedFieldsOnObj({ userId, ...body }, monthAllowedFields)
      );
    }

    // create new year if there isnt already a year
    if (noYear) {
      const newYearRef = yearsCollection.doc();
      transaction.set(
        newYearRef,
        keepAllowedFieldsOnObj({ userId, ...body }, yearAllowedFields)
      );
    }
  });

  // send response
  res.code(200).send({
    status: process.env.RES_STATUS_SUCCESS,
    message: "Day added successfully!",
  });
};

const daysController = { createDay };

export default daysController;
