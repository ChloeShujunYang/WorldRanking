class RadarChart {
    constructor(containerId, data) {
        this.containerId = containerId;
        this.data = data;
        this.chart = null;
        
        console.log(`RadarChart: Container ID = ${containerId}`);
        console.log(`RadarChart: Initial data sample =`, data.slice(0, 5));
        
        const container = document.getElementById(this.containerId);
        if (!container) {
            console.error(`RadarChart: Container with ID "${containerId}" not found`);
            return;
        }
        
        this.initVis();
    }

    initVis() {
        console.log('RadarChart: Initializing visualization');
        const canvas = document.getElementById('radar-chart-canvas');
        
        if (!canvas) {
            console.error('RadarChart: Canvas element not found');
            return;
        }

        const ctx = canvas.getContext('2d');
        if (!ctx) {
            console.error('RadarChart: Failed to get canvas context');
            return;
        }

        this.chart = new Chart(ctx, {
            type: 'radar',
            data: {
                labels: [
                    'Overall Score',
                    'Teaching',
                    'Research',
                    'Citations',
                    'Industry Income',
                    'International Outlook'
                ],
                datasets: [{
                    label: 'University Scores',
                    data: [0, 0, 0, 0, 0, 0],
                    fill: true,
                    backgroundColor: 'rgba(54, 162, 235, 0.2)',
                    borderColor: 'rgb(54, 162, 235)',
                    pointBackgroundColor: 'rgb(54, 162, 235)',
                    pointBorderColor: '#fff',
                    pointHoverBackgroundColor: '#fff',
                    pointHoverBorderColor: 'rgb(54, 162, 235)'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    title: {
                        display: true,
                        text: 'University Performance Metrics',
                        padding: 20
                    },
                    legend: {
                        display: true,
                        position: 'top'
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                return `${context.dataset.label}: ${context.formattedValue}`;
                            }
                        }
                    }
                },
                scales: {
                    r: {
                        angleLines: {
                            display: true
                        },
                        suggestedMin: 0,
                        suggestedMax: 100,
                        ticks: {
                            stepSize: 20,
                            font: {
                                size: 12
                            }
                        },
                        pointLabels: {
                            font: {
                                size: 12
                            }
                        }
                    }
                }
            }
        });
        
        console.log('RadarChart: Chart initialized');
    }

    updateChart(universityData) {
        console.log('RadarChart: Updating chart with data:', universityData);
        
        if (!this.chart) {
            console.error('RadarChart: Chart not initialized');
            return;
        }
        
        if (!universityData) {
            console.error('RadarChart: No university data provided');
            return;
        }
        
        if (!universityData.scores_overall || !universityData.scores_teaching || 
            !universityData.scores_research || !universityData.scores_citations || 
            !universityData.scores_industry_income || !universityData.scores_international_outlook) {
            console.error('RadarChart: Incomplete university data:', universityData);
            return;
        }

        this.chart.data.datasets[0].label = universityData.name;
        this.chart.data.datasets[0].data = [
            universityData.scores_overall,
            universityData.scores_teaching,
            universityData.scores_research,
            universityData.scores_citations,
            universityData.scores_industry_income,
            universityData.scores_international_outlook
        ];

        // Update chart title
        this.chart.options.plugins.title.text = `Performance Metrics: ${universityData.name}`;
        
        this.chart.update();
        console.log('RadarChart: Chart updated');
    }
} 