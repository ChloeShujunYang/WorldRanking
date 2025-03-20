class Scatterplot {
    constructor(containerId, data) {
        console.log("Scatterplot Debug: Constructor start");
        console.log("Scatterplot Debug: Constructor called");
        console.log("Scatterplot Debug: Container ID:", containerId);
        console.log("Scatterplot Debug: Raw data length:", data?.length);
        
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
        console.log("Scatterplot Debug: Filtered data length:", this.data.length);
        console.log("Scatterplot Debug: Sample data point:", this.data[0]);
        
        // Define variables in priority order
        this.variables = [
            { name: 'scores_overall', label: 'Overall Score', priority: 0 },
            { name: 'scores_research', label: 'Research Score', priority: 1 },
            { name: 'scores_citations', label: 'Citation Score', priority: 2 },
            { name: 'scores_industry_income', label: 'Industry Income Score', priority: 3 },
            { name: 'scores_international_outlook', label: 'International Outlook Score', priority: 4 },
            { name: 'scores_teaching', label: 'Teaching Score', priority: 5 }
        ];
        
        // Get year range and set default year
        this.yearRange = {
            min: d3.min(this.data, d => d.year),
            max: d3.max(this.data, d => d.year)
        };
        this.selectedYear = this.yearRange.max;
        
        // Default selected variables (Overall Score and Research Score)
        this.selectedVariables = [this.variables[0], this.variables[1]];
        
        console.log("Scatterplot Debug: Selected variables:", this.selectedVariables);
        console.log("Scatterplot Debug: Year range:", this.yearRange);
        
        // After setting selectedYear and selectedVariables
        console.log("Scatterplot Debug: Initial state:", {
            selectedYear: this.selectedYear,
            selectedVariables: this.selectedVariables,
            dataPoints: this.data.length,
            yearRange: this.yearRange
        });
        
        this.isInitialRender = true;  // 添加标志来追踪是否是初始渲染
        this.initVis();
    }

    initVis() {
        const vis = this;

        // Clear any existing content
        const containerElement = document.getElementById(vis.containerId);
        containerElement.innerHTML = '';
        
        // First, remove any existing title to prevent duplicates
        d3.select("#page6 .content-wrapper .main-title").remove();
        
        // Create page title (stays at top)
        const pageTitle = d3.select("#page6 .content-wrapper")
            .insert("h1", ":first-child")
            .attr("class", "main-title")
            .style("font-size", "42px")
            .style("position", "absolute")
            .style("top", "20px")
            .style("left", "50%")
            .style("transform", "translateX(-50%)")
            .style("margin", "0")
            .style("text-align", "center")
            .style("width", "100%")
            .style("z-index", "1000")
            .text(`${vis.selectedVariables[1].label} vs. ${vis.selectedVariables[0].label} (${vis.selectedYear})`);

        // Store the page title reference
        vis.pageTitle = pageTitle;

        // Create main container with fixed width and centering
        const container = d3.select("#" + vis.containerId)
            .style("display", "grid")
            .style("grid-template-columns", "42% 58%")
            .style("width", "100%")
            .style("height", "100vh")
            .style("gap", "20px")
            .style("padding", "20px")
            .style("position", "relative")
            .style("left", "50%")
            .style("transform", "translateX(-48%)")
            .style("margin", "50px auto 0")
            .style("margin-top", "50px");

        // Left panel container (for hexagon and slider)
        const leftPanel = container.append("div")
            .style("display", "flex")
            .style("flex-direction", "column")
            .style("height", "100%")
            .style("gap", "20px");

        // Calculate heights for hexagon container (70% of its previous height)
        const totalHeight = containerElement.clientHeight;
        const hexagonHeight = Math.floor(totalHeight * 0.6); // 60% of 100%
        const sliderHeight = 40; // Fixed height for slider

        // Add single title for both metrics and year selection
        leftPanel.append("h2")
            .attr("class", "hexagon-title")
            .style("text-align", "center")
            .style("margin-bottom", "10px")
            .style("opacity", "0")  // Start hidden
            .style("font-size", "18px")
            .style("color", "#4a4a4a")
            .text("Select Metrics and Year");

        // Add instruction text
        leftPanel.append("p")
            .attr("class", "hexagon-instruction")
            .style("text-align", "center")
            .style("margin", "0 0 20px 0")
            .style("font-size", "13px")
            .style("color", "#666")
            .style("font-style", "italic")
            .text("Click any line to explore the relationship between two scores");

        // Add hexagon container
        vis.hexagonContainer = leftPanel.append("div")
            .attr("class", "hexagon-container")
            .style("height", `${hexagonHeight}px`)
            .style("display", "flex")
            .style("justify-content", "center")
            .style("align-items", "center");

        console.log("Scatterplot Debug: Hexagon container created");

        // Remove the separate slider title and just add the slider container
        vis.sliderContainer = leftPanel.append("div")
            .attr("class", "slider-container")
            .style("height", `${sliderHeight}px`)
            .style("padding", "20px")
            .style("display", "flex")
            .style("flex-direction", "column")
            .style("justify-content", "center");

        // Add new debug logs for slider title
        console.log("Scatterplot Debug - Slider Container:", vis.sliderContainer);
        console.log("Scatterplot Debug - Attempting to add slider title");

        // Verify the title was added
        console.log("Scatterplot Debug - Slider title elements:", vis.sliderContainer.selectAll(".slider-title").nodes());

        // Right panel for plot - now with centering
        vis.plotContainer = container.append("div")
            .attr("class", "plot-container")
            .style("width", "100%")
            .style("height", "100%")
            .style("display", "flex")
            .style("justify-content", "center")  // Center horizontally
            .style("align-items", "center");     // Center vertically

        console.log("Scatterplot Debug: Plot container created");

        console.log("Scatterplot Debug: Container heights:", {
            totalHeight: totalHeight,
            hexagonHeight: hexagonHeight,
            sliderHeight: sliderHeight
        });

        // Initialize components
        this.initHexagonSelector();
        this.initPlot();
        this.initYearSlider();
        this.render();

        // Debug final container states
        console.log("Scatterplot Debug: Final container states:", {
            leftPanel: {
                element: leftPanel.node(),
                dimensions: {
                    clientWidth: leftPanel.node().clientWidth,
                    clientHeight: leftPanel.node().clientHeight
                }
            },
            hexagonContainer: {
                element: vis.hexagonContainer.node(),
                dimensions: {
                    clientWidth: vis.hexagonContainer.node().clientWidth,
                    clientHeight: vis.hexagonContainer.node().clientHeight
                }
            },
            sliderContainer: {
                element: vis.sliderContainer.node(),
                dimensions: {
                    clientWidth: vis.sliderContainer.node().clientWidth,
                    clientHeight: vis.sliderContainer.node().clientHeight
                }
            },
            plotContainer: {
                element: vis.plotContainer.node(),
                dimensions: {
                    clientWidth: vis.plotContainer.node().clientWidth,
                    clientHeight: vis.plotContainer.node().clientHeight
                }
            }
        });
    }

    initHexagonSelector() {
        const vis = this;
        console.log("Scatterplot Debug: Initializing hexagon selector");
        
        // Create SVG with adjusted dimensions
        vis.hexagonSvg = vis.hexagonContainer.append("svg")
            .attr("width", "100%")
            .attr("height", "100%")
            .attr("viewBox", "0 0 300 300")
            .style("max-height", "100%")
            .style("overflow", "visible");

        // Create separate groups for each layer
        vis.linesGroup = vis.hexagonSvg.append("g").attr("class", "lines-group");
        vis.circlesGroup = vis.hexagonSvg.append("g").attr("class", "circles-group");
        vis.textGroup = vis.hexagonSvg.append("g").attr("class", "text-group");

        // Calculate hexagon layout
        const radius = 120;
        const center = { x: 150, y: 150 };
        const circleRadius = 40;  // Increased circle radius further
        
        // Calculate vertex positions (starting from top, clockwise)
        vis.vertices = vis.variables.map((_, i) => {
            const angle = (i * Math.PI / 3) - Math.PI / 2; // Start from top
            return {
                x: center.x + radius * Math.cos(angle),
                y: center.y + radius * Math.sin(angle)
            };
        });

        // Create lines between all vertices
        vis.lines = [];
        for (let i = 0; i < vis.vertices.length; i++) {
            for (let j = i + 1; j < vis.vertices.length; j++) {
                vis.lines.push({
                    source: vis.vertices[i],
                    target: vis.vertices[j],
                    variables: [vis.variables[i], vis.variables[j]]
                });
            }
        }

     // ** 添加选中线条存储变量 **
     vis.selectedLine = null; 

     // ** 替换原有的线条绘制代码 **
     vis.linesGroup.selectAll(".variable-line")
         .data(vis.lines)
         .join("line")
         .attr("class", "variable-line")
         .attr("x1", d => d.source.x)
         .attr("y1", d => d.source.y)
         .attr("x2", d => d.target.x)
         .attr("y2", d => d.target.y)
         .style("stroke", "#cccccc")
         .style("stroke-width", 5)
         .style("opacity", 0.5)
         .style("cursor", "pointer")
         .on("mouseover", function(event, d) {
             // Only highlight if this line is not the currently selected one
             if (!vis.isSelectedLine(this, d)) {
                 d3.select(this)
                     .transition()
                     .duration(200)
                     .style("stroke", "#3498db")
                     .style("stroke-width", 7)
                     .style("opacity", 0.5);  // Keep the same opacity as unselected lines
             }
         })
         .on("mouseout", function(event, d) {
             // Only reset if this line is not the currently selected one
             if (!vis.isSelectedLine(this, d)) {
                 d3.select(this)
                     .transition()
                     .duration(200)
                     .style("stroke", "#cccccc")
                     .style("stroke-width", 5)
                     .style("opacity", 0.5);
             }
         })
         .on("click", function(event, d) {
             vis.selectVariables(d.variables);
         });
         
        // Helper function to check if a line is currently selected
        vis.isSelectedLine = function(element, data) {
            return vis.selectedLine === element || 
                   (data.variables[0] === vis.selectedVariables[0] && data.variables[1] === vis.selectedVariables[1]) ||
                   (data.variables[0] === vis.selectedVariables[1] && data.variables[1] === vis.selectedVariables[0]);
        };

        // Define colors
        vis.colors = {
            circleFillDefault: "#add8e6",    // Light blue
            circleFillHighlight: "#3498db",  // Darker blue
            textDefault: "#4a4a4a",          // Dark grey
            textHighlight: "#ffffff"         // White
        };

        // Draw circles in the middle layer - remove cursor pointer
        vis.circlesGroup.selectAll(".variable-circle")
            .data(vis.vertices)
            .join("circle")
            .attr("class", "variable-circle")
            .attr("cx", d => d.x)
            .attr("cy", d => d.y)
            .attr("r", circleRadius)
            .style("fill", vis.colors.circleFillDefault)
            .style("stroke", "none")
            .style("cursor", "default");  // Change cursor to default instead of pointer

        // Create text groups in the top layer
        const textGroups = vis.textGroup.selectAll(".variable-text-group")
            .data(vis.variables)
            .join("g")
            .attr("class", "variable-text-group")
            .attr("transform", (d, i) => `translate(${vis.vertices[i].x},${vis.vertices[i].y})`);

        // Add labels
        textGroups.each(function(d, i) {
            const group = d3.select(this);
            
            const words = d.label
                .replace(" Score", "")
                .split(" ")
                .map(word => word.charAt(0).toUpperCase() + word.slice(1));
            
            const lineHeight = 1.2;
            
            words.forEach((word, j) => {
                group.append("text")
                    .attr("class", "variable-label")
                    .attr("x", 0)
                    .attr("y", (j - (words.length - 1)/2) * (lineHeight * 12))
                    .attr("text-anchor", "middle")
                    .attr("dominant-baseline", "middle")
                    .style("font-size", "12px")
                    .style("fill", vis.colors.textDefault)
                    .style("pointer-events", "none")
                    .text(word);
            });
        });

        // Add tooltip div if it doesn't exist
        vis.tooltip = d3.select("body").append("div")
            .attr("class", "hexagon-tooltip")
            .style("opacity", 0);

        // Updated format metric name function
        function formatMetricName(name) {
            return name
                .replace('scores_', '')  // Remove 'scores_' prefix
                .replace('score_', '')   // Remove 'score_' prefix
                .split('_')
                .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                .join(' ') + ' Score';  // Add 'Score' as suffix
        }

        // Store metric data with both position and name
        vis.metricData = vis.variables.map((metric, i) => ({
            name: metric.name,
            x: vis.vertices[i].x,
            y: vis.vertices[i].y
        }));

        // Add metric descriptions
        vis.metricDescriptions = {
            'scores_overall': 'A comprehensive measurement of the overall performance and quality of the university.',
            'scores_teaching': 'A comprehensive measurement of the learning environment of the university. Aspects considered include teaching reputation, staff-to-student ratio, attractiveness to graduates, teaching effectiveness, and institutional income.',
            'scores_research': 'A comprehensive measurement of the research environment of the university. Aspects considered include research reputation, income, and productivity.',
            'scores_citations': 'A comprehensive measurement of the research quality of the university. Aspects considered include research impact, strength, and excellence.',
            'scores_international_outlook': 'A comprehensive measurement of the ability of a university to attract people from all over the world. Aspects considered include proportion of international staff and students, as well as international collaboration.',
            'scores_industry_income': 'A comprehensive measurement of the ability of a university to help with industrial development. Aspects considered include how much research income it earns from industry and the extent to which businesses are willing to pay for its research.'
        };

        // Update circle creation to use the new data structure
        vis.circlesGroup.selectAll(".variable-circle")
            .data(vis.metricData)  // Use the new data structure
            .join("circle")
            .attr("cx", d => d.x)
            .attr("cy", d => d.y)
            .attr("r", circleRadius)
            .style("fill", vis.colors.circleFillDefault)
            .style("stroke", "none")
            .style("cursor", "pointer")
            .on("mouseover", function(event, d) {
                const formattedName = formatMetricName(d.name);
                
                vis.tooltip
                    .style("opacity", 1)
                    .html(`<div class="metric-name">${formattedName}</div>
                          <div class="metric-description">${vis.metricDescriptions[d.name]}</div>`)
                    .style("left", (event.pageX + 10) + "px")
                    .style("top", (event.pageY - 10) + "px");
            })
            .on("mousemove", function(event) {
                vis.tooltip
                    .style("left", (event.pageX + 10) + "px")
                    .style("top", (event.pageY - 10) + "px");
            })
            .on("mouseout", function() {
                vis.tooltip.style("opacity", 0);
            });

        this.updateHexagonSelection();
    }

    initPlot() {
        const vis = this;
        console.log("Scatterplot Debug: Starting initPlot");
        
        // Update the plot colors to include a darker, translucent blue
        vis.plotColors = {
            darkGrey: "#4a4a4a",
            lightBlue: "rgba(52, 152, 219, 0.6)",  // Changed to darker blue with 0.6 opacity
            darkBlue: "#3498db"
        };

        // Update circle radius
        vis.circleRadius = 6;

        // Get container dimensions
        const containerWidth = vis.plotContainer.node().getBoundingClientRect().width;
        const containerHeight = window.innerHeight * 0.8;

        // Calculate size for square plot
        const size = Math.min(containerWidth, containerHeight);

        // Update margins
        vis.margin = {
            top: 100,
            right: 40,
            bottom: 50,
            left: 125
        };

        // Set width and height
        vis.width = size - vis.margin.left - vis.margin.right;
        vis.height = size - vis.margin.top - vis.margin.bottom;

        // Remove existing SVG if it exists
        vis.plotContainer.select("svg").remove();

        // Create new SVG
        vis.svg = vis.plotContainer.append("svg")
            .attr("width", "100%")
            .attr("height", vis.height + vis.margin.top + vis.margin.bottom)
            .style("max-width", "100%")
            .style("display", "block")
            .style("margin", "auto")
            .append("g")
            .attr("transform", `translate(${vis.margin.left},${vis.margin.top})`);

        // Initialize scales
        vis.x = d3.scaleLinear().range([0, vis.width]);
        vis.y = d3.scaleLinear().range([vis.height, 0]);

        // Initialize axes
        vis.xAxis = d3.axisBottom(vis.x).ticks(5).tickSize(10);
        vis.yAxis = d3.axisLeft(vis.y).ticks(5).tickSize(10);

        // Add axes groups
        vis.xAxisGroup = vis.svg.append("g")
            .attr("class", "x-axis")
            .attr("transform", `translate(0,${vis.height})`)
            .style("font-size", "14px");
        
        vis.yAxisGroup = vis.svg.append("g")
            .attr("class", "y-axis")
            .style("font-size", "14px");

        // Add axis labels
        vis.svg.append("text")
            .attr("class", "x-axis-label")
            .attr("x", vis.width / 2)
            .attr("y", vis.height + 40)
            .style("text-anchor", "middle")
            .text(vis.selectedVariables[1].label);

        vis.svg.append("text")
            .attr("class", "y-axis-label")
            .attr("transform", "rotate(-90)")
            .attr("x", -vis.height / 2)
            .attr("y", -60)
            .style("text-anchor", "middle")
            .text(vis.selectedVariables[0].label);

        // Add tooltip if it doesn't exist
        if (!vis.plotTooltip) {
            vis.plotTooltip = d3.select("body").append("div")
                .attr("class", "plot-tooltip")
                .style("opacity", 0)
                .style("position", "absolute")
                .style("background-color", "rgba(255, 255, 255, 0.9)")
                .style("padding", "10px")
                .style("border", "1px solid #ddd")
                .style("border-radius", "4px")
                .style("pointer-events", "none")
                .style("font-size", "12px")
                .style("box-shadow", "0 2px 4px rgba(0,0,0,0.1)")
                .style("z-index", "10");
        }

        // Call render to draw the points
        vis.render();
    }

    initYearSlider() {
        const vis = this;
        console.log("Scatterplot Debug: Initializing year slider");

        // Clear existing content
        vis.sliderContainer.selectAll("*").remove();

        // Create slider
        vis.slider = vis.sliderContainer.append("input")
            .attr("type", "range")
            .attr("min", vis.yearRange.min)
            .attr("max", vis.yearRange.max)
            .attr("value", vis.selectedYear)
            .attr("step", 1)
            .style("width", "100%")
            .style("margin", "10px 0")
            .on("input", function() {
                vis.selectedYear = +this.value;
                console.log("Scatterplot Debug: Year changed to:", vis.selectedYear);
                vis.updateTitle();
                vis.render();
            });

        // Add year labels
        const labelContainer = vis.sliderContainer.append("div")
            .style("display", "flex")
            .style("justify-content", "space-between")
            .style("width", "100%")
            .style("margin", "0 auto")
            .style("padding", "0 0px");

        // Add year markers
        d3.range(vis.yearRange.min, vis.yearRange.max + 1).forEach(year => {
            labelContainer.append("span")
                .style("font-size", "14px") 
                .style("color", "#666")
                .text(year);
        });

        console.log("Scatterplot Debug: Slider elements created:", {
            slider: vis.slider.node(),
            labelContainer: labelContainer.node()
        });
    }

    selectVariables(variables) {
        const vis = this;
        const sorted = variables.sort((a, b) => a.priority - b.priority);
        this.selectedVariables = sorted;
        
        // Update hexagon selection
        this.updateHexagonSelection();
        
        // Render with transitions
        this.render();
    }

    updateHexagonSelection() {
        const vis = this;
        
        // Reset all lines
        vis.linesGroup.selectAll(".variable-line")
            .style("stroke", "#cccccc")
            .style("stroke-width", 5)
            .style("opacity", 0.5);

        // Reset all circles and text
        vis.circlesGroup.selectAll(".variable-circle")
            .style("fill", vis.colors.circleFillDefault)
            .style("stroke", "none");

        vis.textGroup.selectAll(".variable-label")
            .style("fill", vis.colors.textDefault);

        // Highlight selected line and move to front within lines group
        const selectedLine = vis.linesGroup.selectAll(".variable-line")
            .filter(d => 
                (d.variables[0] === vis.selectedVariables[0] && d.variables[1] === vis.selectedVariables[1]) ||
                (d.variables[0] === vis.selectedVariables[1] && d.variables[1] === vis.selectedVariables[0])
            );
        
        selectedLine
            .raise()
            .style("stroke", "#3498db")
            .style("stroke-width", 7)
            .style("opacity", 1)  // Selected line has full opacity
            .each(function() {
                // Store the selected line element
                vis.selectedLine = this;
                // Move to front within the lines group only
                this.parentNode.appendChild(this);
            });

        // Highlight selected circles and their text
        const selectedIndices = vis.variables.map((v, i) => 
            (v === vis.selectedVariables[0] || v === vis.selectedVariables[1]) ? i : -1
        ).filter(i => i !== -1);

        // Update selected circles
        vis.circlesGroup.selectAll(".variable-circle")
            .filter((d, i) => selectedIndices.includes(i))
            .style("fill", vis.colors.circleFillHighlight)
            .style("stroke", "none");

        // Update text color for selected circles
        vis.textGroup.selectAll(".variable-text-group")
            .each(function(d, i) {
                if (selectedIndices.includes(i)) {
                    d3.select(this).selectAll(".variable-label")
                        .style("fill", vis.colors.textHighlight);
                }
            });
    }

    updateTitle() {
        const vis = this;
        // Use the existing title element
        d3.select("#page6 .content-wrapper .main-title")
            .transition()
            .duration(1000)
            .text(`${vis.selectedVariables[1].label} vs. ${vis.selectedVariables[0].label} (${vis.selectedYear})`);
    }

    render() {
        const vis = this;
        console.log("Scatterplot Debug: Starting render");

        // Calculate domains for both axes
        const xDomain = vis.calculateAxisDomain(vis.selectedVariables[1].name);
        const yDomain = vis.calculateAxisDomain(vis.selectedVariables[0].name);

        // Update scales with new domains
        vis.x.domain(xDomain);
        vis.y.domain(yDomain);
        
        // Update axes with transition
        vis.xAxisGroup
            .transition()
            .duration(1000)
            .call(vis.xAxis);
        
        vis.yAxisGroup
            .transition()
            .duration(1000)
            .call(vis.yAxis);

        // Filter data for selected year
        const yearData = vis.data.filter(d => d.year === vis.selectedYear);

        // Update points
        const points = vis.svg.selectAll(".point")
            .data(yearData);
        
        // Exit
        if (vis.isInitialRender) {
            points.exit().remove();
        } else {
            points.exit()
                .transition()
                .duration(1000)
                .attr("r", 0)
                .remove();
        }
        
        // Enter - add new points with updated color
        const pointsEnter = points.enter()
            .append("circle")
            .attr("class", "point")
            .attr("r", vis.circleRadius)
            .attr("fill", vis.plotColors.lightBlue)  // Using the new translucent color
            .style("cursor", "pointer");
        
        // Update + Enter
        if (vis.isInitialRender) {
            // 初始渲染时直接设置位置
            points.merge(pointsEnter)
                .attr("cx", d => vis.x(d[vis.selectedVariables[1].name]))
                .attr("cy", d => vis.y(d[vis.selectedVariables[0].name]))
                .attr("r", vis.circleRadius);
            
            // 初始渲染完成后更新标志
            vis.isInitialRender = false;
        } else {
            // 年份更新时使用过渡动画
            points.merge(pointsEnter)
                .transition()
                .duration(1000)
                .attr("cx", d => vis.x(d[vis.selectedVariables[1].name]))
                .attr("cy", d => vis.y(d[vis.selectedVariables[0].name]))
                .attr("r", vis.circleRadius);
        }

        // Add interactive events (after transition)
        vis.svg.selectAll(".point")
            .on("mouseover", function(event, d) {
                // 将当前元素移到最上层
                this.parentNode.appendChild(this);
                
                d3.select(this)
                    .attr("r", vis.circleRadius * 1.5)
                    .attr("stroke", vis.plotColors.darkBlue)
                    .attr("stroke-width", 2)
                    .attr("fill", vis.plotColors.darkBlue);

                // Show tooltip with university information
                vis.plotTooltip
                    .style("opacity", 1)
                    .style("left", (event.pageX + 10) + "px")
                    .style("top", (event.pageY - 10) + "px")
                    .html(`
                        <strong>${d.name}</strong><br>
                        ${vis.selectedVariables[0].label}: ${d[vis.selectedVariables[0].name].toFixed(1)}<br>
                        ${vis.selectedVariables[1].label}: ${d[vis.selectedVariables[1].name].toFixed(1)}
                    `);
            })
            .on("mousemove", function(event) {
                // Update tooltip position as mouse moves
                vis.plotTooltip
                    .style("left", (event.pageX + 10) + "px")
                    .style("top", (event.pageY - 10) + "px");
            })
            .on("mouseout", function() {
                d3.select(this)
                    .attr("r", vis.circleRadius)
                    .attr("stroke", null)  // 移除边界
                    .attr("stroke-width", null)  // 移除边界宽度
                    .attr("fill", vis.plotColors.lightBlue);

                // Hide tooltip
                vis.plotTooltip.style("opacity", 0);
            });

        // Update axis labels with transition
        vis.svg.select(".x-axis-label")
            .transition()
            .duration(1000)
            .text(vis.selectedVariables[1].label);
        
        vis.svg.select(".y-axis-label")
            .transition()
            .duration(1000)
            .text(vis.selectedVariables[0].label);

        // Update title
        vis.updateTitle();

        // Update any font-family styles in the visualization
        vis.svg.selectAll("text")
            .style("font-family", "sans-serif");

        vis.svg.select(".x-axis-label")
            .style("font-family", "sans-serif");

        vis.svg.select(".y-axis-label")
            .style("font-family", "sans-serif");

        // Update tooltip styles
        vis.tooltip
            .style("font-family", "sans-serif");

        vis.plotTooltip
            .style("font-family", "sans-serif");
    }

    // Add method to calculate axis domain
    calculateAxisDomain(metric) {
        const vis = this;
        
        // Get minimum value for this metric across all years
        const minValue = d3.min(vis.data, d => d[metric]);
        
        // Find largest multiple of 10 less than minValue
        const minDomain = Math.floor(minValue / 10) * 10;
        
        return [minDomain, 100];
    }

    // 当切换变量时重置初始渲染标志
    updateVariables(variables) {
        this.selectedVariables = variables;
        this.isInitialRender = true;  // 重置标志
        this.render();
    }

    initHexagon() {
        const vis = this;
        
        // Create hexagon container
        const hexagonContainer = vis.leftPanel.append("div")
            .attr("class", "hexagon-container")
            .style("height", `${vis.hexagonHeight}px`)
            .style("position", "relative");

        // Create SVG for hexagon
        const hexagonSvg = hexagonContainer.append("svg")
            .attr("width", "100%")
            .attr("height", "100%")
            .style("display", "block");

        // Create group for hexagon elements
        const hexagonGroup = hexagonSvg.append("g")
            .attr("transform", `translate(${vis.hexagonHeight/2}, ${vis.hexagonHeight/2})`);

        // Calculate dimensions
        const radius = vis.hexagonHeight * 0.35;
        const centerX = 0;
        const centerY = 0;
        const angleStep = (2 * Math.PI) / vis.variables.length;

        // Add lines (spokes)
        const lines = hexagonGroup.selectAll("line")
            .data(vis.variables)
            .enter()
            .append("line")
            .attr("class", "spoke")
            .attr("x1", centerX)
            .attr("y1", centerY)
            .attr("x2", (d, i) => centerX + radius * Math.cos(angleStep * i - Math.PI / 2))
            .attr("y2", (d, i) => centerY + radius * Math.sin(angleStep * i - Math.PI / 2))
            .style("stroke", "#999")
            .style("stroke-width", 2)
            .style("cursor", "pointer")
            .style("transition", "stroke 0.3s ease, stroke-width 0.3s ease")
            .on("mouseover", function() {
                d3.select(this)
                    .style("stroke", "#3498db")
                    .style("stroke-width", 3);
            })
            .on("mouseout", function() {
                d3.select(this)
                    .style("stroke", "#999")
                    .style("stroke-width", 2);
            })
            .on("click", handleLineClick);

        // Add circles at vertices
        const circles = hexagonGroup.selectAll("circle")
            .data(vis.variables)
            .enter()
            .append("circle")
            .attr("class", "vertex")
            .attr("cx", (d, i) => centerX + radius * Math.cos(angleStep * i - Math.PI / 2))
            .attr("cy", (d, i) => centerY + radius * Math.sin(angleStep * i - Math.PI / 2))
            .attr("r", 8)
            .style("fill", "#3498db")
            .style("stroke", "white")
            .style("stroke-width", 2);

        // Add labels
        const labels = hexagonGroup.selectAll("text")
            .data(vis.variables)
            .enter()
            .append("text")
            .attr("x", (d, i) => centerX + (radius + 20) * Math.cos(angleStep * i - Math.PI / 2))
            .attr("y", (d, i) => centerY + (radius + 20) * Math.sin(angleStep * i - Math.PI / 2))
            .style("text-anchor", "middle")
            .style("dominant-baseline", "middle")
            .style("font-size", "12px")
            .text(d => d.label);

        // Handle line click
        function handleLineClick(event, d) {
            if (vis.selectedVariables.length === 2) {
                vis.selectedVariables = [d, vis.selectedVariables[0]];
            }
            vis.updateVis();
        }
    }
}

