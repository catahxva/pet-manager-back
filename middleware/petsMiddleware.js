import db from "../db.js";
import { GenericError } from "../utils/CustomErrors.js";
import { getOneById } from "../utils/dbMethods.js";
import { petErrorMessages } from "../utils/messages/petMessages.js";

const extractPetIdBody = function (req, _res, done) {
  const {
    body: { petId },
  } = req;

  if (!petId)
    throw new GenericError({
      message: petErrorMessages.no_id,
    });

  req.petId = petId;

  done();
};

const extractPetIdParams = function (req, _res, done) {
  const {
    params: { id: petId },
  } = req;

  req.petId = petId;

  done();
};

const checkPetExists = async function (req, _res) {
  const { petId } = req;

  const {
    doc: petDoc,
    docData: petData,
    docRef: petRef,
  } = await getOneById(db, process.env.DB_COLLECTION_PETS, petId);

  if (!petDoc)
    throw new GenericError({
      message: petErrorMessages.pet_not_found,
      statusCode: 404,
    });

  req.pet = { id: petDoc.id, ...petData };
  req.petRef = petRef;
};

const petsMiddleware = {
  extractPetIdBody,
  extractPetIdParams,
  checkPetExists,
};

export default petsMiddleware;
