// Function to convert date objects to strings or reverse
const yearFormatter = d3.timeFormat("%Y");
const yearParser = d3.timeParse("%Y");

// Global visualization instances
let worldMap, timeline, scatterplot;

// (1) Load data with promises
let promises = [
    d3.csv("data/2011_2024_rankings_cleaned.csv")
];

Promise.all(promises)
    .then(function (data) {
        let rankingData = data[0];

        // Log the entire data set to check for 2024 entries
        console.log("Loaded ranking data:", rankingData);

        rankingData = rankingData.map(d => ({
            rank_order: +d.rank_order || 0,
            name: d.name,
            location: d.location,
            year: +d.year || 0,
            scores_overall: +d.scores_overall || 0,
            scores_teaching: +d.scores_teaching || 0,
            scores_international_outlook: +d.scores_international_outlook || 0,
            scores_industry_income: +d.scores_industry_income || 0,
            scores_research: +d.scores_research || 0,
            scores_citations: +d.scores_citations || 0
        }));

        // Log the filtered data for 2024
        const universities2024 = rankingData.filter(d => d.year === 2024);
        console.log("Filtered universities for 2024:", universities2024);

        // Check specifically for Canada
        const universitiesCanada = universities2024.filter(d => d.location === "Canada");
        console.log("Universities in Canada for 2024:", universitiesCanada);

        worldMap = new WorldMap("worldmap-chart", rankingData);
        barChart = new BarChart("bar-chart-canvas", rankingData);
        radarChart = new RadarChart("radar-chart-canvas", rankingData);

        document.addEventListener("universitySelected", (event) => {
            console.log('Main: University selected:', event.detail); // Log the selected university data
            if (event.detail && event.detail.scores_overall > 0) {
                radarChart.updateChart(event.detail);
            } else {
                console.warn('Main: No valid university data provided for radar chart update.');
            }
        });

        barChart.updateChart();
        radarChart.updateChart();
    })
    .catch(err => console.error("Error loading data:", err));

function createVis(data) {
    let rankingData = data[0];
    
    // Debug log before processing
    console.log("Before processing:", rankingData);
    
    // (2) Process the data
    rankingData = rankingData.map(function(d) {
        return {
            // Convert numeric columns with '+' operator
            rank_order: +d.rank_order || 0,
            rank: +d.rank || 0,
            name: d.name,
            scores_overall: +d.scores_overall || 0,
            scores_overall_rank: +d.scores_overall_rank || 0,
            scores_teaching: +d.scores_teaching || 0,
            scores_teaching_rank: +d.scores_teaching_rank || 0,
            scores_international_outlook: +d.scores_international_outlook || 0,
            scores_international_outlook_rank: +d.scores_international_outlook_rank || 0,
            scores_industry_income: +d.scores_industry_income || 0,
            scores_industry_income_rank: +d.scores_industry_income_rank || 0,
            scores_research: +d.scores_research || 0,
            scores_research_rank: +d.scores_research_rank || 0,
            scores_citations: +d.scores_citations || 0,
            scores_citations_rank: +d.scores_citations_rank || 0,
            
            // Keep string columns as is
            location: d.location,
            aliases: d.aliases,
            subjects_offered: d.subjects_offered,
            
            // Keep year as number
            year: +d.year || 0,
            
            // Convert remaining numeric columns
            stats_number_students: +d.stats_number_students || 0,
            stats_student_staff_ratio: +d.stats_student_staff_ratio || 0,
            stats_female_male_ratio: +d.stats_female_male_ratio || 0
        };
    }).filter(d => d.rank_order > 0);

    // Debug log after processing
    console.log("After processing:", rankingData);
    
    if (rankingData.length === 0) {
        console.error("No valid data after processing");
        return;
    }

    // (3) Create visualization instances
    worldMap = new WorldMap("worldmap-chart", rankingData);
    timeline = new Timeline("timeline-chart", rankingData);
    scatterplot = new Scatterplot("scatterplot-chart", rankingData);

    // (4) Set up page navigation and intersection observer
    setupPageNavigation();
    setupIntersectionObserver();
}

/**
 * Sets up the page navigation system
 * - Handles page scrolling
 * - Updates navigation dots
 * - Manages scroll events
 */
function setupPageNavigation() {
    // Get DOM elements
    const pages = document.querySelectorAll('.page');
    const navDots = document.querySelectorAll('.page-nav li');
    const pageContainer = document.querySelector('.page-container');
    let currentPage = 0;
    let isScrolling = false;

    /**
     * Scrolls to a specific page
     * @param {number} index - The index of the target page
     */
    function scrollToPage(index) {
        if (index >= 0 && index < pages.length) {
            isScrolling = true;
            currentPage = index;
            // Smooth scroll to target page
            pageContainer.scrollTo({
                top: index * window.innerHeight,
                behavior: 'smooth'
            });
            updateActiveDot();
            // Reset scrolling flag after animation
            setTimeout(() => {
                isScrolling = false;
            }, 1000);
        }
    }

    /**
     * Updates the active state of navigation dots
     */
    function updateActiveDot() {
        navDots.forEach((dot, index) => {
            dot.classList.toggle('active', index === currentPage);
        });
    }

    /**
     * Handles scroll events
     * - Calculates current page based on scroll position
     * - Updates navigation dots accordingly
     */
    function handleScroll() {
        if (isScrolling) return;
        const scrollPosition = pageContainer.scrollTop;
        const pageHeight = window.innerHeight;
        const newPage = Math.round(scrollPosition / pageHeight);

        if (newPage !== currentPage) {
            currentPage = newPage;
            updateActiveDot();
        }
    }

    // Add event listeners
    pageContainer.addEventListener('scroll', handleScroll);

    // Setup click handlers for navigation dots
    navDots.forEach((dot, index) => {
        dot.addEventListener('click', () => scrollToPage(index));
    });

    // Initialize navigation dots
    updateActiveDot();
}

/**
 * Sets up intersection observer for lazy loading charts
 * - Monitors when pages enter viewport
 * - Initializes charts when their container becomes visible
 */
function setupIntersectionObserver() {
    const options = {
        root: null,        // Use viewport as root
        rootMargin: '0px', // No margin
        threshold: 0.1     // Trigger when 10% visible
    };

    // Create intersection observer
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                console.log("16. Page intersecting:", entry.target.id);
                
                // Add class to page container when page 4 is active
                const pageContainer = document.querySelector('.page-container');
                if (entry.target.id === 'page4') {
                    pageContainer.classList.add('page4-active');
                } else {
                    pageContainer.classList.remove('page4-active');
                }
                
                if (entry.target.id === 'page6' && scatterplot) {
                    console.log("17. Triggering scatterplot render");
                    scatterplot.render();
                }
            }
        });
    }, options);

    // Start observing all pages
    document.querySelectorAll('.page').forEach(page => {
        observer.observe(page);
    });
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Show loading state or initialize UI elements if needed
    document.querySelector('.page-container').style.opacity = '1';
    document.querySelector('#page1 .title-box').style.opacity = '1';
});

// Handle window resize
window.addEventListener('resize', () => {
    // Refresh visualizations if needed
    if (worldMap) worldMap.render();
    if (timeline) timeline.render();
    if (scatterplot) scatterplot.render();
});