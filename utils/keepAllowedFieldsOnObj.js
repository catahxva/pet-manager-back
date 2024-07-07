const keepAllowedFieldsOnObj = function (obj, allowedFields) {
  const originalObjKeys = Object.keys(obj);
  const clearedObj = {};

  originalObjKeys.forEach((key) => {
    if (allowedFields.includes(key)) clearedObj[key] = obj[key];
  });

  return clearedObj;
};

export default keepAllowedFieldsOnObj;
