import { FEATURE_CATALOG } from './featureCatalog';

/**
 * Generates a professional PDF of the feature catalog
 * Uses HTML canvas and jsPDF for client-side PDF generation
 */
export const generateFeatureCatalogPDF = async () => {
    // Dynamic import of jsPDF to avoid bundle size issues
    const { jsPDF } = await import('jspdf');
    const html2canvas = (await import('html2canvas')).default;

    // Create a temporary div to render the HTML content
    const container = document.createElement('div');
    container.innerHTML = generatePDFHTML();
    container.style.position = 'absolute';
    container.style.left = '-9999px';
    container.style.width = '210mm';
    document.body.appendChild(container);

    try {
        // Convert HTML to canvas
        const canvas = await html2canvas(container, {
            scale: 2,
            useCORS: true,
            backgroundColor: '#ffffff',
        });

        // Create PDF with A4 dimensions
        const pdf = new jsPDF({
            orientation: 'portrait',
            unit: 'mm',
            format: 'a4',
        });

        const pageWidth = pdf.internal.pageSize.getWidth();
        const pageHeight = pdf.internal.pageSize.getHeight();
        const imgWidth = pageWidth - 20; // 10mm margins
        const imgHeight = (canvas.height * imgWidth) / canvas.width;

        let heightLeft = imgHeight;
        let position = 10; // 10mm margin from top

        // Add image to PDF, creating new pages as needed
        const imgData = canvas.toDataURL('image/png');
        
        while (heightLeft >= 0) {
            pdf.addImage(imgData, 'PNG', 10, position, imgWidth, imgHeight);
            heightLeft -= pageHeight - 20; // Account for margins
            
            if (heightLeft > 0) {
                pdf.addPage();
                position = -imgHeight + (pageHeight - 20);
            }
        }

        // Save the PDF
        pdf.save('TeamBattle-Feature-Catalog.pdf');
    } finally {
        // Clean up
        document.body.removeChild(container);
    }
};

/**
 * Generates HTML content for the PDF
 */
