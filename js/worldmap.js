// WorldMap class for interactive globe visualization
class WorldMap {
    constructor(containerId, data) {
        this.containerId = containerId;
        this.data = data;
        this.container = document.getElementById(containerId);
        
        // Get available years from data
        this.availableYears = [...new Set(this.data.map(d => d.year))].sort();
        this.selectedYear = this.availableYears[this.availableYears.length - 1]; // Default to most recent year
        
        // Set up dimensions
        this.margin = { top: 20, right: 20, bottom: 20, left: 20 };
        this.width = this.container.clientWidth - this.margin.left - this.margin.right;
        this.height = this.container.clientHeight - this.margin.top - this.margin.bottom;
        
        // Define a softer red color palette that's visually comfortable
        this.colors = ["#fff5f0", "#fee0d2", "#fcbba1", "#fc9272", "#fb6a4a", "#ef3b2c", "#cb181d", "#a50f15", "#67000d"];
        
        // Process data by location
        this.processData();
        
        // Initialize visualization
        this.initVis();
    }
    
    processData() {
        const vis = this;
        
        // Filter data by selected year
        const yearData = vis.data.filter(d => d.year === vis.selectedYear);
        
        // Group universities by location and calculate metrics
        vis.locationData = {};
        
        yearData.forEach(d => {
            console.log(`Processing university: ${d.name}, Year: ${d.year}`); // Log each university's year
            if (!d.location) return;
            
            if (!vis.locationData[d.location]) {
                vis.locationData[d.location] = {
                    name: d.location,
                    universities: [],
                    scores_overall: 0,
                    scores_teaching: 0,
                    scores_international_outlook: 0,
                    scores_industry_income: 0,
                    scores_research: 0,
                    scores_citations: 0,
                    count: 0
                };
            }
            
            // Add university to location
            vis.locationData[d.location].universities.push(d.name);
            
            // Sum up scores
            vis.locationData[d.location].scores_overall += d.scores_overall || 0;
            vis.locationData[d.location].scores_teaching += d.scores_teaching || 0;
            vis.locationData[d.location].scores_international_outlook += d.scores_international_outlook || 0;
            vis.locationData[d.location].scores_industry_income += d.scores_industry_income || 0;
            vis.locationData[d.location].scores_research += d.scores_research || 0;
            vis.locationData[d.location].scores_citations += d.scores_citations || 0;
            vis.locationData[d.location].count++;
        });
        
        // Convert to array for easier processing
        vis.locationArray = Object.values(vis.locationData);
        
        // Find min and max values for color scale
        vis.minScore = d3.min(vis.locationArray, d => d.scores_overall);
        vis.maxScore = d3.max(vis.locationArray, d => d.scores_overall);
        
        // Calculate average score for reference
        vis.avgScore = d3.mean(vis.locationArray, d => d.scores_overall);
        
        console.log(`Year ${vis.selectedYear} data:`, vis.locationArray);
        console.log(`Year ${vis.selectedYear} - Min score: ${vis.minScore}, Max score: ${vis.maxScore}, Avg score: ${vis.avgScore}`);
        
        // Create a lookup table for country data
        this.wrangleData();
    }
    
    wrangleData() {
        const vis = this;
        
        // Create a lookup table for country data
        vis.countryInfo = {};
        
        // Create a map for country name lookup
        vis.countryNameMap = {
            "United States of America": "United States",
            "United Kingdom": "United Kingdom",
            "Russian Federation": "Russia",
            "Korea": "South Korea",
            "Democratic Republic of the Congo": "Congo",
            "Republic of the Congo": "Congo",
            "United Republic of Tanzania": "Tanzania",
            "Myanmar": "Myanmar",
            "Viet Nam": "Vietnam",
            "Lao PDR": "Laos",
            "Czech Republic": "Czech Republic",
            "Slovakia": "Slovakia",
            "Bosnia and Herzegovina": "Bosnia and Herzegovina",
            "North Macedonia": "Macedonia",
            "Dominican Republic": "Dominican Republic",
            "Brunei Darussalam": "Brunei",
            "Timor-Leste": "East Timor",
            "Solomon Islands": "Solomon Islands",
            "Cabo Verde": "Cape Verde"
        };
    }

