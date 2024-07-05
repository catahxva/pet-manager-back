const checkDataUniqueness = async function (
  db,
  collection,
  fieldsToCheck,
  uniquenessErrorMessages
) {
  // fieldsToCheck = [{fieldName, fieldValue}]
  // db is expected to be the firestore db

  const errorObject = {};

  const collectionRef = db.collection(collection);

  const queryPromises = fieldsToCheck.map(async ({ fieldName, fieldValue }) => {
    const collectionQuery = collectionRef
      .where(fieldName, "==", fieldValue)
      .limit(1);
    const { empty } = await collectionQuery.get();

    return empty;
  });

  const resolvedQueryPromises = await Promise.all(queryPromises);

  fieldsToCheck.forEach(({ fieldName }, index) => {
    if (!resolvedQueryPromises[index])
      errorObject[fieldName] = uniquenessErrorMessages[fieldName];
  });

  return errorObject;
};

export default checkDataUniqueness;
