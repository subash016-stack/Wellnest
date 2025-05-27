const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const cors = require("cors");


const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());
app.use(bodyParser.json());

// MongoDB Connection
mongoose.connect("mongodb://127.0.0.1:27017/wellnest", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
  .then(() => console.log("Connected to MongoDB"))
  .catch((err) => console.error("MongoDB connection error:", err));

/* 
   USER REGISTRATION & LOGIN
    */
const registrationSchema = new mongoose.Schema({
  fullname: String,
  username: String,
  role: { type: String, enum: ["user", "counsellor"], required: true },
  dob: String,
  email: String,
  phone: String,
  password: String,
  confirm_password: String,
  terms: Boolean,
  resetPasswordToken: String,
  resetPasswordExpires: Date,
});
const Registration = mongoose.model("Registration", registrationSchema);

app.post("/register", async (req, res) => {
  try {
    const data = req.body;
    if (data.password !== data.confirm_password) {
      return res.status(400).json({ message: "Passwords do not match" });
    }

    data.terms = data.terms === "on" || data.terms === true;
    const newUser = new Registration(data);
    await newUser.save();

    return res.status(201).json({ message: "Registration successful" });
  } catch (error) {
    console.error("Error saving user:", error);
    return res.status(500).json({ message: "Server error" });
  }
});

app.post("/login", async (req, res) => {
  const { username, password, role } = req.body;
  try {
    const user = await Registration.findOne({ username, role });
    if (!user)
      return res.status(404).json({ message: "User not found for selected role" });
    if (user.password !== password)
      return res.status(401).json({ message: "Invalid password" });

    return res.status(200).json({ message: "Login successful", role: user.role });
  } catch (error) {
    console.error("Login error:", error);
    return res.status(500).json({ message: "Server error" });
  }
});

app.get("/user/:username", async (req, res) => {
  const { username } = req.params;
  try {
    const user = await Registration.findOne({ username });
    if (!user) return res.status(404).json({ message: "User not found" });

    return res.json({
      name: user.fullname,
      email: user.email,
      mobile: user.phone,
      role: user.role,
      username: user.username,
      password: user.password,
    });
  } catch (error) {
    console.error("Fetch user error:", error);
    return res.status(500).json({ message: "Server error" });
  }
});

/* 
   COUNSELLING SESSION BOOKING
   */
const bookingSchema = new mongoose.Schema({
  username: String,
  email: String,
  mobile: String,
  time: String,
  date: String,
  counsellor: String,
  roomName: String, //  new field
  status: { type: String, default: "Booked" },
  createdAt: { type: Date, default: Date.now },
});
const Booking = mongoose.model("Booking", bookingSchema);

app.post("/api/book-session", async (req, res) => {
  const { username, time, date, counsellor } = req.body;

  if (!username || !time || !date || !counsellor) {
    return res.status(400).json({ message: "Missing required fields" });
  }

  try {
    const existing = await Booking.findOne({ time, date, counsellor, status: "Booked" });
    if (existing) return res.status(409).json({ message: "This slot is already booked." });

    const user = await Registration.findOne({ username });
    if (!user) return res.status(404).json({ message: "User not found." });

    const roomName = `WellnestRoom_${Date.now()}`;

    const booking = new Booking({
      username,
      email: user.email,
      mobile: user.phone,
      time,
      date,
      counsellor,
      roomName, // assigned here
      status: "Booked",
    });

    await booking.save();

    return res.status(201).json({ message: "Session booked successfully." });
  } catch (error) {
    console.error("Booking error:", error);
    return res.status(500).json({ error: "Booking failed." });
  }
});

app.get("/api/bookings", async (req, res) => {
  try {
    const bookings = await Booking.find();
    return res.json(bookings);
  } catch (error) {
    console.error("Fetch bookings error:", error);
    return res.status(500).json({ error: "Failed to fetch bookings." });
  }
});

app.get("/api/user-bookings", async (req, res) => {
  const username = req.query.username;
  if (!username) return res.status(400).json({ message: "Missing username" });

  try {
    const userBookings = await Booking.find({ username });
    return res.json(userBookings);
  } catch (error) {
    console.error("Fetch user bookings error:", error);
    return res.status(500).json({ message: "Failed to fetch user bookings" });
  }
});

app.post("/api/cancel-session", async (req, res) => {
  const { time, date, counsellor } = req.body;

  if (!time || !counsellor) {
    return res.status(400).json({ message: "Missing time or counsellor." });
  }

  try {
    const result = await Booking.updateOne(
      { time, date, counsellor, status: "Booked" },
      { $set: { status: "cancelled" } }
    );

    if (result.modifiedCount === 1) {
      return res.json({ message: "Session cancelled successfully." });
    } else {
      return res.status(404).json({ message: "Session not found or already cancelled." });
    }
  } catch (error) {
    console.error("Cancel error:", error);
    return res.status(500).json({ message: "Server error cancelling session." });
  }
});

app.get("/api/booked-slots", async (req, res) => {
  try {
    const booked = await Booking.find({ status: "Booked" }).select("time date counsellor -_id");
    return res.json(booked);
  } catch (err) {
    return res.status(500).json({ message: "Error fetching booked slots" });
  }
});

app.get("/api/counsellor-bookings", async (req, res) => {
  const counsellor = req.query.counsellor;
  if (!counsellor) return res.status(400).json({ message: "Missing counsellor username" });

  try {
    const counsellorBookings = await Booking.find({ counsellor });
    return res.json(counsellorBookings);
  } catch (error) {
    console.error("Error fetching counsellor bookings:", error);
    return res.status(500).json({ message: "Server error" });
  }
});

/*
    JITSI ROOM GENERATOR */

app.get("/api/session-room", async (req, res) => {
  const { username } = req.query;

  if (!username) {
    return res.status(400).json({ message: "Missing username parameter." });
  }

  try {
    const user = await Registration.findOne({ username });
    if (!user) return res.status(404).json({ message: "User not found" });

    const role = user.role;

    const query =
      role === "counsellor"
        ? { counsellor: username, status: "Booked" }
        : { username, status: "Booked" };

    const session = await Booking.findOne(query).sort({ createdAt: -1 }); // latest

    if (!session) {
      return res.status(404).json({ message: "No session found." });
    }

    return res.json({ roomName: session.roomName });
  } catch (err) {
    console.error("Room fetch error:", err);
    return res.status(500).json({ message: "Error fetching session room." });
  }
});


/* 
   FEEDBACK & OPENAI CHATBOT */
const feedbackSchema = new mongoose.Schema({
  username: String,
  sessionId: String,
  rating: String,
  summary: String,
  endTime: String,
  createdAt: { type: Date, default: Date.now },
});
const Feedback = mongoose.model("Feedback", feedbackSchema);

app.post("/api/session-feedback", async (req, res) => {
  try {
    const feedback = new Feedback(req.body);
    await feedback.save();
    return res.status(201).json({ message: "Feedback submitted successfully." });
  } catch (error) {
    console.error("Feedback error:", error);
    return res.status(500).json({ message: "Failed to submit feedback." });
  }
});


//notes summary
const SessionNoteSchema = new mongoose.Schema({
  counsellor: { type: String, required: true },
  username: { type: String, required: true },
  notes: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
});

const SessionNote = mongoose.model("SessionNote", SessionNoteSchema);


app.post('/api/session-notes', async (req, res) => {
  const { counsellor, username, notes } = req.body;

  if (!counsellor || !username || !notes) {
    return res.status(400).json({ message: 'Missing required fields' });
  }

  try {
    const newNote = new SessionNote({ counsellor, username, notes });
    await newNote.save();
    res.status(201).json({ message: 'Note saved successfully', noteId: newNote._id });
  } catch (error) {
    console.error('❌ Error saving note:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get all session notes for a specific counsellor
app.get('/api/session-notes', async (req, res) => {
  const { counsellor } = req.query;

  if (!counsellor) {
    return res.status(400).json({ message: 'Missing counsellor parameter' });
  }

  try {
    const notes = await SessionNote.find({ counsellor }).sort({ createdAt: -1 });
    res.json(notes);
  } catch (err) {
    console.error('Error fetching notes:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get all registered users (for admin)
app.get("/api/users", async (req, res) => {
  try {
    const users = await Registration.find({}, "-password -confirm_password -resetPasswordToken -resetPasswordExpires");
    res.json(users);
  } catch (err) {
    console.error("Fetch users error:", err);
    res.status(500).json({ message: "Failed to fetch users" });
  }
});

// Update user (admin action)
app.put("/api/user/:id", async (req, res) => {
  try {
    const updateData = req.body;
    const updatedUser = await Registration.findByIdAndUpdate(req.params.id, updateData, { new: true });
    if (!updatedUser) return res.status(404).json({ message: "User not found" });
    console.log(`User ${updatedUser.username} updated by admin.`);
    res.json({ message: "User updated", user: updatedUser });
  } catch (err) {
    console.error("Update user error:", err);
    res.status(500).json({ message: "Failed to update user" });
  }
});

// Delete user (admin action)
app.delete("/api/user/:id", async (req, res) => {
  try {
    const deletedUser = await Registration.findByIdAndDelete(req.params.id);
    if (!deletedUser) return res.status(404).json({ message: "User not found" });
    console.log(`User ${deletedUser.username} deleted by admin.`);
    res.json({ message: "User deleted" });
  } catch (err) {
    console.error("Delete user error:", err);
    res.status(500).json({ message: "Failed to delete user" });
  }
});


/* 
   START SERVER
    */
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
