// imports:
import db from "../db.js";
import petAllowedFields from "../utils/allowedFields/petAllowedFields.js";
import keepAllowedFieldsOnObj from "../utils/keepAllowedFieldsOnObj.js";
import Criteria from "../utils/Criteria.js";
import { GenericError } from "../utils/CustomErrors.js";
import {
  petErrorMessages,
  petSuccessMessages,
} from "../utils/messages/petMessages.js";
import { getMultipleByCriteria } from "../utils/dbMethods.js";
import promisifiedTransactionDelete from "../utils/promisifiedTransactionDelete.js";

// function roles:
//  - extract data (1)
//  - check if user has reached the max number (2)
//      of pets
//  - create pet (3)
//  - send back response (4)

// throws error if:
//  - validation error
//  - max number of pets

const createPet = async function (req, res) {
  // 1
  const {
    body,
    user: { id: userId },
  } = req;

  // 2
  const collectionRef = db.collection(process.env.DB_COLLECTION_PETS);
  const collectionQuery = collectionRef.where("userId", "==", userId);
  const { docs: pets } = await collectionQuery.get();

  if (pets.length >= process.env.MAX_PETS_PER_USER)
    throw new GenericError({
      message: petErrorMessages.max_pets,
    });

  // 3
  const newPetRef = collectionRef.doc();

  await newPetRef.set(
    keepAllowedFieldsOnObj({ ...body, userId }, petAllowedFields)
  );

  // 4
  res.code(200).send({
    status: process.env.RES_STATUS_SUCCESS,
    message: petSuccessMessages.add_pet_success,
  });
};

// function roles:
//  - extract data (1)
//  - update the pet information (2)
//  - send response (3)

// throws err if:
//  - unexpected error

const updatePet = async function (req, res) {
  // 1
  const { body, petRef } = req;

  // 2
  await petRef.update(keepAllowedFieldsOnObj(body, petAllowedFields));

  // 3
  res.code(200).send({
    status: process.env.RES_STATUS_SUCCESS,
    message: "Pet updated successfully!",
  });
};

// function roles:
//  - extract data
//  - delete pet
//  - delete all data associated with pet
//  - send response

// throws err if:
//  - unexpected err

const removePet = async function (req, res) {
  // 1
  const {
    petRef,
    pet: { id: petId },
  } = req;

  const criteriaArr = [new Criteria("petId", "==", petId)];

  const [
    { docsRefs: dayRefs },
    { docsRefs: monthRefs },
    { docsRefs: yearRefs },
    { docsRefs: mealRefs },
    { docsRefs: appointmentsRefs },
  ] = await Promise.all([
    getMultipleByCriteria(db, process.env.DB_COLLECTION_DAYS, criteriaArr),
    getMultipleByCriteria(db, process.env.DB_COLLECTION_MONTHS, criteriaArr),
    getMultipleByCriteria(db, process.env.DB_COLLECTION_YEARS, criteriaArr),
    getMultipleByCriteria(db, process.env.DB_COLLECTION_MEALS, criteriaArr),
    getMultipleByCriteria(
      db,
      process.env.DB_COLLECTION_APPOINTMENTS,
      criteriaArr
    ),
  ]);

  const allDocRefs = [
    ...dayRefs,
    ...monthRefs,
    ...yearRefs,
    ...mealRefs,
    ...appointmentsRefs,
  ];

  // 2 && 3
  await db.runTransaction(async (transaction) => {
    // 2
    transaction.delete(petRef);

    // 3
    await Promise.all(
      allDocRefs.map((ref) => promisifiedTransactionDelete(transaction, ref))
    );
  });

  // 4
  res.code(204).send({});
};

const petsController = { createPet, updatePet, removePet };

export default petsController;
