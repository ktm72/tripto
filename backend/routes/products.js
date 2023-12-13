const express = require("express");
const { ObjectId } = require("mongodb");
//cloudinary
const cloudinary = require("../utils/cloudinary");
// const { upload } = require("../utils/multer");
// const { authenticateToken } = require("../middlewares/authenticate");
const router = express.Router();
//db
const db = require("../db/conn");
const database = db.get("myProject");
//collectons
const blogs = database.collection("blogs");
const destination = database.collection("destination");
const reviews = database.collection("reviews");

// BLOGS WITH PAGINATION
router.get("/blogs", async (req, res) => {
  const page = parseInt(req.query.page) - 1 || 0;
  const size = parseInt(req.query.size);
  try {
    const count = await blogs.estimatedDocumentCount();
    const result = await blogs
      .find({})
      .skip(+page * +size)
      .limit(+size)
      .toArray();

    res.status(200).send({ count, result });
  } catch (error) {
    res.status(501).send("Couldn't Fetch Data!");
  }
});
//GET A BLOG
router.get("/blogs/:id", async (req, res) => {
  const id = req.params.id;
  console.log(id);
  const blogs = database.collection("blogs");
  try {
    const result = await blogs.findOne({ _id: ObjectId(id) });
    res.status(200).send(result);
  } catch (error) {
    res.status(400).send("Couldn't Fetch Data!");
  }
});
// BLOG SEARCH WITH TOPIC
router.get("/blog", async (req, res) => {
  const search = req.query.search;
  try {
    const results = await blogs
      .find({ topic: new RegExp(search, "i") })
      .toArray();
    res.status(200).send(results);
  } catch (error) {
    res.status(501).send("Couldn't Fetch Data!");
  }
});
//GET ALL SERVICE FOR FRONT PAGE AND PAGINATED
router.get("/services", async (req, res) => {
  const page = parseInt(req.query.page) - 1 || 0;
  const size = parseInt(req.query.size) || 6;
  const sort = parseInt(req.query.sort) || -1;
  try {
    const pipeline = [
      {
        $project: {
          avgRating: {
            $avg: "$rating",
          },
          headline: 1,
          img: 1,
          description: 1,
          thumbImg: 1,
          price: 1,
          place: 1,
        },
      },
      {
        $sort: {
          avgRating: sort,
        },
      },
    ];
    const counts = await destination.estimatedDocumentCount();
    const cursor = destination.aggregate(pipeline);
    const results = await cursor
      .skip(+page * +size)
      .limit(+size)
      .toArray();
    res.status(200).send({ counts, results });
  } catch (error) {
    res.status(501).send({ message: "Couldn't fetch data" }).end();
  }
});
// SERVICE SEARCH WITH PLACE
router.get("/service", async (req, res) => {
  const search = req.query.search;

  try {
    const pipeline = [
      {
        $match: {
          place: RegExp(search, "i"),
        },
      },
      {
        $project: {
          avgRating: {
            $avg: "$rating",
          },
          headline: 1,
          img: 1,
          description: 1,
          thumbImg: 1,
          price: 1,
          place: 1,
        },
      },
    ];
    const cursor = destination.aggregate(pipeline);
    const results = await cursor.toArray();
    res.status(302).send(results);
  } catch (error) {
    res.status(501).send("Couldn't Found Data!");
  }
});
//GET A SERVICE
router.get("/services/:id", async (req, res) => {
  const id = req.params.id;
  try {
    const pipeline = [
      {
        $match: {
          _id: ObjectId(id),
        },
      },
      {
        $project: {
          avgRating: {
            $avg: "$rating",
          },
          headline: 1,
          img: 1,
          description: 1,
          thumbImg: 1,
          price: 1,
          place: 1,
        },
      },
    ];
    const cursor = destination.aggregate(pipeline);
    const results = await cursor.toArray();
    res.status(200).send(results);
  } catch (error) {
    res.status(400).send("Couldn't Fetch Data!");
  }
});
//ADD REVIEW
router.post("/review", async (req, res) => {
  const { username, feedback, userImg, rating, uid, serviceId, serviceName } =
    req.body;
  const review = {
    feedback,
    username,
    userImg,
    rating,
    uid,
    serviceId,
    serviceName,
    createdAt: new Date(),
  };
  try {
    await reviews.insertOne(review);
    await destination.updateOne(
      { _id: ObjectId(serviceId) },
      { $push: { reviews: uid, rating: rating } },
      { upsert: true }
    );
    res.status(201).send("Review Created!");
  } catch (error) {
    res.status(400).send("Failed!");
  }
});
//GET REVIEWS FOR EITHER SERVICE ID OR USER ID
router.get("/review/:id", async (req, res) => {
  const id = req.params.id;
  try {
    const result = await reviews
      .find({
        $or: [{ serviceId: id }, { uid: id }],
      })
      .toArray();
    res.status(200).send(result);
  } catch (error) {
    res.status(400).send("Failed!");
  }
});
//GET ALL REVIEWS
router.get("/reviews", async (req, res) => {
  try {
    const result = await reviews.find({}).toArray();
    res.status(200).send(result);
  } catch (error) {
    res.status(400).send("Failed!");
  }
});
//EDIT REVIEW
router.patch("/review", async (req, res) => {
  const reviewId = req.body.id;
  const rating = req.body.rating;
  const feedback = req.body.feedback || "";

  if (rating <= 0) {
    return res.status(205).status("Please set a rating!");
  }
  const values = { rating, feedback };
  try {
    await reviews.findOneAndUpdate(
      { _id: ObjectId(reviewId) },
      {
        $set: { ...values },
        $currentDate: { lastModified: true },
      },
      { upsert: true }
    );

    res.status(204).send("Updated!");
  } catch (error) {
    res.status(400).send("Couldn't Update!");
  }
});
//Delete review
router.delete("/review", async (req, res) => {
  const reviewId = req.body.reviewId;
  const userId = req.body.uid;
  try {
    const result = await reviews.findOneAndDelete(
      { _id: ObjectId(reviewId) },
      { projection: { _id: 0, serviceId: 1, rating: 1 } }
    );
    const id = result.value.serviceId;
    const rating = result.value.rating;
    await destination.updateOne(
      { _id: ObjectId(id) },
      { $pull: { reviews: userId, rating: rating } }
    );
    res.status(204).send("Deleted");
  } catch (error) {
    res.status(400).send("Couldn't Delete!");
  }
});

