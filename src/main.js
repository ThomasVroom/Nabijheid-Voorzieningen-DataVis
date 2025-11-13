// get width and height from viewport
const width = window.innerWidth;
const height = window.innerHeight;

const margin = {
  top: 50,
  left: 50,
  right: 25,
  bottom: 75
};

// select the container, append an SVG
const svg = d3.select("#canvas")
    .append("svg")
    .attr("width", width)
    .attr("height", height)
    .attr("style", "max-width: 100%; height: auto;");

// import and load visualization
import { plotSVG } from "./multivariate_vis.js";
plotSVG(svg, width, height, margin);
