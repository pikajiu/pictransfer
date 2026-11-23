import { PDFDocument } from 'pdf-lib';

export async function makePdf(photos) {
  const pdf = await PDFDocument.create();
  const margin = 24;
  for (const photo of photos) {
    const bytes = await photo.arrayBuffer();
    const image = photo.type === 'image/png' ? await pdf.embedPng(bytes) : await pdf.embedJpg(bytes);
    const dimensions = image.width > image.height ? [842, 595] : [595, 842];
    const page = pdf.addPage(dimensions);
    const { width, height } = image.scaleToFit(dimensions[0] - 2 * margin, dimensions[1] - 2 * margin);
    page.drawImage(image, { x: (dimensions[0] - width) / 2, y: (dimensions[1] - height) / 2, width, height });
  }
  return pdf.save();
}
