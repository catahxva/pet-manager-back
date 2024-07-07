import db from "../db.js";
import keepAllowedFieldsOnObj from "../utils/keepAllowedFieldsOnObj.js";
import validateData from "../utils/validateData.js";
import FieldToValidate from "../utils/FieldToValidate.js";
import isEmptyObject from "../utils/isEmptyObject.js";
import mealAllowedFields from "../utils/allowedFields/mealAllowedFields.js";
import { GenericError, ComplexError } from "../utils/CustomErrors.js";
import { mealValidationErrorMessages } from "../utils/messages/mealMessages.js";

// CONTROLLER FOR:
//              - CREATING MEAL
//              - UPDATING MEAL
//              - REMOVING MEAL

// Notes: - Meals should contain a reference to the user which owns
//          the pet => - when user is deleted, related meals are
//                          also deleted
//       - Meals should contain a reference to the pet which they
//          are added to => - when pet is deleted, related meals
//                              are also deleted
//       - Meals should contain a reference to the day they are
//          added to => - for querying
//       - If current day is monitored by meals, meal should contain
//          only a description of the meal
//      - If current day is monitored by calories, meal should contain
//          a list of foods and also a description

// function roles:
//  - extract data
//  - check if day corresponds to pet
//  - validate data
//  - create meal
//  - update the day goal progress
//  - send response

// throws err if:
//  - day and pet dont correspond
//  - invalid user input
//  - unexpected error

const createMeal = async function (req, res) {
  // extract data
  const {
    body,
    user: { id: userId },
    pet: { id: petId },
    day: { monitoringDietBy, dietGoalProgress, petId: petIdOfDay },
    dayRef,
  } = req;
  const { description, foods } = body;

  // foods = [{quantity, baseCalories, foodId}]

  // check if pet and day match
  if (petId !== petIdOfDay)
    throw new GenericError({ message: "Day and pet dont match" });

  // validation error
  const validationErrors = validateData(
    [
      new FieldToValidate(monitoringByMeals && !description, "description"),
      new FieldToValidate(monitoringByMeals && foods, "foods_not_allowed"),
      new FieldToValidate(
        monitoringByCalories &&
          (!foods || !Array.isArray(foods) || foods.length <= 0),
        "foods_required"
      ),
    ],
    mealValidationErrorMessages
  );

  if (!isEmptyObject(validationErrors))
    throw new ComplexError({
      errorType: process.env.ERROR_TYPE_VALIDATION,
      errorsObject: validationErrors,
    });

  // get monitoringOption
  const monitoringByMeals =
    monitoringDietBy === process.env.PET_FIELD_DIET_BY_MEALS;
  const monitoringByCalories =
    monitoringDietBy === process.env.PET_FIELD_DIET_BY_CALORIES;

  // create meal && update day
  await db.runTransaction(async (transaction) => {
    // create meal
    const collectionRef = db.collection(process.env.DB_COLLECTION_MEALS);

    const newMealRef = collectionRef.doc();

    transaction.set(
      newMealRef,
      keepAllowedFieldsOnObj({ userId, ...body }, mealAllowedFields)
    );

    // update day progrss
    let newDietGoalProgress;

    // if monitioring by day increase the dietGoalProgress of day by one
    if (monitoringByMeals) newDietGoalProgress = dietGoalProgress + 1;

    // if monitoring by calories increase the dietGoalProgress of day by the
    // reduced number of calories of received foods
    if (monitoringByCalories)
      newDietGoalProgress =
        dietGoalProgress +
        foods.reduce((acc, f) => acc + (f.quantity / 100) * f.baseCalories, 0);

    transaction.update(dayRef, { dietGoalProgress: newDietGoalProgress });
  });

  // send response
  res.code(200).send({
    status: process.env.RES_STATUS_SUCCESS,
    message: "Meal added successfully!",
  });
};

// function roles:
//  - extract data
//  - validate data
//  - update the meal data
//  - if the monitoring type is calories, also update the
//    corresponding day
//  - send back response

// throws err if:
//  -
const updateMeal = async function (req, res) {
  // extract data
  const {
    body,
    pet: { id: petId },
    day: { monitoringDietBy, dietGoalProgress, petId: petIdOfDay },
    dayRef,
  } = req;

  // validate data

  // start transaction
  // update meal
  // update corresponding day if needed
  // send res
  res.code(200).send({
    status: process.env.RES_STATUS_SUCCESS,
    message: "Meal updated successfully!",
  });
};

const removeMeal = async function (req, res) {};

const mealsController = {
  createMeal,
  updateMeal,
  removeMeal,
};

export default mealsController;
