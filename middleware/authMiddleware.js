// imports:
import db from "../db.js";
import extractTokenFromHeaders from "../utils/extractTokenFromHeaders.js";
import decodeJWTToken from "../utils/decodeJWTToken.js";
import Criteria from "../utils/Criteria.js";
import { getOneByCriteria, getOneById } from "../utils/dbMethods.js";
import { GenericError } from "../utils/CustomErrors.js";
import { authErrorMessages } from "../utils/messages/authMessages.js";

// function roles:
//  - check if token exists
//  - check if token is blacklisted
//  - check if token has expired
//  - check if user exists
//  - check if user has changed pass since token was emitted

// throws err if:
//  - token doesnt exist
//  - token is blacklisted
//  - token is expired
//  - user does not exist
//  - user changed pass
//  - unexpected errs

const protectRoute = async function (req, res) {
  // extract token
  const token = extractTokenFromHeaders(req);

  // check if token exists
  if (!token)
    throw new GenericError({ message: authErrorMessages.token_not_received });

  // check if token was blacklisted
  const { empty } = await getOneByCriteria(
    db,
    process.env.DB_COLLECTION_BLACKLISTED_TOKENS,
    [new Criteria("token", "==", token)]
  );

  if (!empty)
    throw new GenericError({ message: authErrorMessages.token_blacklisted });

  // decode token and extract daa
  const { id, iat, exp } = await decodeJWTToken(token);

  console.log(iat, exp);

  // check if token is expired
  const currentTime = Date.now();
  const expirationTimeInMs = exp * 1000;

  if (currentTime > expirationTimeInMs)
    throw new GenericError({ message: authErrorMessages.token_expired });

  // get user based on id decoded from token
  const { doc: user, docData: userData } = getOneById(
    db,
    process.env.DB_COLLECTION_USERS,
    id
  );

  // check if user exists
  if (!user)
    throw new GenericError({ message: authErrorMessages.user_not_found });

  // get the time when the user changed their pass (if they did)
  const { changedPasswordAt } = userData;

  // check if they changed pass after token was emitted
  if (changedPasswordAt && changedPasswordAt > iat)
    throw new GenericError({ message: authErrorMessages.pass_changed });

  req.user = { id: user.id, ...userData };
};

const authMiddleware = { protectRoute };

export default authMiddleware;
