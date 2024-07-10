import validateData from "../utils/validateData.js";
import FieldToValidate from "../utils/FieldToValidate.js";
import { petValidationErrorMessages } from "../utils/messages/petMessages.js";

const validateCreatePet = function (req, _res, done) {
  const { body } = req;
  const {
    name,
    age,
    ageIn,
    species,
    breed,
    gender,
    monitoringDietBy,
    dietGoal,
  } = body;

  const validationErrors = validateData(
    [
      new FieldToValidate(!name, "name"),
      new FieldToValidate(!age, "age"),
      new FieldToValidate(!ageIn, "ageIn"),
      new FieldToValidate(
        ageIn &&
          ageIn !== process.env.PET_FIELD_AGE_IN_MONTHS &&
          ageIn !== process.env.PET_FIELD_AGE_IN_YEARS,
        "ageIn_option"
      ),
      new FieldToValidate(!species, "species"),
      new FieldToValidate(
        species &&
          species !== process.env.PET_FIELD_SPECIES_DOG &&
          species !== process.env.PET_FIELD_SPECIES_CAT,
        "species_option"
      ),
      new FieldToValidate(!breed, "breed"),
      new FieldToValidate(!gender, "gender"),
      new FieldToValidate(!monitoringDietBy, "monitoringDietBy"),
      new FieldToValidate(
        monitoringDietBy &&
          monitoringDietBy !== process.env.PET_FIELD_DIET_BY_MEALS &&
          monitoringDietBy !== process.env.PET_FIELD_DIET_BY_CALORIES,
        "monitoringDietBy_option"
      ),
      new FieldToValidate(
        dietGoal === null || dietGoal === undefined,
        "dietGoal"
      ),
      new FieldToValidate(
        dietGoal <= 0 &&
          monitoringDietBy === process.env.PET_FIELD_DIET_BY_MEALS,
        "dietGoal_minimum_meals"
      ),
      new FieldToValidate(
        dietGoal <= 0 &&
          monitoringDietBy === process.env.PET_FIELD_DIET_BY_CALORIES,
        "dietGoal_minimum_calories"
      ),
    ],
    petValidationErrorMessages
  );

  req.validationErrors = validationErrors;

  done();
};

const validateUpdatePet = function (req, _res, done) {
  const { age, ageIn, species, monitoringDietBy, dietGoal } = body;

  const validationErrors = validateData(
    [
      new FieldToValidate(age && age < 0, "age"),
      new FieldToValidate(
        ageIn &&
          ageIn !== process.env.PET_FIELD_AGE_IN_MONTHS &&
          ageIn !== process.env.PET_FIELD_AGE_IN_YEARS,
        "ageIn_option"
      ),
      new FieldToValidate(
        species &&
          species !== process.env.PET_FIELD_SPECIES_DOG &&
          species !== process.env.PET_FIELD_SPECIES_CAT,
        "species_option"
      ),
      new FieldToValidate(
        monitoringDietBy &&
          monitoringDietBy !== process.env.PET_FIELD_DIET_BY_MEALS &&
          monitoringDietBy !== process.env.PET_FIELD_DIET_BY_CALORIES,
        "monitoringDietBy_option"
      ),
      new FieldToValidate(
        dietGoal <= 0 &&
          monitoringDietBy === process.env.PET_FIELD_DIET_BY_MEALS,
        "dietGoal_minimum_meals"
      ),
      new FieldToValidate(
        dietGoal <= 0 &&
          monitoringDietBy === process.env.PET_FIELD_DIET_BY_CALORIES,
        "dietGoal_minimum_calories"
      ),
    ],
    petValidationErrorMessages
  );

  req.validationErrors = validationErrors;

  done();
};

const petsValidationMiddleware = {
  validateCreatePet,
  validateUpdatePet,
};

export default petsValidationMiddleware;
