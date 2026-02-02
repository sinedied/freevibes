import { resolve } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export default {
  base: '/freevibes/',
  build: {
    outDir: resolve(__dirname, '../../dist'),
    emptyOutDir: true,
    sourcemap: true
  }
};