const generatePDFHTML = (): string => {
    const currentDate = new Date().toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });

    let html = `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <style>
                * {
                    margin: 0;
                    padding: 0;
                    box-sizing: border-box;
                }
                
                body {
                    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                    line-height: 1.6;
                    color: #333;
                    background: #ffffff;
                }
                
                .page-break {
                    page-break-after: always;
                    margin-bottom: 40px;
                }
                
                .header {
                    background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
                    color: white;
                    padding: 40px 20px;
                    text-align: center;
                    margin-bottom: 30px;
                    border-radius: 8px;
                }
                
                .logo {
                    font-size: 32px;
                    font-weight: bold;
                    margin-bottom: 10px;
                    letter-spacing: 2px;
                }
                
                .tagline {
                    font-size: 14px;
                    opacity: 0.9;
                    margin-bottom: 5px;
                }
                
                .date {
                    font-size: 12px;
                    opacity: 0.8;
                    margin-top: 10px;
                }
                
                .intro {
                    background: #f8fafc;
                    border-left: 4px solid #f97316;
                    padding: 20px;
                    margin-bottom: 30px;
                    border-radius: 4px;
                }
                
                .intro h2 {
                    color: #0f172a;
                    margin-bottom: 10px;
                    font-size: 18px;
                }
                
                .intro p {
                    font-size: 14px;
                    color: #475569;
                    line-height: 1.7;
                }
                
                .category {
                    margin-bottom: 35px;
                    page-break-inside: avoid;
                }
                
                .category-header {
                    background: linear-gradient(135deg, #f97316 0%, #ea580c 100%);
                    color: white;
                    padding: 15px 20px;
                    margin-bottom: 20px;
                    border-radius: 6px;
                    display: flex;
                    align-items: center;
                }
                
                .category-number {
                    background: rgba(255, 255, 255, 0.2);
                    width: 40px;
                    height: 40px;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-weight: bold;
                    margin-right: 15px;
                    flex-shrink: 0;
                }
                
                .category-title {
                    flex: 1;
                }
                
                .category-title h3 {
                    font-size: 18px;
                    margin-bottom: 5px;
                }
                
                .category-desc {
                    font-size: 12px;
                    opacity: 0.95;
                }
                
                .feature {
                    margin-bottom: 15px;
                    padding: 12px;
                    background: #f8fafc;
                    border-left: 3px solid #3b82f6;
                    border-radius: 4px;
                    page-break-inside: avoid;
                }
                
                .feature-name {
                    font-weight: 600;
                    color: #0f172a;
                    font-size: 14px;
                    margin-bottom: 5px;
                }
                
                .feature-description {
                    font-size: 12px;
                    color: #475569;
                    line-height: 1.5;
                }
                
                .footer {
                    margin-top: 40px;
                    padding-top: 20px;
                    border-top: 2px solid #e2e8f0;
                    text-align: center;
                    font-size: 12px;
                    color: #64748b;
                }
                
                .footer-text {
                    margin-bottom: 5px;
                }
                
                .powered-by {
                    font-size: 11px;
                    margin-top: 10px;
                    color: #94a3b8;
                }
                
                .toc {
                    background: #f1f5f9;
                    padding: 20px;
                    margin-bottom: 30px;
                    border-radius: 6px;
                }
                
                .toc h3 {
                    color: #0f172a;
                    margin-bottom: 15px;
                    font-size: 16px;
                }
                
                .toc-list {
                    list-style: none;
                    columns: 2;
                    column-gap: 20px;
                }
                
                .toc-item {
                    margin-bottom: 8px;
                    font-size: 12px;
                    color: #475569;
                }
                
                .toc-item:before {
                    content: "→ ";
                    color: #f97316;
                    font-weight: bold;
                    margin-right: 5px;
                }
            </style>
        </head>
        <body>
            <!-- Header Section -->
            <div class="header">
                <div class="logo">⚡ TeamBattle</div>
                <div class="tagline">Feature Catalog & User Guide</div>
                <div class="date">Generated on ${currentDate}</div>
            </div>
            
            <!-- Introduction -->
            <div class="intro">
                <h2>Welcome to TeamBattle</h2>
                <p>
                    TeamBattle is a comprehensive location-based gaming platform designed to create engaging, 
                    interactive experiences for teams and groups. This catalog documents all available features 
                    and capabilities to help new users understand the platform's full potential.
                </p>
            </div>
            
            <!-- Table of Contents -->
            <div class="toc">
                <h3>📋 Feature Categories</h3>
                <ul class="toc-list">
    `;

    FEATURE_CATALOG.forEach((category, index) => {
        html += `<li class="toc-item">${index + 1}. ${category.title}</li>`;
    });

    html += `
                </ul>
            </div>
            
            <div class="page-break"></div>
            
            <!-- Feature Categories -->
    `;

    FEATURE_CATALOG.forEach((category, catIndex) => {
        html += `
            <div class="category">
                <div class="category-header">
                    <div class="category-number">${catIndex + 1}</div>
                    <div class="category-title">
                        <h3>${category.title}</h3>
                        <div class="category-desc">${category.description}</div>
                    </div>
                </div>
        `;

        category.features.forEach(feature => {
            html += `
                <div class="feature">
                    <div class="feature-name">✓ ${feature.name}</div>
                    <div class="feature-description">${feature.description}</div>
                </div>
            `;
        });

        html += `</div>`;
    });

    html += `
            <!-- Footer -->
            <div class="footer">
                <div class="footer-text">
                    <strong>TeamBattle Feature Catalog</strong>
                </div>
                <div class="footer-text">
                    For more information and support, visit our website or contact our team.
                </div>
                <div class="powered-by">
                    © ${new Date().getFullYear()} TeamBattle. All rights reserved. | POWERED BY TEAMBATTLE
                </div>
            </div>
        </body>
        </html>
    `;

    return html;
};
