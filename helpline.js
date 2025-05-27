document.addEventListener("DOMContentLoaded", function () {
    const searchInput = document.getElementById("searchInput");
    const helplineCards = document.querySelectorAll(".helpline-card");
    const visitButtons = document.querySelectorAll(".btn[href^='https']");
    const helplineList = document.querySelector(".helpline-list");
    
    const noResultsMessage = document.createElement("p");
    noResultsMessage.textContent = "No search results found";
    noResultsMessage.style.display = "none";
    noResultsMessage.style.color = "red";
    noResultsMessage.style.fontWeight = "bold";
    noResultsMessage.style.textAlign = "center";
    helplineList.appendChild(noResultsMessage);

    window.searchHelplines = function () {
        const filter = searchInput.value.toLowerCase();
        let found = false;

        helplineCards.forEach(card => {
            const title = card.getAttribute("data-title").toLowerCase();
            const description = card.getAttribute("data-description").toLowerCase();
            
            if (title.includes(filter) || description.includes(filter)) {
                card.style.display = "block";
                found = true;
            } else {
                card.style.display = "none";
            }
        });

        noResultsMessage.style.display = found ? "none" : "block";
    };

    // Optional: Add event listener for better user experience
    searchInput.addEventListener("input", searchHelplines);

    // Ensure 'Visit Website' buttons open links in a new tab
    visitButtons.forEach(button => {
        button.addEventListener("click", function (event) {
            event.preventDefault(); // Prevent default anchor behavior
            window.open(this.href, "_blank"); // Open in new tab
        });
    });
});


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