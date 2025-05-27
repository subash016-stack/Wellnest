document.querySelector("form").addEventListener("submit", async function (e) {
    e.preventDefault();

    const form = e.target;
    const formData = new FormData(form);
    const data = {};

    // Convert FormData to JSON
    formData.forEach((value, key) => {
        if (key === "support_needs[]") {
            if (!data.support_needs) data.support_needs = [];
            data.support_needs.push(value);
        } else {
            data[key] = value;
        }
    });

    try {
        const response = await fetch("http://localhost:3000/register", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(data),
        });

        const result = await response.json();
        if (response.ok) {
            alert("Registration successful!");
            form.reset();
        } else {
            alert("Error: " + result.message);
        }
    } catch (error) {
        console.error("Submission failed:", error);
        alert("Something went wrong.");
    }
});
