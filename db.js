import { initializeApp, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import serviceAccount from "./pet-manager-cbacc-3a9f70a09c1f.json" assert { type: "json" };

// connect to db fn
const connectDB = function () {
  try {
    initializeApp({
      credential: cert(serviceAccount),
    });

    console.log(`Connected to DB`);

    return getFirestore();
  } catch (err) {
    console.log(`DB Error`, err);
  }
};

const db = connectDB();

export default db;
