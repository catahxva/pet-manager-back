// imports:
import db from "../db.js";
import extractTokenFromHeaders from "../utils/extractTokenFromHeaders.js";
import decodeJWTToken from "../utils/decodeJWTToken.js";
import Criteria from "../utils/Criteria.js";
import { getOneByCriteria, getOneById } from "../utils/dbMethods.js";
import { GenericError } from "../utils/CustomErrors.js";
import { authErrorMessages } from "../utils/messages/authMessages.js";

// function roles:
//  - extract token (1)
//  - check if token exists (2)
//  - put token on req obj
//  - go forward with req

// throws err if:
//  - no token
//  - unexpected err

const getTokenFromHeaders = function (req, _res, done) {
  // 1
  const token = extractTokenFromHeaders(req);

  // 2
  if (!token)
    throw new GenericError({ message: authErrorMessages.token_not_received });

  // 3
  req.token = token;

  // 4
  done();
};

// function roles:
//  - get token (1)
//  - check if token is blacklisted (2)
//  - decode token and extract data (3)
//  - check if token is expired (4)
//  - check if user exists (5)
//  - check if user changed pass meanwhile (6)
//  - check if user is verified (7)
//  - put user on req obj (8)

// throws err if:
//  - token blacklisted
//  - token expired
//  - user doesnt exist
//  - user changed pass
//  - user is not verified
//  - unexpected err
const protectRoute = async function (req, res) {
  // 1
  const { token } = req;

  // 2
  const { empty } = await getOneByCriteria(
    db,
    process.env.DB_COLLECTION_BLACKLISTED_TOKENS,
    [new Criteria("token", "==", token)]
  );

  if (!empty)
    throw new GenericError({ message: authErrorMessages.token_blacklisted });

  // 3
  const { id, iat, exp } = await decodeJWTToken(token);

  // 4
  const currentTime = Date.now();
  const expirationTimeInMs = exp * 1000;

  if (currentTime > expirationTimeInMs)
    throw new GenericError({ message: authErrorMessages.token_expired });

  // 5
  const { doc: user, docData: userData } = await getOneById(
    db,
    process.env.DB_COLLECTION_USERS,
    id
  );

  if (!user)
    throw new GenericError({ message: authErrorMessages.user_not_found });

  // 6
  const { changedPasswordAt, verified } = userData;

  const iatInMs = iat * 1000;

  if (changedPasswordAt && changedPasswordAt > iatInMs)
    throw new GenericError({ message: authErrorMessages.pass_changed });

  // 7
  if (!verified)
    throw new GenericError({ message: authErrorMessages.user_not_verified });

  // 8
  req.user = { id: user.id, ...userData };
};

const setReceivedCredentialCriteria = function (req, _res, done) {
  // extract data
  const {
    body: { username, email },
  } = req;

  // set up field and value for criteria
  const receivedCredential = username || email;
  const fieldToQueryBy = username ? "username" : "email";

  // build criteria arr
  const criteriaArr = [new Criteria(fieldToQueryBy, "==", receivedCredential)];

  // set criteria on res
  req.criteria = criteriaArr;

  done();
};

// factory function to create two diff functions which are very
// similar to each other
const setTokenCriteriaFactory = function (fieldName) {
  // returns the final funciton
  return function (req, _res, done) {
    // extracts toekn
    const { token } = req;

    // creates criteria arrray
    const criteriaArr = [new Criteria(fieldName, "==", token)];

    // sets criteria arr on req obj
    req.criteria = criteriaArr;

    done();
  };
};

// create fns based on factory fn
const setVerifyAccountCriteria = setTokenCriteriaFactory("verifyEmailToken");
const setResetPassCriteria = setTokenCriteriaFactory("changePasswordToken");

// queries user doc based on criteria from prev middleware
const getUserDocByCriteria = async function (req, _res) {
  // extract criteria
  const { criteria } = req;

  // get user doc
  const {
    empty: noUser,
    doc: userDoc,
    docData: userData,
    docRef: userRef,
  } = await getOneByCriteria(db, process.env.DB_COLLECTION_USERS, criteria);

  // put necessary info on req obj
  req.noUser = noUser;
  req.userDoc = userDoc;
  req.userData = userData;
  req.userRef = userRef;
};

// checks if the user does exist
const checkUserExists = function (req, _res, done) {
  // extract data from req
  const { noUser } = req;

  // throw err if no user
  if (noUser)
    throw new GenericError({
      message: authErrorMessages.user_not_found,
      statusCode: 404,
    });

  done();
};

// checks if the user is already verified (useful for actions like
// resending a verification token)
const checkIfUserAlreadyVerified = function (req, _res, done) {
  // extract data
  const { userData } = req;

  // do check
  if (userData.verified)
    throw new GenericError({
      message: authErrorMessages.user_already_verified,
    });

  done();
};

// check if user is not verified yet (useful for actions like login,
// forgot pass, etc)
const checkIfUserNotVerified = function (req, _res, done) {
  // extract data
  const { userData } = req;

  // do check
  if (!userData.verified)
    throw new GenericError({ message: authErrorMessages.user_not_verified });

  done();
};

const authMiddleware = {
  getTokenFromHeaders,
  protectRoute,
  setReceivedCredentialCriteria,
  setVerifyAccountCriteria,
  setResetPassCriteria,
  getUserDocByCriteria,
  checkUserExists,
  checkIfUserAlreadyVerified,
  checkIfUserNotVerified,
};

export default authMiddleware;