    initVis() {
        const vis = this;
        
        // Clear any existing map before creating a new one
        d3.select("#" + vis.containerId).select("svg").remove(); // Remove existing SVG if it exists
        
        // Create SVG drawing area
        vis.svg = d3.select("#" + vis.containerId)
            .append("svg")
            .attr("width", vis.width + vis.margin.left + vis.margin.right)
            .attr("height", vis.height + vis.margin.top + vis.margin.bottom)
            .append("g")
            .attr("transform", `translate(130, 20)`);

    
        // Create tooltip
        vis.tooltip = d3.select("#worldmap-tooltip");
        
        // Create left panel for country details
        // First, check if the left panel already exists
        let leftPanelExists = d3.select("#page4 .content-wrapper .left-panel").size() > 0;
        
        if (!leftPanelExists) {
            // Create the left panel if it doesn't exist
            vis.leftPanel = d3.select("#page4 .content-wrapper")
                .append("div")
                .attr("class", "left-panel")
                .style("opacity", "0");  // Initially hidden
            
            // Add panel title
            vis.leftPanel.append("h2")
                .attr("class", "panel-title");
            
            // Add score container
            vis.scoreContainer = vis.leftPanel.append("div")
                .attr("class", "score-container");
        } else {
            // If it exists, just select it
            vis.leftPanel = d3.select("#page4 .content-wrapper .left-panel");
            vis.scoreContainer = vis.leftPanel.select(".score-container");
        }
        
        // Create a custom power scale to better differentiate between high values
        // Using a square root scale helps to spread out the lower values while still showing differences at the top
        vis.colorScale = d3.scalePow()
            .exponent(0.3) // Using an exponent less than 1 gives more visual space to lower values
            .domain([0, vis.maxScore])
            .range([0, 1]);
        
        // Create a color interpolator that maps the normalized values to colors
        vis.colorInterpolator = d3.scaleQuantize()
            .domain([0, 1])
            .range(vis.colors);
        
        // Create projection
        vis.projection = d3.geoOrthographic()
            .translate([vis.width / 2, vis.height / 2])
            .scale(Math.min(vis.width, vis.height) * 0.4);
        
        // Create path generator
        vis.path = d3.geoPath()
            .projection(vis.projection);
        
        // Create legend first (so it appears behind the globe)
        vis.createLegend();
        
        // Modify the page title - make it smaller and move it to the center top
        d3.select("#page4 .main-title")
            .text("")  // Clear the text as we'll add it in createYearSelector
            .style("font-size", "36px")
            .style("position", "absolute")
            .style("top", "20px")
            .style("left", "50%")
            .style("transform", "translateX(-50%)")
            .style("margin", "0")
            .style("text-align", "center")
            .style("width", "100%");
        
        // Create the year selector integrated with the title
        vis.createYearSelector();
        
        // Load world map data
        d3.json("https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json")
            .then(function(geoData) {
                vis.geoData = geoData;
                
                // Convert TopoJSON to GeoJSON
                vis.world = topojson.feature(vis.geoData, vis.geoData.objects.countries).features;
                
                // Create a group for the entire globe
                vis.globeGroup = vis.svg.append("g")
                    .attr("class", "globe-group");
                
                // Add sphere for the globe (ocean)
                vis.globeGroup.append("path")
                    .datum({type: "Sphere"})
                    .attr("class", "ocean")
                    .attr('fill', '#ADD8E6')  // Light blue for ocean
                    .attr("stroke", "rgba(129,129,129,0.35)")
                    .attr("d", vis.path);
                
                // Add graticule (grid lines)
                const graticule = d3.geoGraticule();
                vis.globeGroup.append("path")
                    .datum(graticule)
                    .attr("class", "graticule")
                    .attr("fill", "none")
                    .attr("stroke", "rgba(129,129,129,0.35)")
                    .attr("stroke-width", 0.5)
                    .attr("d", vis.path);
                
                // Draw countries
                vis.countries = vis.globeGroup.selectAll(".country")
                    .data(vis.world)
                    .enter()
                    .append("path")
                    .attr('class', 'country')
                    .attr("d", vis.path)
                    .attr("fill", d => {
                        // Find matching location in our data
                        const countryName = d.properties.name;
                        let matchedLocation = null;
                        
                        // Try to match with our location data
                        Object.values(vis.locationData).forEach(location => {
                            if (location.name === countryName || 
                                location.name.includes(countryName) || 
                                countryName.includes(location.name) ||
                                (vis.countryNameMap[countryName] && location.name.includes(vis.countryNameMap[countryName]))) {
                                matchedLocation = location;
                            }
                        });
                        
                        if (matchedLocation) {
                            // Apply the power scale to get a normalized value, then map to color
                            const normalizedValue = vis.colorScale(matchedLocation.scores_overall);
                            return vis.colorInterpolator(normalizedValue);
                        } else {
                            return "#f7f4f9"; // Default lightest color
                        }
                    })
                    .attr("stroke", "#fff")
                    .attr("stroke-width", 0.5)
                    .on("mouseover", function(event, d) {
                        // Find matching location in our data
                        const countryName = d.properties.name;
                        let matchedLocation = null;
                        
                        // Try to match with our location data
                        Object.values(vis.locationData).forEach(location => {
                            if (location.name === countryName || 
                                location.name.includes(countryName) || 
                                countryName.includes(location.name) ||
                                (vis.countryNameMap[countryName] && location.name.includes(vis.countryNameMap[countryName]))) {
                                matchedLocation = location;
                            }
                        });
                        
                        // Highlight country
                        d3.select(this)
                            .attr("stroke", "#000")
                            .attr("stroke-width", 1.5);
                        
                        // Show tooltip
                        if (matchedLocation) {
                            // Get normalized value for reference
                            const score = matchedLocation.scores_overall;
                            const normalizedValue = vis.colorScale(score);
                            const percentOfMax = (score / vis.maxScore * 100).toFixed(1);
                            
                            vis.tooltip
                                .style("opacity", 1)
                                .style("left", (event.pageX + 10) + "px")
                                .style("top", (event.pageY + 10) + "px")
                                .html(`
                                    <h3>${matchedLocation.name}</h3>
                                    <p>Universities: ${matchedLocation.universities.length}</p>
                                    <p>Overall Score: ${matchedLocation.scores_overall.toFixed(0)}</p>
                                    <p>Percent of Max: ${percentOfMax}%</p>
                                `);
                        } else {
                            vis.tooltip
                                .style("opacity", 1)
                                .style("left", (event.pageX + 10) + "px")
                                .style("top", (event.pageY + 10) + "px")
                                .html(`
                                    <h3>${countryName}</h3>
                                    <p>No university data available</p>
                                `);
                        }
                    })
                    .on("mouseout", function() {
                        // Reset highlight
                        d3.select(this)
                            .attr("stroke", "#fff")
                            .attr("stroke-width", 0.5);
                        
                        // Hide tooltip
                        vis.tooltip.style("opacity", 0);
                    })
                    .on("click", function(event, d) {
                        // Find matching location in our data
                        const countryName = d.properties.name;
                        let matchedLocation = null;

                        // Log the clicked country name
                        console.log(`Clicked country: ${countryName}`);

                        // Try to match with our location data
                        Object.values(vis.locationData).forEach(location => {
                            if (location.name === countryName || 
                                location.name.includes(countryName) || 
                                countryName.includes(location.name) ||
                                (vis.countryNameMap[countryName] && location.name.includes(vis.countryNameMap[countryName]))) {
                                matchedLocation = location;
                            }
                        });

                        // Log the matched location data
                        if (matchedLocation) {
                            console.log(`Matched location data:`, matchedLocation);

                            // Update the bar chart with top 5 universities
                            const topUniversities = matchedLocation.universities.slice(0, 5);
                            console.log(`Top universities for ${countryName}:`, topUniversities);
                            barChart.updateChart(matchedLocation.name); // Pass the country name instead of universities

                            // Update the radar chart with the top university
                            const topUniversity = matchedLocation.universities[0];
                            console.log(`Top university for radar chart:`, topUniversity);
                            radarChart.updateChart(topUniversity); // Assuming the first university is the top one
                        } else {
                            console.warn(`No matching location found for ${countryName}`);
                        }
                    });
                
                // Make the globe draggable/rotatable
                vis.makeGlobeDraggable();
            })
            .catch(function(error) {
                console.error("Error loading world data:", error);
            });
    }
    
