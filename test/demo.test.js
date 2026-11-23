import assert from 'node:assert/strict';
import { test } from 'node:test';
import { PDFDocument } from 'pdf-lib';
import { makePdf } from '../src/pdf.js';

const [landscape, portrait, wide] = [
  'iVBORw0KGgoAAAANSUhEUgAAAAMAAAACCAIAAAASFvFNAAAAEElEQVR4nGP8zwAFTDAGAwATKQED8NgHhAAAAABJRU5ErkJggg==',
  'iVBORw0KGgoAAAANSUhEUgAAAAIAAAADCAIAAAA2iEnWAAAAE0lEQVR4nGNkaGBgYGBgAhFwCgAJ1ACGLEmEsAAAAABJRU5ErkJggg==',
  'iVBORw0KGgoAAAANSUhEUgAAAAcAAAAFCAIAAAAG+GGPAAAAFElEQVR4nGNkYPjPgAGYMIWoIgoAbSkBCb17g1cAAAAASUVORK5CYII=',
].map((value) => Buffer.from(value, 'base64'));

test('PDF follows selection order and page orientation', async () => {
  const photos = [portrait, wide, landscape].map((bytes) => new Blob([bytes], { type: 'image/png' }));
  const pdf = await PDFDocument.load(await makePdf(photos));
  assert.deepEqual(pdf.getPages().map((page) => page.getSize()), [
    { width: 595, height: 842 }, { width: 842, height: 595 }, { width: 842, height: 595 },
  ]);
  const single = await PDFDocument.load(await makePdf(photos.slice(0, 1)));
  assert.equal(single.getPageCount(), 1);
});
