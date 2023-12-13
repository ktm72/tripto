const jwt = require("jsonwebtoken");

function authenticateToken(req, res, next) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];
  if (token == null) return res.status(401).send("Unauthorized!");

  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, user) => {
    //Not valid, Forbidden, Doesn't have access right
    if (err) return res.sendStatus(403);
    //custom req, this can be received
    req.user = user; // user contains validUser data while logged in
    next();
  });
}

function generateAccessToken(user) {
  return jwt.sign(user, process.env.ACCESS_TOKEN_SECRET);
}

module.exports = { generateAccessToken, authenticateToken };
