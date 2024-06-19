import storage from "../memoryData.js";
//gluposti
function sometingHandler() {
  console.log("u handleru sam");
  return "uso sam u handler";
}
function studentHandler(req, res) {
  let upit = req.query;

  let godina = upit.godina;
  let kolegij = upit.kolegij;
  // ... obično bi ovdje odredili koji je odgovor
  let odgovor = {
    upit, // vraćamo upit natrag, čisto za provjeru
    status: "uspješno",
  };
  res.json(odgovor);
}
function getingData(req, res) {
  //let upit = req.params;
  // napravi nešto s upitom...
  let odgovor = {
    storage, // vraćamo upit natrag, čisto za provjeru
    status: "uspješno",
  };
  let podatci = storage.posts;
  res.json(podatci);
}
//novi handlovi
export { sometingHandler, studentHandler, getingData };
