// imports:
import db from "../db.js";
import petAllowedFields from "../utils/allowedFields/petAllowedFields.js";
import keepAllowedFieldsOnObj from "../utils/keepAllowedFieldsOnObj.js";
import validateData from "../utils/validateData.js";
import isEmptyObject from "../utils/isEmptyObject.js";
import FieldToValidate from "../utils/FieldToValidate.js";
import { GenericError, ComplexError } from "../utils/CustomErrors.js";
import {
  petValidationErrorMessages,
  petErrorMessages,
  petSuccessMessages,
} from "../utils/messages/petMessages.js";
import { getOneById } from "../utils/dbMethods.js";

// CONTROLLER FOR:
//              - CREATING A PET
//              - UPDATING A PET
//              - REMOVING A PET

// Note: Pets should contain a reference to the user which
//      creates them => - easy to query pets for each user
//                      - if user deletes account, easy to
//                          delete all related data
//                      - makes sure pets dont exist in db
//                          independently

// function roles:
//  - extract data
//  - validate data
//  - check if user has reached the max number
//      of pets
//  - create pet
//  - send back response

// throws error if:
//  - validation error
//  - max number of pets

const createPet = async function (req, res) {
  // extract data
  const {
    body,
    user: { id: userId },
  } = req;
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

  // validate data
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

  if (!isEmptyObject(validationErrors))
    throw new ComplexError({
      errorType: process.env.ERROR_TYPE_VALIDATION,
      errorsObject: validationErrors,
    });

  // check if user reached max pets
  const collectionRef = db.collection(process.env.DB_COLLECTION_PETS);
  const collectionQuery = collectionRef.where("userId", "==", userId);
  const { docs: pets } = await collectionQuery.get();

  if (pets.length >= process.env.MAX_PETS_PER_USER)
    throw new GenericError({
      message: petErrorMessages.max_pets,
    });

  // create a new pet
  const newPetRef = collectionRef.doc();

  await newPetRef.set(
    keepAllowedFieldsOnObj({ ...body, userId }, petAllowedFields)
  );

  // send response
  res.code(200).send({
    status: process.env.RES_STATUS_SUCCESS,
    message: petSuccessMessages.add_pet_success,
  });
};

// function roles:
//  - extract data
//  - validate data
//  - update the pet information
//  - send response

// throws err if:
//  - validation err
//  - no pet found
//  - unexpected error

const updatePet = async function (req, res) {
  // extract data
  const {
    params: { id },
    body,
  } = req;

  const { age, ageIn, species, monitoringDietBy, dietGoal } = body;

  // validate data
  if (!id) throw new GenericError({ message: petErrorMessages.no_id });

  // validation error
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

  if (!isEmptyObject(validationErrors))
    throw new ComplexError({
      errorType: process.env.ERROR_TYPE_VALIDATION,
      errorsObject: validationErrors,
    });

  // get the pet
  const { doc: pet, docRef: petRef } = await getOneById(
    db,
    process.env.DB_COLLECTION_PETS,
    id
  );

  // check if pet exists
  if (!pet) throw new GenericError({ message: petErrorMessages.pet_not_found });

  // update pet
  await petRef.update(keepAllowedFieldsOnObj(body, petAllowedFields));

  // send response
  res.code(200).send({
    status: process.env.RES_STATUS_SUCCESS,
    message: "Pet updated successfully!",
  });
};

// function roles:
//  - extract id
//  - query for the pet
//  - check if it exists
//  - delete pet
//  - query for all days, months, years associated
//      with the pet
//  - delete that data
//  - send response

// throws err if:

const removePet = async function (req, res) {};

const petsController = { createPet, updatePet, removePet };

export default petsController;
