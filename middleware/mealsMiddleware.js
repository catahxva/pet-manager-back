import { GenericError } from "../utils/CustomErrors";

const documentsCorrespond = function (req, _res, done) {
  const {
    user: { id: userId },
    pet: { id: petId, userId: userIdOfPet },
    day: { petId: petIdOfDay, userId: userIdOfDay },
  } = req;

  if (userId !== userIdOfPet)
    throw new GenericError({ message: "User and pet dont match" });

  if (petId !== petIdOfDay)
    throw new GenericError({ message: "Pet and day dont match" });

  if (userId !== userIdOfDay)
    throw new GenericError({ message: "User and day dont match" });

  done();
};

const mealsMiddleware = { documentsCorrespond };

export default mealsMiddleware;
