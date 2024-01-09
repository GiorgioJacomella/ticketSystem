function renderNav() {
    const JWT = localStorage.getItem("JWT");

    // Always return a promise
    return new Promise((resolve, reject) => {
        fetch('http://localhost:8080/checkAdmin', {
            method: 'GET',
            headers: {
                'Authorization': 'Bearer ' + JWT,
                'Content-Type': 'application/json'
            }
        })
        .then(response => response.json())
        .then(data => {
            let navBar;
            if (data.isAdmin === "Admin") {
              navBar = `<nav class="navbar navbar-expand-lg navbar-dark bg-primary">
                  <a class="navbar-brand" href="#">The Solution</a>
                  <button class="navbar-toggler" type="button" data-toggle="collapse" data-target="#navbarNav" aria-controls="navbarNav" aria-expanded="false" aria-label="Toggle navigation">
                      <span class="navbar-toggler-icon"></span>
                  </button>
                  
                  <div class="collapse navbar-collapse" id="navbarNav">
                      <ul class="navbar-nav ml-auto">
                          <li class="nav-item">
                              <a class="nav-link" href="#">Home</a>
                          </li>
                          <li class="nav-item active">
                              <a class="nav-link" href="./NewTicket.html">New Ticket <span class="sr-only">(current)</span></a>
                          </li>
                          <li class="nav-item">
                              <a class="nav-link" href="./MyTickets.html">My Tickets</a>
                          </li>
                          <li class="nav-item">
                              <a class="nav-link" href="./AdminPanel.html">Admin Dashboard</a>
                          </li>
                      </ul>
                  </div>
              </nav>`;
            } else if (data.isAdmin === 'Coworker' || data.isAdmin === 'User') {
              navBar = `<nav class="navbar navbar-expand-lg navbar-dark bg-primary">
                  <a class="navbar-brand" href="#">The Solution</a>
                  <button class="navbar-toggler" type="button" data-toggle="collapse" data-target="#navbarNav" aria-controls="navbarNav" aria-expanded="false" aria-label="Toggle navigation">
                      <span class="navbar-toggler-icon"></span>
                  </button>
                  
                  <div class="collapse navbar-collapse" id="navbarNav">
                      <ul class="navbar-nav ml-auto">
                          <li class="nav-item">
                              <a class="nav-link" href="#">Home</a>
                          </li>
                          <li class="nav-item active">
                              <a class="nav-link" href="./NewTicket.html">New Ticket <span class="sr-only">(current)</span></a>
                          </li>
                          <li class="nav-item">
                              <a class="nav-link" href="./MyTickets.html">My Tickets</a>
                          </li>
                      </ul>
                  </div>
              </nav>`;
            } else {
                // Redirect and resolve with empty string
                window.location.href = '../login/login.html';
                resolve('');
                return;
            }
            // Resolve with the navbar
            resolve(navBar);
        })
        .catch(error => {
            // Reject on error
            reject(error);
        });
    });
}


function renderForm() {
  return `<div class="container mt-4">
      <form>
          <div class="form-group">
              <label for="ticketTitle">Ticket Title</label>
              <input type="text" class="form-control" id="ticketTitle" placeholder="Enter ticket title">
          </div>
          <div class="form-group">
              <label for="ticketDescription">Ticket Description</label>
              <textarea class="form-control" id="ticketDescription" rows="3" placeholder="Enter ticket description"></textarea>
          </div>
          <br>
          <button type="submit" class="btn btn-primary">Submit</button>
      </form>
  </div>`;
}

// render whole page
function renderPage() {
    return renderNav()
        .then(navBar => {
            let ticketForm = renderForm();
            return navBar + ticketForm;
        });
}

function init() {
    renderPage()
        .then(page => {
            let mainView = document.getElementById("mainView");
            mainView.innerHTML = page;
        })
        .catch(error => {
            console.error("Error initializing page:", error);
        });
}

document.addEventListener("DOMContentLoaded", init);