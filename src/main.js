// Constants
const width = window.innerWidth;
const height = window.innerHeight;

// Select the container and append an SVG
const svg = d3.select("#map")
    .append("svg")
    .attr("width", width)
    .attr("height", height);

// Load the GeoJSON file
d3.json("data/dataset_clean.json").then(data => {
    console.log("GeoJSON data:", data);

    const projection = d3.geoMercator().fitSize([width, height], data);
    const path = d3.geoPath().projection(projection);

    svg.selectAll("path")
      .data(data.features)
      .join("path")
      .attr("d", path)
      .attr("fill", "#a8dadc")
      .attr("stroke", "#1d3557");
});
