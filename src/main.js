// get width and height from viewport
const width = window.innerWidth;
const height = window.innerHeight;

// select the container, append an SVG
const svg = d3.select("#canvas")
    .append("svg")
    .attr("width", width)
    .attr("height", height);

// import and load visualization
import { plotSVG } from "./multivariate_vis.js";
plotSVG(svg, width, height);
