const isPositiveNumber = function (n) {
  return typeof n === "number" && !Number.isNaN(n) && n > 0;
};

export default isPositiveNumber;
