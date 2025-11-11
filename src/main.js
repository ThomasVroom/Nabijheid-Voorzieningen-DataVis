// get width and height from viewport
const width = window.innerWidth;
const height = window.innerHeight;

// select the container, append an SVG
const svg = d3.select("#canvas")
    .append("svg")
    .attr("width", width)
    .attr("height", height);

// basic GeoJSON visualization
import { visGeoJSON } from "./basic_geovis.js";
visGeoJSON(svg, width, height);
