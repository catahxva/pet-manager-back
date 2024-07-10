const promisifiedTransactionDelete = function (tr, ref) {
  return new Promise((resolve, reject) => {
    try {
      tr.delete(ref);
      resolve();
    } catch (err) {
      reject(err);
    }
  });
};

export default promisifiedTransactionDelete;
