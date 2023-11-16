//import mongo from "mongodb";
import { MongoClient } from "mongodb";
let uri =
  "mongodb+srv://zmak:1234@clustercatchergaderer.7nbp3nd.mongodb.net/?retryWrites=true&w=majority";

const client = new MongoClient(uri);
console.log("kljent", client);
let x = 2;

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();
    // Send a ping to confirm a successful connection
    //await client.db("admin").command({ ping: 1 });
    console.log("kljent drugi put !!!", client);
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
    // Ensures that the client will close when you finish/error
    await client.close();
  }
}
run().catch(console.dir);
//let db = client.db("")
//prof
/*
let client = new mongo.MongoClient(connection_string, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});
client.connect((err) => {
  if (err) {
    console.error(err);
    return;
  }
  console.log("Database connected successfully!");
  // za sada ništa nećemo raditi, samo zatvaramo pristup sljedećom naredbom
  client.close();
});
*/

//mongo site
/*
const { MongoClient, ServerApiVersion } = require('mongodb');
const uri = "mongodb+srv://zmak:<password>@clustercatchergaderer.7nbp3nd.mongodb.net/?retryWrites=true&w=majority";

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();
    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    await client.close();
  }
}
run().catch(console.dir);
*/

let db = null;
// eksportamo Promise koji resolva na konekciju
export default () => {
  return new Promise((resolve, reject) => {
    // ako smo inicijalizirali bazu i klijent je još uvijek spojen
    if (db && client.isConnected()) {
      resolve(db);
    } else {
      client.connect((err) => {
        if (err) {
          reject("Spajanje na bazu nije uspjelo:" + err);
        } else {
          console.log("Database connected successfully!");
          db = client.db("CatcherGaderer");
          resolve(db);
        }
      });
    }
  });
};
