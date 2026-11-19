import { describe, expect, it } from "vitest";
import { REPORT_MAX_TOTAL_BYTES, safeReportName, validateReportFiles } from "@/lib/reportFiles";

describe("report PDFs", () => {
  const pdf = (size, name = "r.pdf") => ({ name, size, head: "%PDF" });
  it("accepts PDFs within the limits", () => {
    expect(validateReportFiles([pdf(1000), pdf(2000)]).ok).toBe(true);
    expect(validateReportFiles([]).ok).toBe(true);
  });
  it("rejects non-PDFs, empty files, too many and too large", () => {
    expect(validateReportFiles([{ name: "a.pdf", size: 10, head: "GIF8" }]).ok).toBe(false);
    expect(validateReportFiles([pdf(0)]).ok).toBe(false);
    expect(validateReportFiles(Array.from({ length: 6 }, () => pdf(10))).ok).toBe(false);
    expect(validateReportFiles([pdf(REPORT_MAX_TOTAL_BYTES), pdf(1)]).ok).toBe(false);
  });
  it("makes safe filenames", () => {
    expect(safeReportName("../../etc/報告 Jane.pdf")).toBe("報告 Jane.pdf");
    expect(safeReportName("a<b>.txt")).toBe("a_b_.txt.pdf");
    expect(safeReportName("", 1)).toBe("report-2.pdf");
  });
});
