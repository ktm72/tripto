const express = require("express");
const bcrypt = require("bcrypt");
const { ObjectId } = require("mongodb");
//json web token
const jwt = require("jsonwebtoken");
const {
  generateAccessToken,
  authenticateToken,
} = require("../middlewares/authenticate");
const router = express.Router();
//db
const db = require("../db/conn");
const database = db.get("myProject");
const users = database.collection("users");

//register
router.post("/register", async (req, res) => {
  const found = await users.findOne({ email: req.body.email });
  console.log(found);
  if (found) return res.status(409).send("User Already Exists!");
  try {
    const salt = await bcrypt.genSalt(11);
    const hashedPass = await bcrypt.hash(req.body.password, salt);
    const user = {
      name: req.body.fullName,
      password: hashedPass,
      email: req.body.email,
      img: req.body.photo,
    };
    await users.insertOne(user);
    res.status(201).send("Successfull");
  } catch (error) {
    res.status(400).send("Not successfull!");
  }
});

//login
router.post("/login", async (req, res) => {
  const user = await users.findOne({ email: req.body.email });

  if (user == null) {
    return res.status(401).send("Authentication Failed!");
  }
  try {
    const isValid = await bcrypt.compare(req.body.password, user.password);
    if (isValid) {
      const validUser = { userId: user._id, username: user.name };
      //generate token
      const accessToken = generateAccessToken(validUser);
      await users.findOneAndUpdate(
        { _id: user._id },
        {
          $set: {
            accessToken: accessToken,
          },
        }
      );
      res.status(200).send({
        accessToken: accessToken,
        msg: "Success!",
      });
    } else {
      res.status(406).send("Not allowed!");
    }
  } catch (error) {
    return res.status(401).send("Authentication Failed!");
  }
});
// USERS
router.get("/users", async (req, res) => {
  try {
    const result = await users.find({}).toArray();
    //req succeeded
    res.status(200).send(result);
  } catch (error) {
    //not found
    res.status(404).send("Not Found!");
  }
});
// USER
router.get("/user", authenticateToken, async (req, res) => {
  const { userId } = req.user;
  try {
    const result = await users.findOne({ _id: ObjectId(userId) });
    //req succeeded, found
    res.status(302).send({ name: result.name });
  } catch (error) {
    //not found
    res.status(404).send("Not Found!");
  }
});

//LOGOUT
// router.delete("/logout", async (req, res) => {
//   const authHeader = req.headers["authorization"];
//   const token = authHeader && authHeader.split(" ")[1]; //token stored
//   if (!token) return res.status(401).send("Unauthorized Token");
//   try {
//     await users.findOneAndUpdate(
//       { accessToken: token },
//       {
//         $set: {
//           accessToken: "",
//         },
//       }
//     );

//     res.status(204).send("Deleted!");
//   } catch (error) {
//     res.sendStatus(500);
//   }
// });
module.exports = router;
