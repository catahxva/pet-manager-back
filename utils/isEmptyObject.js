const isEmptyObject = function (object) {
  return object.constructor === Object && Object.keys(object).length === 0;
};

export default isEmptyObject;
