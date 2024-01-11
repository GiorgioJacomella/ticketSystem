export function renderNav() {
    const JWT = localStorage.getItem("JWT");

    // Always return a promise
    return new Promise((resolve, reject) => {
        fetch('http://localhost:8080/checkAdmin', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${JWT}`
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
                              <a class="nav-link" href="./Dashboard.html">Dashboard</a>
                          </li>
                          <li class="nav-item">
                              <a class="nav-link" href="./NewTicket.html">New Ticket</a>
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
                              <a class="nav-link" href="./Dashboard.html">Dashboard</a>
                          </li>
                          <li class="nav-item">
                              <a class="nav-link" href="./NewTicket.html">New Ticket</a>
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


export function renderForm() {
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
          <button id="submitNewTicket" type="submit" class="btn btn-primary">Submit</button>
      </form>
  </div>`;
}

export function showModal(title, message) {
    const modalHtml = `
    <div class="modal fade" id="alertModal" tabindex="-1" role="dialog" aria-labelledby="alertModalLabel" aria-hidden="true">
    <div class="modal-dialog modal-dialog-centered" role="document">
        <div class="modal-content">
            <div class="modal-header">
                <h5 class="modal-title" id="alertModalLabel">${title}</h5>
                <button type="button" class="close" data-dismiss="modal" aria-label="Close">
                    <span aria-hidden="true">&times;</span>
                </button>
            </div>
            <div class="modal-body">
                ${message}
            </div>
            <div class="modal-footer">
                <button type="button" class="btn btn-secondary" data-dismiss="modal">Close</button>
            </div>
        </div>
    </div>
</div>
    `;

    document.body.innerHTML += modalHtml;
    $('#alertModal').modal('show');
}

export function renderMyTicketsList() {
    const JWT = localStorage.getItem("JWT");

    // Always return a promise
    return new Promise((resolve, reject) => {
        fetch('http://localhost:8080/requestTickets', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${JWT}`
            }
        })
        .then(response => response.json())
        .then(data => {
            if (!data || !data.tickets) {
                console.log("No data");
                return;
            }

            // Create tickets list inside a Bootstrap card and center it using d-flex and justify-content-center classes
            let ticketsList = `
            <br>
                <div class="d-flex justify-content-center">
                    <div class="card" style="width: 18rem;">
                        <ul class="list-group list-group-flush">`;
            data.tickets.forEach(ticket => {
                ticketsList += `<li class="list-group-item">Title: ${ticket.title} <br> Description: ${ticket.textElement}</li>`;
            });
            ticketsList += `</ul>
                    </div>
                </div>`;

            // Resolve with the centered tickets list
            resolve(ticketsList);
        })
        .catch(error => {
            console.error(error);
        });
    });
}

