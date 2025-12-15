import {kMeans} from "./kMeans.js";

// code from:
// - https://observablehq.com/@d3/color-legend
// - https://d3-graph-gallery.com/graph/parallel_basic.html
// - https://d3-graph-gallery.com/graph/parallel_custom.html
// - https://d3-graph-gallery.com/graph/backgroundmap_basic.html

const margin = {
    top: 5,
    left: 50,
    right: 40,
    bottom: 50
};

let mouseDown = false;
let toggleRestore = false;
window.addEventListener('mousedown', function() {
    mouseDown = true;
});
window.addEventListener('mouseup', function() {
    mouseDown = false;
});

const mapWidth = 500;
const legendWidth = 40;
const plotWidth = 750;
const height = 630;

// slider for k-means clustering
const kLabel = d3.select("#n-clusters");
const kSlider = d3.select("#k");
kSlider.on("input", function() {
    kLabel.text("# of clusters: " + this.value);
});
let kMeansClusters = {};

// select canvasses, append svg
const svg_map = d3.select("#canvas-map")
    .append("svg")
    .attr("width", mapWidth)
    .attr("height", height);
const svg_legend = d3.select("#canvas-legend")
    .append("svg")
    .attr("width", legendWidth)
    .attr("height", height);
const svg_plot = d3.select("#canvas-plot")
    .append("svg")
    .attr("width", plotWidth)
    .attr("height", height);

const tooltip = d3.select("#tooltip")
    .attr("class", "tooltip");

