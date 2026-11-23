# 清晰成册

批量选择 JPG 或 PNG，在浏览器中用 ESRGAN Slim 做 2 倍超分，再按选定顺序导出 PDF。一张图一页。照片和导出的 PDF 都留在当前设备。

也可以先在豆包、ChatGPT 或 Codex 中手动修图，再把保存的结果导回对应照片。网页提供修图指令，支持导入 JPG、PNG 和 WebP，导入后可对比、排序并合成 PDF。选择外部工具时，照片由用户自行上传到该工具。

## 本地使用

使用 Node.js 22 运行以下命令。Windows PowerShell 可将 `npm` 换成 `npm.cmd`。

```sh
npm ci
npm run dev
npm test
npm run build
```

生产产物在 `dist/`，包含模型权重及应用资源。GitHub Pages 从 `gh-pages` 分支根目录发布。更新站点时，重新构建并把产物同步到该分支，保留空的 `.nojekyll` 文件。

一次最多 5 张，每张 2 MB。长边超过 1024 像素的照片先缩小再增强，透明区域以白色填充。模型适用于通用照片放大，过度模糊的文字和人脸细节无法保证准确恢复。

超分模型来自 [UpscalerJS ESRGAN Slim](https://upscalerjs.com/models/available/upscaling/esrgan-slim/)，采用 MIT 许可证。
