import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const config = {
	base: '/freevibes/',
	build: {
		outDir: path.resolve(__dirname, '../../dist'),
		emptyOutDir: true,
		sourcemap: true,
	},
};

export default config;
