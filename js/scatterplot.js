// feel free to change any part of the code
class Scatterplot {
    constructor(containerId, data) {
        console.log("6. Scatterplot constructor called");
        console.log("7. Container ID:", containerId);
        console.log("8. Data received:", data?.length);
        
        this.containerId = containerId;
        // Remove entries with zero scores
        this.data = data.filter(d => 
            d.scores_overall > 0 && 
            d.scores_teaching > 0 && 
            d.scores_international_outlook > 0 && 
            d.scores_industry_income > 0 && 
            d.scores_research > 0 && 
            d.scores_citations > 0
        );
        
        // Get year range from data
        this.yearRange = {
            min: d3.min(this.data, d => d.year),
            max: d3.max(this.data, d => d.year)
        };
        
        this.availableScores = [
            'scores_overall',
            'scores_teaching',
            'scores_international_outlook',
            'scores_industry_income',
            'scores_research',
            'scores_citations'
        ];
        
        // Default variables
        this.currentX = 'scores_teaching';
        this.currentY = 'scores_international_outlook';
        
        // Track draggable state of each score
        this.scoreStates = {};
        this.availableScores.forEach(score => {
            this.scoreStates[score] = {
                isDraggable: ![this.currentX, this.currentY].includes(score),
                position: null // Will store original position
            };
        });
        
        this.clearChart(); // Clear any existing content
        this.initVis(); // Initialize visualization
    }

    clearChart() {
        // Clear existing content in the scatterplot container
        d3.select("#" + this.containerId).selectAll("*").remove();
    }

    initVis() {
        const vis = this;
        console.log("9. InitVis called");
        
        // Calculate required width based on ovals
        const ovalWidth = 160;
        const ovalSpacing = 40;
        const totalOvalWidth = (ovalWidth + ovalSpacing) * vis.availableScores.length;
        
        // Set up the SVG drawing area
        const containerWidth = document.getElementById(vis.containerId).clientWidth;
        const containerHeight = document.getElementById(vis.containerId).clientHeight;
        
        // Increase left margin to center the plot
        vis.margin = {
            top: 70,  // Increased to make room for title
            right: 50,
            bottom: 100,
            left: 150  // Increased from 80 to 150
        };

        // Calculate required width
        vis.width = Math.max(containerWidth, totalOvalWidth + vis.margin.left + vis.margin.right);
        vis.height = containerHeight;
        
        vis.innerWidth = vis.width - vis.margin.left - vis.margin.right;
        vis.innerHeight = vis.height - vis.margin.top - vis.margin.bottom;

        // Create SVG with calculated width
        vis.svg = d3.select("#" + vis.containerId)
        .append("svg")
            .attr("width", vis.width)
            .attr("height", vis.height);

        // Add container for plot
        vis.g = vis.svg.append("g")
            .attr("transform", `translate(${vis.margin.left},${vis.margin.top})`);

        // Add title with more space for two lines
        vis.title = vis.svg.append("text")
            .attr("class", "plot-title")
            .attr("x", vis.width / 2)
            .attr("y", 25)  // Adjusted y position for two-line title
            .attr("text-anchor", "middle")
            .style("font-size", "18px")
            .style("font-weight", "bold");

        // Initialize scales
        vis.x = d3.scaleLinear()
            .domain([0, 100])
            .range([0, vis.innerWidth]);

        vis.y = d3.scaleLinear()
            .domain([0, 100])
            .range([vis.innerHeight, 0]);

        // Create axis generators with major and minor ticks
        vis.xAxis = d3.axisBottom(vis.x)
            .tickValues(d3.range(0, 101, 20))
            .tickSize(10);

        vis.xAxisMinor = d3.axisBottom(vis.x)
            .tickValues(d3.range(0, 101, 10))
            .tickSize(5);

        vis.yAxis = d3.axisLeft(vis.y)
            .tickValues(d3.range(0, 101, 20))
            .tickSize(10);

        vis.yAxisMinor = d3.axisLeft(vis.y)
            .tickValues(d3.range(0, 101, 10))
            .tickSize(5);

        // Add axes groups
        vis.xAxisGroup = vis.g.append("g")
            .attr("class", "x-axis")
            .attr("transform", `translate(0,${vis.innerHeight})`);

        vis.yAxisGroup = vis.g.append("g")
            .attr("class", "y-axis");

        // Create drag behavior with proper binding
        vis.drag = d3.drag()
            .on("start", function(event, d) { vis.dragstarted.call(vis, event, d, this); })
            .on("drag", function(event, d) { vis.dragged.call(vis, event, d, this); })
            .on("end", function(event, d) { vis.dragended.call(vis, event, d, this); });

        this.createVariableSelectors();
        this.render();
    }

