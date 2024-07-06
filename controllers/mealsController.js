import db from "../db";
import keepAllowedFieldsOnObj from "../utils/keepAllowedFieldsOnObj";
import validateData from "../utils/validateData";
import FieldToValidate from "../utils/FieldToValidate";
import isEmptyObject from "../utils/isEmptyObject";
import mealAllowedFields from "../utils/allowedFields/mealAllowedFields";
import { GenericError, ComplexError } from "../utils/CustomErrors";
import { getOneById } from "../utils/dbMethods";

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
//  - validate data
//  - check if pet exists
//  - check if day exists
//  - create meal
//  - update the day goal progress
//  - send response

// throws err if:
//  -

const createMeal = async function (req, res) {
  // extract data
  const {
    body,
    user: { id: userId },
  } = req;
  const { description, foods, dayId, petId } = body;

  // foods = [{quantity, baseCalories, foodId}]

  // validate data
  if (!petId || !dayId)
    throw new GenericError({
      message: "Meal must be associated with a day and pet",
    });

  // check if day && pet exist
  const [
    {
      doc: day,
      docData: { monitoringDietBy, dietGoalProgress },
      docRef: dayRef,
    },
    { doc: pet },
  ] = await Promise.all([
    getOneById(db, process.env.DB_COLLECTION_DAYS, dayId),
    getOneById(db, process.env.DB_COLLECTION_DAYS),
  ]);

  if (!pet) throw new GenericError({ message: "Pet does not exist" });

  if (!day) throw new GenericError({ message: "Day does not exist" });

  // get monitoringOption
  const monitoringByMeals =
    monitoringDietBy === process.env.PET_FIELD_DIET_BY_MEALS;
  const monitoringByCalories = process.env.PET_FIELD_DIET_BY_CALORIES;

  // validation error
  const validationErrors = validateData(
    [
      new FieldToValidate(monitoringByMeals && !description, "description"),
      new FieldToValidate(monitoringByMeals && foods, "foods_not_allowed"),
      new FieldToValidate(
        monitoringByCalories &&
          (!foods || !Array.isArray(foods) || foods.length === 0),
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

  res.code(200).send({
    status: process.env.RES_STATUS_SUCCESS,
    message: "Meal added successfully!",
  });
};

const updateMeal = async function (req, res) {};

const removeMeal = async function (req, res) {};

const mealsController = {
  createMeal,
  updateMeal,
  removeMeal,
};

export default mealsController;
