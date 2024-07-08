import db from "../db.js";
import { GenericError } from "../utils/CustomErrors.js";
import { getOneById } from "../utils/dbMethods.js";
import { petErrorMessages } from "../utils/messages/petMessages.js";

const checkPetExists = async function (req, _res) {
  const {
    body: { petId },
  } = req;

  if (!petId)
    throw new GenericError({
      message: petErrorMessages.no_id,
    });

  const { doc: petDoc, docData: petData } = await getOneById(
    db,
    process.env.DB_COLLECTION_PETS,
    petId
  );

  if (!petDoc)
    throw new GenericError({
      message: petErrorMessages.pet_not_found,
      statusCode: 404,
    });

  req.pet = { id: petDoc.id, ...petData };
};

const petsMiddleware = {
  checkPetExists,
};

export default petsMiddleware;
