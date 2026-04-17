import type { Post } from "@/data/posts";
import { createClientReportPrintTemplate } from "@/lib/clientReportPrintTemplate";

function sanitizeFilename(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") || "relatorio-cliente";
}

interface ExportClientReportPdfOptions {
  clientName: string;
  posts: Post[];
  exportedAt?: Date;
  filtersApplied?: boolean;
  avatarUrl?: string | null;
}

async function toDataUrl(url: string): Promise<string | null> {
  try {
    const res = await fetch(url, { mode: "cors" });
    if (!res.ok) return null;
    const blob = await res.blob();
    return await new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(typeof reader.result === "string" ? reader.result : null);
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

export async function exportClientReportPdf({
  clientName,
  posts,
  exportedAt = new Date(),
  filtersApplied = false,
  avatarUrl = null,
}: ExportClientReportPdfOptions) {
  if (typeof window === "undefined" || typeof document === "undefined") {
    throw new Error("PDF export is only available in the browser.");
  }

  const printFrame = document.createElement("iframe");
  printFrame.setAttribute("aria-hidden", "true");
  printFrame.style.position = "fixed";
  printFrame.style.right = "0";
  printFrame.style.bottom = "0";
  printFrame.style.width = "0";
  printFrame.style.height = "0";
  printFrame.style.border = "0";

  document.body.appendChild(printFrame);

  const printDocument = printFrame.contentDocument;
  const printWindow = printFrame.contentWindow;

  if (!printDocument || !printWindow) {
    printFrame.remove();
    throw new Error("Could not open the print document.");
  }

  const avatarDataUrl = avatarUrl ? await toDataUrl(avatarUrl) : null;

  printDocument.open();
  printDocument.write(
    createClientReportPrintTemplate({
      clientName,
      posts,
      exportedAt,
      filtersApplied,
      avatarDataUrl,
    }),
  );
  printDocument.close();
  printDocument.title = `${sanitizeFilename(clientName)}-relatorio-fiel`;

  if ("fonts" in printDocument) {
    try {
      await printDocument.fonts.ready;
    } catch {
      // noop
    }
  }

  await new Promise((resolve) => printWindow.requestAnimationFrame(() => resolve(null)));
  await new Promise((resolve) => window.setTimeout(resolve, 150));

  const cleanup = () => {
    window.setTimeout(() => {
      printFrame.remove();
    }, 300);
  };

  printWindow.addEventListener("afterprint", cleanup, { once: true });
  window.setTimeout(cleanup, 60000);
  printWindow.focus();
  printWindow.print();
}