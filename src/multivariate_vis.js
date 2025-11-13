import { loadGeoJSON } from "./util.js";

// TODO
export function plotSVG(svg, width, height) {
    loadGeoJSON("data/dataset_limburg.json").then(data => {
        const projection = d3.geoMercator().fitSize([width, height], data);
        const path = d3.geoPath().projection(projection);

        svg.selectAll("path")
        .data(data.features)
        .join("path")
        .attr("d", path);
    });
};
