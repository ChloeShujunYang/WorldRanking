class LineChart {
    constructor(containerId, data) {
        this.containerId = containerId;
        this.data = data;
        this.margin = { top: 80, right: 200, bottom: 60, left: 80 };
        this.width = 1200 - this.margin.left - this.margin.right;
        this.height = 600 - this.margin.top - this.margin.bottom;
        this.selectedMetric = 'scores_overall';
        this.selectedRankRange = '1-10';
        this.selectedUniversities = new Set();
        this.maxUniversities = 10;
        this.selectedUniversity = null;
        this.isExpanded = true;

        this.initVis();
    }

    initVis() {
        const vis = this;

        // Create container for both chart and info panel
        vis.container = d3.select(`#${vis.containerId}`)
            .style("display", "flex")
            .style("width", "100%")
            .style("height", "100%")
            .style("position", "relative");

        // Create selectors container with better positioning
        vis.selectorsContainer = vis.container.append("div")
            .attr("class", "selectors-container")
            .style("position", "absolute")
            .style("top", "10px")
            .style("left", "10px")
            .style("z-index", "10")
            .style("display", "flex")
            .style("gap", "40px")
            .style("align-items", "flex-start");

        // Create chart container
        vis.chartContainer = vis.container.append("div")
            .attr("class", "chart-container")
            .style("flex", "1")
            .style("transition", "width 0.3s ease")
            .style("margin-top", "70px");  // Increased top margin to avoid overlap

        // Create university info container (initially hidden)
        vis.infoContainer = vis.container.append("div")
            .attr("class", "university-info")
            .style("width", "0")
            .style("padding", "0")
            .style("transition", "all 0.3s ease");

        // Create SVG container
        vis.svg = vis.chartContainer.append("svg")
            .attr("width", vis.width + vis.margin.left + vis.margin.right)
            .attr("height", vis.height + vis.margin.top + vis.margin.bottom)
            .append("g")
            .attr("transform", `translate(${vis.margin.left},${vis.margin.top})`);

        // Initialize scales
        vis.x = d3.scaleLinear()
            .range([0, vis.width]);

        vis.y = d3.scaleLinear()
            .range([vis.height, 0]);

        // Initialize axes
        vis.xAxis = vis.svg.append("g")
            .attr("class", "x-axis")
            .attr("transform", `translate(0,${vis.height})`);

        vis.yAxis = vis.svg.append("g")
            .attr("class", "y-axis");

        // Add axes labels
        vis.svg.append("text")
            .attr("class", "x-axis-label")
            .attr("x", vis.width / 2)
            .attr("y", vis.height + 40)
            .style("text-anchor", "middle")
            .text("Year");

        vis.svg.append("text")
            .attr("class", "y-axis-label")
            .attr("transform", "rotate(-90)")
            .attr("x", -vis.height / 2)
            .attr("y", -50)
            .style("text-anchor", "middle")
            .text("Score");

        // Add title
        vis.svg.append("text")
            .attr("class", "chart-title")
            .attr("x", vis.width / 2)
            .attr("y", -40)
            .style("text-anchor", "middle")
            .style("font-size", "24px")
            .text("University Performance Over Time");

        // Initialize tooltip
        vis.tooltip = d3.select("body").append("div")
            .attr("class", "tooltip")
            .style("opacity", 0);

        // Create selectors
        this.createSelectors();
        this.createSelector2();

        // Initial data processing
        this.wrangleData();

        // 添加点击事件到容器
        vis.container.on("click", function(event) {
            // 检查点击是否在 infoContainer 外
            if (!event.target.closest('.university-info') && !event.target.closest('.line') && vis.selectedUniversity) {
                // 关闭信息面板
                vis.selectedUniversity = null;
                vis.chartContainer.style("width", "100%");
                vis.infoContainer.style("width", "0").style("padding", "0");
                vis.isExpanded = true;
                vis.updateVis();
            }
        });

        // 阻止信息面板的点击事件冒泡
        vis.infoContainer.on("click", function(event) {
            event.stopPropagation();
        });
    }

    createSelectors() {
        const vis = this;
        
        // 创建 Rank Range 容器
        const rankContainer = vis.selectorsContainer.append("div")
            .attr("class", "rank-container")
            .style("background", "white")
            .style("padding", "15px")
            .style("border-radius", "7px")
            .style("box-shadow", "0 2px 4px rgba(0,0,0,0)")
            .style("min-width", "200px")
            .style("margin-top", "80px")
            .style("margin-left", "-150px");  // 向左移动
            
        
        // 添加 Rank Range 标签和选择器
        rankContainer.append("label")
            .text("Rank Range:")
            .style("font-weight", "bold")
            .style("font-size", "13px")  // 调整字体大小
            .style("display", "block")
            .style("margin-bottom", "3px");
        
        // 创建 Rank Range 选项
        const rankRanges = [];
        for (let i = 1; i <= 100; i += 10) {
            rankRanges.push(`${i}-${i + 9}`);
        }
        
        // 添加 Rank Range 下拉框
        rankContainer.append("select")
            .attr("class", "rank-selector")
            .style("width", "80px")  // 调整宽度
            .style("padding", "4px 7px")  // 调整内边距，上下内边距控制高度
            .style("font-size", "14px")  // 调整下拉框文字大小
            .style("border", "1px solid #ccc")
            .style("border-radius", "4px")
            .on("change", function() {
                vis.selectedRankRange = this.value;
                vis.wrangleData();
            })
            .selectAll("option")
            .data(rankRanges)
            .enter()
            .append("option")
            .attr("value", d => d)
            .text(d => d)
            .property("selected", d => d === vis.selectedRankRange);
    }

    createSelector2() {
        const vis = this;
        console.log("Creating Score Metric Selector");
        
        // 创建 Score Metric 容器
        const metricContainer = vis.selectorsContainer.append("div")
            .attr("class", "metric-container")
            .style("background", "transparent")  // 设置背景为透明
            .style("padding", "15px")
            .style("border-radius", "7px")
            .style("box-shadow", "none")  // 移除阴影
            .style("min-width", "200px")
            .style("margin-top", "50px")     // 控制垂直位置
            .style("margin-left", "50px");    // 控制水平位置，与 Rank Range 的间距
        
        // 添加 Score Metric 标签和选择器
        metricContainer.append("label")
            .text("Score Metric:")
            .style("font-weight", "bold")
            .style("font-size", "13px")
            .style("display", "block")
            .style("margin-bottom", "3px")     // 控制与下方下拉框的距离
            .style("margin-top", "30px")       // 控制上方间距
            .style("margin-left", "-180px")      // 控制左侧间距
            .style("padding-left", "5px");     // 文字缩进
        
        const metrics = [
            { value: 'scores_overall', text: 'Overall Score' },
            { value: 'scores_teaching', text: 'Teaching Score' },
            { value: 'scores_research', text: 'Research Score' },
            { value: 'scores_citations', text: 'Citations Score' },
            { value: 'scores_industry_income', text: 'Industry Income Score' },
            { value: 'scores_international_outlook', text: 'International Outlook Score' }
        ];
        
        // 添加 Score Metric 下拉框
        metricContainer.append("select")
            .attr("class", "metric-selector")
            .style("width", "100px")  // 调整宽度
            .style("padding", "5px 8px")
            .style("font-size", "12px")
            .style("border", "1px solid #ccc")
            .style("border-radius", "4px")
            .style("margin-left", "-485px")
            .on("change", function() {
                vis.selectedMetric = this.value;
                vis.wrangleData();
            })
            .selectAll("option")
            .data(metrics)
            .enter()
            .append("option")
            .attr("value", d => d.value)
            .text(d => d.text)
            .property("selected", d => d.value === vis.selectedMetric);
    }

    wrangleData() {
        const vis = this;

        // Parse rank range
        const [minRank, maxRank] = vis.selectedRankRange.split('-').map(Number);

        // Group data by university
        const universitiesData = d3.group(vis.data, d => d.name);
        
        // Process data for selected universities or top performers
        vis.displayData = Array.from(universitiesData, ([name, values]) => {
            const sortedValues = values
                .filter(d => d.year !== null && d[vis.selectedMetric] !== null)
                .sort((a, b) => a.year - b.year);
            
            return {
                name: name,
                values: sortedValues.map(d => ({
                    year: d.year,
                    score: d[vis.selectedMetric] || 0,
                    rank: d.rank,
                    location: d.location
                }))
            };
        });

        // Filter universities by rank range using the latest available rank
        vis.displayData = vis.displayData.filter(d => {
            if (d.values.length === 0) return false;
            const latestRank = d.values[d.values.length - 1].rank;
            return latestRank >= minRank && latestRank <= maxRank;
        });

        // Sort by latest rank
        vis.displayData.sort((a, b) => {
            const rankA = a.values[a.values.length - 1].rank;
            const rankB = b.values[b.values.length - 1].rank;
            return rankA - rankB;
        });

        this.updateVis();
    }

    updateVis() {
        const vis = this;
    
        // Compute min and max values for Y-axis
        const yMin = d3.min(vis.displayData, d => d3.min(d.values, v => v.score));
        const yMax = d3.max(vis.displayData, d => d3.max(d.values, v => v.score));
        
        // Add padding to make the graph visually clear
        const padding = (yMax - yMin) * 0.1;  // 10% padding
    
        // Update y-axis range
        vis.y.domain([
            Math.max(0, yMin - padding),  // Ensure min value doesn't go below 0
            Math.min(100, yMax + padding)  // Ensure max value doesn't exceed 100
        ]);
    
        // Update y-axis with transition effect
        vis.yAxis.transition()
            .duration(1000)
            .call(d3.axisLeft(vis.y));
    
        // Update x-axis range
        vis.x.domain([
            d3.min(vis.displayData, d => d3.min(d.values, v => v.year)),
            d3.max(vis.displayData, d => d3.max(d.values, v => v.year))
        ]);
    
        // Update x-axis
        vis.xAxis.call(d3.axisBottom(vis.x).tickFormat(d3.format("d")));
    
        // Create line generator
        const line = d3.line()
            .x(d => vis.x(d.year))
            .y(d => vis.y(d.score));
    
        // Update lines
        const lines = vis.svg.selectAll(".line")
            .data(vis.displayData, d => d.name);
    
        // Enter
        const linesEnter = lines.enter()
            .append("path")
            .attr("class", "line");
    
        // Merge + Update
        lines.merge(linesEnter)
            .attr("d", d => line(d.values))
            .attr("fill", "none")
            .attr("stroke", (d, i) => d3.schemeCategory10[i % 10])
            .attr("stroke-width", d => d.name === vis.selectedUniversity?.name ? 4 : 2)
            .style("opacity", d => d.name === vis.selectedUniversity?.name ? 1 : 0.7)
            .on("mouseover", function(event, d) {
                if (vis.selectedUniversity && vis.selectedUniversity.name !== d.name) return;
                
                d3.select(this)
                    .attr("stroke-width", 4)
                    .style("opacity", 1);
                
                vis.tooltip
                    .style("opacity", 1)
                    .html(`<strong>${d.name}</strong><br/>
                           Score: ${d.values[d.values.length-1].score.toFixed(1)}<br/>
                           Rank: ${d.values[d.values.length-1].rank}<br/>
                           <span style="color: blue;">Click the line to see details</span>`)
                    .style("left", (event.pageX + 10) + "px")
                    .style("top", (event.pageY - 10) + "px");
            })
            .on("mouseout", function(event, d) {
                if (vis.selectedUniversity && vis.selectedUniversity.name !== d.name) return;
                
                d3.select(this)
                    .attr("stroke-width", d.name === vis.selectedUniversity?.name ? 4 : 2)
                    .style("opacity", d.name === vis.selectedUniversity?.name ? 1 : 0.7);
                
                vis.tooltip.style("opacity", 0);
            })
            .on("click", function(event, d) {
                vis.handleLineClick(this, d);
            });
    
        // Exit
        lines.exit().remove();
    
        // Update legend positioning
        const legendX = vis.width + 20;  // Adjusted to prevent cutoff
        const legendY = 0;
    
        const legend = vis.svg.selectAll(".legend")
            .data(vis.displayData, d => d.name);
    
        const legendEnter = legend.enter()
            .append("g")
            .attr("class", "legend")
            .attr("transform", (d, i) => `translate(${legendX},${legendY + i * 40})`);
    
        legendEnter.append("rect")
            // .attr("x", 0)
            .attr("width", 10)
            .attr("height", 10)
            .attr("fill", (d, i) => d3.schemeCategory10[i % 10])
            .attr("y", 5);
    
        // **Auto-wrap long legend text**
        legendEnter.append("text")
            .attr("x", 15)
            .attr("y", 9)
            .attr("dy", ".35em")
            .style("font-size", "12px")
            .style("cursor", "default")
            .each(function(d) {
                const text = d3.select(this);
                
                // Add university name
                text.append("tspan")
                    .attr("x", 15)
                    .text(d.name);
                
                // Add rank on new line
                text.append("tspan")
                    .attr("x", 15)
                    .attr("dy", "1.2em")
                    .style("fill", "#666")  // Slightly lighter color for the rank
                    .text(`Rank: ${d.values[d.values.length-1].rank}`);
            });
    
        // Update existing legend positions
        legend.attr("transform", (d, i) => `translate(${legendX},${legendY + i * 30})`);
        legend.select("text").each(function(d) {
            const text = d3.select(this);
            
            // Clear existing content
            text.selectAll("*").remove();
            
            // Add university name
            text.append("tspan")
                .attr("x", 15)
                .text(d.name);
            
            // Add rank on new line
            text.append("tspan")
                .attr("x", 15)
                .attr("dy", "1.2em")
                .style("fill", "#666")
                .text(`Rank: ${d.values[d.values.length-1].rank}`);
        });
    
        legend.exit().remove();
    }
    

    handleLineClick(element, data) {
        const vis = this;
        
        if (vis.selectedUniversity && vis.selectedUniversity.name === data.name) {
            // Deselect if clicking the same university
            vis.selectedUniversity = null;
            vis.chartContainer.style("width", "100%");
            vis.infoContainer.style("width", "0").style("padding", "0");
            vis.isExpanded = true;
        } else {
            // Select new university
            vis.selectedUniversity = data;
            vis.chartContainer.style("width", "70%");
            vis.infoContainer
                .style("width", "30%")
                .style("padding", "20px")
                .html(`
                    <div style="position: relative;">
                        <h2>${data.name}</h2>
                        <p><strong>Location:</strong> ${data.values[0].location}</p>
                        <p><strong>Current Rank:</strong> ${data.values[data.values.length-1].rank}</p>
                        <p><strong>Current Score:</strong> ${data.values[data.values.length-1].score.toFixed(1)}</p>
                        <h3>Score History</h3>
                        <table>
                            <tr><th>Year</th><th>Score</th><th>Rank</th></tr>
                            ${data.values.map(v => `
                                <tr>
                                    <td>${v.year}</td>
                                    <td>${v.score.toFixed(1)}</td>
                                    <td>${v.rank}</td>
                                </tr>
                            `).join('')}
                        </table>
                        <div style="margin-top: 20px;">
                            <button id="close-info" style="
                                background: #4a90e2;
                                border: none;
                                border-radius: 4px;
                                padding: 8px 15px;
                                cursor: pointer;
                                font-size: 14px;
                                color: white;
                                transition: all 0.3s ease;
                            ">Close</button>
                        </div>
                    </div>
                `);
            vis.isExpanded = false;

            // 添加按钮事件
            d3.select("#close-info")
                .on("mouseover", function() {
                    d3.select(this)
                        .style("background", "#357abd");
                })
                .on("mouseout", function() {
                    d3.select(this)
                        .style("background", "#4a90e2");
                })
                .on("click", function() {
                    vis.selectedUniversity = null;
                    vis.chartContainer.style("width", "100%");
                    vis.infoContainer.style("width", "0").style("padding", "0");
                    vis.isExpanded = true;
                    vis.updateVis();
                });
        }

        // Update visualization
        vis.updateVis();
    }

    render() {
        const vis = this;

        // Get container dimensions
        const containerWidth = vis.container.node().getBoundingClientRect().width;
        const containerHeight = vis.container.node().getBoundingClientRect().height;

        // Update dimensions
        vis.width = (containerWidth * (vis.isExpanded ? 1 : 0.7)) - vis.margin.left - vis.margin.right;
        vis.height = containerHeight - vis.margin.top - vis.margin.bottom;

        // Update SVG size
        vis.svg.attr("width", vis.width + vis.margin.left + vis.margin.right)
            .attr("height", vis.height + vis.margin.top + vis.margin.bottom);

        // Update scales
        vis.x.range([0, vis.width]);
        vis.y.range([vis.height, 0]);

        // Update axes and labels positions
        vis.xAxis.attr("transform", `translate(0,${vis.height})`);
        
        // Update the visualization
        this.wrangleData();
    }

    // Method to update selected universities
    updateSelectedUniversities(universities) {
        this.selectedUniversities = new Set(universities);
        this.wrangleData();
    }
} 