    createLegend() {
        const vis = this;
        
        // Create legend group - Position it at the bottom of the visualization
        vis.legend = vis.svg.append("g")
            .attr('class', 'legend')
            .attr('transform', `translate(${vis.width / 2 - 100}, ${vis.height - 30})`);
        
        // Create sample points for the legend
        const samplePoints = [];
        for (let i = 0; i <= 8; i++) {
            samplePoints.push(vis.maxScore * Math.pow(i/8, 1/0.3));
        }
        
        // Create legend scale with power scale
        const legendScale = d3.scaleLinear()
            .domain([0, vis.maxScore])
            .range([0, 200]);
        
        // Create legend axis with custom tick values
        const legendAxis = d3.axisBottom(legendScale)
            .tickValues([0, Math.round(vis.maxScore * 0.1), Math.round(vis.maxScore * 0.25), 
                         Math.round(vis.maxScore * 0.5), Math.round(vis.maxScore)])
            .tickFormat(d3.format(",d"))
            .tickSize(0);
        
        // Create legend rectangles
        vis.legend.selectAll(".legend-rect")
            .data(vis.colors)
            .enter()
            .append("rect")
            .attr("class", "legend-rect")
            .attr("x", (d, i) => i * (200 / vis.colors.length))
            .attr("width", 200 / vis.colors.length)
            .attr("height", 10)
            .attr("fill", d => d);
        
        // Add axis to legend with a class
        vis.legend.append("g")
            .attr("class", "legend-axis")
            .attr("transform", "translate(0,10)")
            .call(legendAxis)
            .selectAll("text")
            .style("font-size", "10px");
    }
    
