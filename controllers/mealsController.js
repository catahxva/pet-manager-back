import db from "../db.js";
import keepAllowedFieldsOnObj from "../utils/keepAllowedFieldsOnObj.js";
import validateData from "../utils/validateData.js";
import FieldToValidate from "../utils/FieldToValidate.js";
import isEmptyObject from "../utils/isEmptyObject.js";
import mealAllowedFields from "../utils/allowedFields/mealAllowedFields.js";
import { GenericError, ComplexError } from "../utils/CustomErrors.js";
import { mealValidationErrorMessages } from "../utils/messages/mealMessages.js";
import { getOneById } from "../utils/dbMethods.js";

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
//  - calculate total calories
//  - create meal
//  - update the day goal progress
//  - send response

// throws err if:
//  - unexpected error

const createMeal = async function (req, res) {
  // extract data
  const {
    body,
    user: { id: userId },
    day: { dietGoalProgress },
    dayRef,
    monitoringByMeals,
    monitoringByCalories,
  } = req;
  const { foods } = body;

  // foods = [{quantity, baseCalories, foodId}]

  // calculate calories
  const caloriesTotal = monitoringByCalories
    ? foods.reduce((acc, f) => acc + (f.quantity / 100) * f.baseCalories, 0)
    : null;

  // create meal && update day
  await db.runTransaction(async (transaction) => {
    // create meal
    const collectionRef = db.collection(process.env.DB_COLLECTION_MEALS);
    const newMealRef = collectionRef.doc();

    transaction.set(
      newMealRef,
      keepAllowedFieldsOnObj(
        { userId, caloriesTotal, ...body },
        mealAllowedFields
      )
    );

    // update day progrss
    let newDietGoalProgress;

    // if monitioring by day increase the dietGoalProgress of day by one
    if (monitoringByMeals) newDietGoalProgress = dietGoalProgress + 1;

    // if monitoring by calories increase the dietGoalProgress of day by the
    // reduced number of calories of received foods
    if (monitoringByCalories)
      newDietGoalProgress = dietGoalProgress + caloriesTotal;

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
//  - update the meal data
//  - if the monitoring type is calories, also update the
//    corresponding day
//  - send back response

// throws err if:
//  - unexpected error

const updateMeal = async function (req, res) {
  // extract data
  const {
    body,
    dayRef,
    mealRef,
    monitoringByCalories,
    meal: { caloriesTotal: caloriesTotalOfMeal },
    day: { dietGoalProgress },
  } = req;
  const { foods } = body;

  // validate foods
  const foodsValid = foods && Array.isArray(foods) && foods.length <= 0;

  // calculate total calories
  const caloriesTotal =
    monitoringByCalories && foodsValid
      ? foods.reduce((acc, f) => acc + (f.quantity / 100) * f.baseCalories, 0)
      : null;

  // start transaction
  await db.runTransaction(async (transaction) => {
    // update meal
    transaction.update(
      mealRef,
      keepAllowedFieldsOnObj({ caloriesTotal, ...body }, mealAllowedFields)
    );

    // update corresponding day if needed
    if (monitoringByCalories && foodsValid) {
      const dietGoalProgressWithoutCurrentMeal =
        dietGoalProgress - caloriesTotalOfMeal;

      const newDietGoalProgress =
        dietGoalProgressWithoutCurrentMeal + caloriesTotal;

      transaction.update(dayRef, { dietGoalProgress: newDietGoalProgress });
    }
  });

  // send res
  res.code(200).send({
    status: process.env.RES_STATUS_SUCCESS,
    message: "Meal updated successfully!",
  });
};

// function roles:
//  - get the meal ref
//  - delete doc
//  - update day
//  - send res

// throws err if:
//  - unexpected err

const removeMeal = async function (req, res) {
  const {
    mealRef,
    dayRef,
    monitoringByCalories,
    monitoringByMeals,
    meal: { caloriesTotal: caloriesTotalOfMeal },
    day: { dietGoalProgress },
  } = req;
};

const mealsController = {
  createMeal,
  updateMeal,
  removeMeal,
};

export default mealsController;
