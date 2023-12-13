const express = require("express");
const path = require("path");
const cors = require("cors");
const { MongoServerError } = require("mongodb");
require("dotenv").config();
const cookieParser = require("cookie-parser");
//db
const db = require("./db/conn");
//routes
const productRoutes = require("./routes/products");
const userRoutes = require("./routes/users");

const PORT = process.env.PORT || 5000;
const app = express();
//middleware

app.use(cors());
app.use(express.urlencoded({ extended: true, limit: "50mb" }));
app.use(express.json({ limit: "50mb" }));
app.use(cookieParser());
//upload
// app.use("/uploads", express.static(path.join(__dirname, "uploads")));

//testing
app.get("/", (req, res) => {
  res.send("HEY, WHO ARE YOU?");
});
//routes
app.use("/api", productRoutes);
app.use("/api", userRoutes);

//connect to the server
async function main() {
  try {
    await db.connect();
    console.log("Connected successfully to server");
  } catch (error) {
    if (error instanceof MongoServerError) {
      console.log(`Error worth logging: ${error}`); // special case for some reason
    }
    console.log(error);
  }
}
main().catch(console.dir);

app.listen(PORT, () => console.log(`server is running on port ${PORT}`));
