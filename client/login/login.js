function displayAlert(type, message) {
    const alertDiv = document.getElementById('alertDiv');
    alertDiv.innerHTML = `<div class="alert alert-${type} alert-dismissible fade show" role="alert">
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
    </div>`;
}

function login(event) {
    event.preventDefault();
    const email = document.getElementById('inputEmail').value;
    const password = document.getElementById('inputPassword').value;
    const data = {
        emailInput: email,
        pwd: password
    };

    if (!email || !password) {
        displayAlert('danger', 'Email and password are required.');
        return;
    }

    //API Call
    fetch('http://localhost:8080/login', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Invalid email or password.');
        }
        displayAlert('success', 'Login successful!');
    })
    .catch(error => {
        displayAlert('danger', error.message);
    });
}


function init() {
    console.log("DOMContend loaded");
    let submitButton = document.getElementById("submitButton");
    submitButton.addEventListener("click", login);
}

document.addEventListener("DOMContentLoaded", init);