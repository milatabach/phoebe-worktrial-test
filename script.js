// Set the current year in the footer
document.getElementById("year").textContent = new Date().getFullYear();

// Simple greet button interaction
const btn = document.getElementById("greet-btn");
const out = document.getElementById("greet-output");

btn.addEventListener("click", () => {
  out.textContent = "Hello! The script is wired up correctly. ✅";
});
