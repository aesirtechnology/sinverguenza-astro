import { useEffect, useState } from 'react';
import { getAllPosts } from '../../lib/posts-api';
import type { BlogPostDocument } from '../../lib/blog-types';

interface DashboardState {
  draftCount: number;
  publishedCount: number;
  recentPosts: BlogPostDocument[];
  totalCount: number;
}

export default function AdminDashboard() {
  const [data, setData] = useState<DashboardState | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function loadDashboard() {
      try {
        setLoading(true);
        const posts = await getAllPosts();

        if (cancelled) {
          return;
        }

        setData({
          draftCount: posts.filter((post) => post.status === 'draft').length,
          publishedCount: posts.filter((post) => post.status === 'published')
            .length,
          recentPosts: posts.slice(0, 5),
          totalCount: posts.length,
        });
        setError(null);
      } catch (loadError) {
        if (cancelled) {
          return;
        }

        setError(
          loadError instanceof Error
            ? loadError.message
            : 'Unable to load dashboard data.',
        );
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadDashboard();

    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return <div className="admin-panel">Loading dashboard…</div>;
  }

  if (error) {
    return <div className="admin-panel admin-panel--error">{error}</div>;
  }

  if (!data) {
    return null;
  }

  return (
    <div className="admin-stack">
      <div className="admin-card-grid">
        <article className="admin-stat-card">
          <span className="admin-stat-card__label">Published</span>
          <strong className="admin-stat-card__value">{data.publishedCount}</strong>
        </article>
        <article className="admin-stat-card">
          <span className="admin-stat-card__label">Drafts</span>
          <strong className="admin-stat-card__value">{data.draftCount}</strong>
        </article>
        <article className="admin-stat-card">
          <span className="admin-stat-card__label">Total Posts</span>
          <strong className="admin-stat-card__value">{data.totalCount}</strong>
        </article>
      </div>

      <section className="admin-panel">
        <div className="admin-panel__header">
          <h2>Recently Updated</h2>
          <a className="admin-link" href="/admin/posts">
            View all posts
          </a>
        </div>

        {data.recentPosts.length === 0 ? (
          <p className="admin-empty-state">No posts yet. Start your first draft.</p>
        ) : (
          <div className="admin-list">
            {data.recentPosts.map((post) => (
              <article className="admin-list__item" key={post.id}>
                <div>
                  <a className="admin-list__title" href={`/admin/posts/edit/${post.id}`}>
                    {post.title}
                  </a>
                  <p className="admin-list__meta">
                    {post.author} · {new Date(post.updatedAt).toLocaleString()}
                  </p>
                </div>
                <span
                  className={`admin-badge admin-badge--${post.status}`}
                >
                  {post.status}
                </span>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
