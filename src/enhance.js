import Upscaler from 'upscaler';
import model from '@upscalerjs/esrgan-slim/2x';

let engine;

export async function enhancePhoto(url, onProgress) {
  const image = new Image();
  image.src = url;
  await image.decode();
  const scale = Math.min(1, 1024 / Math.max(image.naturalWidth, image.naturalHeight));
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
  canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
  const context = canvas.getContext('2d');
  context.fillStyle = '#fff';
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.drawImage(image, 0, 0, canvas.width, canvas.height);

  try {
    engine ??= new Upscaler({
      model: { ...model, path: new URL('./model.json', document.baseURI).href },
    });
    const dataUrl = await engine.upscale(canvas, {
      patchSize: 64,
      padding: 8,
      progress: (fraction) => onProgress(Math.round(fraction * 100)),
    });
    return await (await fetch(dataUrl)).blob();
  } catch (error) {
    console.error('Local AI processing failed', error);
    engine = undefined;
    throw new Error('本机未能完成增强，请重试或换一张较小的照片。');
  }
}
