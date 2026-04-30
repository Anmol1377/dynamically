import sharp from 'sharp';
import { writeFileSync } from 'node:fs';

async function main() {
  const buffer = await sharp({
    create: { width: 800, height: 450, channels: 3, background: { r: 30, g: 100, b: 200 } },
  })
    .composite([
      {
        input: Buffer.from(
          `<svg width="800" height="450"><text x="50%" y="50%" font-family="sans-serif" font-size="56" fill="white" text-anchor="middle" dominant-baseline="middle">Dynamically</text></svg>`
        ),
        top: 0,
        left: 0,
      },
    ])
    .jpeg({ quality: 80 })
    .toBuffer();

  writeFileSync('/tmp/dynamically-test.jpg', buffer);
  console.log(`wrote /tmp/dynamically-test.jpg (${buffer.length} bytes, 800x450)`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
