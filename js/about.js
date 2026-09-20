const referenceModal = document.getElementById("reference-modal");
const openReferences = document.getElementById("open-references");
const closeReferences = document.getElementById("close-references");

openReferences.addEventListener("click", function () {
    referenceModal.classList.add("show");
});

closeReferences.addEventListener("click", function () {
    referenceModal.classList.remove("show");
});

referenceModal.addEventListener("click", function (event) {
    if (event.target === referenceModal) {
        referenceModal.classList.remove("show");
    }
});

document.addEventListener("keydown", function (event) {
    if (event.key === "Escape") {
        referenceModal.classList.remove("show");
    }
});