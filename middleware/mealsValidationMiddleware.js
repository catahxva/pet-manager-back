// factory fn

// function roles:
//  - extract data (1)
//  - create dynamic validation field (2)
//  - create errors obj (3)
//  - put obj on req (4)
//  - forward request (5)

// throws err if:
//  - unexpected err

import validateData from "../utils/validateData.js";
import FieldToValidate from "../utils/FieldToValidate.js";
import { mealValidationErrorMessages } from "../utils/messages/mealMessages.js";

const validateMealDataFactory = function (httpMethod) {
  // return child fn
  return function (req, _res, done) {
    // 1
    const {
      monitoringByMeals,
      monitoringByCalories,
      body: { description, foods },
    } = req;

    // 2
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

    // 3
    const validationErrors = validateData(
      [
        new FieldToValidate(monitoringByMeals && !description, "description"),
        new FieldToValidate(monitoringByMeals && foods, "foods_not_allowed"),
        dynamicFieldToValidate,
      ],
      mealValidationErrorMessages
    );

    // 4
    req.validationErrors = validationErrors;

    done();
  };
};

const validateMealPost = validateMealDataFactory("post");
const validateMealPatch = validateMealDataFactory("patch");

const mealsValidationMiddleware = {
  validateMealPost,
  validateMealPatch,
};

export default mealsValidationMiddleware;
