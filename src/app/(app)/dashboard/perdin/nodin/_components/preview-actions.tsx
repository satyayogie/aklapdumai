"use client";

import { useState, useTransition, useCallback, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Save, Printer, Eye, FileText } from "lucide-react";
import { toast } from "sonner";
import { persistNotaFromDraft } from "@/server/perdin/preview";

interface Props {
  draftId: string;
}

export function PreviewActions({ draftId }: Props) {
  const router = useRouter();
  const [isPersisting, startPersist] = useTransition();
  const [isPrinting, setIsPrinting] = useState(false);
  const printTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleSave = useCallback(() => {
    startPersist(async () => {
      try {
        console.log("Starting to save nota with draftId:", draftId);
        const notaId = await persistNotaFromDraft(draftId);
        console.log("Nota saved successfully with ID:", notaId);
        toast.success("Nota Dinas berhasil disimpan!");
        router.push(`/dashboard/perdin/nodin`);
      } catch (error) {
        console.error("Error saving nota:", error);

        let errorMessage = "Gagal menyimpan Nota Dinas";
        if (error instanceof Error) {
          if (error.message.includes("Draft tidak ditemukan")) {
            errorMessage = "Draft tidak ditemukan. Silakan buat draft baru.";
          } else if (error.message.includes("Nomor")) {
            errorMessage = "Nomor nota dinas sudah terdaftar. Gunakan nomor lain.";
          } else {
            errorMessage = error.message;
          }
        }

        toast.error(errorMessage);
      }
    });
  }, [draftId, router]);

  const cleanup = useCallback(() => {
    console.log('🧹 Cleaning up print state');

    // Remove all print-related classes
    document.body.classList.remove('printing', 'print-mode', 'print-ready');
    document.documentElement.classList.remove('print-mode', 'print-ready');

    // Remove injected styles
    const printStyles = document.getElementById('enhanced-print-styles');
    if (printStyles) {
      printStyles.remove();
    }

    setIsPrinting(false);

    // Clear timeouts
    if (printTimeoutRef.current) {
      clearTimeout(printTimeoutRef.current);
      printTimeoutRef.current = null;
    }
  }, []);

  const handlePrint = useCallback(async () => {
    if (isPrinting) return;

    console.log('🖨️ Starting ENHANCED print process');
    setIsPrinting(true);
    toast.info("Mempersiapkan dokumen untuk dicetak...");

    try {
      // Step 1: Verify document exists
      const printDocument = document.querySelector('.print-document');
      if (!printDocument) {
        throw new Error('Print document tidak ditemukan');
      }

      console.log('✅ Print document found');

      const printStyles = document.createElement('style');
      printStyles.id = 'enhanced-print-styles';
      printStyles.textContent = `
        @media print {
          /* Perfect A4 page setup */
          @page {
            size: A4 portrait;
            margin: 20mm;
          }

          @page :first {
            margin: 5mm 20mm 20mm 20mm;
          }

          /* Hide everything except print content */
          body * {
            visibility: hidden;
          }

          .print-container,
          .print-container * {
            visibility: visible;
          }

          /* Position print container exactly */
          .print-container {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            background: white;
          }

          /* Perfect document formatting */
          .print-document {
            width: 100%;
            background: white;
            color: black;
            font-family: Arial, sans-serif;
            font-size: 12px;
            line-height: 1.1;
            margin: 0;
            padding: 0;
          }

          /* Header stays at top - no top margin */
          .document-header {
            margin-top: 0 !important;
            margin-bottom: 8px !important;
          }

          /* Header content tight spacing */
          .header-content {
            display: flex !important;
            align-items: flex-start !important;
            gap: 12px !important;
            margin-bottom: 2px !important;
          }

          .header-text {
            flex: 1 !important;
            text-align: center !important;
            padding-left: 15px !important;
            margin-top: -2px !important;
          }

          /* Title close to border */
          .document-title {
            margin-top: 4px !important;
            margin-bottom: 12px !important;
            text-align: center !important;
          }

          .document-title h1 {
            font-size: 14px !important;
            font-weight: bold !important;
            text-decoration: underline !important;
            color: black !important;
            margin: 0 !important;
          }

          /* Tight spacing for info table */
          .info-table td {
            padding: 1px 0 !important;
            line-height: 1.1 !important;
            color: black !important;
          }

          .info-table .colon {
            text-align: left !important;
          }

          /* Table display fixes */
          table {
            display: table !important;
            border-collapse: collapse !important;
          }

          tr {
            display: table-row !important;
            page-break-inside: avoid;
          }

          td, th {
            display: table-cell !important;
          }

          /* Border and color enforcement */
          .header-border {
            background-color: black !important;
            height: 2px !important;
            width: 100% !important;
            -webkit-print-color-adjust: exact !important;
            color-adjust: exact !important;
            print-color-adjust: exact !important;
          }

          .peserta-table th,
          .peserta-table td {
            border: 1px solid black !important;
            -webkit-print-color-adjust: exact !important;
            color-adjust: exact !important;
            print-color-adjust: exact !important;
          }

          .peserta-table th {
            background-color: #f0f0f0 !important;
            -webkit-print-color-adjust: exact !important;
            color-adjust: exact !important;
            print-color-adjust: exact !important;
          }

          .disposisi-table th,
          .disposisi-table td {
            border: 2px solid black !important;
            -webkit-print-color-adjust: exact !important;
            color-adjust: exact !important;
            print-color-adjust: exact !important;
          }

          /* Force Arial font everywhere */
          * {
            font-family: Arial, sans-serif !important;
            color: black !important;
          }

          /* Hide screen-only elements */
          .no-print {
            display: none !important;
            visibility: hidden !important;
          }

          /* Signature container */
          .signature-container {
            display: flex !important;
            justify-content: space-between !important;
            align-items: flex-start !important;
          }

          /* Page break prevention */
          .header-content,
          .document-title,
          .peserta-table,
          .signature-container {
            page-break-inside: avoid;
          }

          /* Ensure proper sizing */
          .print-document {
            max-width: none !important;
          }
        }
      `;

      // Remove existing and add new styles
      const existingStyles = document.getElementById('enhanced-print-styles');
      if (existingStyles) existingStyles.remove();
      document.head.appendChild(printStyles);

      // Step 3: Wait for styles to apply
      console.log('📄 Applying enhanced print styles...');
      await new Promise(resolve => setTimeout(resolve, 500));

      // Step 4: Execute print with proper handling
      const printPromise = new Promise<void>((resolve) => {
        let resolved = false;

        const handleAfterPrint = () => {
          if (resolved) return;
          resolved = true;
          console.log('✅ Print completed successfully');
          window.removeEventListener('afterprint', handleAfterPrint);
          cleanup();
          toast.success("Dokumen berhasil dicetak");
          resolve();
        };

        // Add event listener for print completion
        window.addEventListener('afterprint', handleAfterPrint, { once: true });

        // Fallback timeout
        printTimeoutRef.current = setTimeout(() => {
          if (!resolved) {
            console.log('⏰ Print timeout - assuming completed');
            handleAfterPrint();
          }
        }, 20000); // Extended timeout for complex documents

        // Execute print
        setTimeout(() => {
          console.log('🖨️ Executing window.print() with enhanced formatting');
          try {
            window.print();
          } catch (error) {
            console.error('Print execution error:', error);
            handleAfterPrint();
          }
        }, 300);
      });

      await printPromise;

    } catch (error) {
      console.error("❌ Print error:", error);
      cleanup();
      toast.error(`Gagal mencetak dokumen: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }, [isPrinting, cleanup]);

  const handleBack = useCallback(() => {
    router.back();
  }, [router]);

  // Cleanup on component unmount
  useEffect(() => {
    return () => {
      cleanup();
    };
  }, [cleanup]);

  return (
    <Card className="border-0 shadow-lg bg-gradient-to-r from-white/90 to-blue-50/90 backdrop-blur-sm">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          {/* Left side - Status and info */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-100 text-blue-600">
                <FileText className="h-5 w-5" />
              </div>
              <div>
                <h2 className="font-semibold text-lg">Preview Nota Dinas</h2>
              </div>
            </div>

            <Badge variant="secondary" className="ml-4">
              <Eye className="h-3 w-3 mr-1" />
              Draft Preview
            </Badge>
          </div>

          {/* Right side - Action buttons */}
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              onClick={handleBack}
              className="gap-2"
              disabled={isPersisting || isPrinting}
            >
              <ArrowLeft className="h-4 w-4" />
              Kembali
            </Button>

            <Button
              variant="outline"
              onClick={handlePrint}
              disabled={isPrinting || isPersisting}
              className="gap-2 relative"
            >
              {isPrinting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-current border-t-transparent" />
                  Menyiapkan Print...
                </>
              ) : (
                <>
                  <Printer className="h-4 w-4" />
                  Cetak
                </>
              )}
            </Button>

            <Button
              onClick={handleSave}
              disabled={isPersisting || isPrinting}
              className="gap-2 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white shadow-lg shadow-green-500/25"
            >
              {isPersisting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white/30 border-t-white" />
                  Menyimpan...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  Simpan Nota
                </>
              )}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
