import dotenv from "dotenv";
dotenv.config(); // učitava environment varijable iz datoteke .env
import express from "express";
import routes from "./routes"; // . označava da tražimo modul u istom direktoriju gdje se nalazi ovaj modul
import cors from "cors";
import storage from "./memoryData";
import connect from "./DB";
import * as dataHandlers from "./handlers/dataHandlers.js";
import { ObjectId } from "mongodb";
import mongo from "mongodb";
import auth from "./auth.js";

//import db from "./DB";

const app = express(); // instanciranje aplikacije
const port = 3000; // port na kojem će web server slušati
app.use(express.json()); // automatski dekodiraj JSON poruke
app.use(cors()); // omogući CORS na svim rutama

app.get("/", routes.home);
app.get("/data", dataHandlers.getingData);
//zbog front
app.post("/posts", (req, res) => {
  let data = req.body;
  // ovo inače radi baza (autoincrement ili sl.), ali čisto za primjer
  data.id = 1 + storage.posts.reduce((max, el) => Math.max(el.id, max), 0);
  // dodaj u našu bazu (lista u memoriji)
  //storage.posts.push(data);
  // vrati ono što je spremljeno
  console.log(data);
  res.json(data); // vrati podatke za referencu
});
//auth rute #
//register user
app.post("/user", async (req, res) => {
  var userInfo = req.body;
  let id;
  try {
    id = await auth.registerUser(userInfo);
    res.status(200).json(id);
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: error.message });
  }
});
//log-in user
app.post("/auth", async (req, res) => {
  let userInfo = req.body;

  try {
    let result = await auth.authenticateUser(userInfo.email, userInfo.password);
    console.log(result);
    res.status(200).json(result);
  } catch (error) {
    res.status(401).json({ error: error.message });
  }
});
//example of middleweare
app.get("/testmid", [auth.verify], (req, res) => {
  console.log("ovo je iz req jwt", req.jwt);
  res.status(200).json({ message: "ovo je tajna" });
});
// dodavanje rute u aplikaciju
app.get("/studenti", dataHandlers.studentHandler);
//testovi
app.get("/tesiranjeMongoTAN", [auth.verify], async (req, res) => {
  //let results = { kako: "ono" };
  try {
    let db = await connect(); // pristup db objektu
    let cursor = await db.collection("test1").find();
    let results = await cursor.toArray();
    res.status(200).json(results);
  } catch (error) {
    res.status(500).json({ errors: error });
  }
});
app.post("/tesiranjeMongoTAN", [auth.verify], async (req, res) => {
  let body = req.body;
  if (Object.keys(body).length != 0) {
    let db = await connect(); // pristup db objektu
    let Collection = await db.collection("test1");
    Collection.insertOne(body);
    res.status(200).json(body);
  } else {
    res.sendStatus(400);
  }
});
app.patch("/tesiranjeMongoTAN", [auth.verify], async (req, res) => {
  //id=req.params.id
  let db = await connect(); // pristup db objektu
  let Collection = await db.collection("test1");

  await Collection.updateOne(
    { _id: new ObjectId("65a133559c26c0de372e4224") },

    { $set: { name: "Kumerle2" } }
  );
  res.sendStatus(200);
});
app.delete("/tesiranjeMongoTAN/:id", [auth.verify], async (req, res) => {
  let id = req.params.id;
  try {
    let db = await connect(); // pristup db objektu
    await db.collection("test1").deleteOne({ _id: new ObjectId(id) });

    res.sendStatus(200);
  } catch (error) {
    res.status(500).json({ errors: error });
  }
});

/*async function _getTest() {
  const result = await Collection.find({}).toArray();
  //id: { $in: movieData }
  return result;
}
app.get("/testiranjeMongo", async (req, res) => {
  //const Db = await connect.db;
  //const collection = db.collection("test1");
  let result = await _getTest();
  console.log("db Test:", result);
  res.status(200).json(result);
});*/
app.listen(port, () => console.log(`Slušam na portu ${port}!`));
