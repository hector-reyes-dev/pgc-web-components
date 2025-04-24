// Select all elements with the class 'card'
const cards = document.querySelectorAll(".card");

// Funcionalidad extra: en mobile, activa la card automáticamente al entrar en el viewport
if (window.innerWidth <= 768) {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('active');
          // Mostrar contenido
          const content = entry.target.querySelector('.content');
          const title = entry.target.querySelector('.title-collapsed');
          if (content) {
            content.style.display = 'block';
            setTimeout(() => (content.style.opacity = '1'), 0);
          }
          if (title) title.style.display = 'none';
        } else {
          entry.target.classList.remove('active');
          // Ocultar contenido
          const content = entry.target.querySelector('.content');
          const title = entry.target.querySelector('.title-collapsed');
          if (content) {
            content.style.opacity = '0';
            setTimeout(() => (content.style.display = 'none'), 180);
          }
          if (title) title.style.display = 'block';
        }
      });
    },
    {
      threshold: 0.5
    }
  );
  cards.forEach((card) => observer.observe(card));
}


// Function to remove the 'active' class from all cards
function removeActiveClasses() {
  cards.forEach((card) => {
    card.classList.remove("active");
  });
}

// Función para mostrar y ocultar los elementos correctamente
function showContentAfterTransition(card) {
  const content = card.querySelector(".content");
  const title = card.querySelector(".title-collapsed");
  // Espera a que termine la transición del flex
  card.addEventListener("transitionend", function handler(e) {
    if (e.propertyName === "flex-grow" || e.propertyName === "flex") {
      // Solo muestra el contenido si la card está activa
      if (card.classList.contains("active")) {
        content.style.display = "block";
        setTimeout(() => (content.style.opacity = "1"), 0); // fuerza reflow para transición
        if (title) title.style.display = "none";
      }
      card.removeEventListener("transitionend", handler);
    }
  });
}

function hideContentInstant(card) {
  const content = card.querySelector(".content");
  const title = card.querySelector(".title-collapsed");
  content.style.opacity = "0";
  setTimeout(() => {
    content.style.display = "none";
    if (title) title.style.display = "block";
  }, 180); // espera a que termine la transición de opacidad (0.18s)
}

cards.forEach((card) => {
  // Inicializa estados
  const content = card.querySelector(".content");
  const title = card.querySelector(".title-collapsed");
  if (!card.classList.contains("active")) {
    content.style.display = "none";
    content.style.opacity = "0";
    if (title) title.style.display = "block";
  } else {
    content.style.display = "block";
    content.style.opacity = "1";
    if (title) title.style.display = "none";
  }
  card.addEventListener("click", () => {
    // Oculta el contenido de todas las cards
    cards.forEach((c) => {
      if (c !== card) hideContentInstant(c);
    });
    // Quita todas las activas
    removeActiveClasses();
    // Activa la seleccionada y espera la transición
    card.classList.add("active");
    showContentAfterTransition(card);
  });
});
