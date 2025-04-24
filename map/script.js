/* SVG Map config. */
const MAP_CONFIG = {
  insets: [
    {
      width: 900,
      top: 0,
      height: 900,
      bbox: [
        {
          y: -12671671.123330014,
          x: -20004297.151525836,
        },
        {
          y: 6930392.025135122,
          x: 20026572.39474939,
        },
      ],
      left: 0,
    },
  ],
  height: 900,
  projection: {
    type: "mill",
    centralMeridian: 11.5,
  },
  width: 900.0,
};

/* Functions to calculate x and y posiiton on the map. */
function mill(lat, lng, c) {
  const radius = 6381372;
  const radDeg = Math.PI / 180;
  return {
    x: radius * (lng - c) * radDeg,
    y: (-radius * Math.log(Math.tan((45 + 0.4 * lat) * radDeg))) / 0.8,
  };
}

function getInsetForPoint(x, y) {
  const configInsets = MAP_CONFIG.insets;
  let i = 0;
  let box = [];
  for (i = 0; i < configInsets.length; i += 1) {
    box = configInsets[i].bbox;
    if (x > box[0].x && x < box[1].x && y > box[0].y && y < box[1].y) {
      return configInsets[i];
    }
  }
  return {};
}

/* A class that creates renders map and markers based on lat and lang. */
class WorldMap {
  constructor() {
    this.markers = [];
    this.transX = 0;
    this.transY = 0;
    this.scale = 1;
    this.baseTransX = 0;
    this.baseTransY = 0;
    this.baseScale = 1;
    this.width = 0;
    this.height = 0;
    this.defaultWidth = MAP_CONFIG.width;
    this.defaultHeight = MAP_CONFIG.height;
    this.container = document.querySelector(".world-map-graph-vector");

    const map = this;
    this.onResize = function () {
      map.updateSize();
    };
    let resizeTimer;
    window.addEventListener("resize", () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(map.onResize, 20);
    });
    this.updateSize();
  }

  setMarkers(markers) {
    this.markers = markers;
  }

  updateSize() {
    this.width = this.container.getBoundingClientRect().width;
    this.height = this.container.getBoundingClientRect().height;
    this.resize();
    this.applyTransform();
  }

  resize() {
    const curBaseScale = this.baseScale;
    if (this.width / this.height > this.defaultWidth / this.defaultHeight) {
      this.baseScale = this.height / this.defaultHeight;
      const tempVal = this.width - this.defaultWidth * this.baseScale;
      this.baseTransX = Math.abs(tempVal) / (2 * this.baseScale);
    } else {
      this.baseScale = this.width / this.defaultWidth;
      const tempVal = this.height - this.defaultHeight * this.baseScale;
      this.baseTransY = Math.abs(tempVal) / (2 * this.baseScale);
    }
    this.scale *= this.baseScale / curBaseScale;
    this.transX *= this.baseScale / curBaseScale;
    this.transY *= this.baseScale / curBaseScale;
  }

  applyTransform() {
    let maxTransX = 0;
    let maxTransY = 0;
    let minTransX = 0;
    let minTransY = 0;

    if (this.defaultWidth * this.scale <= this.width) {
      maxTransX =
        (this.width - this.defaultWidth * this.scale) / (2 * this.scale);
      minTransX =
        (this.width - this.defaultWidth * this.scale) / (2 * this.scale);
    } else {
      maxTransX = 0;
      minTransX = (this.width - this.defaultWidth * this.scale) / this.scale;
    }

    if (this.defaultHeight * this.scale <= this.height) {
      maxTransY =
        (this.height - this.defaultHeight * this.scale) / (2 * this.scale);
      minTransY =
        (this.height - this.defaultHeight * this.scale) / (2 * this.scale);
    } else {
      maxTransY = 0;
      minTransY = (this.height - this.defaultHeight * this.scale) / this.scale;
    }

    if (this.transY > maxTransY) {
      this.transY = maxTransY;
    } else if (this.transY < minTransY) {
      this.transY = minTransY;
    }
    if (this.transX > maxTransX) {
      this.transX = maxTransX;
    } else if (this.transX < minTransX) {
      this.transX = minTransX;
    }
    if (this.markers) {
      this.repositionMarkers();
    }
  }

  repositionMarkers() {
    for (let i = 0; i < this.markers.length; i += 1) {
      const point = this.getMarkerPosition(this.markers[i]);
      if (point !== false) {
        const marker = document.querySelector(`.world-map-marker[data-index='${this.markers[i].key}']`);
        if (marker) {
          marker.setAttribute('cx', point.x);
          marker.setAttribute('cy', point.y);
        }
      }
    }
  }

  latLngToPoint(lat, long) {
    let point = {};
    const proj = MAP_CONFIG.projection;
    let inset = [];
    let box = [];

    let lng = long;
    if (lng < -180 + proj.centralMeridian) {
      lng += 360;
    }

    point = mill(lat, lng, proj.centralMeridian);

    inset = getInsetForPoint(point.x, point.y);
    if (inset) {
      box = inset.bbox;

      point.x =
        ((point.x - box[0].x) / (box[1].x - box[0].x)) *
        inset.width *
        this.scale;
      point.y =
        ((point.y - box[0].y) / (box[1].y - box[0].y)) *
        inset.height *
        this.scale;

      return {
        x: point.x + this.transX * this.scale + inset.left * this.scale,
        y: point.y + this.transY * this.scale + inset.top * this.scale,
      };
    }
    return false;
  }

  getMarkerPosition(markerConfig) {
    if (MAP_CONFIG.projection) {
      const lat = markerConfig.latLng[0];
      const lng = markerConfig.latLng[1];
      return this.latLngToPoint(lat || 0, lng || 0);
    }
    return {
      x: markerConfig.coords[0] * this.scale + this.transX * this.scale,
      y: markerConfig.coords[1] * this.scale + this.transY * this.scale,
    };
  }

  createMarkers() {
    const markerWrap = document.querySelector(".marker-wrap");
    this.markers.forEach(marker => {
      if (
        marker.hasOwnProperty("latLng") &&
        Array.isArray(marker.latLng) &&
        marker.latLng.length === 2
      ) {
        const point = this.getMarkerPosition(marker);
        const template = document.querySelector(".marker-template circle.world-map-marker:not(.selected-outer-circle)");
        if (template) {
          const circleEle = template.cloneNode(true);
          circleEle.setAttribute("data-index", marker.key);
          circleEle.setAttribute("cx", point.x);
          circleEle.setAttribute("cy", point.y);
          markerWrap.appendChild(circleEle);
        }
      }
    });
  }
}

