import crypto from "crypto";

const createCrypto32Token = function (expirationTime) {
  const token = crypto.randomBytes(32).toString("hex");
  const tokenExpirationTime = Date.now() + expirationTime;

  return [token, tokenExpirationTime];
};

export default createCrypto32Token;
