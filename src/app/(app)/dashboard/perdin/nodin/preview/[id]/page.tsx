import { notFound, redirect } from "next/navigation";
import { getNotaDraft } from "@/server/perdin/preview";
import { PreviewActions } from "../../_components/preview-actions";
import { NotaPreview } from "../../_components/nota-preview";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function PreviewPage(props: Props) {
  const params = await props.params;

  // Validasi format draftId (UUID)
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(params.id)) {
    console.error("Invalid draft ID format:", params.id);
    notFound();
  }

  let resolvedData;

  try {
    console.log("Loading preview page for draft ID:", params.id);
    resolvedData = await getNotaDraft(params.id);

    console.log("Preview page loaded with resolved data:", {
      nomor: resolvedData.nomor,
      tujuanCount: resolvedData.tujuanList.length,
      pesertaCount: resolvedData.pesertaList.length,
      hasYthPejabat: !!resolvedData.ythPejabat,
      hasDariPejabat: !!resolvedData.dariPejabat,
      hasKegiatan: !!resolvedData.kegiatanData,
      hasSubKegiatan: !!resolvedData.subKegiatanData,
    });

    if (!resolvedData.nomor || !resolvedData.tanggal) {
      console.error("Invalid draft data - missing required fields");
      throw new Error("Data draft tidak valid");
    }

  } catch (error) {
    console.error("Error loading draft:", error);

    if (error instanceof Error) {
      if (error.message.includes("Draft tidak ditemukan")) {
        console.log("Draft not found, redirecting to new form");
        redirect("/dashboard/perdin/nodin/add");
      }
    }

    notFound();
  }

  return (
    <div className="min-h-screen bg-gray-50 preview-page">
      {/* Screen-only header actions */}
      <div className="no-print py-8">
        <div className="container mx-auto px-4">
          <div className="mb-8">
            <PreviewActions draftId={params.id} />
          </div>
        </div>
      </div>

      {/* Print container - This is what gets printed */}
      <div className="print-container">
        <NotaPreview data={resolvedData} mode="preview" />
      </div>
    </div>
  );
}
