import db from "../db.js";

const createFood = async function (req, res) {
  const { body } = req;

  const collectionRef = db.collection("foods");
  const newFoodRef = collectionRef.doc();

  await newFoodRef.set(body);

  res.code(200).send({
    message: "boooooon",
  });
};

const foodsController = { createFood };

export default foodsController;
