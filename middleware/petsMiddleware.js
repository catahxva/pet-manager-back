import db from "../db.js";
import { GenericError } from "../utils/CustomErrors.js";
import { getOneById } from "../utils/dbMethods.js";
import { petErrorMessages } from "../utils/messages/petMessages.js";

// function roles:
//  - extract data from body (1)
//  - validate data (2)
//  - put id on req (3)
//  - forward req (4)

// throws err if:
//  - no petId on body

const extractPetIdBody = function (req, _res, done) {
  // 1
  const {
    body: { petId },
  } = req;

  // 2
  if (!petId)
    throw new GenericError({
      message: petErrorMessages.no_id,
    });

  // 3
  req.petId = petId;

  // 4
  done();
};

// function roles:
//  - extract data from params
//  - put data on req obj
//  - forward req
const extractPetIdParams = function (req, _res, done) {
  // 1
  const {
    params: { id: petId },
  } = req;

  // 2
  req.petId = petId;

  // 3
  done();
};

// function roles:
//  - extract pet id from request (1)
//  - query for pet (2)
//  - validate pet (3)
//  - put data on req obj (4)

// throws err if:
//  - no pet found
//  - unexpected err

const checkPetExists = async function (req, _res) {
  // 1
  const { petId } = req;

  // 2
  const {
    doc: petDoc,
    docData: petData,
    docRef: petRef,
  } = await getOneById(db, process.env.DB_COLLECTION_PETS, petId);

  // 3
  if (!petDoc)
    throw new GenericError({
      message: petErrorMessages.pet_not_found,
      statusCode: 404,
    });

  // 4
  req.pet = { id: petDoc.id, ...petData };
  req.petRef = petRef;
};

const petsMiddleware = {
  extractPetIdBody,
  extractPetIdParams,
  checkPetExists,
};

export default petsMiddleware;
