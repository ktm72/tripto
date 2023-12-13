const multer = require("multer");
const path = require("path");
//store nothing
const storage = multer.diskStorage({
  // destination: (req, file, cb) => {
  //   cb(null, "uploads");
  // },
  // filename: (req, file, cb) => {
  //   cb(
  //     null,
  //     new Date().toISOString().replace(/:/g, "-") + "-" + file.originalname
  //   );
  // },
});
//type filter
const filefilter = async (req, file, cb) => {
  // let ext = path.extname(file.originalname).toLowerCase();
  // console.log(ext);
  if (
    file.mimetype === "image/png" ||
    file.mimetype === "image/jpg" ||
    file.mimetype === "image/jpeg"
  ) {
    //options: error, accept file
    cb(null, true);
  } else {
    cb(null, false);
  }
};
//storage: storage
const upload = multer({ storage: storage, fileFilter: filefilter });

module.exports = { upload };
