export const getOneByCriteria = async function (db, collection, criterias) {
  // criterias = [{criteriaField, criteriaOperator, criteriaValue}]

  // get collection reference
  const collectionRef = db.collection(collection);

  // build the query
  const collectionWhereQuery = criterias.reduce(
    (acc, { criteriaField, criteriaOperator, criteriaValue }) =>
      acc.where(criteriaField, criteriaOperator, criteriaValue),
    collectionRef
  );
  const collectionQuery = collectionWhereQuery.limit(1);

  // execute the query and extract data
  const { empty, docs } = await collectionQuery.get();

  // guard clause if query is empty
  if (empty) return { empty, doc: null, docData: null, docRef: null };

  // extract the doc, docData and doc reference
  const [doc] = docs;
  const docData = doc.data();
  const docRef = doc.ref;

  // return all needed data
  return { empty, doc, docData, docRef };
};

export const getMultipleByCriteria = async function (
  db,
  collection,
  criterias
) {
  // criterias = [{criteriaField, criteriaOperator, criteriaValue}]

  // get collection reference
  const collectionRef = db.collection(collection);

  // build the query
  const collectionQuery = criterias.reduce(
    (acc, { criteriaField, criteriaOperator, criteriaValue }) =>
      acc.where(criteriaField, criteriaOperator, criteriaValue),
    collectionRef
  );

  // execute the query and extract data
  const { empty, docs } = await collectionQuery.get();

  // guard clause if query is empty
  if (empty) return { empty, docs: null, docsData: null, docsRefs: null };

  // extract docs data and docs refs
  const docsData = [];
  const docsRefs = [];

  docs.forEach((doc) => {
    docsData.push({ id: doc.id, ...doc.data() });
    docsRefs.push(doc.ref);
  });

  // return all needed data
  return { empty, docs, docsData, docsRefs };
};

export const getOneById = async function (db, collection, id) {
  const collectionRef = db.collection(collection);
  const docRef = collectionRef.doc(id);
  const doc = await docRef.get();

  if (!doc.exists) return { doc: null, docData: null, docRef: null };

  const docData = doc.data();

  return { doc, docData, docRef };
};
