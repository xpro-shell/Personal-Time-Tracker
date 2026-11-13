import fs from 'fs';
import path from 'path';
import zlib from 'zlib';

function crc32(buf) {
  let table = [];
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) {
      if (c & 1) c = 0xedb88320 ^ (c >>> 1);
      else c = c >>> 1;
    }
    table[n] = c;
  }

  let crc = 0 ^ (-1);
  for (let i = 0; i < buf.length; i++) {
    crc = (crc >>> 8) ^ table[(crc ^ buf[i]) & 0xff];
  }
  return (crc ^ (-1)) >>> 0;
}

function makeChunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const typeBuf = Buffer.from(type, 'ascii');
  const crcBuf = Buffer.alloc(4);
  const crcVal = crc32(Buffer.concat([typeBuf, data]));
  crcBuf.writeUInt32BE(crcVal, 0);
  return Buffer.concat([len, typeBuf, data, crcBuf]);
}

function createPng(width, height, isMaskable = false) {
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  // IHDR
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // 8-bit depth
  ihdr[9] = 6; // RGBA color type
  ihdr[10] = 0; // compression
  ihdr[11] = 0; // filter
  ihdr[12] = 0; // interlace
  const ihdrChunk = makeChunk('IHDR', ihdr);

  // Raw image data with filter byte (0) per row
  const rowSize = 1 + width * 4;
  const rawData = Buffer.alloc(rowSize * height);

  const cx = width / 2;
  const cy = height / 2;
  const outerR = isMaskable ? width * 0.48 : width * 0.44;
  const innerR = isMaskable ? width * 0.38 : width * 0.36;

  for (let y = 0; y < height; y++) {
    const rowOffset = y * rowSize;
    rawData[rowOffset] = 0; // filter None

    for (let x = 0; x < width; x++) {
      const pxOffset = rowOffset + 1 + x * 4;
      const dx = x - cx;
      const dy = y - cy;
      const dist = Math.sqrt(dx * dx + dy * dy);

      // Background color: #09090b (Dark canvas)
      let r = 9;
      let g = 9;
      let b = 11;
      let a = 255;

      if (!isMaskable && dist > outerR + 2) {
        // Outside circle transparent for standard icon
        a = 0;
      } else if (dist <= outerR && dist > innerR) {
        // Outer dark ring (#18181b / #27272a)
        r = 39;
        g = 39;
        b = 42;
      } else if (dist <= innerR) {
        // Inner clock face (#141416)
        r = 20;
        g = 20;
        b = 22;

        // Clock hands (Minimalist white stopwatch hands)
        // Hour hand pointing to 2 o'clock (~60 deg)
        // Minute hand pointing to 10 o'clock (~300 deg)
        const angle = Math.atan2(dy, dx); // -pi to pi

        // Center hub
        if (dist <= width * 0.04) {
          r = 255;
          g = 255;
          b = 255;
        }
        // Clock tick at top (12 o'clock)
        else if (Math.abs(dx) <= width * 0.015 && dy < 0 && dist >= innerR * 0.75 && dist <= innerR * 0.92) {
          // Amber tick accent (#f59e0b)
          r = 245;
          g = 158;
          b = 11;
        }
        // Minute Hand pointing to 10:10 (angle ~ -2.4 rad)
        else if (
          dist <= innerR * 0.7 &&
          Math.abs(dx * Math.sin(-2.3) - dy * Math.cos(-2.3)) < width * 0.02 &&
          dx * Math.cos(-2.3) + dy * Math.sin(-2.3) > 0
        ) {
          r = 250;
          g = 250;
          b = 250;
        }
        // Hour Hand pointing to 14:00 (angle ~ -0.6 rad)
        else if (
          dist <= innerR * 0.5 &&
          Math.abs(dx * Math.sin(-0.6) - dy * Math.cos(-0.6)) < width * 0.025 &&
          dx * Math.cos(-0.6) + dy * Math.sin(-0.6) > 0
        ) {
          r = 240;
          g = 240;
          b = 245;
        }
        // Crimson Red accent dot (#ef4444) at 6 o'clock (representing desk focus quota / lost time alert)
        else if (Math.abs(dx) <= width * 0.02 && Math.abs(dy - innerR * 0.7) <= width * 0.02) {
          r = 239;
          g = 68;
          b = 68;
        }
      }

      rawData[pxOffset] = r;
      rawData[pxOffset + 1] = g;
      rawData[pxOffset + 2] = b;
      rawData[pxOffset + 3] = a;
    }
  }

  const compressedData = zlib.deflateSync(rawData);
  const idatChunk = makeChunk('IDAT', compressedData);
  const iendChunk = makeChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

const publicDir = path.resolve('public');
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

// Generate PNG icons
fs.writeFileSync(path.join(publicDir, 'pwa-192x192.png'), createPng(192, 192, false));
fs.writeFileSync(path.join(publicDir, 'pwa-512x512.png'), createPng(512, 512, false));
fs.writeFileSync(path.join(publicDir, 'pwa-maskable-512x512.png'), createPng(512, 512, true));
fs.writeFileSync(path.join(publicDir, 'apple-touch-icon.png'), createPng(180, 180, false));

console.log('PWA PNG icons generated successfully in public/');
