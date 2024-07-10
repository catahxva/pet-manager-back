const isNumber = function (n) {
  return typeof n === "number" && !Number.isNaN(n);
};

export default isNumber;
