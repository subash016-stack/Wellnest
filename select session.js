let selectedSlot = null;
let selectedCounsellor = null;
let bookings = [];
let bookedSlots = [];
let selectedDate = null;

const availableSlots = [
  "10:00 AM", "12:00 PM", "2:00 PM", "4:00 PM", "6:00 PM"
];

document.addEventListener("DOMContentLoaded", async function () {
  selectedCounsellor = getCounsellorFromURL();
  if (!selectedCounsellor) {
    alert("No counsellor selected.");
    return;
  }

  setupDatePicker();
  await fetchBookedSlots();
  await fetchAllBookings();
  updateBookingSummary();
});

function getCounsellorFromURL() {
  const params = new URLSearchParams(window.location.search);
  return params.get("counsellor");
}

function setupDatePicker() {
  const dateInput = document.getElementById("session-date");
  const today = new Date();
  const maxDate = new Date();
  maxDate.setDate(today.getDate() + 15); // 15-day window

  dateInput.min = today.toISOString().split("T")[0];
  dateInput.max = maxDate.toISOString().split("T")[0];

  dateInput.addEventListener("change", () => {
    selectedDate = dateInput.value;
    renderSlots();
  });
}

async function fetchBookedSlots() {
  try {
    const res = await fetch("http://localhost:3000/api/booked-slots");
    bookedSlots = await res.json();
  } catch (err) {
    console.error("Error fetching booked slots:", err);
  }
}

async function fetchAllBookings() {
  try {
    const res = await fetch("http://localhost:3000/api/bookings");
    bookings = await res.json();
  } catch (err) {
    console.error("Error fetching bookings:", err);
  }
}

function renderSlots() {
  const slotsList = document.getElementById("slots-list");
  slotsList.innerHTML = "";

  if (!selectedDate) {
    slotsList.innerHTML = "<p>Please select a date to view available slots.</p>";
    return;
  }

  availableSlots.forEach((slotTime, index) => {
    const slotDiv = document.createElement("div");
    slotDiv.classList.add("slot");
    slotDiv.textContent = slotTime;

    const isBooked = bookedSlots.some(bs =>
      bs.time === slotTime &&
      bs.date === selectedDate &&
      bs.counsellor === selectedCounsellor
    );

    if (isBooked) {
      slotDiv.classList.add("booked");
      slotDiv.title = "Already booked";
    } else {
      slotDiv.addEventListener("click", () => bookSlot(slotTime));
    }

    slotsList.appendChild(slotDiv);
  });
}

function bookSlot(slotTime) {
  const username = localStorage.getItem("username");
  if (!username || !selectedDate || !selectedCounsellor) {
    alert("Missing booking information or not logged in.");
    return;
  }

  const confirmMsg = `Are you sure you want to book a session with ${selectedCounsellor} on ${selectedDate} at ${slotTime}?`;
  if (!confirm(confirmMsg)) {
    return; // User cancelled the action
  }

  const booking = {
    username,
    time: slotTime,
    date: selectedDate,
    counsellor: selectedCounsellor,
    status: "Booked"
  };

  fetch("http://localhost:3000/api/book-session", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(booking)
  })
    .then(res => res.json())
    .then(data => {
      if (data.message) {
        alert(`Session booked on ${selectedDate} at ${slotTime}`);
        bookings.push(booking);
        fetchBookedSlots().then(() => renderSlots());
        updateBookingSummary();
        document.getElementById("confirmation-message").classList.remove("hidden");
      } else {
        alert("Booking failed. Try again.");
      }
    })
    .catch(err => {
      console.error("Booking error:", err);
      alert("Error booking session.");
    });
}

function cancelBooking(sessionTime) {
  if (!confirm("Are you sure you want to cancel this session?")) return;

  fetch("http://localhost:3000/api/cancel-session", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      time: sessionTime,
      counsellor: selectedCounsellor,
      date: selectedDate
    })
  })
    .then(res => res.json())
    .then(async (data) => {
      if (data.message) {
        alert(data.message);
        await fetchBookedSlots();
        await fetchAllBookings();
        renderSlots();
        updateBookingSummary();
      } else {
        alert("Cancellation failed. Try again.");
      }
    })
    .catch(err => {
      console.error("Cancellation error:", err);
      alert("Error cancelling session.");
    });
}

function updateBookingSummary() {
  const bookingInfo = document.getElementById("booking-info");
  bookingInfo.innerHTML = "<h3>All Booked Sessions</h3>";

  bookings.forEach((b) => {
    if (b.status.toLowerCase() !== "cancelled" && b.username === localStorage.getItem("username")) {
      bookingInfo.innerHTML += `
        <p><strong>${b.date} ${b.time}</strong> with ${b.counsellor} - Status: ${b.status}
        <button class="cancel-btn" onclick="cancelBooking('${b.time}')">Cancel Session</button></p><br>
      `;
    }
  });

  document.querySelector(".booking-summary").classList.remove("hidden");
}