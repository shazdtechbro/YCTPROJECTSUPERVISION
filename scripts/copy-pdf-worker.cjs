const { copyFileSync } = require("node:fs");

copyFileSync(require.resolve("pdfjs-dist/build/pdf.worker.min.mjs"), "public/pdf.worker.min.mjs");
