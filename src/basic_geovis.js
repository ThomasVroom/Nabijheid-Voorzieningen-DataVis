export function visGeoJSON(svg, width, height) { // load and visualize a GeoJSON file
    d3.json("data/dataset_clean.json").then(data => {
        console.log("GeoJSON data:", data);

        const projection = d3.geoMercator().fitSize([width, height], data);
        const path = d3.geoPath().projection(projection);

        // basic visualization with highlightable areas
        svg.selectAll("path")
        .data(data.features)
        .join("path")
        .attr("d", path);
    });
}
