// reusable function for loading the dataset
export function loadGeoJSON(path) {
    let data = d3.json(path);
    console.log("loaded data:", data);
    return data;
};

// function for drawing the chart title
export function setTitle(svg, width, margin, title) {
    svg.append("text")
        .attr("x", width / 2)
        .attr("y", margin.top / 2)
        .attr("text-anchor", "middle")
        .attr("class", "chart-title")
        .text(title);
};

// basic spatial visualization with highlightable areas
export function plotSVG(svg, width, height, margin) {
    // set title
    setTitle(svg, width, margin, "The Netherlands")

    // load geojson data
    loadGeoJSON("data/dataset_clean.json").then(data => {
        const projection = d3.geoMercator().fitSize([width - margin.left - margin.right, height - margin.top - margin.bottom], data);
        const path = d3.geoPath().projection(projection);
        const tooltip = d3.select("#tooltip").attr("class", "tooltip"); // tooltip for showing area names

        // draw map
        svg.selectAll("path")
        .data(data.features)
        .join("path")
        .attr("d", path)
        .attr("stroke", "black")
        .attr("stroke-width", 0.5)
        .attr("fill", "lightblue")
        .on("mouseover", function(event, d) { // activate tooltip
            d3.select(this).attr("fill", "orange")
            tooltip.html(`<strong>${d.properties["Region Name"]}</strong>`).style("opacity", 1);
        })
        .on("mousemove", function(event) { // update tooltip position
            tooltip.style("left", event.pageX + 10 + "px").style("top", event.pageY - 20 + "px");
        })
        .on("mouseout", function() { // remove tooltip
            d3.select(this).attr("fill", "lightblue") // should be the same as above!
            tooltip.style("opacity", 0);
        });
    });
};
