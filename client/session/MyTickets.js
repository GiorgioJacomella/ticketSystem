import { renderNav, renderMyTicketsList, showFormModal} from "./renderElements.js";

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
