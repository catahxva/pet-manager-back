export const getOneByCriteria = async function (db, collection, criterias) {
  // criterias = [{criteriaField, criteriaOperator, criteriaValue}]

  const collectionRef = db.collection(collection);
  const collectionWhereQuery = criterias.reduce(
    (acc, { criteriaField, criteriaOperator, criteriaValue }) =>
      acc.where(criteriaField, criteriaOperator, criteriaValue),
    collectionRef
  );
  const collectionQuery = collectionWhereQuery.limit(1);
  const { empty, docs } = await collectionQuery.get();

  if (empty) return { empty, doc: null, docData: null, docRef: null };

  const [doc] = docs;
  const docData = doc.data();
  const docRef = doc.ref;

  return { empty, doc, docData, docRef };
};
