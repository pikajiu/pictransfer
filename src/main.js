import './style.css';

const photos = document.querySelector('#photos');
const enhance = document.querySelector('#enhance');
const exportPdf = document.querySelector('#export');
const results = document.querySelector('#results');
const items = document.querySelector('#items');
const status = document.querySelector('#status');
const promptText = document.querySelector('#prompt-text');
const entries = [];
let processing = false;
let exporting = false;

function element(tag, text, parent) {
  const node = document.createElement(tag);
  node.textContent = text;
  parent?.append(node);
  return node;
}

function button(label, parent, action, disabled = false) {
  const node = element('button', label, parent);
  node.className = 'secondary';
  node.disabled = disabled;
  node.onclick = action;
}

function preview(parent, url, label) {
  const figure = element('figure', '', parent);
  const image = element('img', '', figure);
  image.src = url;
  image.alt = label;
  const caption = element('figcaption', label, figure);
  image.onload = () => {
    caption.textContent = `${label} · ${image.naturalWidth} × ${image.naturalHeight}`;
  };
}

async function importResult(entry, file) {
  if (!file) return;
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type) || file.size > 15 * 1024 * 1024) {
    status.textContent = '请选择不超过 15 MB 的 JPG、PNG 或 WebP 修图结果。';
    return;
  }
  const inputUrl = URL.createObjectURL(file);
  entry.importing = true;
  render();
  try {
    const image = new Image();
    image.src = inputUrl;
    await image.decode();
    let result = file;
    if (file.type === 'image/webp') {
      const canvas = document.createElement('canvas');
      canvas.width = image.naturalWidth;
      canvas.height = image.naturalHeight;
      canvas.getContext('2d').drawImage(image, 0, 0);
      result = await new Promise((resolve) => canvas.toBlob(resolve, 'image/png'));
      if (!result) throw new Error('Conversion failed');
    }
    if (!entries.includes(entry)) return;
    if (entry.resultUrl) URL.revokeObjectURL(entry.resultUrl);
    entry.result = result;
    entry.resultUrl = URL.createObjectURL(result);
    entry.resultLabel = '导入的修图结果';
    entry.selected = true;
    status.textContent = `已导入 ${file.name}`;
  } catch {
    status.textContent = '无法读取修图结果，请换一张图片。';
  } finally {
    entry.importing = false;
    URL.revokeObjectURL(inputUrl);
    render();
  }
}

function move(index, offset) {
  const target = index + offset;
  [entries[index], entries[target]] = [entries[target], entries[index]];
  render();
  items.children[target].querySelector(offset < 0 ? '[data-up]' : '[data-down]')?.focus();
}

function render() {
  results.hidden = entries.length === 0;
  enhance.disabled = processing || entries.some((entry) => entry.importing) || !entries.some((entry) => !entry.result);
  exportPdf.disabled = exporting || !entries.some((entry) => entry.selected);
  items.replaceChildren();
  entries.forEach((entry, index) => {
    const item = element('li', '', items);
    element('strong', entry.file.name, item).className = 'file-name';
    const comparison = element('div', '', item);
    comparison.className = 'comparison';
    preview(comparison, entry.originalUrl, '原图');
    if (entry.result) preview(comparison, entry.resultUrl, entry.resultLabel);
    const row = element('div', '', item);
    row.className = 'row';
    const importInput = document.createElement('input');
    importInput.type = 'file';
    importInput.accept = 'image/jpeg,image/png,image/webp';
    importInput.onchange = () => importResult(entry, importInput.files[0]);
    button(entry.result ? '替换修图结果' : '导入修图结果', row, () => importInput.click(), processing || entry.importing);
    if (entry.result) {
      const label = element('label', '', row);
      const checkbox = element('input', '', label);
      checkbox.type = 'checkbox';
      checkbox.checked = entry.selected;
      label.append(' 加入 PDF');
      checkbox.onchange = () => {
        entry.selected = checkbox.checked;
        exportPdf.disabled = exporting || !entries.some((photo) => photo.selected);
      };
    } else {
      element('span', entry.message || '等待增强', row);
      if (entry.failed) button('重试', row, () => processEntries([entry]), processing);
    }
    button('上移', row, () => move(index, -1), index === 0);
    row.lastElementChild.dataset.up = '';
    button('下移', row, () => move(index, 1), index === entries.length - 1);
    row.lastElementChild.dataset.down = '';
    button('移除', row, () => {
      URL.revokeObjectURL(entry.originalUrl);
      if (entry.resultUrl) URL.revokeObjectURL(entry.resultUrl);
      entries.splice(entries.indexOf(entry), 1);
      render();
    }, processing);
  });
}

