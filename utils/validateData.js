const validateData = function (fieldsToValidate, validationErrorMessages) {
  // fieldsToValidate = [{fieldValidationCondition, fieldName}]

  const errorObject = {};

  fieldsToValidate.forEach(({ fieldValidationCondition, fieldName }) => {
    if (fieldValidationCondition)
      errorObject[fieldName] = validationErrorMessages[fieldName];
  });

  return errorObject;
};

export default validateData;
