const cards = document.querySelectorAll(".card");

cards[0].addEventListener("click", () => {
    window.location.href = "agenda.html";
});

cards[2].addEventListener("click", () => {
    window.location.href = "vehiculos.html";
});

cards[4].addEventListener("click", () => {
    window.location.href = "clientes.html";
});