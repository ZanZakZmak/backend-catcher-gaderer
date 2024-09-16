//import mongo from "mongodb";
import { MongoClient } from "mongodb";
let uri =
  "mongodb+srv://zmak:1234@clustercatchergaderer.7nbp3nd.mongodb.net/?retryWrites=true&w=majority";

const client = new MongoClient(uri);

let db = null;
// eksportamo Promise koji resolva na konekciju
export default () => {
  return new Promise(async (resolve, reject) => {
    // ako smo inicijalizirali bazu i klijent je još uvijek spojen
    //&& client.isConnected()
    //console.log("message1 :");
    if (db) {
      console.log("jos uvjek povezan sa db");
      resolve(db);
    } else {
      //console.log("message3");
      try {
        await client.connect();
        console.log("Connected to MongoDB Atlas");
        db = client.db("CatcherGaderer");
        resolve(db);
      } catch (err) {
        console.error("Error connecting to MongoDB Atlas:", err);
        reject("Spajanje na bazu nije uspjelo:" + err);
      }
    }
  });
};
