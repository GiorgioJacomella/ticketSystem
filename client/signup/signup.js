function displayAlert(type, message) {
    const alertDiv = document.getElementById('alertDiv');
    alertDiv.innerHTML = `<div class="alert alert-${type} alert-dismissible fade show" role="alert">
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
    </div>`;
}

function validateAndSignUp(event) {
    event.preventDefault();
    console.log("Validation started");
    const alertDiv = document.getElementById('alertDiv');
    alertDiv.innerHTML = '';

    const fullName = document.getElementById('fullName').value;
    const phoneNumber = document.getElementById('phoneNumber').value;
    const email = document.getElementById('emailAddress').value;
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirmPassword').value;

    if (fullName && phoneNumber && email && password && confirmPassword && password === confirmPassword) {
        const requestData = {
            "fullNameInput": fullName,
            "phoneNumberInput": phoneNumber,
            "emailInput": email,
            "pwd": password
        };

        // API Call
        fetch('http://localhost:8080/signup', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(requestData)
        })
        .then(response => response.json())
        .then(data => {
            displayAlert('success', 'Signup Successful');
            console.log('API Response:', data);
        })
        .catch(error => {
            console.error('Error:', error);
            displayAlert('danger', `An error occurred: ${error}`);
        });
    } else {
        displayAlert('danger', 'Please fill in all fields and ensure passwords match.');
        console.log("Invalid Input");
    }
}

function init() {
    console.log("DOMContentLoaded");
    let submitButton = document.getElementById("submitButton");
    submitButton.addEventListener("click", validateAndSignUp);
}

document.addEventListener("DOMContentLoaded", init);
