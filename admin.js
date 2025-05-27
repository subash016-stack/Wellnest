document.getElementById("counsellorForm").addEventListener("submit", function(event) {
    event.preventDefault();
    
    let name = document.getElementById("name").value;
    let email = document.getElementById("email").value;
    let phone = document.getElementById("phone").value;
    let specialization = document.getElementById("specialization").value;
    
    let counsellor = { id: Date.now(), name, email, phone, specialization };

    // Retrieve stored counsellors or initialize an empty array
    let counsellors = JSON.parse(localStorage.getItem("counsellors")) || [];
    
    // Add new counsellor
    counsellors.push(counsellor);
    
    // Save back to local storage
    localStorage.setItem("counsellors", JSON.stringify(counsellors));

    // Show success message
    document.getElementById("counsellorMessage").innerText = "Counsellor added successfully!";
    
    // Reload the counsellor list
    loadCounsellors();

    // Clear input fields
    document.getElementById("counsellorForm").reset();
});

function loadCounsellors() {
    let counsellors = JSON.parse(localStorage.getItem("counsellors")) || [];
    
    let counsellorList = document.getElementById("counsellorList");
    counsellorList.innerHTML = "";

    if (counsellors.length > 0) {
        let table = document.createElement("table");
        table.classList.add("counsellor-table");

        let thead = document.createElement("thead");
        thead.innerHTML = `
            <tr>
                <th>Select</th>
                <th>Name</th>
                <th>Specialization</th>
                <th>Email</th>
                <th>Phone</th>
            </tr>
        `;
        table.appendChild(thead);

        let tbody = document.createElement("tbody");

        counsellors.forEach(counsellor => {
            let row = document.createElement("tr");
            row.innerHTML = `
                <td><input type='checkbox' class='select-counsellor' value='${counsellor.id}'></td>
                <td>${counsellor.name}</td>
                <td>${counsellor.specialization}</td>
                <td>${counsellor.email}</td>
                <td>${counsellor.phone}</td>
            `;
            tbody.appendChild(row);
        });

        table.appendChild(tbody);
        counsellorList.appendChild(table);

        let deleteButton = document.createElement("button");
        deleteButton.innerText = "Delete Selected";
        deleteButton.classList.add("delete-btn");
        deleteButton.onclick = deleteSelectedCounsellors;
        counsellorList.appendChild(deleteButton);
    }
}

function deleteSelectedCounsellors() {
    let selected = document.querySelectorAll(".select-counsellor:checked");
    let idsToDelete = Array.from(selected).map(input => Number(input.value));

    if (idsToDelete.length === 0) {
        alert("Please select at least one counsellor to delete.");
        return;
    }

    let counsellors = JSON.parse(localStorage.getItem("counsellors")) || [];
    
    // Filter out the selected counsellors
    counsellors = counsellors.filter(counsellor => !idsToDelete.includes(counsellor.id));

    // Save the updated list back to local storage
    localStorage.setItem("counsellors", JSON.stringify(counsellors));

    // Show success message
    alert("Selected counsellors have been deleted successfully!");

    // Reload the updated list
    loadCounsellors();
}


// Load stored counsellors on page load
window.onload = loadCounsellors;
