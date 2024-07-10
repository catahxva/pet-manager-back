import db from "../db.js";
import { getOneByCriteria } from "../utils/dbMethods.js";
import Criteria from "../utils/Criteria";
import { GenericError } from "../utils/CustomErrors";
import { authErrorMessages } from "../utils/messages/authMessages";

const checkForBlacklistedToken = async function (req, res) {
  const { token } = req;

  const { empty } = await getOneByCriteria(
    db,
    process.env.DB_COLLECTION_BLACKLISTED_TOKENS,
    [new Criteria("token", "==", token)]
  );

  if (!empty)
    throw new GenericError({ message: authErrorMessages.token_blacklisted });
};

const blacklistedTokenMiddleware = {
  checkForBlacklistedToken,
};

export default blacklistedTokenMiddleware;
