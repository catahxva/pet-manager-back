import db from "../db.js";
import { mealErrorMessages } from "../utils/messages/mealMessages.js";
import { GenericError } from "../utils/CustomErrors.js";
import { getOneById } from "../utils/dbMethods.js";

// function roles:
//  - extract data (1)
//  - query data (2)
//  - check if doc exists (3)
//  - put data on req obj (4)

// throws err if:
//  - no doc
//  - unexpected err

const checkMealExists = async function (req, _res) {
  // 1
  const {
    params: { id: mealId },
  } = req;

  // 2
  const {
    doc: mealDoc,
    docData: mealData,
    docRef: mealRef,
  } = await getOneById(db, process.env.DB_COLLECTION_MEALS, mealId);

  // 3
  if (!mealDoc)
    throw new GenericError({
      message: mealErrorMessages.meal_not_found,
      statusCode: 404,
    });

  // 4
  const meal = { id: mealDoc.id, ...mealData };

  req.meal = meal;
  req.mealRef = mealRef;
};

const mealsMiddleware = {
  documentsCorrespond,
  checkMealExists,
};

export default mealsMiddleware;
