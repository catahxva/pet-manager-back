import db from "../db.js";
import { mealErrorMessages } from "../utils/messages/mealMessages.js";
import { GenericError } from "../utils/CustomErrors.js";
import { getOneById } from "../utils/dbMethods.js";
import { generalErrorMessages } from "../utils/messages/generalMessages.js";

// check if documents correspond
const documentsCorrespond = function (req, _res, done) {
  // extract data
  const {
    user: { id: userId },
    pet: { id: petId, userId: userIdOfPet },
    day: { petId: petIdOfDay, userId: userIdOfDay },
  } = req;

  // check if user is owner of current pet
  if (userId !== userIdOfPet)
    throw new GenericError({ message: generalErrorMessages.user_pet_no_match });

  // check if day is linked to the current pet
  if (petId !== petIdOfDay)
    throw new GenericError({ message: generalErrorMessages.pet_day_no_match });

  // check if day is linked to current user
  if (userId !== userIdOfDay)
    throw new GenericError({ message: generalErrorMessages.user_day_no_match });

  done();
};

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
