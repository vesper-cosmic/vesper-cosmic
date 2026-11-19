// Report PDFs the admin attaches when delivering a digital order. Pure checks.
// Vercel limits a request body to ~4.5 MB, so keep the total under 4 MB.

export const REPORT_MAX_TOTAL_BYTES = 4 * 1024 * 1024;
export const REPORT_MAX_FILES = 5;

/** A filename that is safe in an email: keeps letters, digits, dots, dashes, underscores, spaces. */
export function safeReportName(name, index = 0) {
  const base = String(name || "").split(/[\\/]/).pop().replace(/[^\w.\- 一-鿿()]/g, "_").trim();
  const withExt = /\.pdf$/i.test(base) ? base : `${base || `report-${index + 1}`}.pdf`;
  return withExt.slice(0, 100);
}

/**
 * files: [{ name, size, head }] where `head` is the first bytes as a string/Buffer.
 * @returns {{ ok: boolean, error?: string }}
 */
export function validateReportFiles(files) {
  const list = Array.isArray(files) ? files : [];
  if (list.length > REPORT_MAX_FILES) return { ok: false, error: `一次最多 ${REPORT_MAX_FILES} 個 PDF。` };
  let total = 0;
  for (const file of list) {
    const size = Number(file?.size) || 0;
    if (!(size > 0)) return { ok: false, error: `${file?.name || "檔案"} 是空的。` };
    if (String(file.head || "").slice(0, 4) !== "%PDF") return { ok: false, error: `${file?.name || "檔案"} 不是 PDF。` };
    total += size;
  }
  if (total > REPORT_MAX_TOTAL_BYTES) {
    return { ok: false, error: `PDF 合計 ${(total / 1048576).toFixed(1)} MB，超過 4 MB 上限。請壓縮，或改用下載連結貼在附加說明。` };
  }
  return { ok: true };
}
