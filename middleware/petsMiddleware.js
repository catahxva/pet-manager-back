import db from "../db.js";
import { GenericError } from "../utils/CustomErrors.js";
import { getOneById } from "../utils/dbMethods.js";

const checkPetExists = async function (req, _res) {
  const {
    body: { petId },
  } = req;

  if (!petId)
    throw new GenericError({
      message: "Pet ID is required in order to complete this action.",
    });

  const { doc: petDoc, docData: petData } = await getOneById(
    db,
    process.env.DB_COLLECTION_PETS,
    petId
  );

  if (!petDoc) throw new GenericError({ message: "", statusCode: 404 });

  req.pet = { id: petDoc.id, ...petData };
};

const petsMiddleware = {
  checkPetExists,
};

export default petsMiddleware;
