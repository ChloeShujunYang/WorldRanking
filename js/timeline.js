class Timeline {
    constructor(containerId, data) {
        this.containerId = containerId;
        this.data = data;
        this.selectedRankType = 'rank_order'; // Default to overall ranking
        this.selectedGroup = '1-10'; // Default group
        this.margin = { top: 50, right: 50, bottom: 50, left: 60 };
        this.width = 800;
        this.height = 400;
        this.isExpanded = false; // Track if a line is selected

        this.initVis();
    }

    initVis() {
        const vis = this;

        // Create the main container
        vis.container = d3.select(`#${vis.containerId}`)
            .style("display", "flex")
            .style("width", "100%")
            .style("height", "100%");

        // Create chart container
        vis.chartContainer = vis.container.append("div")
            .attr("class", "chart-container")
            .style("flex", "1");

        // Create university info container (initially hidden)
        vis.infoContainer = vis.container.append("div")
            .attr("class", "university-info")
            .style("width", "0")
            .style("transition", "width 0.3s ease");

        // Create SVG
        vis.svg = vis.chartContainer.append("svg")
            .attr("width", vis.width + vis.margin.left + vis.margin.right)
            .attr("height", vis.height + vis.margin.top + vis.margin.bottom);

        vis.chart = vis.svg.append("g")
            .attr("transform", `translate(${vis.margin.left},${vis.margin.top})`);

        // Create scales
        vis.x = d3.scaleLinear()
            .range([0, vis.width]);

        vis.y = d3.scaleLinear()
            .range([vis.height, 0]);

        // Create axes
        vis.xAxis = vis.chart.append("g")
            .attr("class", "x-axis")
            .attr("transform", `translate(0,${vis.height})`);

        vis.yAxis = vis.chart.append("g")
            .attr("class", "y-axis");

        // Create controls
        this.createControls();

        // Initial render
        this.wrangleData();
    }

    createControls() {
        const vis = this;

        // Create control container
        const controls = d3.select(`#${vis.containerId}`)
            .append("div")
            .attr("class", "timeline-controls")
            .style("position", "absolute")
            .style("top", "20px")
            .style("left", "20px");

        // Create ranking type selector
        const rankTypes = [
            { value: 'rank_order', text: 'Overall Ranking' },
            { value: 'scores_teaching_rank', text: 'Teaching Ranking' },
            { value: 'scores_research_rank', text: 'Research Ranking' },
            { value: 'scores_citations_rank', text: 'Citations Ranking' },
            { value: 'scores_industry_income_rank', text: 'Industry Income Ranking' },
            { value: 'scores_international_outlook_rank', text: 'International Outlook Ranking' }
        ];

        controls.append("select")
            .attr("id", "ranking-type-select")
            .style("margin-right", "10px")
            .on("change", function() {
                vis.selectedRankType = this.value;
                vis.wrangleData();
            })
            .selectAll("option")
            .data(rankTypes)
            .enter()
            .append("option")
            .attr("value", d => d.value)
            .text(d => d.text);

        // Create rank group selector
        const rankGroups = [];
        for (let i = 0; i < 200; i += 10) {
            rankGroups.push(`${i + 1}-${i + 10}`);
        }

        controls.append("select")
            .attr("id", "rank-group-select")
            .on("change", function() {
                vis.selectedGroup = this.value;
                vis.wrangleData();
            })
            .selectAll("option")
            .data(rankGroups)
            .enter()
            .append("option")
            .attr("value", d => d)
            .text(d => `Rank ${d}`);
    }

    wrangleData() {
        const vis = this;

        // Filter data based on selected rank group
        const [start, end] = vis.selectedGroup.split('-').map(Number);
        const filteredData = vis.data.filter(d => 
            d[vis.selectedRankType] >= start && 
            d[vis.selectedRankType] <= end
        );

        // Group data by university and create trend lines
        vis.processedData = d3.group(filteredData, d => d.name);

        // Update scales
        vis.x.domain(d3.extent(vis.data, d => d.year));
        vis.y.domain([0, 100]); // Assuming scores are 0-100

        this.updateVis();
    }

    updateVis() {
        const vis = this;

        // Create line generator
        const line = d3.line()
            .x(d => vis.x(d.year))
            .y(d => vis.y(d[vis.selectedRankType.replace('_rank', '')]));

        // Update axes
        vis.xAxis.call(d3.axisBottom(vis.x).tickFormat(d3.format("d")));
        vis.yAxis.call(d3.axisLeft(vis.y));

        // Draw lines
        const lines = vis.chart.selectAll(".trend-line")
            .data(Array.from(vis.processedData), d => d[0]);

        // Enter
        const linesEnter = lines.enter()
            .append("path")
            .attr("class", "trend-line");

        // Update + Enter
        lines.merge(linesEnter)
            .attr("d", d => line(d[1]))
            .attr("fill", "none")
            .attr("stroke", "steelblue")
            .attr("stroke-width", 2)
            .style("opacity", 0.7)
            .on("mouseover", function() {
                d3.select(this)
                    .attr("stroke-width", 4)
                    .style("opacity", 1);
            })
            .on("mouseout", function() {
                if (!d3.select(this).classed("selected")) {
                    d3.select(this)
                        .attr("stroke-width", 2)
                        .style("opacity", 0.7);
                }
            })
            .on("click", function(event, d) {
                vis.handleLineClick(this, d);
            });

        // Exit
        lines.exit().remove();
    }

    handleLineClick(element, data) {
        const vis = this;
        
        // Reset all lines
        vis.chart.selectAll(".trend-line")
            .classed("selected", false)
            .attr("stroke-width", 2)
            .style("opacity", 0.7);

        if (!vis.isExpanded) {
            // Expand view and show university info
            d3.select(element)
                .classed("selected", true)
                .attr("stroke-width", 4)
                .style("opacity", 1);

            // Animate chart container
            vis.chartContainer
                .style("width", "60%")
                .style("transition", "width 0.3s ease");

            // Show info container
            vis.infoContainer
                .style("width", "40%")
                .style("padding", "20px")
                .html(`
                    <h2>${data[0]}</h2>
                    <p>University information will be displayed here...</p>
                `);

            vis.isExpanded = true;
        } else {
            // Collapse view
            vis.chartContainer
                .style("width", "100%");

            vis.infoContainer
                .style("width", "0")
                .style("padding", "0");

            vis.isExpanded = false;
        }

        // Redraw chart with new dimensions
        vis.updateVis();
    }

    render() {
        const vis = this;

        // Get the new container dimensions
        const containerWidth = vis.container.node().getBoundingClientRect().width;
        const containerHeight = vis.container.node().getBoundingClientRect().height;

        // Update width and height based on container size
        vis.width = containerWidth - vis.margin.left - vis.margin.right;
        vis.height = containerHeight - vis.margin.top - vis.margin.bottom;

        // Update SVG dimensions
        vis.svg
            .attr("width", vis.width + vis.margin.left + vis.margin.right)
            .attr("height", vis.height + vis.margin.top + vis.margin.bottom);

        // Update scales
        vis.x.range([0, vis.width]);
        vis.y.range([vis.height, 0]);

        // Update axes positions
        vis.xAxis
            .attr("transform", `translate(0,${vis.height})`);

        // Update the visualization
        vis.wrangleData();
    }
} 