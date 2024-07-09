import connect from "./DB";
import mongo from "mongodb";
import bcrypt from "bcrypt";
import jwt, { verify } from "jsonwebtoken";
(async () => {
  let db = await connect();
  await db.collection("users").createIndex({ email: 1 }, { unique: true });
})();
export default {
  async registerUser(user) {
    let db = await connect(); // pristup db objektu
    //enkripcija
    let doc = {
      username: user.name,
      email: user.email,
      password: await bcrypt.hash(user.password, 8),
    };
    try {
      let result = await db.collection("users").insertOne(doc);
      if (result && result.insertedId) {
        return { id: result.insertedId };
      }
    } catch (error) {
      if (error.code == 11000) {
        throw new Error("već postoji user");
      } else {
        console.log(error);
      }
    }

    console.log("register user info ", doc);
  },
  async authenticateUser(email, password) {
    let db = await connect();
    let user = await db.collection("users").findOne({ email: email });

    //sign if pass maatches
    if (
      user &&
      user.password &&
      (await bcrypt.compare(password, user.password))
    ) {
      //sign
      delete user.password;
      let token = jwt.sign(user, process.env.JWT_SECRET, {
        algorithm: "HS512",
        expiresIn: "1 week",
      });
      console.log(user);
      return { token };
    } else {
      throw new Error("cannot authenticate");
    }
  },
  //middlewear
  verify(req, res, next) {
    let token = req.headers.authorization.split(` `);
    let tokenType = token[0];
    let tokenContent = token[1];
    try {
      if (tokenType != "Bearer") {
        return res.status(401).send();
      } else {
        req.jwt = jwt.verify(tokenContent, process.env.JWT_SECRET);
        return next();
      }
    } catch (error) {
      return res.status(401).send();
    }
  },
};
