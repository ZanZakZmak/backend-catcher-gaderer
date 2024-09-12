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
/*app.post("/posts", (req, res) => {
  let data = req.body;
  // ovo inače radi baza (autoincrement ili sl.), ali čisto za primjer
  data.id = 1 + storage.posts.reduce((max, el) => Math.max(el.id, max), 0);
  // dodaj u našu bazu (lista u memoriji)
  //storage.posts.push(data);
  // vrati ono što je spremljeno
  console.log(data);
  res.json(data); // vrati podatke za referencu
});*/

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

//social posts
//sa js filteranje
/*app.get("/posts", async (req, res) => {
  let query = req.query;
  console.log("da vidimo querry:", query);
  //with mongo querry object
  let filter;
  try {
    let db = await connect(); // pristup db objektu
    let cursor = await db.collection("posts").find();
    let results = await cursor.toArray();
    console.log("testic", results);
    //filter with javascript
    if (query.search && !(query.search === "") && query.search != "null") {
      results = results.filter((element) => {
        return !(
          element.title.toLowerCase().search(query.search.toLowerCase()) === -1
        );
      });
    }
    if (
      query.categoryFilter &&
      query.categoryFilter != "" &&
      query.categoryFilter != "null"
    ) {
      let category = query.categoryFilter.split(",");
      console.log("ovo je moj querry :", category);
      function checkCategory(dbCat, searchCat) {
        let result = false;
        for (let i = 0; i < searchCat.length; i++) {
          if (dbCat.includes(searchCat[i].toLowerCase())) {
            result = true;
          }
        }
        return result;
      }
      results = results.filter((element) => {
        return checkCategory(element.category, category);
      });
    }
    res.status(200).json(results);
  } catch (error) {
    res.status(500).json({ errors: error });
  }
});*/
app.get("/posts", async (req, res) => {
  let query = req.query;
  console.log("state iner:", query);
  try {
    let filtersExample = {
      //and on wat things
      $and: [
        { title: new RegExp("ulov") },
        // category filter
        { category: { $all: ["herb", "fungi"] } },
        //area filter
        { area: new RegExp("pula") },
      ],
    };
    let filters = {};

    if (
      (query.search && !(query.search === "")) ||
      (query.categoryFilter &&
        query.categoryFilter != "" &&
        query.categoryFilter != "null") ||
      (query.areaFilter &&
        !(query.areaFilter === "") &&
        query.areaFilter != "null")
    ) {
      filters.$and = [];
    }
    //search term
    if (query.search && !(query.search === "")) {
      filters.$and.push({
        $or: [
          { title: new RegExp(query.search, "i") },
          { createdBy: new RegExp(query.search, "i") },
        ],
      });
    }
    //category filter
    if (
      query.categoryFilter &&
      query.categoryFilter != "" &&
      query.categoryFilter != "null"
    ) {
      let category = query.categoryFilter.split(",");

      filters.$and.push({ category: { $all: [...category] } });
    }

    //area filter
    if (
      query.areaFilter &&
      !(query.areaFilter === "") &&
      query.areaFilter != "null"
    ) {
      filters.$and.push({ area: new RegExp(query.areaFilter, "i") });
    }

    let db = await connect(); // pristup db objektu
    let cursor = await db
      .collection("posts")
      .find(filters)
      .sort({ createdTime: 1 }); //.sort( { postedAt: 1 })
    let results = await cursor.toArray();
    res.status(200).json(results);
  } catch (error) {
    res.status(500).json({ errors: error });
  }
});
/*app.get("/s-posts", (req, res) => {
  res.status(200).json({ message: "ovo je tajna" });
});*/

