const keepAllowedFieldsOnObj = function (obj, allowedFields) {
  const clearedObj = {};

  allowedFields.forEach((field) => {
    if (obj[field]) clearedObj[field] = obj[field];
  });

  return clearedObj;
};

export default keepAllowedFieldsOnObj;
