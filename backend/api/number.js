const { MongoClient, ObjectId } = require("mongodb");

const uri = process.env.MONGODB_URI;

// Reuse connection across warm serverless invocations
let cachedClient = null;

async function getCollection() {
  if (!cachedClient) {
    cachedClient = new MongoClient(uri);
    await cachedClient.connect();
  }
  const db = cachedClient.db("numberstore");
  return db.collection("numbers");
}

const ALLOWED_ORIGINS = [
process.env.ALLOWED_ORIGINS ,
];

function setCors(req, res) {
  const origin = req.headers.origin;
  if (ALLOWED_ORIGINS.includes(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
  }
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,DELETE,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  res.setHeader("Access-Control-Allow-Credentials", "true");
}

module.exports = async function handler(req, res) {
  setCors(req, res);

  if (req.method === "OPTIONS") return res.status(200).end();

  try {
    const collection = await getCollection();

    // ── GET /api/numbers ──────────────────────────────────────
    if (req.method === "GET") {
      const docs = await collection.find({}).sort({ _id: 1 }).toArray();
      const numbers = docs.map((d) => ({
        id: d._id.toString(),
        value: d.value,
      }));
      return res.json({ success: true, numbers });
    }

    // ── POST /api/numbers ─────────────────────────────────────
    if (req.method === "POST") {
      const { value } = req.body;

      if (value === undefined || value === null || value === "") {
        return res.status(400).json({ success: false, message: "Value is required" });
      }

      const num = Number(value);
      if (isNaN(num)) {
        return res.status(400).json({ success: false, message: "Value must be a valid number" });
      }

      const result = await collection.insertOne({ value: String(num) });
      const total = await collection.countDocuments();
      return res.json({
        success: true,
        number: num,
        total,
        id: result.insertedId.toString(),
      });
    }

    // ── DELETE /api/numbers?id=xxxxxx ─────────────────────────
    if (req.method === "DELETE") {
      const { id } = req.query;

      if (!id) {
        return res.status(400).json({ success: false, message: "ID is required" });
      }

      if (!ObjectId.isValid(id)) {
        return res.status(400).json({ success: false, message: "Invalid ID" });
      }

      await collection.deleteOne({ _id: new ObjectId(id) });

      const docs = await collection.find({}).sort({ _id: 1 }).toArray();
      const numbers = docs.map((d) => ({
        id: d._id.toString(),
        value: d.value,
      }));
      return res.json({ success: true, numbers });
    }

    return res.status(405).json({ success: false, message: "Method not allowed" });

  } catch (err) {
    console.error("DB error:", err);
    return res.status(500).json({ success: false, message: "Database error: " + err.message });
  }
};