import { toPng } from 'html-to-image';
import jsPDF from 'jspdf';
import { getNodesBounds, getViewportForBounds } from '@xyflow/react';
import type { ReactFlowInstance } from '@xyflow/react';

/**
 * Configuration for PNG export
 */
const PNG_CONFIG = {
  width: 1920,
  height: 1080,
  pixelRatio: 2,
  backgroundColor: '#f1f5f9',
  fileName: 'erd-diagram.png',
} as const;

/**
 * Configuration for PDF export
 */
const PDF_CONFIG = {
  format: 'a4',
  orientation: 'landscape',
  fileName: 'erd-diagram.pdf',
} as const;

/**
 * Downloads a data URL as a file
 */
function downloadFile(dataUrl: string, fileName: string): void {
  const link = document.createElement('a');
  link.download = fileName;
  link.href = dataUrl;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Exports the ERD diagram as a PNG image
 *
 * @param reactFlowInstance - The React Flow instance
 * @throws Error if export fails
 */
export async function exportToPng(reactFlowInstance: ReactFlowInstance): Promise<void> {
  try {
    // Validate React Flow instance
    if (!reactFlowInstance) {
      throw new Error('React Flow instance not available');
    }

    // Get all nodes and validate
    const nodes = reactFlowInstance.getNodes();
    if (!nodes || nodes.length === 0) {
      throw new Error('No nodes to export');
    }

    // Get the viewport element
    const viewportElement = document.querySelector('.react-flow__viewport') as HTMLElement;
    if (!viewportElement) {
      throw new Error('React Flow viewport element not found');
    }

    // Calculate optimal viewport bounds
    const nodesBounds = getNodesBounds(nodes);
    const viewport = getViewportForBounds(
      nodesBounds,
      PNG_CONFIG.width,
      PNG_CONFIG.height,
      0.5, // minZoom
      2,   // maxZoom
      0.1  // padding
    );

    // Capture viewport as PNG with proper transform
    const dataUrl = await toPng(viewportElement, {
      backgroundColor: PNG_CONFIG.backgroundColor,
      width: PNG_CONFIG.width,
      height: PNG_CONFIG.height,
      pixelRatio: PNG_CONFIG.pixelRatio,
      style: {
        width: `${PNG_CONFIG.width}px`,
        height: `${PNG_CONFIG.height}px`,
        transform: `translate(${viewport.x}px, ${viewport.y}px) scale(${viewport.zoom})`,
      },
    });

    // Download the image
    downloadFile(dataUrl, PNG_CONFIG.fileName);
  } catch (error) {
    console.error('Failed to export ERD as PNG:', error);
    throw new Error('Failed to export diagram as PNG. Please try again.');
  }
}

/**
 * Exports the ERD diagram as a PDF document
 *
 * @param reactFlowInstance - The React Flow instance
 * @throws Error if export fails
 */
export async function exportToPdf(reactFlowInstance: ReactFlowInstance): Promise<void> {
  try {
    // Validate React Flow instance
    if (!reactFlowInstance) {
      throw new Error('React Flow instance not available');
    }

    // Get all nodes and validate
    const nodes = reactFlowInstance.getNodes();
    if (!nodes || nodes.length === 0) {
      throw new Error('No nodes to export');
    }

    // Get the viewport element
    const viewportElement = document.querySelector('.react-flow__viewport') as HTMLElement;
    if (!viewportElement) {
      throw new Error('React Flow viewport element not found');
    }

    // Calculate optimal viewport bounds
    const nodesBounds = getNodesBounds(nodes);
    const viewport = getViewportForBounds(
      nodesBounds,
      PNG_CONFIG.width,
      PNG_CONFIG.height,
      0.5, // minZoom
      2,   // maxZoom
      0.1  // padding
    );

    // Capture viewport as PNG first
    const dataUrl = await toPng(viewportElement, {
      backgroundColor: PNG_CONFIG.backgroundColor,
      width: PNG_CONFIG.width,
      height: PNG_CONFIG.height,
      pixelRatio: PNG_CONFIG.pixelRatio,
      style: {
        width: `${PNG_CONFIG.width}px`,
        height: `${PNG_CONFIG.height}px`,
        transform: `translate(${viewport.x}px, ${viewport.y}px) scale(${viewport.zoom})`,
      },
    });

    // Create PDF from PNG
    const pdf = new jsPDF({
      orientation: PDF_CONFIG.orientation as 'landscape' | 'portrait',
      unit: 'px',
      format: PDF_CONFIG.format,
    });

    // Get PDF dimensions
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();

    // Calculate image dimensions to fit PDF page
    const imgAspectRatio = PNG_CONFIG.width / PNG_CONFIG.height;
    const pdfAspectRatio = pdfWidth / pdfHeight;

    let imgWidth = pdfWidth;
    let imgHeight = pdfHeight;

    if (imgAspectRatio > pdfAspectRatio) {
      // Image is wider than PDF page
      imgHeight = pdfWidth / imgAspectRatio;
    } else {
      // Image is taller than PDF page
      imgWidth = pdfHeight * imgAspectRatio;
    }

    // Center the image on the page
    const xOffset = (pdfWidth - imgWidth) / 2;
    const yOffset = (pdfHeight - imgHeight) / 2;

    // Add image to PDF
    pdf.addImage(dataUrl, 'PNG', xOffset, yOffset, imgWidth, imgHeight, undefined, 'FAST');

    // Download PDF
    pdf.save(PDF_CONFIG.fileName);
  } catch (error) {
    console.error('Failed to export ERD as PDF:', error);
    throw new Error('Failed to export diagram as PDF. Please try again.');
  }
}
