import { renderNav } from "./renderElements.js";

// render Dashboard Page
function renderPage() {
    return renderNav()
}

function init() {
    try {
        renderPage().then(page => {
            let mainView = document.getElementById("mainView");
            mainView.innerHTML = page;
        });
    } catch (error) {
        console.error("Error initializing page:", error);
    }
}


document.addEventListener("DOMContentLoaded", init);