// load geojson data
// change to `data/dataset_clean.json` to load full dataset
d3.json("data/dataset_limburg.json").then(data => {
    console.log("loaded data:", data);

    const geoData = data;
    const jsonData = data.features.map(d => d.properties);
    jsonData.map((r) => {r["Cluster"] = -1;}); // init new column

    function updateColor(color, feature) {
        svg_plot.selectAll(".pc-line").attr("stroke", d => color(+d[feature]));
        svg_map.selectAll(".region")
            .on("mousedown", function(event, d) { // gray out (toggle)
                if (d3.select(this).attr("fill") === "gray") {
                    toggleRestore = true;
                    d3.select(this).attr("fill", d2 => color(+d2.properties[d3.select("#color-select").node().value]));
                    d3.select("#pc-" + d.properties["Region Code"])
                        .attr("stroke-opacity", 0.4)
                        .attr("stroke-width", 2.5);
                    tooltip
                        .style("opacity", 1)    
                        .html(`
                            <div><strong>${d.properties["Region Name"]}</strong></div>
                            <table><tr><td>${feature.replace("Avg. Distance to ", "")}</td>
                            <td style="text-align:right">${(+d.properties[feature]).toFixed(2)}</td></tr></table>
                        `);
                }
                else {
                    toggleRestore = false;
                    d3.select(this).attr("fill", "gray");
                    d3.select("#pc-" + d.properties["Region Code"])
                        .attr("stroke-opacity", 0.2)
                        .attr("stroke-width", 1);
                    tooltip.style("opacity", 0);
                }
            })
            .on("mouseover", function(event, d) { // activate tooltip
                d3.select(this).attr("opacity", 1);
                if (d3.select(this).attr("fill") === "gray") {
                    if (mouseDown && toggleRestore) { // restore (dragging)
                        d3.select(this).attr("fill", d2 => color(+d2.properties[d3.select("#color-select").node().value]));
                        d3.select("#pc-" + d.properties["Region Code"])
                            .attr("stroke-opacity", 0.4)
                            .attr("stroke-width", 2.5);
                    }
                    return;
                }
                if (mouseDown && !toggleRestore) { // gray out (dragging)
                    d3.select(this).attr("fill", "gray");
                    d3.select("#pc-" + d.properties["Region Code"])
                        .attr("stroke-opacity", 0.2)
                        .attr("stroke-width", 1);
                    return;
                }
                // highlight corresponding line
                d3.select("#pc-" + d.properties["Region Code"])
                    .attr("stroke-opacity", 1)
                    .attr("stroke-width", 5);
                tooltip
                    .style("opacity", 1)    
                    .html(`
                        <div><strong>${d.properties["Region Name"]}</strong></div>
                        <table><tr><td>${feature.replace("Avg. Distance to ", "")}</td>
                        <td style="text-align:right">${(+d.properties[feature]).toFixed(2)}</td></tr></table>
                    `);
            })
            .filter(function (d) {
                return d3.select("#map-" + d.properties["Region Code"]).attr("fill") != "gray";
            })
            .attr("fill", d => color(+d.properties[feature]));
    }

    // spatial map
    const projection = d3.geoMercator().fitSize([mapWidth, height - margin.top - margin.bottom], geoData);
    const path_map = d3.geoPath().projection(projection);
    svg_map.selectAll("path")
        .data(geoData.features)
        .join("path")
        .attr("class", "region")
        .attr("id", d => "map-" + d.properties["Region Code"])
        .attr("d", path_map)
        .attr("stroke", "black")
        .attr("stroke-width", 0.5)
        .attr("opacity", 0.9)
        .on("mousemove", function(event) { // update tooltip position
            tooltip.style("left", event.pageX + 10 + "px").style("top", event.pageY - 20 + "px");
        })
        .on("mouseout", function(event, d) { // remove tooltip
            d3.select(this).attr("opacity", 0.9); // should be the same as above!
            if (d3.select(this).attr("fill") != "gray") {
                d3.select("#pc-" + d.properties["Region Code"])
                    .attr("stroke-opacity", 0.4)
                    .attr("stroke-width", 2.5);
            }
            tooltip.style("opacity", 0);
        });

    // function for plotting with a filtered set of columns
    function plot_columns(columns, color_feature, k) {
        // brushing for highlighting multiple lines
        const activeBrushes = {};

        // find the maximum value of the entire selection
        let col_max = [];
        for (let dim of columns) {
            col_max.push(d3.max(jsonData, d => +d[dim]));
        }
        const maximum = d3.max(col_max);

        // y-scale
        const y = {};
        for (let dim of columns) {
            if (dim === "Cluster") {
                // categorical scale
                y[dim] = d3.scalePoint()
                    .domain(d3.range(1, k + 1).reverse())
                    .range([margin.top, height - margin.bottom]);
            } else {
                // numeric scale
                y[dim] = d3.scaleLinear()
                    .domain([0, maximum])
                    .range([height - margin.bottom, margin.top]);
            }
        }

        // x-scale
        const x = d3.scalePoint()
            .range([margin.left, plotWidth - margin.right])
            .domain(columns);

        // k-means clustering
        if (!kMeansClusters[k]) { // cache previous clusters
            kMeansClusters[k] = kMeans(jsonData, columns, k, []);
        }
        let clusterAssignments = kMeansClusters[k];
        jsonData.map((r, i) => {
            r["Cluster"] = clusterAssignments[i] + 1;
        });

        // lines
        function path(d) {
            return d3.line().curve(d3.curveMonotoneX)(columns.map(p => {
                return [x(p), y[p](p === "Cluster" ? +d[p] : d[p])];
            }));
        }
        const linePaths = svg_plot.selectAll("path")
            .data(jsonData)
            .join("path")
            .attr("class", "pc-line")
            .attr("id", d => "pc-" + d["Region Code"])
            .attr("d", path)
            .attr("fill", "none")
            .attr("stroke-opacity", 0.4)
            .attr("stroke-width", 2.5)
            .on("mouseover", function(event, d) { // activate tooltip
                if (d3.select(this).attr("stroke-opacity") < 0.4) return;
                d3.select(this)
                    .attr("stroke-opacity", 0.75)
                    .attr("stroke-width", 5);
                // highlight area
                d3.select("#map-" + d["Region Code"])
                    .attr("opacity", 1)
                    .attr("stroke-width", 2);
                const tableRows = columns
                    .map(dim => `<tr><td>${dim.replace("Avg. Distance to ", "")}</td>
                    <td style="text-align:right">${(+d[dim]).toFixed(2)}</td></tr>`)
                    .join("");
                tooltip
                    .style("opacity", 1)
                    .html(`
                        <div><strong>${d["Region Name"]}</strong></div>
                        <table>${tableRows}</table>
                    `);
            })
            .on("mousemove", function(event) { // update tooltip position
                tooltip.style("left", event.pageX + 10 + "px").style("top", event.pageY - 20 + "px");
            })
            .on("mouseout", function(event, d) { // remove tooltip
                if (d3.select(this).attr("stroke-opacity") < 0.4) return;
                d3.select(this)
                    .attr("stroke-opacity", 0.4) // should be the same as above!
                    .attr("stroke-width", 2.5);
                d3.select("#map-" + d["Region Code"])
                    .attr("opacity", 0.9)
                    .attr("stroke-width", 0.5);
                tooltip.style("opacity", 0);
            });

        // colors
        let color;
        if (color_feature === "Cluster") {
            // categorical color scale for clusters
            color = d3.scaleOrdinal()
                .domain(d3.range(1, k + 1))
                .range(d3.schemeCategory10);
        } else {
            // numeric sequential scale
            color = d3.scaleSequential()
                .domain([0, maximum])
                .interpolator(d3.interpolateRgb("purple", "orange"));
        }
        if (!columns.includes(color_feature)) {
            color_feature = columns[0]; // failsafe: use first column
        }
        updateColor(color, color_feature); // default color

        // drop down menu for color switching
        const colorSelect = d3.select("#color-select");
        colorSelect.selectAll("option")
            .data(columns)
            .join("option")
            .attr("value", d => d)
            .text(d => d.replace("Avg. Distance to ", ""));
        colorSelect.on("change", function() {
            if (this.value === "Cluster") {
                // categorical color scale for clusters
                color = d3.scaleOrdinal()
                    .domain(d3.range(1, k + 1))
                    .range(d3.schemeCategory10);
                svg_legend.selectAll("*").remove(); // disable legend
            } else {
                // numeric sequential scale
                color = d3.scaleSequential()
                    .domain([0, maximum])
                    .interpolator(d3.interpolateRgb("purple", "orange"));
                createLegend();
            }
            updateColor(color, this.value);
        });
        colorSelect.property('value', color_feature);

        // brushing logic
        function updateLineHighlighting() {
            linePaths
                .attr("stroke-opacity", d => {
                    // for every active brush, check if the value is inside the interval
                    for (const dim in activeBrushes) {
                        const [y0, y1] = activeBrushes[dim];
                        const py = y[dim](dim === "Cluster" ? +d[dim] : d[dim]);
                        if (py < y0 || py > y1) {
                            return 0.2; // faded
                        }
                    }
                    return 1; // highlight
                })
                .attr("stroke-width", d => {
                    for (const dim in activeBrushes) {
                        const [y0, y1] = activeBrushes[dim];
                        const py = y[dim](dim === "Cluster" ? +d[dim] : d[dim]);
                        if (py < y0 || py > y1) return 1; // shrink
                    }
                    return 2.5;
                });
            svg_map.selectAll(".region").attr("fill", d => {
                    // for every active brush, check if the value is inside the interval
                    for (const dim in activeBrushes) {
                        const [y0, y1] = activeBrushes[dim];
                        const py = y[dim](d.properties[dim]);
                        if (py < y0 || py > y1) {
                            return "gray"; // toggle
                        }
                    }
                    return color(+d.properties[d3.select("#color-select").node().value]); // keep
                });
        }
        function brushed(dimension) {
            return function(event) {
                if (event.selection) {
                    const [y0, y1] = event.selection;
                    activeBrushes[dimension] = [y0, y1];
                } else {
                    delete activeBrushes[dimension];
                }
                updateLineHighlighting();
            };
        }

        // vertical axes
        const axisGroup = svg_plot.selectAll(".dimension")
            .data(columns)
            .join("g")
            .attr("class", "dimension")
            .attr("transform", d => `translate(${x(d)})`)    
        axisGroup.each(function(d) {
            const g = d3.select(this).call(d3.axisLeft(y[d]));
            g.selectAll(".domain").attr("class", "axis"); // axis lines
            g.selectAll(".tick line").attr("class", "axis"); // tick lines
        })
        axisGroup.append("text") // axis labels
            .style("text-anchor", "middle")
            .attr("y", height - margin.bottom + 30)
            .attr("class", "axis-label")
            .text(d => d.replace("Avg. Distance to ", ""));
        axisGroup.append("g") // brushing
            .attr("class", "brush")
            .each(function (d) {
                const brush = d3.brushY()
                    .extent([[-10, margin.top], [10, height - margin.bottom]])
                    .on("brush end", brushed(d));
                const gBrush = d3.select(this).call(brush);
                // handles
                const handle = gBrush.selectAll(".handle")
                    .data([{ type: "n" }, { type: "s" }])
                    .join("line")
                    .attr("class", "handle")
                    .attr("stroke", "#333")
                    .attr("stroke-width", 4)
                    .attr("stroke-linecap", "round");
                function updateHandles(selection) {
                    const [y0, y1] = selection; // [top, bottom]
                    handle
                        .attr("x1", -10)
                        .attr("x2", 10)
                        .attr("y1", d => (d.type === "n" ? y0 : y1))
                        .attr("y2", d => (d.type === "n" ? y0 : y1));
                }
                const oBrushed = brushed(d);
                function wrappedBrush(event) {
                    if (event.selection) updateHandles(event.selection);
                    oBrushed(event);
                }
                gBrush.call(brush.on("brush end", wrappedBrush));
            });

        // general y-axis label
        svg_plot.append("text")
            .attr("x", margin.left - 40)
            .attr("y", height / 2)
            .attr("text-anchor", "middle")
            .attr("class", "axis-label")
            .attr("transform", `rotate(-90, ${margin.left - 40}, ${height / 2})`)
            .text("Average Distance (km)");

        // legend
        function createLegend() {
            const legendHeight = height - margin.top - margin.bottom;
            const legend_width = 15;
            const linearGradient = svg_legend.append("defs").append("linearGradient")
                .attr("id", "color-gradient")
                .attr("x1", "0%")
                .attr("x2", "0%")
                .attr("y1", "100%")
                .attr("y2", "0%");
            for (let i = 0; i <= 1; i += 0.05) {
                linearGradient.append("stop")
                    .attr("offset", i)
                    .attr("stop-color", color(i * maximum));
            }
            const legendGroup = svg_legend.append("g")
            legendGroup.append("rect")
                .attr("width", legend_width)
                .attr("height", legendHeight)
                .style("fill", `url(#color-gradient)`)
                .attr("stroke", "cream")
                .attr("stroke-width", 0.5);
            const legendScale = d3.scaleLinear()
                .domain([0, maximum])
                .range([legendHeight, 0]);
            const legendAxis = d3.axisRight(legendScale)
                .ticks(6)
                .tickSize(4);
            legendGroup.append("g")
                .attr("transform", `translate(${legend_width}, 0)`)
                .call(legendAxis)
                .call(g => g.select(".domain").remove());
        }
        if (color_feature !== "Cluster") createLegend();
    };

    // remove non-relevant columns
    const columns_clean = Object.keys(jsonData[0]).filter(d =>
        d !== "Region Code" &&
        d !== "Region Name" &&
        d !== "Population" &&
        d !== "geometry"
    );

    // set initial columns
    const columns_init = [columns_clean[0], columns_clean[1], columns_clean[2], "Cluster"];

    // checkboxes for filtering
    d3.select("#filtering").selectAll("div")
        .data(columns_clean)
        .join("div")
        .attr("class", "checkbox-item")
        .html(d => `<label>
            <input type="checkbox" class="feature-checkbox" value="${d}" ${(columns_init.includes(d) ? "checked=\"\"" : "")}}>
            ${d.replace("Avg. Distance to ", "")}
            </label>`);
    d3.selectAll(".feature-checkbox").on("change", () => {
        svg_plot.selectAll("*").remove(); // clear screen
        svg_legend.selectAll("*").remove();
        plot_columns( // filtering
            Array.from(document.querySelectorAll(".feature-checkbox:checked")).map(d => d.value),
            d3.select("#color-select").node().value, // currently selected color
            +kSlider.node().value // number of clusters
        );
    });
    kSlider.on("change", function() {
        svg_plot.selectAll("*").remove(); // clear screen
        svg_legend.selectAll("*").remove();
        plot_columns( // filtering
            Array.from(document.querySelectorAll(".feature-checkbox:checked")).map(d => d.value),
            d3.select("#color-select").node().value, // currently selected color
            +this.value // number of clusters
        );
    });
    d3.select("#redo-clusters").on("click", function() {
        kMeansClusters = {}; // reset clusters
        svg_plot.selectAll("*").remove(); // clear screen
        svg_legend.selectAll("*").remove();
        plot_columns( // filtering
            Array.from(document.querySelectorAll(".feature-checkbox:checked")).map(d => d.value),
            d3.select("#color-select").node().value, // currently selected color
            +kSlider.node().value // number of clusters
        );
    });

    // run the plotting code with all columns
    plot_columns(columns_init, columns_init[0], 3);
});
