import { renderNav, renderMyTicketsList } from "./renderElements.js";

// Render MyTickets Page including Navbar and Tickets List
function renderPage() {
    return renderNav().then(navBar => {
        return renderMyTicketsList().then(ticketsList => {
            return navBar + ticketsList;
        });
    });
}

function init() {
    try {
        renderPage().then(pageContent => {
            let mainView = document.getElementById("mainView");
            mainView.innerHTML = pageContent;
        });
    } catch (error) {
        console.error("Error initializing page:", error);
    }
}

document.addEventListener("DOMContentLoaded", init);
