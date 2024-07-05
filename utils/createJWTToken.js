import jsonwebtoken from "jsonwebtoken";

const createJWTToken = function (payload) {
  return jsonwebtoken.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRATION_TIME,
  });
};

export default createJWTToken;
