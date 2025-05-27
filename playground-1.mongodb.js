const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const app = express();
app.use(express.json());
app.use(cors());

mongoose.connect("mongodb://localhost:27017/counsellors", { useNewUrlParser: true, useUnifiedTopology: true });

const counsellorSchema = new mongoose.Schema({
    name: String,
    email: String,
    phone: String,
    specialization: String
});

const Counsellor = mongoose.model("Counsellor", counsellorSchema);

app.post("/addCounsellor", async (req, res) => {
    const newCounsellor = new Counsellor(req.body);
    await newCounsellor.save();
    res.json({ message: "Counsellor added successfully!" });
});

app.get("/getCounsellors", async (req, res) => {
    const counsellors = await Counsellor.find();
    res.json(counsellors);
});

app.delete("/deleteCounsellor/:id", async (req, res) => {
    await Counsellor.findByIdAndDelete(req.params.id);
    res.json({ message: "Counsellor deleted successfully!" });
});

app.listen(3000, () => console.log("Server running on port 3000"));