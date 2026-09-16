import * as esbuild from 'esbuild';
import { statSync, createReadStream } from 'node:fs';
import { createGzip } from 'node:zlib';

async function build() {
  await esbuild.build({
    entryPoints: ['src/index.js'],
    bundle: true,
    minify: true,
    sourcemap: true,
    target: ['es2020'],
    format: 'iife',
    outfile: 'dist/t.min.js',
    legalComments: 'none'
  });

  // Calculate compressed bundle size
  const rawSize = statSync('dist/t.min.js').size;
  const gzipStream = createGzip();
  const fileStream = createReadStream('dist/t.min.js');
  let gzipSize = 0;

  fileStream.pipe(gzipStream)
    .on('data', chunk => { gzipSize += chunk.length; })
    .on('end', () => {
      console.log(`Bundle built successfully!`);
      console.log(`Raw size: ${(rawSize / 1024).toFixed(2)} KB`);
      console.log(`Gzip size: ${(gzipSize / 1024).toFixed(2)} KB`);
      if (gzipSize > 5 * 1024) {
        console.error('Error: Bundle size exceeds 5 KB limit!');
        process.exit(1);
      }
    });
}

build().catch(() => process.exit(1));