    makeGlobeDraggable() {
        const vis = this;
        
        let m0, o0;
        
        // Apply drag behavior to the entire globe group
        vis.globeGroup.call(
            d3.drag()
                .on("start", function(event) {
                    // Store initial mouse position and projection rotation
                    m0 = [event.x, event.y];
                    let lastRotationParams = vis.projection.rotate();
                    o0 = [-lastRotationParams[0], -lastRotationParams[1]];
                })
                .on("drag", function(event) {
                    if (m0) {
                        let m1 = [event.x, event.y],
                            o1 = [o0[0] + (m0[0] - m1[0]) / 4, o0[1] + (m1[1] - m0[1]) / 4];
                        vis.projection.rotate([-o1[0], -o1[1]]);
                    }
                    
                    // Update all paths with the new projection
                    vis.globeGroup.selectAll("path").attr("d", vis.path);
                })
        );
    }

    // Method to update the left panel with location information
    updateLeftPanel(location) {
        const vis = this;
        
        // Update the panel title
        vis.leftPanel.select(".panel-title")
            .text(location.name);
        
        // Clear previous content
        vis.scoreContainer.html("");
        
        // Create a score bar for each metric
        const metrics = [
            { name: "Teaching", score: location.scores_teaching, color: "#fb6a4a" },
            { name: "Research", score: location.scores_research, color: "#ef3b2c" },
            { name: "Citations", score: location.scores_citations, color: "#cb181d" },
            { name: "Industry Income", score: location.scores_industry_income, color: "#a50f15" },
            { name: "International Outlook", score: location.scores_international_outlook, color: "#67000d" }
        ];
        
        // Add university count
        vis.scoreContainer.append("div")
            .attr("class", "university-count")
            .style("margin-bottom", "15px")
            .style("font-size", "18px")
            .style("font-weight", "bold")
            .html(`<span style="color: #333;">Universities:</span> <span style="color: #cb181d;">${location.universities.length}</span>`);
        
        // Add overall score
        vis.scoreContainer.append("div")
            .attr("class", "overall-score")
            .style("margin-bottom", "15px")
            .style("font-size", "18px")
            .style("font-weight", "bold")
            .html(`<span style="color: #333;">Overall Score:</span> <span style="color: #cb181d;">${location.scores_overall.toFixed(0)}</span>`);
        
        // Add percent of max
        const percentOfMax = (location.scores_overall / vis.maxScore * 100).toFixed(1);
        vis.scoreContainer.append("div")
            .attr("class", "percent-max")
            .style("margin-bottom", "20px")
            .style("font-size", "18px")
            .style("font-weight", "bold")
            .html(`<span style="color: #333;">Percent of Max:</span> <span style="color: #cb181d;">${percentOfMax}%</span>`);
        
        // Add a title for the detailed scores
        vis.scoreContainer.append("h3")
            .style("margin-top", "0")
            .style("margin-bottom", "10px")
            .style("font-size", "18px")
            .text("Detailed Scores");
        
        // Create a container for the score bars
        const scoreBarContainer = vis.scoreContainer.append("div")
            .attr("class", "score-bars")
            .style("display", "flex")
            .style("flex-direction", "column")
            .style("gap", "10px");
        
        // Add each metric as a score bar
        metrics.forEach(metric => {
            const scoreBar = scoreBarContainer.append("div")
                .attr("class", "score-bar")
                .style("display", "flex")
                .style("flex-direction", "column")
                .style("gap", "3px");
            
            // Add the metric name and score
            scoreBar.append("div")
                .attr("class", "metric-name")
                .style("display", "flex")
                .style("justify-content", "space-between")
                .html(`
                    <span>${metric.name}</span>
                    <span>${metric.score.toFixed(0)}</span>
                `);
            
            // Add the bar
            const barContainer = scoreBar.append("div")
                .attr("class", "bar-container")
                .style("width", "100%")
                .style("height", "10px")
                .style("background-color", "#f0f0f0")
                .style("border-radius", "5px")
                .style("overflow", "hidden");
            
            // Calculate the width of the bar based on the score
            const maxScore = d3.max(metrics, d => d.score);
            const barWidth = (metric.score / maxScore * 100).toFixed(0);
            
            // Add the colored bar
            barContainer.append("div")
                .attr("class", "bar")
                .style("width", `${barWidth}%`)
                .style("height", "100%")
                .style("background-color", metric.color)
                .style("border-radius", "5px");
        });
        
        // Force the panel to be visible
        vis.leftPanel
            .style("opacity", "1")
            .style("left", "30px")
            .style("top", "100px")
            .style("transform", "none")
            .style("z-index", "100");
    }

