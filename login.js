document.getElementById("loginForm").addEventListener("submit", async function (e) {
    e.preventDefault();

    const role = document.getElementById("role").value;
    const username = document.getElementById("username").value.trim();
    const password = document.getElementById("password").value;

    try {
        const response = await fetch("http://localhost:3000/login", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ role, username, password })
        });

        const result = await response.json();

        if (response.ok) {
            alert(`Welcome, ${result.role}!`);
            // You can redirect or load dashboard here
            // window.location.href = `/dashboard/${result.role}`;
        } else {
            alert(result.message);
        }
    } catch (error) {
        console.error("Login failed:", error);
        alert("Server error. Please try again later.");
    }
});
