import pdfParse from "pdf-parse";
console.log("TS Type of pdf-parse import:", typeof pdfParse);
console.log("TS Import itself:", pdfParse);
try {
  // Check if it has .default
  const pdfParseObj = pdfParse as unknown as Record<string, unknown>;
  if (pdfParseObj.default) {
    console.log("TS .default exists, type:", typeof pdfParseObj.default);
  }
} catch (e) {
  console.error("Error in TS checks:", e);
}
