// Set the current year in the footer
document.getElementById("year").textContent = new Date().getFullYear();

// Simple greet button interaction
const btn = document.getElementById("greet-btn");
const out = document.getElementById("greet-output");

if (btn) {
  btn.addEventListener("click", () => {
    out.textContent = "Hello! The script is wired up correctly. ✅";
  });
}

// Mobile navbar toggle
const navToggle = document.getElementById("nav-toggle");
const navLinks  = document.getElementById("nav-links");

navToggle.addEventListener("click", () => {
  const isOpen = navLinks.classList.toggle("open");
  navToggle.setAttribute("aria-expanded", isOpen);
});