    createVariableSelectors() {
        const vis = this;
        
        const ovalWidth = 160;
        const ovalHeight = 30;
        const ovalSpacing = 40;
        
        // Calculate total width needed for all ovals
        const totalWidth = (ovalWidth + ovalSpacing) * vis.availableScores.length - ovalSpacing;
        // Calculate starting x position to center the ovals
        const startX = (vis.width - totalWidth) / 2;
        
        // Create variable selection ovals below plot - moved lower
        const selectionGroup = vis.svg.append("g")
            .attr("transform", `translate(${startX},${vis.height - 20})`);  // Changed from -30 to -20

        // Store initial positions for each score
        vis.availableScores.forEach((score, i) => {
            vis.scoreStates[score].position = {
                x: i * (ovalWidth + ovalSpacing),
                y: 0
            };
        });

        // Create draggable ovals
        vis.scoreSelectors = selectionGroup.selectAll(".score-selector")
            .data(vis.availableScores)
            .join("g")
            .attr("class", "score-selector")
            .attr("transform", (d) => `translate(${vis.scoreStates[d].position.x},${vis.scoreStates[d].position.y})`);

        // Add ovals and text
        vis.updateScoreSelectors();

        // Create axis variable indicators
        // X-axis selector - moved lower
        vis.xSelector = vis.svg.append("g")
            .attr("class", "axis-selector x")
            .attr("transform", `translate(${vis.margin.left + vis.innerWidth/2},${vis.height - 60})`);  // Changed from -70 to -60

        vis.xSelector.append("ellipse")
            .attr("rx", ovalWidth/2)  // Wider oval
            .attr("ry", ovalHeight/2)
            .attr("fill", "#ffffff")
            .attr("stroke", "#666");

        vis.xSelector.append("text")
            .attr("text-anchor", "middle")
            .attr("dy", "0.3em")
            .style("font-weight", "bold");

        // Y-axis selector - keep same position
        vis.ySelector = vis.svg.append("g")
            .attr("class", "axis-selector y")
            .attr("transform", `translate(${vis.margin.left - 60},${vis.margin.top + vis.innerHeight/2}) rotate(-90)`);

        vis.ySelector.append("ellipse")
            .attr("rx", ovalWidth/2)  // Wider oval
            .attr("ry", ovalHeight/2)
            .attr("fill", "#ffffff")
            .attr("stroke", "#666");

        vis.ySelector.append("text")
            .attr("text-anchor", "middle")
            .attr("dy", "0.3em")
            .style("font-weight", "bold");

        this.updateAxisSelectors();
    }

    updateScoreSelectors() {
        const vis = this;
        
        vis.scoreSelectors.each(function(score) {
            const selector = d3.select(this);
            const isDraggable = vis.scoreStates[score].isDraggable;
            
            // Remove old elements
            selector.selectAll("*").remove();
            
            // Update draggable state
            if (isDraggable) {
                selector.call(vis.drag);
                selector.style("cursor", "move");
            } else {
                selector.on(".drag", null);
                selector.style("cursor", "default");
            }
            
            // Add oval with wider width
            selector.append("ellipse")
                .attr("rx", 80)  // Doubled from 40
                .attr("ry", 15)
                .attr("fill", isDraggable ? "#dddddd" : "#ffffff")
                .attr("stroke", "#666");

            // Add text
            selector.append("text")
                .attr("text-anchor", "middle")
                .attr("dy", "0.3em")
                .style("font-weight", isDraggable ? "normal" : "bold")
                .text(score.replace("scores_", ""));
        });
    }

    updateAxisSelectors() {
        const vis = this;
        
        // Update x-axis selector
        vis.xSelector.select("text")
            .text(vis.currentX.replace("scores_", ""))
            .style("font-weight", "bold");
            
        // Update y-axis selector
        vis.ySelector.select("text")
            .text(vis.currentY.replace("scores_", ""))
            .style("font-weight", "bold");
    }

    dragstarted(event, d, element) {
        if (!this.scoreStates[d].isDraggable) return;
        
        d3.select(element)
            .raise()
            .select("ellipse")
            .attr("stroke", "#000")
            .attr("stroke-width", 2);
    }

    dragged(event, d, element) {
        if (!this.scoreStates[d].isDraggable) return;
        
        d3.select(element)
            .attr("transform", `translate(${event.x},${event.y})`);
    }