// ADD SERVICE
router.post("/add-service", async (req, res) => {
  const { title, desc, price, image, place } = req.body;

  try {
    const result = await cloudinary.uploader.upload(image, {
      upload_preset: "destinations",
    });

    let thumbImg = result.secure_url;
    const cloudinary_id = result.public_id;
    if (thumbImg) {
      const service = {
        headline: title,
        thumbImg,
        place,
        cloudinary_id,
        description: desc,
        price,
        rating: [],
        reviews: [],
      };
      await destination.insertOne(service);
      res.status(201).send(thumbImg);
    }
  } catch (error) {
    res.status(500).send("Failed!");
  }
});
//DELETE SERVICE
router.delete("/add-service", async (req, res) => {
  const serviceId = req.body.id;
  try {
    await destination.findOneAndDelete({ _id: ObjectId(serviceId) });
    await reviews.deleteMany({ serviceId: serviceId });
    res.sendStatus(204);
  } catch (error) {
    res.status(400).send("Couldn't Delete!");
  }
});

// for practice only
//not working, don't know why
// router.get("/both", async (req, res) => {
//   try {
//     const cursor = destination
//       .aggregate([
//         { $match: { reviews: uid } },
//         {
//           $lookup: {
//             from: "reviews",
//             localField: "uid",
//             foreignField: "uid",
//             as: "reviews",
//           },
//         },
//       ]);
// const result = cursor.toArray();
//     res.send(result);
//   } catch (error) {
//     res.sendStatus(500);
//   }
// });

// router.post("/sum", async (req, res) => {
//   const serviceId = req.body.id;
//   try {
//     const result = await reviews
//       .aggregate([
//         { $match: { serviceId: serviceId } },
//         {
//           $group: {
//             rating: { $sum: "$rating" },
//           },
//         },
//       ])
//       .toArray();
//     res.status(200).send(result);
//   } catch (error) {
//     res.status(500).send("couldn't");
//   }
// });

module.exports = router;
