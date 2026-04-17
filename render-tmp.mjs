import { chromium } from 'playwright';
const b = await chromium.launch();
const p = await b.newPage();
await p.goto('file:///tmp/pdfqa/report.html', { waitUntil: 'networkidle' });
await p.pdf({ path: '/tmp/pdfqa/report.pdf', format: 'A4', printBackground: true });
await b.close();
