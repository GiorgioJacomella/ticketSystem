import { renderNav, renderForm, showModal } from "./renderElements.js";

async function newTicket(event) {
    event.preventDefault();
    const ticketTitle = document.getElementById('ticketTitle').value;
    const ticketText = document.getElementById('ticketDescription').value;
    const JWT = localStorage.getItem("JWT");

    try {
        const response = await fetch('http://localhost:8080/newTicket', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${JWT}`
            },
            body: JSON.stringify({
                ticketTitle: ticketTitle,
                ticketText: ticketText
            })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(`Error: ${errorData.error}`);
        }

        const result = await response.json();
        console.log('Ticket erfolgreich erstellt:', result);

        // Zeige Erfolgsmeldung
        showModal('Success', 'Ticket created Successfully!');
        return result;
    } catch (error) {
        console.error('Error Occured:', error.message);
        // Zeige Fehlermeldung
        showModal('Fehler', error.message);
    }
}

// Render New Ticket Page
function renderPage() {
    return renderNav()
        .then(navBar => {
            let ticketForm = renderForm();
            return navBar + ticketForm;
        });
}

function init() {
    try {
        renderPage().then(page => {
            let mainView = document.getElementById("mainView");
            mainView.innerHTML = page;
            let submitNewTicket = document.getElementById("submitNewTicket");
            submitNewTicket.addEventListener('click', newTicket);
        });
    } catch (error) {
        console.error("Error initializing page:", error);
    }
}



document.addEventListener("DOMContentLoaded", init);
