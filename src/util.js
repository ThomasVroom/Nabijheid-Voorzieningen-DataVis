// reusable function for loading the dataset
export function loadGeoJSON(path) {
    let data = d3.json(path);
    console.log("loaded data:", data);
    return data;
};

// basic spatial visualization with highlightable areas
export function plotSVG(svg, width, height) {
    loadGeoJSON("data/dataset_clean.json").then(data => {
        const projection = d3.geoMercator().fitSize([width, height], data);
        const path = d3.geoPath().projection(projection);

        svg.selectAll("path")
        .data(data.features)
        .join("path")
        .attr("d", path);
    });
};
