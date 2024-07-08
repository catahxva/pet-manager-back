// imports:
import db from "../db.js";
import extractTokenFromHeaders from "../utils/extractTokenFromHeaders.js";
import decodeJWTToken from "../utils/decodeJWTToken.js";
import Criteria from "../utils/Criteria.js";
import { getOneByCriteria, getOneById } from "../utils/dbMethods.js";
import { GenericError } from "../utils/CustomErrors.js";
import { authErrorMessages } from "../utils/messages/authMessages.js";

// MIDDLEWARE FOR:
//              - GETTING TOKEN FROM HEADERS
//              - PROTECTING ROUTES FROM UNAUTH USERS
//              - SETTING CRITERIA FOR MULTIPLE ROUTES (USED TO GET USER DOC)
//              - GETTING USER DOC BASED ON PREV SET CRITERIA
//              - CHECKING IF USER EXISTS
//              - CHECKINF IF USER IS ALREADY VERIFIED
//              - CHECKING IF USER IS NOT VERIFIED

const getTokenFromHeaders = function (req, _res, done) {
  // extract token
  const token = extractTokenFromHeaders(req);

  // check if token exists
  if (!token)
    throw new GenericError({ message: authErrorMessages.token_not_received });

  // put token on req obj
  req.token = token;

  done();
};

// protect other routes
const protectRoute = async function (req, res) {
  // extract token
  const { token } = req;

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

  // check if token is expired
  const currentTime = Date.now();
  const expirationTimeInMs = exp * 1000;

  if (currentTime > expirationTimeInMs)
    throw new GenericError({ message: authErrorMessages.token_expired });

  // get user based on id decoded from token
  const { doc: user, docData: userData } = await getOneById(
    db,
    process.env.DB_COLLECTION_USERS,
    id
  );

  // check if user exists
  if (!user)
    throw new GenericError({ message: authErrorMessages.user_not_found });

  // get the time when the user changed their pass (if they did) and
  // their verified status
  const { changedPasswordAt, verified } = userData;

  // convert iat to millis
  const iatInMs = iat * 1000;

  // check if they changed pass after token was emitted
  if (changedPasswordAt && changedPasswordAt > iatInMs)
    throw new GenericError({ message: authErrorMessages.pass_changed });

  // check if user is verified
  if (!verified)
    throw new GenericError({ message: authErrorMessages.user_not_verified });

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
