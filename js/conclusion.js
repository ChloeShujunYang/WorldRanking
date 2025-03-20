/**
 * Conclusion Page Script
 * Focuses on the applicant's perspective with a critical view of rankings
 */

class ConclusionPage {
    constructor() {
        // Initialize the conclusion page
        this.initConclusionPage();
    }

    initConclusionPage() {
        // Select the conclusion page content wrapper with updated ID
        const conclusionWrapper = d3.select("#conclusion");
        
        // Clear any existing content
        conclusionWrapper.html("");
        
        // Create the centered content container
        const contentContainer = conclusionWrapper.append("div")
            .attr("class", "conclusion-container");
        
        // Add title - large, centered
        contentContainer.append("h1")
            .attr("class", "conclusion-title")
            .text("What is the point of university rankings?");
        
        // Add first paragraph - justified text with decent width
        contentContainer.append("p")
            .attr("class", "conclusion-paragraph")
            .html("From admission decisions to career prospects, university rankings influence how students " +
                  "choose their educational paths. For applicants, these rankings present a simplified view of " +
                  "complex institutions, promising prestige and opportunity. Yet rankings often reduce diverse " +
                  "educational experiences to numerical scores, potentially obscuring what truly matters: the fit " +
                  "between a student's needs and what an institution actually offers.");
        
        // Add second paragraph - question
        contentContainer.append("p")
            .attr("class", "conclusion-question")
            .html("With all that said, what is the point of it? Why would applicants rely on these " +
                  "ranking systems when choosing where to invest their future?");
        
        // Add final insight with highlighted text
        const insightPara = contentContainer.append("p")
            .attr("class", "conclusion-insight");
        
        insightPara.html("Students don't just reference rankings for the sake of it. ");
        
        insightPara.append("span")
            .attr("class", "highlight-text")
            .html("For every ranking they consider, there should be critical evaluation, and personal priorities to fulfill.");
    }
}

// Initialize the conclusion page when the document is ready
document.addEventListener('DOMContentLoaded', function() {
    new ConclusionPage();
}); 