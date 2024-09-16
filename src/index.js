import dotenv from "dotenv";
dotenv.config(); // učitava environment varijable iz datoteke .env
import express from "express";
import cors from "cors";
import connect from "./DB";
//import * as dataHandlers from "./handlers/dataHandlers.js";
import { ObjectId } from "mongodb";
import mongo from "mongodb";
import auth from "./auth.js";

//import db from "./DB";

const app = express(); // instanciranje aplikacije
const port = 3000; // port na kojem će web server slušati
app.use(express.json()); // automatski dekodiraj JSON poruke
app.use(cors()); // omogući CORS na svim rutama

//auth rute #
//register user
app.post("/user", async (req, res) => {
  var userInfo = req.body;
  let id;
  try {
    id = await auth.registerUser(userInfo);
    res.status(200).json(id);
  } catch (error) {
    console.log(error.message);
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
//social posts i info posts
app.get("/posts/:type", [auth.verify], async (req, res) => {
  // nepostojeći querry je samo undefined
  let query = req.query;
  let pharams = req.params;

  try {
    /*let filtersExample = {
      //and on wat things
      $and: [
        { type: new RegExp("social") },
        //search
        { title: new RegExp("ulov") },
        // category filter
        { category: { $all: ["herb", "fungi"] } },
        //area filter
        { area: new RegExp("pula") },
      ],
    };*/
    let filters = {
      $and: [{ type: new RegExp(pharams.type) }],
    };

    //search term
    if (query.search && !(query.search === "")) {
      filters.$and.push({
        $or: [
          { title: new RegExp(query.search, "i") },
          { createdBy: new RegExp(query.search, "i") },
          { text: new RegExp(query.search, "i") },
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
      //poteciali change to find all that have only one of categorys

      filters.$and.push({ category: { $all: [...category] } });
    }

    //area filter for social
    if (
      query.areaFilter &&
      !(query.areaFilter === "") &&
      query.areaFilter != "null"
    ) {
      filters.$and.push({ area: new RegExp(query.areaFilter, "i") });
    }
    // time span filter span
    if (
      query.startTimeFilter &&
      query.endTimeFilter &&
      !(query.startTimeFilter === "") &&
      !(query.endTimeFilter === "") &&
      query.startTimeFilter != "null" &&
      query.endTimeFilter != "null"
    ) {
      console.log("desio sam se", typeof query.startTimeFilter);
      //startTimeFilter
      //endTimeFilter

      filters.$and.push({
        createdTime: {
          $gt: Number(query.startTimeFilter),
          $lte: Number(query.endTimeFilter),
        },
      });
    }
    //info type for info
    //
    if (
      query.infoTypeFilter &&
      !(query.infoTypeFilter === "") &&
      query.infoTypeFilter != "null"
    ) {
      filters.$and.push({ infoType: new RegExp(query.infoTypeFilter, "i") });
    }

    let db = await connect(); // pristup db objektu
    let cursor = await db
      .collection("posts")
      .find(filters)
      .sort({ createdTime: -1 }); //.sort( { postedAt: 1 })
    let results = await cursor.toArray();
    res.status(200).json(results);
  } catch (error) {
    res.status(500).json({ errors: error });
  }
});

app.post("/posts", [auth.verify], async (req, res) => {
  var postData = req.body;
  let db = await connect(); // pristup db objektu
  let doc = {
    type: postData.type,
    title: postData.title,
    text: postData.text,
    imgUrl: postData.imgUrl,
    createdBy: postData.createdBy,
    createdById: postData.createdById,
    createdTime: postData.createdTime,
    //area: postData.area,
    //infoType: postData.infoType,
    category: [...postData.category],
    comments: postData.comments,
  };
  if (postData.type == "social") {
    doc.area = postData.area;
  }
  if (postData.type == "info") {
    doc.infoType = postData.infoType;
  }

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
//single post
//pazi vec pstoji get.posts sa pharams /: tako da ova ruta mora biti drugacija
app.get("/post/:id", [auth.verify], async (req, res) => {
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
      .sort({ createdTime: -1 }); //.sort 1 or -1
    let commentArr = await cursor.toArray();
    //prebaciti cu u id samo da ne bude _
    commentArr.forEach((element) => {
      element.id = element._id;
      delete element._id;
    });
    //zamjenjujem u arrayu
    results.comments = commentArr;

    console.log("results :", results);
    res.status(200).json(results);
  } catch (error) {
    res.status(500).json({ errors: error });
  }
});
app.delete("/post/:id", [auth.verify], async (req, res) => {
  let postid = req.params.id;
  let userid = req.jwt._id;

  try {
    let db = await connect(); // pristup db objektu
    //remove from post
    let cursor = await db.collection("posts");
    let postInfo = await cursor.findOne({ _id: new ObjectId(postid) });
    console.log("post info", postInfo);

    if (postInfo.createdById == userid) {
      console.log("ja sam created", postInfo.createdById);
      console.log("ja sam poslan", userid);
      //remove comments
      let cursorComents = await db.collection("comments");
      postInfo.comments.forEach(async (element) => {
        console.log("ele u coments", element);

        cursorComents.deleteOne({ _id: new ObjectId(element) });
      });
      //remove post
      await cursor.deleteOne({ _id: new ObjectId(postid) });
    } else {
      res.status(500).json({ error: "nije vas post" });
    }

    res.sendStatus(200);
  } catch (error) {
    res.status(500).json({ error: error });
  }
});
//comments

app.post("/posts/:postid/comments", [auth.verify], async (req, res) => {
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
app.delete(
  "/posts/:postid/comments/:comid",
  [auth.verify],
  async (req, res) => {
    let postId = req.params.postid;
    let commentId = req.params.comid;

    try {
      let db = await connect(); // pristup db objektu
      //remove from post
      let resultUpdate = await db.collection("posts").updateOne(
        { _id: new ObjectId(postId) },

        { $pull: { comments: new ObjectId(commentId) } }
      );
      //remove comment
      await db
        .collection("comments")
        .deleteOne({ _id: new ObjectId(commentId) });

      res.sendStatus(200);
    } catch (error) {
      res.status(500).json({ errors: error });
    }
  }
);

//encyclopedia
app.get("/encyclopedia", [auth.verify], async (req, res) => {
  let query = req.query;
  console.log("state iner:", query);
  try {
    let filters = {};

    if (
      (query.search && !(query.search === "")) ||
      (query.categoryFilter &&
        query.categoryFilter != "" &&
        query.categoryFilter != "null") ||
      (query.poisonousFilter &&
        !(query.poisonousFilter === "") &&
        query.poisonousFilter != "null")
    ) {
      filters.$and = [];
    }
    //search term
    if (query.search && !(query.search === "")) {
      filters.$and.push({
        $or: [
          { name: new RegExp(query.search, "i") },
          { nameLat: new RegExp(query.search, "i") },
          { namesAlt: new RegExp(query.search, "i") },
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
      let or = [];

      category.forEach((element) => {
        or.push({ category: new RegExp(element, "i") });
      });

      filters.$and.push({ $or: or });
    }

    //area filter
    if (
      query.poisonousFilter &&
      !(query.poisonousFilter === "") &&
      query.poisonousFilter != "null"
    ) {
      filters.$and.push({ poison: new RegExp(query.poisonousFilter, "i") });
    }

    let db = await connect(); // pristup db objektu
    let cursor = await db.collection("encyclopedia").find(filters);

    let results = await cursor.toArray();
    res.status(200).json(results);
  } catch (error) {
    res.status(500).json({ errors: error });
  }
});

app.post("/encyclopedia", [auth.verify], async (req, res) => {
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
app.get("/encyclopedia/:id", [auth.verify], async (req, res) => {
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
app.patch("/user/password", [auth.verify], async (req, res) => {
  let changes = req.body;

  let id = req.jwt._id;

  if (changes.newPassword && changes.oldPassword) {
    let result = await auth.changeUserPassword(
      id,
      changes.oldPassword,
      changes.newPassword
    );
    console.log("rezultat iz index", result);
    if (result) {
      res.status(201).send();
    } else {
      res.status(500).json({ error: "canot change password" });
    }
  } else {
    res.status(400).json({ error: "krivi unos" });
  }
});
app.patch("/user/username", [auth.verify], async (req, res) => {
  let changes = req.body;

  let id = req.jwt._id;

  if (changes.newUsername && changes.oldPassword) {
    let result = await auth.changeUserUsername(
      id,
      changes.newUsername,
      changes.oldPassword
    );

    if (result) {
      res.status(201).send();
    } else {
      res.status(500).json({ error: "canot change username" });
    }
  } else {
    res.status(400).json({ error: "krivi unos" });
  }
});
app.patch("/user/email", [auth.verify], async (req, res) => {
  let changes = req.body;
  let id = req.jwt._id;
  console.log("stali je tu u tokenu", req.jwt);

  if (changes.newEmail && changes.oldPassword) {
    let result = await auth.changeUserEmail(
      id,
      changes.newEmail,
      changes.oldPassword
    );
    if (result) {
      res.status(201).send();
    } else {
      res.status(500).json({ error: "canot change password" });
    }
  } else {
    res.status(400).json({ error: "krivi unos" });
  }
});

app.listen(port, () => console.log(`Slušam na portu ${port}!`));
