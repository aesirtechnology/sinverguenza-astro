import rss from '@astrojs/rss';
import type { APIRoute } from 'astro';
import { getPublishedPosts } from '../lib/public-blog';

export const GET: APIRoute = async (context) => {
  const posts = await getPublishedPosts();

  return rss({
    description:
      'Fresh stories and reflections from the Sin Vergüenza blog on healing, growth, and the first-gen experience.',
    items: posts.map((post) => ({
      description: post.excerpt,
      link: `/blog/${post.slug}`,
      pubDate: new Date(post.publishedAt || post.createdAt),
      title: post.title,
    })),
    site: context.site,
    title: 'Sin Vergüenza Blog RSS',
  });
};
