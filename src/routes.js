// src/routes.js

let home = (req, res) => res.send("Hello World, ovaj puta iz paketa!");
let student = (req, res) => res.send("Ruta za studente preko novog paketa.");

export default { home, student }; // na kraju navodimo koje JS objekte trebaeksportat