// Add these styles to ensure proper layout and slider appearance
const styles = `
    #${vis.containerId} {
        width: 100%;
        height: 100vh;
        margin: 0;
        padding: 0;
        overflow: hidden;
    }

    .slider-container input[type="range"] {
        -webkit-appearance: none;
        width: 100%;
        height: 8px;
        border-radius: 4px;
        background: #ddd;
        outline: none;
        margin: 10px 0;
    }

    .slider-container input[type="range"]::-webkit-slider-thumb {
        -webkit-appearance: none;
        width: 16px;
        height: 16px;
        border-radius: 50%;
        background: #3498db;
        cursor: pointer;
    }

    .slider-container input[type="range"]::-moz-range-thumb {
        width: 16px;
        height: 16px;
        border-radius: 50%;
        background: #3498db;
        cursor: pointer;
    }

    /* Hide any existing year filter dropdowns */
    select[id*="year"] {
        display: none !important;
    }

    .point {
        transition: fill 0.3s ease;
    }
    
    .x-axis path,
    .y-axis path,
    .x-axis line,
    .y-axis line {
        transition: all 0.3s ease;
    }
    
    .x-axis text,
    .y-axis text {
        transition: all 0.3s ease;
    }

    .spoke {
        transition: stroke 0.3s ease, stroke-width 0.3s ease;
    }
`;

// Add the styles to the document
const styleSheet = document.createElement("style");
styleSheet.textContent = styles;
document.head.appendChild(styleSheet);
