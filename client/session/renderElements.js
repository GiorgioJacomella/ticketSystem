////Render Navbar
export function renderNav() {
    const JWT = localStorage.getItem("JWT");

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
            resolve(navBar);
        })
        .catch(error => {
            console.error(error);
        });
    });
}


//Render Form for new tickets
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


///Render Message Modal
export function showMessageModal(title, message) {
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
    </div>`;    document.body.innerHTML += modalHtml;

    const alertModal = $('#alertModal');
    alertModal.on('hidden.bs.modal', function () {
        location.reload();
    });
    alertModal.modal('show');
}

/// API Fetch to delete ticket
async function deleteTicket(ticketId, JWT) {
    try {
        const response = await fetch('http://localhost:8080/deleteTicket', {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${JWT}`
            },
            body: JSON.stringify({ ticketId: ticketId })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(`Error: ${errorData.error}`);
        }

        const result = await response.json();
        console.log('Ticket successfully deleted:', result);
        showMessageModal('Success', 'Ticket deleted successfully!');
        return result;
    } catch (error) {
        console.error('Error Occurred:', error.message);
        showMessageModal('Error', error.message);

    }
}


///Render Modal to edit ticket
export function showFormModal(ticket) {
    const modalHtml = `
    <div class="modal fade" id="formModal${ticket.ID}" tabindex="-1" role="dialog" aria-labelledby="formModalLabel" aria-hidden="true">
        <div class="modal-dialog modal-dialog-centered" role="document">
            <div class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title" id="formModalLabel">Ticket ID: ${ticket.ID}</h5>
                    <button type="button" class="close" data-dismiss="modal" aria-label="Close">
                        <span aria-hidden="true">&times;</span>
                    </button>
                </div>
                <div class="modal-body">
                    <div class="form-group">
                        <label for="titleInput">Title</label>
                        <input type="text" class="form-control" id="titleInput" placeholder="Enter title" value="${ticket.title}">
                    </div>
                    <div class="form-group">
                        <label for="descriptionTextarea">Description</label>
                        <textarea class="form-control" id="descriptionTextarea" rows="3" placeholder="Enter description">${ticket.textElement}</textarea>
                    </div>
                    <div class="form-group">
                        <label for="statusSelect">Status</label>
                        <select class="form-control disabled" id="statusSelect">
                            <option selected>${ticket.statusElement}</option>
                        </select>
                    </div>
                </div>
                    <div class="modal-footer d-flex justify-content-between">
                    <button type="button" id="deleteTicket${ticket.ID}" class="btn btn-danger" data-dismiss="modal">Delete</button>
                        <div>
                            <button type="button" class="btn btn-primary" data-dismiss="modal">Save</button>
                            <button type="button" class="btn btn-secondary" data-dismiss="modal">Cancel</button>
                        </div>
                    </div>
                </div>    
            </div>
        </div>
    </div>`;

    const JWT = localStorage.getItem("JWT");
    document.body.innerHTML += modalHtml;
    $(`#formModal${ticket.ID}`).modal('show');
    const deleteButton = document.getElementById(`deleteTicket${ticket.ID}`);
    deleteButton.addEventListener('click', () => deleteTicket(ticket.ID, JWT));
}



export function renderMyTicketsList() {
    const JWT = localStorage.getItem("JWT");

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

            let ticketsList = `
            <br>
                <div class="d-flex justify-content-center">
                    <div class="card">
                        <ul class="list-group list-group-flush">`;
            data.tickets.forEach(ticket => {
                ticketsList += `
                    <li class="list-group-item">
                        Title: ${ticket.title} <br> 
                        Description: ${ticket.textElement}<br><br>
                        <button type="button" class="btn btn-primary edit-button" data-ticket='${JSON.stringify(ticket)}'>Edit</button>
                    </li>`;
            });
            ticketsList += `</ul>
                    </div>
                </div>`;

            resolve(ticketsList);

            // Add event listeners to buttons
            document.addEventListener('click', function(event) {
                if (event.target && event.target.classList.contains('edit-button')) {
                    const ticket = JSON.parse(event.target.getAttribute('data-ticket'));
                    console.log("Show modal");
                    showFormModal(ticket);
                }
            });
            
        })
        .catch(error => {
            console.error(error);
        });
    });
}