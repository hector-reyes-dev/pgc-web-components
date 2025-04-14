document.addEventListener("DOMContentLoaded", () => {
  const gridContainer = document.querySelector(".icon-grid-background");
  if (!gridContainer) {
    console.error(
      "Error: El contenedor '.icon-grid-background' no fue encontrado."
    );
    return;
  }

  // --- Configuración ---                 ---
  const iconImagePaths = [
    "./assets/icon-Beach.png",
    "./assets/icon-Camping.png",
    "./assets/icon-Chair.png",
    "./assets/icon-FansPurifiers.png",
    "./assets/icon-GardenCenter.png",
    "./assets/icon-Heating.png",
    "./assets/icon-KitchenDiningRoom.png",
    "./assets/icon-LivingRoom.png",
    "./assets/icon-OfficeBacktoSchool.png",
    "./assets/icon-OutdoorCooking.png",
    "./assets/icon-PatioFurniture.png",
    "./assets/icon-StorageFurniture.png",
  ];

  const gridCellSize = 80;
  const illuminationInterval = 200;
  const illuminationDuration = 1800;
  const iconsToIlluminatePerPulse = 3;

  let animationIntervalId = null;
  let generatedIcons = [];

  const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
  let prefersReducedMotion = mediaQuery.matches;

  // --- Funciones Auxiliares ---
  function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  function getRandomElement(arr) {
    if (arr.length === 0) return null;
    return arr[Math.floor(Math.random() * arr.length)];
  }

  // --- Lógica Principal ---
  function populateGrid() {
    while (gridContainer.firstChild) {
      gridContainer.removeChild(gridContainer.firstChild);
    }
    generatedIcons = [];

    const containerWidth = gridContainer.offsetWidth;
    const containerHeight = gridContainer.offsetHeight;

    if (containerWidth === 0 || containerHeight === 0) {
      console.warn("Grid container has no dimensions yet. Retrying...");
      setTimeout(populateGrid, 100);
      return;
    }

    const cols = Math.ceil(containerWidth / gridCellSize) + 1;
    const rows = Math.ceil(containerHeight / gridCellSize) + 1;
    const totalIcons = cols * rows;

    // Crea y añade los iconos <img> al DOM de forma segura
    for (let i = 0; i < totalIcons; i++) {
      const randomIconPath = getRandomElement(iconImagePaths);
      if (randomIconPath) {
        const imgElement = document.createElement("img"); // Crea un elemento <img>
        imgElement.setAttribute("src", randomIconPath); // Establece la ruta de la imagen
        // Añade alt text vacío para iconos decorativos
        imgElement.setAttribute("alt", "");
        imgElement.classList.add("grid-icon"); // Añade la clase para estilos y selección
        // Opcional: Manejo de errores si una imagen no carga
        imgElement.addEventListener("error", () => {
          console.warn(`Failed to load icon: ${randomIconPath}`);
          // Podrías ocultar el icono o reemplazarlo con uno por defecto
          imgElement.style.visibility = "hidden";
        });

        gridContainer.appendChild(imgElement); // Añade la imagen al grid
        generatedIcons.push(imgElement); // Guarda la referencia
      }
    }
  }

  function illuminateRandomIcons() {
    if (prefersReducedMotion || generatedIcons.length === 0) {
      return;
    }

    const nonIlluminatedIcons = generatedIcons.filter(
      (icon) =>
        !icon.classList.contains("icon-illuminated") &&
        icon.style.visibility !== "hidden" // No animar errores
    );
    const count = Math.min(
      iconsToIlluminatePerPulse,
      nonIlluminatedIcons.length
    );

    for (let i = 0; i < count; i++) {
      const randomIndex = getRandomInt(0, nonIlluminatedIcons.length - 1);
      const iconToLight = nonIlluminatedIcons.splice(randomIndex, 1)[0];

      if (iconToLight) {
        iconToLight.classList.add("icon-illuminated");
        setTimeout(() => {
          iconToLight.classList.remove("icon-illuminated");
        }, illuminationDuration + getRandomInt(-400, 400));
      }
    }
  }

  // --- Inicialización y Manejo de Eventos ---
  function startAnimation() {
    if (prefersReducedMotion) return;
    if (animationIntervalId) clearInterval(animationIntervalId);
    animationIntervalId = setInterval(
      illuminateRandomIcons,
      illuminationInterval
    );
  }

  function stopAnimation() {
    if (animationIntervalId) {
      clearInterval(animationIntervalId);
      animationIntervalId = null;
      generatedIcons.forEach((icon) =>
        icon.classList.remove("icon-illuminated")
      );
    }
  }

  populateGrid();

  if (!prefersReducedMotion) {
    startAnimation();
  }

  let resizeTimeout;
  window.addEventListener("resize", () => {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(() => {
      populateGrid();
      stopAnimation();
      startAnimation();
    }, 300);
  });

  mediaQuery.addEventListener("change", () => {
    prefersReducedMotion = mediaQuery.matches;
    if (prefersReducedMotion) {
      stopAnimation();
    } else {
      populateGrid();
      startAnimation();
    }
  });
});