    // Add a render method to handle window resizing
    render() {
        const vis = this;
        
        // Update dimensions
        vis.width = vis.container.clientWidth - vis.margin.left - vis.margin.right;
        vis.height = vis.container.clientHeight - vis.margin.top - vis.margin.bottom;

        // Update SVG dimensions
        vis.svg
            .attr("width", vis.width + vis.margin.left + vis.margin.right)
            .attr("height", vis.height + vis.margin.top + vis.margin.bottom);

        // Update projection
        vis.projection
            .translate([vis.width / 2, vis.height / 2])
            .scale(Math.min(vis.width, vis.height) * 0.4);

        // Update all paths with new projection
        vis.svg.select(".ocean")
            .attr("d", vis.path);

        vis.svg.select(".graticule")
            .attr("d", vis.path);

        vis.svg.selectAll(".country")
            .attr("d", vis.path);

        // Update legend position if needed
        this.createLegend();
    }

    // Modify the createYearSelector method to improve the dropdown styling
    createYearSelector() {
        const vis = this;
        
        // First, remove the existing year selector if it exists
        d3.select(".year-selector-container").remove();
        
        // Update the main title to include the year
        const mainTitle = d3.select("#page4 .main-title");
        
        // Clear any existing content
        mainTitle.html("");
        
        // Add the static part of the title
        mainTitle.append("span")
            .text("Global University Rankings in ");
        
        // Create a container for the year selector that will be styled as part of the title
        const yearContainer = mainTitle.append("span")
            .attr("class", "year-selector-container")
            .style("position", "relative")
            .style("display", "inline-block");
        
        // Add the year as text with special styling
        const yearText = yearContainer.append("span")
            .attr("class", "selected-year")
            .text(vis.selectedYear)
            .style("color", "#cb181d")  // Use the same red as in your color scheme
            .style("font-weight", "bold")
            .style("cursor", "pointer")
            .style("border-bottom", "2px dotted #cb181d")
            .style("padding-bottom", "2px");
        
        // Add a small dropdown arrow that looks better
        yearContainer.append("span")
            .html(" &#9662;")  // Unicode for a down arrow
            .style("font-size", "0.7em")
            .style("color", "#cb181d")
            .style("position", "relative")
            .style("top", "-2px");
        
        // Create a dropdown for year selection with improved styling
        const dropdown = yearContainer.append("div")
            .attr("class", "year-dropdown")
            .style("position", "absolute")
            .style("top", "100%")
            .style("left", "50%")
            .style("transform", "translateX(-50%)")
            .style("background-color", "white")
            .style("border", "1px solid #eee")
            .style("border-radius", "8px")
            .style("box-shadow", "0 4px 15px rgba(0,0,0,0.1)")
            .style("z-index", "1000")
            .style("display", "none")  // Initially hidden
            .style("padding", "8px 0")
            .style("margin-top", "10px")
            .style("min-width", "120px")
            .style("max-height", "200px")
            .style("overflow-y", "auto")
            .style("text-align", "center");
        
        // Add a little arrow at the top of the dropdown
        dropdown.append("div")
            .style("position", "absolute")
            .style("top", "-8px")
            .style("left", "50%")
            .style("transform", "translateX(-50%)")
            .style("width", "0")
            .style("height", "0")
            .style("border-left", "8px solid transparent")
            .style("border-right", "8px solid transparent")
            .style("border-bottom", "8px solid white");
        
        // Add options for each year with improved styling
        vis.availableYears.forEach(year => {
            dropdown.append("div")
                .attr("class", "year-option")
                .text(year)
                .style("padding", "8px 15px")
                .style("cursor", "pointer")
                .style("transition", "all 0.2s ease")
                .style("color", year === vis.selectedYear ? "#cb181d" : "#333")
                .style("font-weight", year === vis.selectedYear ? "bold" : "normal")
                .style("font-size", "18px")
                .style("border-left", year === vis.selectedYear ? "3px solid #cb181d" : "3px solid transparent")
                .on("mouseover", function() {
                    d3.select(this)
                        .style("background-color", "#f8f8f8")
                        .style("color", "#cb181d");
                })
                .on("mouseout", function() {
                    d3.select(this)
                        .style("background-color", "white")
                        .style("color", year === vis.selectedYear ? "#cb181d" : "#333");
                })
                .on("click", function(event) {
                    const selectedYear = +d3.select(this).text();
                    vis.selectedYear = selectedYear;
                    
                    // Update the displayed year
                    yearText.text(selectedYear);
                    
                    // Hide the dropdown
                    dropdown.style("display", "none");
                    
                    // Update the visualization
                    vis.updateVisualization();
                    
                    // Prevent the event from bubbling up
                    if (event) event.stopPropagation();
                });
        });
        
        // Add a subtle separator between years
        dropdown.selectAll(".year-option:not(:last-child)")
            .style("border-bottom", "1px solid #f0f0f0");
        
        // Toggle dropdown when clicking on the year container
        yearContainer.on("click", function(event) {
            const isVisible = dropdown.style("display") === "block";
            dropdown.style("display", isVisible ? "none" : "block");
            
            // Prevent the event from bubbling up
            if (event) event.stopPropagation();
        });
        
        // Hide dropdown when clicking elsewhere
        d3.select("body").on("click", function() {
            dropdown.style("display", "none");
        });
    }