/* JSON to add markers and select countries. */
const CONTINENT_MARKERS = [
  {
    key: 1,
    latLng: [50, -100],
    name: "North America",
    countries: [
      "PR",
      "DO",
      "DM",
      "LC",
      "NI",
      "PA",
      "CA",
      "SV",
      "HT",
      "TT",
      "JM",
      "GT",
      "HN",
      "BZ",
      "BS",
      "CR",
      "US",
      "MX",
      "CU",
    ],
    default: true,
    percentage: 33.5,
  },
  {
    key: 2,
    latLng: [-20, -60],
    name: "Latin America",
    countries: [
      "PY",
      "CO",
      "VE",
      "CL",
      "SR",
      "BO",
      "EC",
      "AR",
      "GY",
      "BR",
      "PE",
      "UY",
      "FK",
      "GF",
    ],
    default: false,
    percentage: 20,
  },
  {
    key: 3,
    latLng: [50, 30],
    name: "Europe",
    countries: [
      "BE",
      "FR",
      "BG",
      "DK",
      "HR",
      "DE",
      "BA",
      "HU",
      "JE",
      "FI",
      "BY",
      "GR",
      "NL",
      "PT",
      "NO",
      "LI",
      "LV",
      "LT",
      "LU",
      "FO",
      "PL",
      "XK",
      "CH",
      "AD",
      "EE",
      "IS",
      "AL",
      "IT",
      "GG",
      "CZ",
      "IM",
      "GB",
      "AX",
      "IE",
      "ES",
      "ME",
      "MD",
      "RO",
      "RS",
      "MK",
      "SK",
      "MT",
      "SI",
      "SM",
      "UA",
      "SE",
      "AT",
    ],
    default: false,
    percentage: 25,
  },
  {
    key: 4,
    latLng: [45, 130],
    name: "Asia Pacific",
    countries: [
      "GU",
      "PW",
      "RU",
      "KI",
      "NC",
      "NU",
      "NZ",
      "AU",
      "PG",
      "SB",
      "BD",
      "MN",
      "BN",
      "BH",
      "BT",
      "HK",
      "JO",
      "PS",
      "LB",
      "PF",
      "FJ",
      "FM",
      "WS",
      "VU",
      "LA",
      "TW",
      "TR",
      "LK",
      "TL",
      "TM",
      "TJ",
      "TH",
      "XC",
      "NP",
      "PK",
      "PH",
      "-99",
      "AE",
      "CN",
      "AF",
      "IQ",
      "JP",
      "IR",
      "AM",
      "SY",
      "VN",
      "GE",
      "IL",
      "IN",
      "AZ",
      "ID",
      "OM",
      "KG",
      "UZ",
      "MM",
      "SG",
      "KH",
      "CY",
      "QA",
      "KR",
      "KP",
      "KW",
      "KZ",
      "SA",
      "MY",
      "YE",
    ],
    default: false,
    percentage: 11.5,
  },
];

