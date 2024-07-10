// imports:
import db from "../db.js";
import petAllowedFields from "../utils/allowedFields/petAllowedFields.js";
import keepAllowedFieldsOnObj from "../utils/keepAllowedFieldsOnObj.js";
import validateData from "../utils/validateData.js";
import isEmptyObject from "../utils/isEmptyObject.js";
import FieldToValidate from "../utils/FieldToValidate.js";
import Criteria from "../utils/Criteria.js";
import { GenericError, ComplexError } from "../utils/CustomErrors.js";
import {
  petValidationErrorMessages,
  petErrorMessages,
  petSuccessMessages,
} from "../utils/messages/petMessages.js";
import { getMultipleByCriteria } from "../utils/dbMethods.js";

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
  const { body, petRef } = req;

  // update pet
  await petRef.update(keepAllowedFieldsOnObj(body, petAllowedFields));

  // send response
  res.code(200).send({
    status: process.env.RES_STATUS_SUCCESS,
    message: "Pet updated successfully!",
  });
};

// function roles:
//  - extract data
//  - delete pet
//  - query for all days, months, years associated
//      with the pet
//  - delete that data
//  - send response

// throws err if:

const removePet = async function (req, res) {
  // extract data
  const { petRef } = req;

  const criteriaArr = [new Criteria("petId", "==", petId)];

  // get doc refs
  const [
    { docsRefs: dayRefs },
    { docsRefs: monthRefs },
    { docsRefs: yearRefs },
    { docsRefs: mealRefs },
  ] = await Promise.all([
    getMultipleByCriteria(db, process.env.DB_COLLECTION_DAYS, criteriaArr),
    getMultipleByCriteria(db, process.env.DB_COLLECTION_MONTHS, criteriaArr),
    getMultipleByCriteria(db, process.env.DB_COLLECTION_YEARS, criteriaArr),
    getMultipleByCriteria(db, process.env.DB_COLLECTION_MEALS, criteriaArr),
  ]);

  // create one main arr
  const allDocRefs = [...dayRefs, ...monthRefs, ...yearRefs, ...mealRefs];

  // promisify delete operation
  const promisifiedTransactionDelete = function (tr, ref) {
    return new Promise((resolve, reject) => {
      try {
        tr.delete(ref);
        resolve();
      } catch (err) {
        reject(err);
      }
    });
  };

  // delete doc and other related data
  await db.runTransaction(async (transaction) => {
    transaction.delete(petRef);

    await Promise.all(
      allDocRefs.map((ref) => promisifiedTransactionDelete(transaction, ref))
    );
  });

  res.code(204).send({});
};

const petsController = { createPet, updatePet, removePet };

export default petsController;
