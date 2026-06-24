import pdfParse from "pdf-parse";
console.log("TS Type of pdf-parse import:", typeof pdfParse);
console.log("TS Import itself:", pdfParse);
try {
  // Check if it has .default
  const anyPdfParse = pdfParse as any;
  if (anyPdfParse.default) {
    console.log("TS .default exists, type:", typeof anyPdfParse.default);
  }
} catch (e) {
  console.error("Error in TS checks:", e);
}
