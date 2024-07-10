import db from "../db.js";
import isEmptyObject from "../utils/isEmptyObject.js";
import validateData from "../utils/validateData.js";
import {
  mealValidationErrorMessages,
  mealErrorMessages,
} from "../utils/messages/mealMessages.js";
import { GenericError, ComplexError } from "../utils/CustomErrors.js";
import FieldToValidate from "../utils/FieldToValidate.js";
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

// factory function for creating two diff middlewares for 2 diff
// controllers (createMeal && update meal)
const validateMealDataFactory = function (httpMethod) {
  // return final fn
  return function (req, _res, done) {
    // extract data
    const {
      monitoringByMeals,
      monitoringByCalories,
      body: { description, foods },
    } = req;

    // create a dynamic validation obj based on received method
    const dynamicFieldToValidate =
      httpMethod === "post"
        ? new FieldToValidate(
            monitoringByCalories &&
              (!foods || !Array.isArray(foods) || foods.length <= 0),
            "foods_required"
          )
        : new FieldToValidate(
            monitoringByCalories &&
              foods !== undefined &&
              (!Array.isArray(foods) || foods.length <= 0),
            "foods_right_format"
          );

    //validate data
    const validationErrors = validateData(
      [
        new FieldToValidate(monitoringByMeals && !description, "description"),
        new FieldToValidate(monitoringByMeals && foods, "foods_not_allowed"),
        dynamicFieldToValidate,
      ],
      mealValidationErrorMessages
    );

    if (!isEmptyObject(validationErrors))
      throw new ComplexError({
        errorType: process.env.ERROR_TYPE_VALIDATION,
        errorsObject: validationErrors,
      });

    done();
  };
};

// 2 fns based on factory fn
const validateMealDataPost = validateMealDataFactory("post");
const validateMealDataPatch = validateMealDataFactory("patch");

const checkMealExists = async function (req, _res) {
  // extract id
  const {
    params: { id: mealId },
  } = req;

  // query doc
  const {
    doc: mealDoc,
    docData: mealData,
    docRef: mealRef,
  } = await getOneById(db, process.env.DB_COLLECTION_MEALS, mealId);

  // throw err if no doc
  if (!mealDoc)
    throw new GenericError({
      message: mealErrorMessages.meal_not_found,
      statusCode: 404,
    });

  // build a meal obj
  const meal = { id: mealDoc.id, ...mealData };

  // put data on req obj
  req.meal = meal;
  req.mealRef = mealRef;
};

const mealsMiddleware = {
  documentsCorrespond,
  validateMealDataPost,
  validateMealDataPatch,
  checkMealExists,
};

export default mealsMiddleware;
