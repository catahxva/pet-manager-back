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
//  - decode token and extract data (1)
//  - put data on req obj (2)
const decodeAuthToken = async function (req, _res) {
  // 1
  const { id, iat, exp } = await decodeJWTToken(token);

  // 2
  req.jwtId = id;
  req.jwtIat = iat;
  req.jwtExp = exp;
};

// function roles:
//  - extract data (1)
//  - compare times (2)
//  - forward req (3)

// throws err if:
//  - token is expired

const checkIfTokenExpired = function (req, _res, done) {
  // 1
  const { jwtExp } = req;

  // 2
  const currentTime = Date.now();
  const expirationTimeInMS = jwtExp * 1000;

  if (currentTime > expirationTimeInMS)
    throw new GenericError({ message: authErrorMessages.token_expired });

  // 3
  done();
};

// function roles:
//  - extract data (1)
//  - get user based on data (2)
//  - put info on req obj (3)

const getUserDocById = async function (req, _res) {
  // 1
  const { jwtId } = req;

  // 2
  const { doc: user, docData: userData } = await getOneById(
    db,
    process.env.DB_COLLECTION_USERS,
    jwtId
  );

  // 3
  req.noUser = !user;
  req.userData = userData;
  req.user = { id: user.id, ...userData };
};

// function roles:
//  - extract data (1)
//  - set criteria for use in later middleware (2)
//  - put said criteria on req obj (3)
//  - go forward with req (4)

// throws err if:
//  - unexpected error

const setReceivedCredentialCriteria = function (req, _res, done) {
  // 1
  const {
    body: { username, email },
  } = req;

  // 2
  const receivedCredential = username || email;
  const fieldToQueryBy = username ? "username" : "email";

  const criteriaArr = [new Criteria(fieldToQueryBy, "==", receivedCredential)];

  // 3
  req.criteria = criteriaArr;

  // 4
  done();
};

// function roles:
//  - return another function in order to create other
//    functions

// returned function roles:
//  - extract token (1)
//  - set criteria arr for other use (2)
//  - put criteria arr on req obj (3)
//  - go forward with req (4)

// throws err if:
//  - unexpected ett
const setTokenCriteriaFactory = function (fieldName) {
  // returned fn
  return function (req, _res, done) {
    // 1
    const { token } = req;

    // 2
    const criteriaArr = [new Criteria(fieldName, "==", token)];

    // 3
    req.criteria = criteriaArr;

    // 4
    done();
  };
};

// 2 fns based on a facotry fn
const setVerifyAccountCriteria = setTokenCriteriaFactory("verifyEmailToken");
const setResetPassCriteria = setTokenCriteriaFactory("changePasswordToken");

// function roles:
//  - extract criteria (1)
//  - get user based on received criteria (2)
//  - put necessary data on req obj (3)

// throws err if:
//  - unexpected err
const getUserDocByCriteria = async function (req, _res) {
  // 1
  const { criteria } = req;

  // 2
  const {
    empty: noUser,
    doc: userDoc,
    docData: userData,
    docRef: userRef,
  } = await getOneByCriteria(db, process.env.DB_COLLECTION_USERS, criteria);

  // 3
  req.noUser = noUser;
  req.userDoc = userDoc;
  req.userData = userData;
  req.userRef = userRef;
};

// function roles:
//  - extract data (1)
//  - check if user exists (2)
//  - go forward with request (3)

// throws err if:
//  - no user found
//  - unexpected err
const checkUserExists = function (req, _res, done) {
  // 1
  const { noUser } = req;

  // 2
  if (noUser)
    throw new GenericError({
      message: authErrorMessages.user_not_found,
      statusCode: 404,
    });

  // 3
  done();
};

// function roles:
//  - extract data (1)
//  - check if user changed pass since token was created (2)
//  - forward req (3)

// throws err if:
//  - user did change pass

const checkUserChangedPass = function (req, _res, done) {
  // 1
  const {
    userData: { changedPasswordAt },
    jwtIat,
  } = req;

  // 2
  const iatInMS = jwtIat * 1000;

  if (changedPasswordAt && changedPasswordAt > iatInMS)
    throw new GenericError({ message: authErrorMessages.pass_changed });

  // 3
  done();
};

// function roles:
//  - extract data (1)
//  - check if user is verified (2)
//  - forward request (3)

// throws err if:
//  - user is already verified
//  - unexpected err

const checkIfUserAlreadyVerified = function (req, _res, done) {
  // 1
  const { userData } = req;

  // 2
  if (userData.verified)
    throw new GenericError({
      message: authErrorMessages.user_already_verified,
    });

  // 3
  done();
};

// function roles:
//  - extract data (1)
//  - check if user is verified (2)
//  - forward request (3)

// throws error if:
//  - user is not verified
//  - unexpected err

const checkIfUserNotVerified = function (req, _res, done) {
  // 1
  const { userData } = req;

  // 2
  if (!userData.verified)
    throw new GenericError({ message: authErrorMessages.user_not_verified });

  // 3
  done();
};

const authMiddleware = {
  getTokenFromHeaders,
  decodeAuthToken,
  checkIfTokenExpired,
  getUserDocById,
  setReceivedCredentialCriteria,
  setVerifyAccountCriteria,
  setResetPassCriteria,
  getUserDocByCriteria,
  checkUserExists,
  checkUserChangedPass,
  checkIfUserAlreadyVerified,
  checkIfUserNotVerified,
};

export default authMiddleware;
