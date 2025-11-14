import { loadGeoJSON, setTitle } from "./util.js";

// code from:
// - https://d3-graph-gallery.com/graph/parallel_basic.html
// - https://d3-graph-gallery.com/graph/parallel_custom.html
// - https://observablehq.com/@d3/color-legend

// parallel coordinates plot for the "limburg" subset of areas
export function plotSVG(svg, width, height, margin) {
    // set title
    setTitle(svg, width, margin, "Average Distance to ...");

    // load and convert data to regular json
    loadGeoJSON("data/dataset_limburg.json").then(data => {
        data = data.features.map(d => d.properties);

        // remove non-relevant columns
        const columns = Object.keys(data[0]).filter(d =>
            d !== "Region Code" &&
            d !== "Region Name" &&
            d !== "Population" &&
            d !== "geometry"
        );

        // find the maximum value of the entire dataset
        const col_max = [];
        for (const dim of columns) {
            col_max.push(d3.max(data, d => +d[dim]));
        }
        const maximum = d3.max(col_max);

        // y-scale
        const y = {};
        for (const dim of columns) {
            y[dim] = d3.scaleLinear()
                .domain([0, maximum])
                .range([height - margin.bottom, margin.top]);
        }

        // x-scale
        const x = d3.scalePoint()
            .range([margin.left, width - margin.right])
            .padding(1) // on the sides
            .domain(columns);

        // tooltip for viewing area names
        const tooltip = d3.select("#tooltip").attr("class", "tooltip");

        // lines
        function path(d) {
            return d3.line().curve(d3.curveMonotoneX)(columns.map(p => [x(p), y[p](d[p])]));
        }
        svg.selectAll("path")
            .data(data)
            .join("path")
            .attr("d", path)
            .attr("fill", "none")
            .attr("stroke-opacity", 0.4)
            .attr("stroke-width", 2.5)
            .on("mouseover", function(event, d) { // activate tooltip
                d3.select(this)
                    .attr("stroke-opacity", 0.75)
                    .attr("stroke-width", 5);
                tooltip.html(`<strong>${d["Region Name"]}</strong>`).style("opacity", 1);
            })
            .on("mousemove", function(event) { // update tooltip position
                tooltip.style("left", event.pageX + 10 + "px").style("top", event.pageY - 20 + "px");
            })
            .on("mouseout", function() { // remove tooltip
                d3.select(this)
                    .attr("stroke-opacity", 0.4) // should be the same as above!
                    .attr("stroke-width", 2.5);
                tooltip.style("opacity", 0);
            });

        // colors
        const color = d3.scaleSequential()
            .domain([0, maximum])
            .interpolator(d3.interpolateRgb("purple", "orange"));
        function updateColor(feature) { // interactive color switching
            svg.selectAll("path").attr("stroke", d => color(+d[feature]));
        }
        updateColor(columns[0]); // default color: first column

        // vertical axes
        svg.selectAll(".dimension")
            .data(columns)
            .join("g")
            .attr("class", "dimension")
            .attr("transform", d => `translate(${x(d)})`)
            .each(function(d) {
                const g = d3.select(this).call(d3.axisLeft(y[d]));
                g.selectAll(".domain").attr("class", "axis"); // axis lines
                g.selectAll(".tick line").attr("class", "axis"); // tick lines
            })
            .append("text") // axis labels
            .style("text-anchor", "middle")
            .attr("y", height - margin.bottom + 30)
            .attr("class", "axis-label")
            .text(d => d.replace("Avg. Distance to ", ""));

        // general y-axis label
        svg.append("text")
            .attr("x", x.step())
            .attr("y", height / 2)
            .attr("text-anchor", "middle")
            .attr("class", "axis-label")
            .attr("transform", `rotate(-90, ${x.step()}, ${height / 2})`)
            .text("Average Distance (km)");

        // legend
        const legendHeight = height - margin.top - margin.bottom;
        const legendWidth = 15;
        const linearGradient = svg.append("defs").append("linearGradient")
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
        const legendGroup = svg.append("g")
            .attr("transform", `translate(${width - margin.right - 100}, ${margin.top})`);
        legendGroup.append("rect")
            .attr("width", legendWidth)
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
            .attr("transform", `translate(${legendWidth}, 0)`)
            .call(legendAxis)
            .call(g => g.select(".domain").remove());

        // drop down menu for color switching
        const colorSelect = d3.select("#color-select");
        colorSelect.selectAll("option")
            .data(columns)
            .join("option")
            .attr("value", d => d)
            .text(d => d.replace("Avg. Distance to ", ""));
        colorSelect.on("change", function() {
            updateColor(this.value);
        });
    });
};
