import db from "../db.js";
import isEmptyObject from "../utils/isEmptyObject.js";
import validateData from "../utils/validateData.js";
import { mealValidationErrorMessages } from "../utils/messages/mealMessages.js";
import { GenericError, ComplexError } from "../utils/CustomErrors.js";
import FieldToValidate from "../utils/FieldToValidate.js";
import { getOneById } from "../utils/dbMethods.js";

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
    throw new GenericError({ message: "User and pet dont match" });

  // check if day is linked to the current pet
  if (petId !== petIdOfDay)
    throw new GenericError({ message: "Pet and day dont match" });

  // check if day is linked to current user
  if (userId !== userIdOfDay)
    throw new GenericError({ message: "User and day dont match" });

  done();
};

// factory function for creating two diff middlewares for 2 diff
// controllers (createMeal && update meal)
const validateMealDataFactory = function (httpMethod) {
  // return final fn
  return function (req, _res, done) {
    // extract data
    const {
      day: { monitoringDietBy },
      body: { description, foods },
    } = req;

    // define monitoringOptions
    const monitoringByMeals =
      monitoringDietBy === process.env.PET_FIELD_DIET_BY_MEALS;
    const monitoringByCalories =
      monitoringDietBy === process.env.PET_FIELD_DIET_BY_CALORIES;

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
              foods !== null &&
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

    // put monitoring options on req
    req.monitoringByMeals = monitoringByMeals;
    req.monitoringByCalories = monitoringByCalories;

    done();
  };
};

// 2 fns based on factory fn
const validateMealDataPost = validateMealDataFactory("post");
const validateMealDataPatch = validateMealDataFactory("patch");

const checkMealExists = async function (req, res) {
  const {
    params: { id: mealId },
  } = req;

  const {
    doc: mealDoc,
    docData: mealData,
    docRef: mealRef,
  } = await getOneById(db, process.env.DB_COLLECTION_MEALS, mealId);

  if (!mealDoc)
    throw new GenericError({ message: "No meal found", statusCode: 404 });

  const meal = { id: mealDoc.id, ...mealData };

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
