const express = require("express");
const cors = require("cors");
const { MongoClient, ObjectId } = require("mongodb");
const { config } = require("dotenv");

config({ path: "./.env" });

const uri = process.env.MONGODB_URI;
const client = new MongoClient(uri);
const app = express();
const PORT = 4000;

app.use(cors());
app.use(express.json());

async function getCollection() {
  await client.connect();
  const db = client.db("numberstore");
  return db.collection("numbers");
}

// GET /api/numbers
app.get("/api/numbers", async (req, res) => {
  try {
    const collection = await getCollection();
    const docs = await collection.find({}).sort({ _id: 1 }).toArray();
    const numbers = docs.map((d) => ({
      id: d._id.toString(),
      value: d.value,
    }));
    res.json({ success: true, numbers });
  } catch (err) {
    console.error("GET error:", err);
    res.status(500).json({ success: false, message: "Failed to read data: " + err.message });
  }
});

// POST /api/numbers
app.post("/api/numbers", async (req, res) => {
  const { value } = req.body;

  if (value === undefined || value === null || value === "") {
    return res.status(400).json({ success: false, message: "Value is required" });
  }

  const num = Number(value);
  if (isNaN(num)) {
    return res.status(400).json({ success: false, message: "Value must be a valid number" });
  }

  try {
    const collection = await getCollection();
    const result = await collection.insertOne({ value: String(num) });
    const total = await collection.countDocuments();
    res.json({
      success: true,
      number: num,
      total,
      id: result.insertedId.toString(),
    });
  } catch (err) {
    console.error("POST error:", err);
    res.status(500).json({ success: false, message: "Failed to save data: " + err.message });
  }
});

// DELETE /api/numbers?id=xxxxxx
app.delete("/api/numbers", async (req, res) => {
  const { id } = req.query;

  if (!id) {
    return res.status(400).json({ success: false, message: "ID is required" });
  }

  if (!ObjectId.isValid(id)) {
    return res.status(400).json({ success: false, message: "Invalid ID" });
  }

  try {
    const collection = await getCollection();
    await collection.deleteOne({ _id: new ObjectId(id) });
    const docs = await collection.find({}).sort({ _id: 1 }).toArray();
    const numbers = docs.map((d) => ({
      id: d._id.toString(),
      value: d.value,
    }));
    res.json({ success: true, numbers });
  } catch (err) {
    console.error("DELETE error:", err);
    res.status(500).json({ success: false, message: "Failed to delete: " + err.message });
  }
});

app.listen(PORT, () => {
  console.log(`✅ Server running at http://localhost:${PORT}`);
});