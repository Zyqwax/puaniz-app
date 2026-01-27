import html2canvas from "html2canvas-pro";
import jsPDF from "jspdf";

/**
 * Generates a PDF from a set of DOM elements using html2canvas-pro and jsPDF.
 * This approach prevents breaking components across pages and ensures high quality.
 *
 * @param {HTMLElement} containerElement - The container hosting the content (hidden or visible)
 * @param {string} fileName - Output filename
 */
export const generatePDF = async (containerElement, fileName = "report.pdf") => {
  if (!containerElement) return;

  const doc = new jsPDF({
    orientation: "p",
    unit: "mm",
    format: "a4",
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 10;
  const contentWidth = pageWidth - 2 * margin;

  let currentY = margin;

  // Select all sections marked for PDF generation
  // We assume the component adds 'pdf-section' class to top-level logical blocks
  const sections = Array.from(containerElement.querySelectorAll(".pdf-section"));

  // Helper to process a chunk
  const processSection = async (element) => {
    // Capture the element
    const canvas = await html2canvas(element, {
      scale: 2, // High resolution
      useCORS: true,
      logging: false,
      backgroundColor: "#ffffff", // Ensure white background
    });

    const imgData = canvas.toDataURL("image/jpeg", 0.95);
    const imgWidth = contentWidth;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;

    // Check if we need a new page
    if (currentY + imgHeight > pageHeight - margin) {
      doc.addPage();
      currentY = margin;
    }

    // Add image
    doc.addImage(imgData, "JPEG", margin, currentY, imgWidth, imgHeight);

    // Move cursor
    currentY += imgHeight + 5; // 5mm spacing
  };

  // Temporarily show the element if it's hidden to ensure proper rendering
  // Note: html2canvas requires the element to be in the DOM and visible-ish
  // If it's absolutely positioned off-screen, that works usually.

  for (const section of sections) {
    await processSection(section);
  }

  doc.save(fileName);
};
