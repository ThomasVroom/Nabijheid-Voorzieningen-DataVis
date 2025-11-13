import { loadGeoJSON } from "./util.js";

// parallel coordinates plot for the "limburg" subset of areas
export function plotSVG(svg, width, height, margin) {
    // title
    svg.append("text")
        .attr("x", width / 2)
        .attr("y", margin.top / 2)
        .attr("text-anchor", "middle")
        .attr("class", "chart-title")
        .text("Average Distance to ...");

    loadGeoJSON("data/dataset_limburg.json").then(data => {
        // convert data to json
        data = data.features.map(d => d.properties);

        // remove non-relevant columns
        const dimensions = Object.keys(data[0]).filter(d =>
            d !== "Region Code" &&
            d !== "Region Name" &&
            d !== "Population" &&
            d !== "geometry"
        );

        // find the maximum value of the entire dataset
        const col_max = [];
        for (const dim of dimensions) {
            col_max.push(d3.max(data, d => +d[dim]));
        }
        const maximum = d3.max(col_max);

        // y-scale
        const y = {};
        for (const dim of dimensions) {
            y[dim] = d3.scaleLinear()
                .domain([0, maximum])
                .range([height - margin.bottom, margin.top]);
        }

        // x-scale
        const x = d3.scalePoint()
            .range([margin.left, width - margin.right])
            .padding(1)
            .domain(dimensions);

        // colors
        const color = d3.scaleSequential()
            .domain([0, maximum])
            .interpolator(d3.interpolateRgb("purple", "orange"));
        function updateColor(colorFeature) {
            svg.selectAll("path")
                //.transition()
                //.duration(600)
                .attr("stroke", d => color(+d[colorFeature]));
        }

        // lines
        function path(d) {
            return d3.line().curve(d3.curveMonotoneX)(dimensions.map(p => [x(p), y[p](d[p])]));
        }
        const tooltip = d3.select("#tooltip").attr("class", "tooltip");
        svg.selectAll("path")
            .data(data)
            .join("path")
            .attr("d", path)
            // tooltip
            .on("mouseover", function(event, d) {
                tooltip.html(`<strong>${d["Region Name"]}</strong>`).style("opacity", 1);
            })
            .on("mousemove", function(event) {
                tooltip.style("left", event.pageX + 10 + "px").style("top", event.pageY - 20 + "px");
            })
            .on("mouseout", function() {
                tooltip.style("opacity", 0);
            });
        updateColor(dimensions[0]);

        // vertical axes
        svg.selectAll(".dimension")
            .data(dimensions)
            .join("g")
            .attr("class", "dimension")
            .attr("transform", d => `translate(${x(d)})`)
            .each(function(d) {
                d3.select(this)
                    .call(d3.axisLeft(y[d]))
                    .attr("class", "axis");
            })
            .append("text") // axis labels
            .style("text-anchor", "middle")
            .attr("y", height - margin.bottom + 30)
            .text(d => d.replace("Avg. Distance to ", ""));

        // y-axis label
        svg.append("text")
            .attr("x", x.step())
            .attr("y", height / 2)
            .attr("text-anchor", "middle")
            .attr("transform", `rotate(-90, ${x.step()}, ${height / 2})`)
            .text("Average Distance (km)");

        // legend
        const legendHeight = height - margin.top - margin.bottom;
        const legendWidth = 15;
        const legendX = width - margin.right - 100;
        const legendY = margin.top;
        const colorDomain = [0, maximum]
        const linearGradient = svg.append("defs").append("linearGradient")
            .attr("id", "color-gradient")
            .attr("x1", "0%")
            .attr("x2", "0%")
            .attr("y1", "100%")
            .attr("y2", "0%");
        for (let i = 0; i <= 1; i += 0.05) {
            linearGradient.append("stop")
                .attr("offset", i)
                .attr("stop-color", color(
                colorDomain[0] + i * (colorDomain[1] - colorDomain[0])
            ));
        }
        const legendGroup = svg.append("g")
            .attr("transform", `translate(${legendX}, ${legendY})`);
        legendGroup.append("rect")
            .attr("width", legendWidth)
            .attr("height", legendHeight)
            .style("fill", `url(#color-gradient)`)
            .attr("stroke", "#ccc")
            .attr("stroke-width", 0.5);
        const legendScale = d3.scaleLinear()
            .domain(colorDomain)
            .range([legendHeight, 0]);
        const legendAxis = d3.axisRight(legendScale)
            .ticks(6)
            .tickSize(4);
        legendGroup.append("g")
            .attr("transform", `translate(${legendWidth}, 0)`)
            .call(legendAxis)
            .call(g => g.select(".domain").remove());
        
        // drop down for color switching
        const colorSelect = d3.select("#color-select");
        colorSelect.selectAll("option")
            .data(dimensions)
            .join("option")
            .attr("value", d => d)
            .text(d => d.replace("Avg. Distance to ", ""));
        colorSelect.on("change", function() {
            updateColor(this.value);
        });
    });
};
