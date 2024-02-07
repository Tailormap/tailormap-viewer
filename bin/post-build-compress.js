const path = require('path');
const fs = require('fs');
const zlib = require("zlib");
const chalk = require('chalk');

const EXTENSIONS = ['.js', '.css', '.svg', '.map'];
const COMPRESS_SIZE_THRESHOLD = 1024;
const BR_VS_GZ_SIZE_THRESHOLD = 500;

// recursive option requires Node v20
const files = fs.readdirSync(path.resolve(__dirname, '../dist/app/'), { recursive: true, withFileTypes: true })
  .filter(entry => entry.isFile())
  .filter(entry => EXTENSIONS.includes(path.extname(entry.name)))
  .map(entry => ({
    filename: path.join(entry.path, entry.name),
    displayName: path.join(entry.path, entry.name).split('/dist/')[1],
  }));

const displayNamePad = files.reduce((previous, current) => Math.max(previous, current.displayName.length), 0) - 2;

let bundleTotal = 0;
let compressedTotal = 0;
files.forEach(entry => {
  const { size } = fs.statSync(entry.filename);
  if (size > COMPRESS_SIZE_THRESHOLD) {
    const isSourceMap = path.extname(entry.filename) === '.map';

    process.stdout.write(`Compressing ${entry.displayName.padEnd(displayNamePad, ' ')} size ${(size + "").padStart(7, ' ')}... `);

    const contents = fs.readFileSync(entry.filename);

    const gzipped = zlib.gzipSync(contents, { level: 9 });
    fs.writeFileSync(entry.filename + ".gz", gzipped);

    let writeBrotli = false;
    let brotliLength = 0;
    let gzipMinusBrotliLength = 0;
    // Don't waste time compressing source maps with Brotli
    if (!isSourceMap) {
      const brotli = zlib.brotliCompressSync(contents, {
        params: {
          [zlib.constants.BROTLI_PARAM_QUALITY]: zlib.constants.BROTLI_MAX_QUALITY
        }
      });

      brotliLength = brotli.length;
      gzipMinusBrotliLength = gzipped.length - brotli.length;
      writeBrotli = gzipMinusBrotliLength > BR_VS_GZ_SIZE_THRESHOLD;
      if (writeBrotli) {
        fs.writeFileSync(entry.filename + ".br", brotli);
      }
    }

    const gzRatio = (gzipped.length / size).toFixed(2);
    if (!isSourceMap) {
      const brRatio = (brotliLength / size).toFixed(2);
      const chalkFn = writeBrotli ? chalk.green : chalk.gray;
      process.stdout.write(`gzip ${chalk.bold(gzRatio)}, br ${chalkFn(chalk.bold(brRatio))}, br > gzip: ${chalkFn((gzipMinusBrotliLength + "").padStart(5, ' '))}\n`);
    } else {
      process.stdout.write(`gzip ${chalk.bold(gzRatio)}\n`);
    }
    if (entry.displayName.startsWith('app/en/') && !isSourceMap) {
      bundleTotal += size;
      compressedTotal += (writeBrotli ? brotliLength : gzipped.length);
    }
  }
});

console.log(`Total single bundle ratio: ${chalk.green(chalk.bold((compressedTotal / bundleTotal).toFixed(2)))}, saved ${chalk.bold(((bundleTotal - compressedTotal) / 1024).toFixed(0))} KiB`);

