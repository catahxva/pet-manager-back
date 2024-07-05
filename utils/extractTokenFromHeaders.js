const extractTokenFromHeaders = function (req) {
  const {
    headers: { authorization },
  } = req;

  if (!authorization) return;

  if (!authorization.startsWith("Bearer")) return;

  const token = authorization.split(" ")[1];

  return token;
};

export default extractTokenFromHeaders;
