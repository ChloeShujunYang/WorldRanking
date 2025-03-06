class BarChart {
    constructor(containerId, data) {
        this.containerId = containerId;
        this.data = data;
        this.chart = null;
        this.selectedCountry = 'United States';
        this.selectedRange = '1-5';
        
        console.log(`BarChart: Container ID = ${containerId}`);
        console.log(`BarChart: Initial data sample =`, data.slice(0, 5));
        
        const container = document.getElementById(this.containerId);
        if (!container) {
            console.error(`BarChart: Container with ID "${containerId}" not found`);
            return;
        }
        
        this.initVis();
        this.setupEventListeners();
    }

    initVis() {
        console.log('BarChart: Initializing visualization');
        const canvas = document.getElementById('bar-chart-canvas');
        
        if (!canvas) {
            console.error('BarChart: Canvas element not found');
            return;
        }

        const ctx = canvas.getContext('2d');
        if (!ctx) {
            console.error('BarChart: Failed to get canvas context');
            return;
        }

        this.chart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: [],
                datasets: [{
                    label: 'Overall Score',
                    data: [],
                    backgroundColor: 'rgba(54, 162, 235, 0.8)',
                    borderColor: 'rgb(54, 162, 235)',
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        max: 100,
                        title: {
                            display: true,
                            text: 'Overall Score'
                        }
                    },
                    x: {
                        title: {
                            display: true,
                            text: 'University Name'
                        },
                        ticks: {
                            maxRotation: 45,
                            minRotation: 45
                        }
                    }
                },
                plugins: {
                    title: {
                        display: true,
                        text: 'Top Universities by Overall Score',
                        padding: 20
                    }
                },
                onClick: (event, elements) => {
                    if (elements.length > 0) {
                        const index = elements[0].index;
                        const universityData = this.currentUniversities[index];
                        console.log('BarChart: Selected university:', universityData);
                        document.dispatchEvent(new CustomEvent('universitySelected', {
                            detail: universityData
                        }));
                    }
                }
            }
        });
        
        console.log('BarChart: Chart initialized');
    }

    updateRangeFilter(totalUniversities) {
        console.log(`BarChart: Updating range filter for ${totalUniversities} universities`);
        const filterSelect = document.getElementById('rank-range-filter');
        
        if (!filterSelect) {
            console.error('BarChart: Range filter select element not found');
            return;
        }
        
        filterSelect.innerHTML = ''; // Clear existing options
        
        const rangeSize = 5; // Number of universities per range
        const numberOfRanges = Math.ceil(totalUniversities / rangeSize);
        
        for (let i = 0; i < numberOfRanges; i++) {
            const start = i * rangeSize + 1;
            const end = Math.min((i + 1) * rangeSize, totalUniversities);
            const option = document.createElement('option');
            option.value = `${start}-${end}`;
            option.textContent = `Rank ${start}-${end}`;
            filterSelect.appendChild(option);
        }

        // Set the first range as default if no range is selected
        if (!this.selectedRange || !filterSelect.querySelector(`option[value="${this.selectedRange}"]`)) {
            this.selectedRange = filterSelect.options[0].value;
        }
    }

    setupEventListeners() {
        const filterSelect = document.getElementById('rank-range-filter');
        if (!filterSelect) {
            console.error('BarChart: Range filter select element not found for event listener');
            return;
        }
        
        filterSelect.addEventListener('change', (event) => {
            this.selectedRange = event.target.value;
            this.updateChart();
        });
    }

    updateChart(country = this.selectedCountry) {
        console.log(`BarChart: Updating chart for country: ${country}`);
        this.selectedCountry = country;
        
        if (!this.chart) {
            console.error('BarChart: Chart not initialized');
            return;
        }
        
        // Filter universities by country and year 2024
        const universities = this.data
            .filter(u => u.location === this.selectedCountry && u.year === 2024)
            .sort((a, b) => a.rank_order - b.rank_order);

        console.log(`BarChart: Found ${universities.length} universities for ${country} in 2024`);

        if (universities.length === 0) {
            console.warn(`BarChart: No universities found for ${country} in 2024`);
            this.chart.data.labels = [];
            this.chart.data.datasets[0].data = [];
            this.chart.update();
            return;
        }

        // Update range filter based on total universities
        this.updateRangeFilter(universities.length);

        // Get range bounds
        const [start, end] = this.selectedRange.split('-').map(Number);
        this.currentUniversities = universities.slice(start - 1, end); // Ensure this does not exceed the length of universities

        console.log(`BarChart: Displaying universities from rank ${start} to ${end}:`, this.currentUniversities.map(u => u.name));

        // Update chart data
        this.chart.data.labels = this.currentUniversities.map(u => u.name);
        this.chart.data.datasets[0].data = this.currentUniversities.map(u => u.scores_overall);
        
        // Log updated chart data
        console.log(`BarChart: Updated labels:`, this.chart.data.labels);
        console.log(`BarChart: Updated data:`, this.chart.data.datasets[0].data);
        
        // Update chart title
        this.chart.options.plugins.title.text = `Top Universities in ${this.selectedCountry}`;
        
        this.chart.update();

        // Update the dropdown selection to reflect the current range
        const filterSelect = document.getElementById('rank-range-filter');
        if (filterSelect) {
            filterSelect.value = this.selectedRange; // Set the dropdown to the current range
        }

        // Trigger selection of first university for radar chart
        if (this.currentUniversities.length > 0) {
            document.dispatchEvent(new CustomEvent('universitySelected', {
                detail: this.currentUniversities[0]
            }));
        }
    }
}

// Add an event listener for university selection
document.addEventListener("universitySelected", (event) => {
    radarChart.updateChart(event.detail); // Update radar chart with selected university data
}); 