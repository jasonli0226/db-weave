import { useState } from 'react';
import { useReactFlow } from '@xyflow/react';
import { Download, FileImage, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { exportToPng, exportToPdf } from '@/lib/export/erdExport';

/**
 * ERD Export Button Component
 *
 * Provides a dropdown menu for exporting the ERD diagram as PNG or PDF.
 * Only visible when in ERD mode with a parsed schema.
 */
export function ERDExportButton() {
  const reactFlowInstance = useReactFlow();
  const [isExporting, setIsExporting] = useState(false);
  const [exportType, setExportType] = useState<'png' | 'pdf' | null>(null);

  /**
   * Handles PNG export
   */
  const handleExportPng = async () => {
    if (isExporting) return;

    try {
      setIsExporting(true);
      setExportType('png');
      await exportToPng(reactFlowInstance);
    } catch (error) {
      console.error('PNG export failed:', error);
    } finally {
      setIsExporting(false);
      setExportType(null);
    }
  };

  /**
   * Handles PDF export
   */
  const handleExportPdf = async () => {
    if (isExporting) return;

    try {
      setIsExporting(true);
      setExportType('pdf');
      await exportToPdf(reactFlowInstance);
    } catch (error) {
      console.error('PDF export failed:', error);
    } finally {
      setIsExporting(false);
      setExportType(null);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" disabled={isExporting}>
          <Download className="mr-2 h-4 w-4" />
          {isExporting
            ? `Exporting ${exportType?.toUpperCase()}...`
            : 'Export ERD'}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={handleExportPng} disabled={isExporting}>
          <FileImage className="mr-2 h-4 w-4" />
          Export as PNG
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleExportPdf} disabled={isExporting}>
          <FileText className="mr-2 h-4 w-4" />
          Export as PDF
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
