import { defineConfig } from 'astro/config';
import node from '@astrojs/node';
import react from '@astrojs/react';

async function resolveAdapter() {
  try {
    const azureModule = await import('@astrojs/azure');
    return azureModule.default();
  } catch {
    return node({ mode: 'standalone' });
  }
}

export default defineConfig({
  site: 'https://www.sinverguenzapodcast.com',
  output: 'hybrid',
  adapter: await resolveAdapter(),
  integrations: [
    react(),
  ],
});
