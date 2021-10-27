const mongoose = require("mongoose");
const db = require("../models");

mongoose.connect(process.env.MONGODB_URI || "mongodb://localhost/budget", {
  useNewUrlParser: true
});

const transactionSeed = [
  // {
  //   name: "New Shoes",
  //   value: 100,
  //   date: new Date(new Date().setDate(new Date().getDate() - 9))
  // },
  // {
  //   name: "New Clothes",
  //   value: 200,
  //   date: new Date(new Date().setDate(new Date().getDate() - 7))
  // },
  // {
  //   name: "Utilities",
  //   value: 300,
  //   date: new Date(new Date().setDate(new Date().getDate() - 5))
  // },
  // {
  //   name: "Dentist Copay",
  //   value: 50,
  //   date: new Date(new Date().setDate(new Date().getDate() - 5))
  // },
  // {
  //   name: "Thai Food",
  //   value: 50,
  //   date: new Date(new Date().setDate(new Date().getDate() - 3))
  // },
];

db.Transaction.deleteMany({})
  .then(() => db.Transaction.collection.insertMany(transactionSeed))
  .then(data => {
    console.log(data.result.n + " records inserted!");
    process.exit(0);
  })
  .catch(err => {
    console.error(err);
    process.exit(1);
  });