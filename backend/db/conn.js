const { MongoClient, ServerApiVersion } = require("mongodb");
const mongoClient = new MongoClient(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function connect() {
  await mongoClient.connect();
}
function get(name) {
  return mongoClient.db(name);
}

function close() {
  return mongoClient.close();
}
module.exports = {
  connect,
  get,
  close,
};