/* On click on a particular marker based in the percentage the marker is bloted,
 * its radius is calculated based ont he map size.
 */
function sizeOfMarkerBasedOnPercentage(percentage) {
  const parentEle = document.querySelector(".world-map-svg");
  const totalHeight = parentEle ? parentEle.getBoundingClientRect().height : 300;
  let percentValue = Number(percentage);
  if (isNaN(percentValue) || percentValue <= 0) {
    return 8; // valor por defecto seguro
  }
  let radius = totalHeight / 3;
  radius = (radius * percentValue) / 100;
  return radius > 0 ? radius : 8;
}

/* Window resize function for handling responsive. */
function windowResize() {
  const mainSection = document.querySelector(".world-map-section");
  const windowWidth = mainSection.querySelector(".world-map-container").getBoundingClientRect().width - 30;
  const defaultWidth = 900;
  const calculatedWidthHeight = windowWidth / defaultWidth;
  const vectorGraphEle = mainSection.querySelector(".world-map-graph-vector");
  vectorGraphEle.style.transform = `scale(${calculatedWidthHeight}, ${calculatedWidthHeight})`;
  if (vectorGraphEle) {
    const parentEle = mainSection.querySelector(".world-map-svg");
    parentEle.classList.remove("d-none");
    parentEle.style.height = `${vectorGraphEle.getBoundingClientRect().height}px`;
  }
  const marker = mainSection.querySelector(".world-map-marker.selected-outer-circle");
  const percentage = parseInt(marker.getAttribute("data-percentage"), 10);
  const radius = sizeOfMarkerBasedOnPercentage(percentage);
  marker.setAttribute("r", `${radius}`);
}

function selectMarkerOnGraph(obj) {
  if (!obj || !Array.isArray(obj.countries)) return;
  const mainSection = document.querySelector(".world-map-section");
  const vectorGraph = mainSection.querySelectorAll(".world-map-graph-vector path");
  const markerWrap = mainSection.querySelector(".marker-wrap");
  document.querySelectorAll(".world-map-marker").forEach(el => el.classList.remove("selected"));
  mainSection.querySelectorAll(".marker-wrap circle.selected-outer-circle").forEach(el => el.remove());
  vectorGraph.forEach(el => el.classList.remove("selected"));
  const selectedCountries = Array.from(vectorGraph).filter(graph => obj.countries.includes(graph.getAttribute("data-code")));
  const marker = mainSection.querySelector(`.world-map-marker[data-index='${obj.key}']`);
  marker.classList.add("selected");
  const outerCircleTemplate = mainSection.querySelector(".marker-template circle.selected-outer-circle");
  const outerCircleEle = outerCircleTemplate.cloneNode(true);
  const radius = sizeOfMarkerBasedOnPercentage(obj.percentage);
  outerCircleEle.setAttribute("data-index", obj.key);
  outerCircleEle.setAttribute("cx", marker.getAttribute("cx"));
  outerCircleEle.setAttribute("cy", marker.getAttribute("cy"));
  outerCircleEle.setAttribute("data-percentage", obj.percentage);
  outerCircleEle.setAttribute("r", `${radius}`);
  markerWrap.appendChild(outerCircleEle);
  selectedCountries.forEach(el => el.classList.add("selected"));
}

function initialSelect() {
  const obj = CONTINENT_MARKERS.find(item => item.default === true);
  if (obj) {
    selectMarkerOnGraph(obj);
  }
}

function onMarkerClick() {
  const markers = document.querySelectorAll("circle.world-map-marker");
  markers.forEach(marker => {
    marker.addEventListener("click", (e) => {
      const clickedEle = e.target;
      let key = clickedEle.getAttribute("data-index");
      key = parseInt(key, 10);
      const obj = CONTINENT_MARKERS.find(item => item.key === key);
      selectMarkerOnGraph(obj);
    });
  });
}

function renderMarkers() {
  const worldMap = new WorldMap();
  worldMap.setMarkers(CONTINENT_MARKERS);
  worldMap.createMarkers();
  onMarkerClick();
}

windowResize();
renderMarkers();
initialSelect();
window.addEventListener("resize", windowResize);
