'use strict';

const fs = require('node:fs');
const path = require('node:path');
const sharp = require('sharp');

const MAX_INPUT_BYTES = Number(process.env.PRASAPP_IMAGE_MAX_BYTES || 8 * 1024 * 1024);
const MAX_DIMENSION = Number(process.env.PRASAPP_IMAGE_MAX_DIMENSION || 1600);
const AVIF_QUALITY = Number(process.env.PRASAPP_AVIF_QUALITY || 62);
const SUPPORTED_MIME = new Set(['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/avif']);

function assertImage(buffer, mimeType = '') {
  if (!Buffer.isBuffer(buffer) || !buffer.length) throw new Error('File gambar kosong.');
  if (buffer.length > MAX_INPUT_BYTES) throw new Error(`Ukuran gambar maksimal ${Math.floor(MAX_INPUT_BYTES / 1024 / 1024)} MB.`);
  if (mimeType && !SUPPORTED_MIME.has(String(mimeType).toLowerCase())) throw new Error('Format gambar harus JPG, PNG, WebP, atau AVIF.');
}

async function toAvif(buffer, options = {}) {
  assertImage(buffer, options.mimeType);
  return sharp(buffer, { failOn: 'error', limitInputPixels: 40_000_000 })
    .rotate()
    .resize({
      width: options.maxWidth || MAX_DIMENSION,
      height: options.maxHeight || MAX_DIMENSION,
      fit: 'inside',
      withoutEnlargement: true,
    })
    .avif({ quality: options.quality || AVIF_QUALITY, effort: 4 })
    .toBuffer();
}

async function writeAvif(buffer, directory, baseName, options = {}) {
  const output = await toAvif(buffer, options);
  fs.mkdirSync(directory, { recursive: true });
  const safeBase = String(baseName || 'image').replace(/[^a-zA-Z0-9._-]/g, '-').replace(/\.[^.]+$/, '');
  const fileName = `${safeBase}.avif`;
  const filePath = path.join(directory, fileName);
  fs.writeFileSync(filePath, output, { flag: options.exclusive ? 'wx' : 'w' });
  return { fileName, filePath, bytes: output.length, mimeType: 'image/avif' };
}

module.exports = { MAX_INPUT_BYTES, SUPPORTED_MIME, assertImage, toAvif, writeAvif };
