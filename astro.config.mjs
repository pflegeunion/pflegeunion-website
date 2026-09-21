// @ts-check
import { defineConfig } from 'astro/config';

// Statische Site ohne JavaScript im Browser, ohne externe Dienste.
export default defineConfig({
  site: 'https://pflegeunion.ch',
  output: 'static',
  build: {
    inlineStylesheets: 'always',
  },
});
