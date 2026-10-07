import { fileURLToPath } from 'node:url';

/** Working folder for writing descriptions (git-ignored, like the rest of output/). */
export const DESCRIPTIONS_DIR = fileURLToPath(new URL('../output/descriptions', import.meta.url));