app.get("/tesiranjePosts", (req, res) => {
  let posts = [
    {
      title: "narnia",
      imgUrl: "",
      text: "",
      createdBy: "",
      createdByID: "",
      date: "",
      type: ["fish", "herb", "fungi"],
      comments: [1, 2, 3, 4],
    },
    {
      title: "got",
      imgUrl: "",
      text: "",
      createdBy: "",
      createdByID: "",
      date: "",
      type: ["herb", "fungi"],
      comments: [1, 2, 3, 4],
    },
    {
      title: "lotr",
      imgUrl: "",
      text: "",
      createdBy: "",
      createdByID: "",
      date: "",
      type: ["fish"],
      comments: [1, 2, 3, 4],
    },
  ];

  //filtriranje ovdje primamo querry sa front i vracamo filtrirano sa back stranom
  let query = req.query;
  console.log("ovo je moj querry :", query);
  console.log("ovo je moj querry :", typeof query.key3);

  if (query.search && !(query.search === "")) {
    posts = posts.filter((element) => {
      return !(
        element.title.toLowerCase().search(query.search.toLowerCase()) === -1
      );
    });
  }

  if (query.key2) {
    let category = query.key2.split(",");
    console.log("ovo je moj querry :", category);
    function checkCategory(dbCat, searchCat) {
      let result = false;
      for (let i = 0; i < searchCat.length; i++) {
        if (dbCat.includes(searchCat[i].toLowerCase())) {
          result = true;
        }
      }
      return result;
    }
    posts = posts.filter((element) => {
      return checkCategory(element.type, category);
    });
  }
  /*else {
    res.status(200).json(posts);
    return;
  }*/

  console.log("tetiranje", posts);

  res.status(200).json(posts);
});
app.post("/posts", async (req, res) => {
  var postData = req.body;
  let db = await connect(); // pristup db objektu
  let doc = {
    title: postData.title,
    text: postData.text,
    imgUrl: postData.imgUrl,
    createdBy: postData.createdBy,
    createdById: postData.createdById,
    createdTime: postData.createdTime,
    area: postData.area,
    category: [...postData.category],
    comments: postData.comments,
  };

  try {
    let result = await db.collection("posts").insertOne(doc);
    let id;
    if (result && result.insertedId) {
      id = result.insertedId;
    }
    res.status(200).json(id);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
//single socialpost
app.get("/post/:id", async (req, res) => {
  let id = req.params.id;

  try {
    let db = await connect(); // pristup db objektu
    let results = await db
      .collection("posts")
      .findOne({ _id: new ObjectId(id) });

    //dodati funkciju za komentare ucitat preko ID-eva i mapirati u novi objekt ili maanualno pošto je jedan
    let cursor = await db
      .collection("comments")
      .find({ postId: id }) //new ObjectId(id)
      .sort({ createdTime: 1 }); //.sort( { postedAt: 1 })
    let commentArr = await cursor.toArray();
    //prebaciti cu u id samo da ne bude _
    commentArr.forEach((element) => {
      element.id = element._id;
      delete element._id;
    });
    //zamjenjujem u arrayu
    results.comments = commentArr;

    //console.log("results :", results);
    res.status(200).json(results);
  } catch (error) {
    res.status(500).json({ errors: error });
  }
});
app.delete("/post/:id", (req, res) => {
  res.status(200).json({});
});
//comments
/*
app.get("/post/:postid/comments", async (req, res) => {
  let id = req.params.postid;
  try {
    let db = await connect(); // pristup db objektu
    let cursor = await db
      .collection("comments")
      .find({ postId: id }) //new ObjectId(id)
      .sort({ createdTime: 1 }); //.sort( { postedAt: 1 })
    let results = await cursor.toArray();
    res.status(200).json(results);
  } catch (error) {
    res.status(500).json({ errors: error });
  }
});*/
app.post("/post/:postid/comment", async (req, res) => {
  let id = req.params.postid;
  var postData = req.body;
  let doc = {
    text: postData.text,
    createdBy: postData.createdBy,
    createdById: postData.createdById,
    createdTime: postData.createdTime,
    postId: postData.postId,
  };
  let db = await connect();

  try {
    //add comment
    let result = await db.collection("comments").insertOne(doc);
    let comId;
    if (result && result.insertedId) {
      comId = result.insertedId;
    }
    //update post
    let resultUpdate = await db.collection("posts").updateOne(
      { _id: new ObjectId(id) },

      { $push: { comments: comId } }
    );

    res.status(200).json(comId);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
app.delete("/post/:postid/comments/:comid", async (req, res) => {
  let postId = req.params.postid;
  let commentId = req.params.comid;

  try {
    let db = await connect(); // pristup db objektu
    //remove from post
    let resultUpdate = await db.collection("posts").updateOne(
      { _id: new ObjectId(postId) },

      { $pull: { comments: { _id: new ObjectId(commentId) } } }
    );
    //remove comment
    await db.collection("comments").deleteOne({ _id: new ObjectId(commentId) });

    res.sendStatus(200);
  } catch (error) {
    res.status(500).json({ errors: error });
  }
});
//info posts
//encyclopedia
app.get("/encyclopedia", async (req, res) => {
  let query = req.query;
  console.log("state iner:", query);
  try {
    let filtersExample = {
      //and on wat things
      $and: [
        { title: new RegExp("ulov") },
        // category filter
        { category: { $all: ["herb", "fungi"] } },
        //area filter
        { area: new RegExp("pula") },
      ],
    };
    let filters = {};

    if (
      (query.search && !(query.search === "")) ||
      (query.categoryFilter &&
        query.categoryFilter != "" &&
        query.categoryFilter != "null") ||
      (query.areaFilter &&
        !(query.areaFilter === "") &&
        query.areaFilter != "null")
    ) {
      filters.$and = [];
    }
    //search term
    if (query.search && !(query.search === "")) {
      filters.$and.push({
        $or: [
          { title: new RegExp(query.search, "i") },
          { createdBy: new RegExp(query.search, "i") },
        ],
      });
    }
    //category filter
    if (
      query.categoryFilter &&
      query.categoryFilter != "" &&
      query.categoryFilter != "null"
    ) {
      let category = query.categoryFilter.split(",");

      filters.$and.push({ category: { $all: [...category] } });
    }

    //area filter
    if (
      query.areaFilter &&
      !(query.areaFilter === "") &&
      query.areaFilter != "null"
    ) {
      filters.$and.push({ area: new RegExp(query.areaFilter, "i") });
    }

    let db = await connect(); // pristup db objektu
    let cursor = await db.collection("encyclopedia").find();
    //.sort({ createdTime: 1 }); //.sort( { postedAt: 1 })
    let results = await cursor.toArray();
    res.status(200).json(results);
  } catch (error) {
    res.status(500).json({ errors: error });
  }
});

app.post("/encyclopedia", async (req, res) => {
  var postData = req.body;

  let doc = {
    name: postData.name,
    nameLat: postData.nameLat,
    namesAlt: postData.namesAlt,
    imgUrl: postData.imgUrl,
    poison: postData.poison,
    category: postData.category,
    description: postData.description,
  };

  try {
    let db = await connect(); // pristup db objektu
    let result = await db.collection("encyclopedia").insertOne(doc);
    let id;
    if (result && result.insertedId) {
      id = result.insertedId;
    }
    res.status(200).json(id);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
//single encyclopedia
app.get("/encyclopedia/:id", async (req, res) => {
  let id = req.params.id;

  try {
    let db = await connect(); // pristup db objektu
    let results = await db
      .collection("encyclopedia")
      .findOne({ _id: new ObjectId(id) });

    //console.log("results :", results);
    res.status(200).json(results);
  } catch (error) {
    res.status(500).json({ errors: error });
  }
});
//profile
// dodavanje rute u aplikaciju
app.get("/studenti", dataHandlers.studentHandler);
//testovi
app.get("/testQuery", async (req, res) => {
  let query = req.query;
  console.log("state iner:", query);
  try {
    let filtersExample = {
      //and on wat things
      $and: [
        { title: new RegExp("ulov") },
        // category filter
        { category: { $all: ["herb", "fungi"] } },
        //area filter
        { area: new RegExp("pula") },
      ],
    };
    let filters = {};

    if (
      (query.search && !(query.search === "")) ||
      (query.categoryFilter &&
        query.categoryFilter != "" &&
        query.categoryFilter != "null") ||
      (query.areaFilter &&
        !(query.areaFilter === "") &&
        query.areaFilter != "null")
    ) {
      filters.$and = [];
    }
    //search term
    if (query.search && !(query.search === "")) {
      filters.$and.push({
        $or: [
          { title: new RegExp(query.search, "i") },
          { createdBy: new RegExp(query.search, "i") },
        ],
      });
    }
    //category filter
    if (
      query.categoryFilter &&
      query.categoryFilter != "" &&
      query.categoryFilter != "null"
    ) {
      let category = query.categoryFilter.split(",");

      filters.$and.push({ category: { $all: [...category] } });
    }

    //area filter
    if (
      query.areaFilter &&
      !(query.areaFilter === "") &&
      query.areaFilter != "null"
    ) {
      filters.$and.push({ area: new RegExp(query.areaFilter, "i") });
    }

    let db = await connect(); // pristup db objektu
    let cursor = await db.collection("posts").find(filters);
    let results = await cursor.toArray();
    res.status(200).json(results);
  } catch (error) {
    res.status(500).json({ errors: error });
  }
});
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
