import express from "express";
import routes from "./routes"; // . označava da tražimo modul u istom direktoriju gdje se nalazi ovaj modul
import cors from "cors";
import storage from "./memoryData";
import connect from "./DB";

const app = express(); // instanciranje aplikacije
const port = 3000; // port na kojem će web server slušati
app.use(express.json()); // automatski dekodiraj JSON poruke
app.use(cors()); // omogući CORS na svim rutama

let studentHandler = (req, res) => {
  let upit = req.query;

  let godina = upit.godina;
  let kolegij = upit.kolegij;
  // ... obično bi ovdje odredili koji je odgovor
  let odgovor = {
    upit, // vraćamo upit natrag, čisto za provjeru
    status: "uspješno",
  };
  res.json(odgovor);
};

let dynamicStudentHandler = (req, res) => {
  let upit = req.params;
  // napravi nešto s upitom...
  let odgovor = {
    upit, // vraćamo upit natrag, čisto za provjeru
    status: "uspješno",
  };
  res.json(odgovor);
};

let getingData = (req, res) => {
  //let upit = req.params;
  // napravi nešto s upitom...
  let odgovor = {
    storage, // vraćamo upit natrag, čisto za provjeru
    status: "uspješno",
  };
  let podatci = storage.posts;
  res.json(podatci);
};

app.post("/posts", (req, res) => {
  let data = req.body;
  // ovo inače radi baza (autoincrement ili sl.), ali čisto za primjer
  data.id = 1 + storage.posts.reduce((max, el) => Math.max(el.id, max), 0);
  // dodaj u našu bazu (lista u memoriji)
  storage.posts.push(data);
  // vrati ono što je spremljeno
  console.log(data);
  res.json(data); // vrati podatke za referencu
});

app.put("/put", (req, res) => {
  let data = req.body;
  // ovo inače radi baza (autoincrement ili sl.), ali čisto za primjer
  //data.id = 1 + storage.posts.reduce((max, el) => Math.max(el.id, max), 0)
  // dodaj u našu bazu (lista u memoriji)
  //storage.posts.push(data)
  // vrati ono što je spremljeno
  console.log(data);
  res.json(data); // vrati podatke za referencu
});

app.patch("/patch", (req, res) => {
  let data = req.body;
  // ovo inače radi baza (autoincrement ili sl.), ali čisto za primjer
  //data.id = 1 + storage.posts.reduce((max, el) => Math.max(el.id, max), 0)
  // dodaj u našu bazu (lista u memoriji)
  //storage.posts.push(data)
  // vrati ono što je spremljeno
  console.log(data);
  res.json(data); // vrati podatke za referencu
});

// dodavanje rute u aplikaciju
app.get("/student/:id", dynamicStudentHandler);

app.get("/data", getingData);

app.get("/", routes.home);
//app.get("/student", routes.student);
// dodavanje rute u aplikaciju
app.get("/studenti", studentHandler);

app.listen(port, () => console.log(`Slušam na portu ${port}!`));
