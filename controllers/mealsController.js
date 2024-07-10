import db from "../db.js";
import keepAllowedFieldsOnObj from "../utils/keepAllowedFieldsOnObj.js";
import mealAllowedFields from "../utils/allowedFields/mealAllowedFields.js";
import { mealSuccessMessages } from "../utils/messages/mealMessages.js";

// function roles:
//  - extract data (1)
//  - create meal (2)
//  - update day (3)
//  - send back res (4)

// throws err if:
//  - unexpected err

const createMeal = async function (req, res) {
  // 1
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

  // 2 && 3
  await db.runTransaction(async (transaction) => {
    // 2
    const caloriesTotal = monitoringByCalories
      ? foods.reduce((acc, f) => acc + (f.quantity / 100) * f.baseCalories, 0)
      : null;

    const collectionRef = db.collection(process.env.DB_COLLECTION_MEALS);
    const newMealRef = collectionRef.doc();

    transaction.set(
      newMealRef,
      keepAllowedFieldsOnObj(
        { userId, caloriesTotal, ...body },
        mealAllowedFields
      )
    );

    // 3
    const newDietGoalProgress = monitoringByMeals
      ? dietGoalProgress + 1
      : monitoringByCalories
      ? dietGoalProgress + caloriesTotal
      : null;

    transaction.update(dayRef, { dietGoalProgress: newDietGoalProgress });
  });

  // 4
  res.code(200).send({
    status: process.env.RES_STATUS_SUCCESS,
    message: mealSuccessMessages.meal_created,
  });
};

// function roles:
//  - extract data (1)
//  - update meal (2)
//  - update day if needed (3)
//  - send back res (4)

// throws err if:
//  - unexpected error

const updateMeal = async function (req, res) {
  // 1
  const {
    body,
    dayRef,
    mealRef,
    monitoringByCalories,
    meal: { caloriesTotal: caloriesTotalOfMeal },
    day: { dietGoalProgress },
  } = req;
  const { foods } = body;

  // 2 && 3
  await db.runTransaction(async (transaction) => {
    // 2
    const foodsValid = foods && Array.isArray(foods) && foods.length <= 0;

    const caloriesTotal =
      monitoringByCalories && foodsValid
        ? foods.reduce((acc, f) => acc + (f.quantity / 100) * f.baseCalories, 0)
        : caloriesTotalOfMeal;

    transaction.update(
      mealRef,
      keepAllowedFieldsOnObj({ caloriesTotal, ...body }, mealAllowedFields)
    );

    // 3
    if (monitoringByCalories && foodsValid) {
      const dietGoalProgressWithoutCurrentMeal =
        dietGoalProgress - caloriesTotalOfMeal;

      const newDietGoalProgress =
        dietGoalProgressWithoutCurrentMeal + caloriesTotal;

      transaction.update(dayRef, { dietGoalProgress: newDietGoalProgress });
    }
  });

  // 4
  res.code(200).send({
    status: process.env.RES_STATUS_SUCCESS,
    message: mealSuccessMessages.meal_updated,
  });
};

// function roles:
//  - extract data (1)
//  - delete meal (2)
//  - update day (3)
//  - send back res

// throws err if:
//  - unexpected err

const removeMeal = async function (req, res) {
  // 1
  const {
    mealRef,
    dayRef,
    monitoringByCalories,
    monitoringByMeals,
    meal: { caloriesTotal: caloriesTotalOfMeal },
    day: { dietGoalProgress },
  } = req;

  // 2 && 3
  await db.runTransaction(async (transaction) => {
    // 2
    transaction.delete(mealRef);

    // 3
    const newDietGoalProgress = monitoringByMeals
      ? dietGoalProgress - 1
      : monitoringByCalories
      ? dietGoalProgress - caloriesTotalOfMeal
      : null;

    transaction.update(dayRef, { dietGoalProgress: newDietGoalProgress });
  });

  // 4
  res.code(204).send({});
};

const mealsController = {
  createMeal,
  updateMeal,
  removeMeal,
};

export default mealsController;
