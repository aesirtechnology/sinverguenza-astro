import { defineConfig } from 'astro/config';
import node from '@astrojs/node';
import react from '@astrojs/react';
import sitemap from '@astrojs/sitemap';

async function resolveAdapter() {
  try {
    const azureModule = await import('@astrojs/azure');
    return azureModule.default();
  } catch {
    return node({ mode: 'standalone' });
  }
}

export default defineConfig({
  site: 'https://sinverguenzapodcast.com',
  output: 'hybrid',
  adapter: await resolveAdapter(),
  integrations: [
    react(),
    sitemap(),
  ],
});
