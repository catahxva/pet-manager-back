import db from "../db";
import keepAllowedFieldsOnObj from "../utils/keepAllowedFieldsOnObj";
import { GenericError, ComplexError } from "../utils/CustomErrors";

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
//  - update the day
//  - send response

const createMeal = async function (req, res) {};

const updateMeal = async function (req, res) {};

const removeMeal = async function (req, res) {};

const mealsController = {
  createMeal,
  updateMeal,
  removeMeal,
};

export default mealsController;