    // Modify the updateVisualization method to update the title
    updateVisualization() {
        const vis = this;
        
        // Process data for the new year
        vis.processData();
        
        // Update color scale with new min/max values
        vis.colorScale = d3.scalePow()
            .exponent(0.3)
            .domain([0, vis.maxScore])
            .range([0, 1]);
        
        // Update country colors
        vis.countries
            .attr("fill", d => {
                // Find matching location in our data
                const countryName = d.properties.name;
                let matchedLocation = null;
                
                // Try to match with our location data
                Object.values(vis.locationData).forEach(location => {
                    if (location.name === countryName || 
                        location.name.includes(countryName) || 
                        countryName.includes(location.name) ||
                        (vis.countryNameMap[countryName] && location.name.includes(vis.countryNameMap[countryName]))) {
                        matchedLocation = location;
                    }
                });
                
                if (matchedLocation) {
                    // Apply the power scale to get a normalized value, then map to color
                    const normalizedValue = vis.colorScale(matchedLocation.scores_overall);
                    return vis.colorInterpolator(normalizedValue);
                } else {
                    return "#f7f4f9"; // Default lightest color
                }
            });
        
        // Update legend with new max value
        vis.updateLegend();
        
        // Hide the left panel if it's visible
        vis.leftPanel.style("opacity", "0");
        
        // Update the year in the title
        d3.select(".selected-year").text(vis.selectedYear);
    }

    // Add a method to update the legend
    updateLegend() {
        const vis = this;
        
        // Update legend scale
        const legendScale = d3.scaleLinear()
            .domain([0, vis.maxScore])
            .range([0, 200]);
        
        // Update legend axis
        const legendAxis = d3.axisBottom(legendScale)
            .tickValues([0, Math.round(vis.maxScore * 0.1), Math.round(vis.maxScore * 0.25), 
                         Math.round(vis.maxScore * 0.5), Math.round(vis.maxScore)])
            .tickFormat(d3.format(",d"))
            .tickSize(0);
        
        // Update axis
        vis.legend.select(".legend-axis")
            .call(legendAxis)
            .selectAll("text")
            .style("font-size", "10px");
    }
}