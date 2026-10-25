import html2canvas from "html2canvas-pro";
import jsPDF from "jspdf";

export const generatePDF = async (
  containerElement: HTMLElement | null,
  fileName = "report.pdf"
): Promise<void> => {
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

  const sections = Array.from(
    containerElement.querySelectorAll<HTMLElement>(".pdf-section")
  );

  const processSection = async (element: HTMLElement) => {
    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: "#ffffff",
    });

    const imgData = canvas.toDataURL("image/jpeg", 0.95);
    const imgWidth = contentWidth;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;

    if (currentY + imgHeight > pageHeight - margin) {
      doc.addPage();
      currentY = margin;
    }

    doc.addImage(imgData, "JPEG", margin, currentY, imgWidth, imgHeight);
    currentY += imgHeight + 5;
  };

  for (const section of sections) {
    await processSection(section);
  }

  doc.save(fileName);
};