    dragended(event, d, element) {
        const vis = this;
        if (!this.scoreStates[d].isDraggable) return;
        
        // Reset stroke
        d3.select(element)
            .select("ellipse")
            .attr("stroke", "#666")
            .attr("stroke-width", 1);
        
        const draggedScore = d;
        
        // Get the current mouse position relative to the SVG
        const mouseX = event.sourceEvent.clientX;
        const mouseY = event.sourceEvent.clientY;
        
        // Get the axis oval positions
        const xAxisOval = vis.xSelector.node().getBoundingClientRect();
        const yAxisOval = vis.ySelector.node().getBoundingClientRect();
        
        let replaced = false;
        
        // Check if mouse is over x-axis oval on release
        if (mouseX >= xAxisOval.left && mouseX <= xAxisOval.right &&
            mouseY >= xAxisOval.top && mouseY <= xAxisOval.bottom) {
            // Update variables
            const oldX = vis.currentX;
            vis.currentX = draggedScore;
            
            // Update draggable states
            vis.scoreStates[oldX].isDraggable = true;
            vis.scoreStates[draggedScore].isDraggable = false;
            
            replaced = true;
        }
        // Check if mouse is over y-axis oval on release
        else if (mouseX >= yAxisOval.left && mouseX <= yAxisOval.right &&
                 mouseY >= yAxisOval.top && mouseY <= yAxisOval.bottom) {
            // Update variables
            const oldY = vis.currentY;
            vis.currentY = draggedScore;
            
            // Update draggable states
            vis.scoreStates[oldY].isDraggable = true;
            vis.scoreStates[draggedScore].isDraggable = false;
            
            replaced = true;
        }

        if (replaced) {
            // Update visualizations
            vis.updateScoreSelectors();
            vis.updateAxisSelectors();
            vis.updateTitle();  // Update title when variables change
            vis.renderTransition();
        }
        
        // Return to original position
        d3.select(element)
            .transition()
            .duration(200)
            .attr("transform", `translate(${vis.scoreStates[d].position.x},${vis.scoreStates[d].position.y})`);
    }

    renderTransition() {
        const vis = this;
        
        // Update points with transition
        const points = vis.g.selectAll(".point")
            .data(vis.data);
            
        // Exit
        points.exit().remove();
        
        // Enter
        const pointsEnter = points.enter()
            .append("circle")
            .attr("class", "point")
            .attr("r", 5)
            .attr("fill", "#3498db")
            .attr("opacity", 0.6);
            
        // Update + Enter
        points.merge(pointsEnter)
            .transition()
            .duration(750)
            .attr("cx", d => vis.x(d[vis.currentX]))
            .attr("cy", d => vis.y(d[vis.currentY]));
    }

    updateTitle() {
        const vis = this;
        
        // Format variable names for title
        const formatText = (text) => {
            return text.split("_")
                .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                .join(" ");
        };

        const xVar = formatText(vis.currentX.replace("scores_", ""));
        const yVar = formatText(vis.currentY.replace("scores_", ""));
        
        // Create multi-line title
        vis.title
            .selectAll("tspan").remove();  // Clear existing title
            
        vis.title
            .append("tspan")
            .text(`Scatter Plot of ${xVar} Score vs. ${yVar} Score`)
            .attr("x", vis.width / 2)
            .attr("dy", 0);
            
        vis.title
            .append("tspan")
            .text(`of Universities Around the World From ${vis.yearRange.min} to ${vis.yearRange.max}`)
            .attr("x", vis.width / 2)
            .attr("dy", "1.2em");
    }

    render() {
        const vis = this;

        // Update title
        vis.updateTitle();

        // Clear existing content
        vis.g.selectAll(".point").remove();

        // Update axes
        vis.xAxisGroup.call(vis.xAxis);
        vis.xAxisGroup.call(vis.xAxisMinor);
        vis.yAxisGroup.call(vis.yAxis);
        vis.yAxisGroup.call(vis.yAxisMinor);

        // Draw points
        vis.g.selectAll(".point")
            .data(vis.data)
            .join("circle")
            .attr("class", "point")
            .attr("cx", d => vis.x(d[vis.currentX]))
            .attr("cy", d => vis.y(d[vis.currentY]))
            .attr("r", 5)
            .attr("fill", "#3498db")
            .attr("opacity", 0.6);
        
        // Debug point positions
        const samplePoint = vis.data[0];
        console.log("Sample point coordinates:", {
            x: vis.x(samplePoint[vis.currentX]),
            y: vis.y(samplePoint[vis.currentY]),
            rawX: samplePoint[vis.currentX],
            rawY: samplePoint[vis.currentY]
        });
        
        // Debug SVG existence
        console.log("SVG dimensions after render:", {
            width: vis.svg.attr("width"),
            height: vis.svg.attr("height")
        });
        
        console.log("scatterplot rendered");
    }
}