photos.onchange = async () => {
  const files = Array.from(photos.files);
  photos.value = '';
  photos.disabled = true;
  const notes = [];
  for (const file of files) {
    if (entries.length >= 5) {
      notes.push('最多保留 5 张照片。');
      break;
    }
    if (!['image/jpeg', 'image/png'].includes(file.type) || file.size > 2 * 1024 * 1024) {
      notes.push(`${file.name}：请选择不超过 2 MB 的 JPG 或 PNG。`);
      continue;
    }
    const image = new Image();
    image.src = URL.createObjectURL(file);
    try {
      await image.decode();
      entries.push({ file, originalUrl: image.src, selected: false });
    } catch {
      URL.revokeObjectURL(image.src);
      notes.push(`${file.name}：无法打开图片。`);
    }
  }
  status.textContent = notes.join(' ');
  photos.disabled = false;
  render();
};

enhance.onclick = () => processEntries(entries.filter((entry) => !entry.result));
document.querySelector('#copy-prompt').onclick = async () => {
  try {
    await navigator.clipboard.writeText(promptText.textContent.trim());
    status.textContent = '已复制修图指令。';
  } catch {
    promptText.parentElement.open = true;
    status.textContent = '请选中并复制修图指令。';
  }
};

async function processEntries(queue) {
  if (processing || entries.some((entry) => entry.importing)) return;
  processing = true;
  try {
    for (const entry of queue) {
      entry.failed = false;
      entry.message = '增强中…';
      status.textContent = `正在增强 ${entry.file.name}`;
      render();
      let resultUrl;
      try {
        const { enhancePhoto } = await import('./enhance.js');
        const blob = await enhancePhoto(entry.originalUrl, (percent) => {
          status.textContent = `正在增强 ${entry.file.name} · ${percent}%`;
        });
        const image = new Image();
        resultUrl = URL.createObjectURL(blob);
        image.src = resultUrl;
        await image.decode();
        entry.result = blob;
        entry.resultUrl = resultUrl;
        entry.resultLabel = '本机增强图';
        entry.selected = true;
      } catch (failure) {
        if (resultUrl) URL.revokeObjectURL(resultUrl);
        entry.failed = true;
        entry.message = failure.message || '增强失败，请重试。';
      }
    }
    status.textContent = `本次增强完成 ${queue.filter((entry) => entry.result).length} / ${queue.length} 张。`;
  } finally {
    processing = false;
    render();
  }
}

exportPdf.onclick = async () => {
  const selected = entries.filter((entry) => entry.selected).map((entry) => entry.result);
  exporting = true;
  exportPdf.disabled = true;
  try {
    const { makePdf } = await import('./pdf.js');
    const bytes = await makePdf(selected);
    const url = URL.createObjectURL(new Blob([bytes], { type: 'application/pdf' }));
    const link = element('a', '', document.body);
    link.href = url;
    link.download = '增强照片.pdf';
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 30000);
  } catch {
    status.textContent = 'PDF 导出失败，请重试。';
  } finally {
    exporting = false;
    exportPdf.disabled = !entries.some((entry) => entry.selected);
  }
};
