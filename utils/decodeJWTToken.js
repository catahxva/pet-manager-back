import util from "util";
import jsonwebtoken from "jsonwebtoken";

const decodeJWTToken = async function (token) {
  const decodedToken = await util.promisify(jsonwebtoken.verify)(
    token,
    process.env.JWT_SECRET
  );

  return decodedToken;
};

export default decodeJWTToken;
