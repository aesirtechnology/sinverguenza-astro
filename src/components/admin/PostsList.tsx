import { useEffect, useState } from 'react';
import { deletePost, getAllPosts } from '../../lib/posts-api';
import type { BlogPostDocument } from '../../lib/blog-types';

export default function PostsList() {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [posts, setPosts] = useState<BlogPostDocument[]>([]);
  const [deletingSlug, setDeletingSlug] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadPosts() {
      try {
        setLoading(true);
        const allPosts = await getAllPosts();

        if (!cancelled) {
          setPosts(allPosts);
          setError(null);
        }
      } catch (loadError) {
        if (!cancelled) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : 'Unable to load posts.',
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadPosts();

    return () => {
      cancelled = true;
    };
  }, []);

  async function handleDelete(post: BlogPostDocument) {
    const confirmed = window.confirm(
      `Delete "${post.title}"? This cannot be undone.`,
    );

    if (!confirmed) {
      return;
    }

    try {
      setDeletingSlug(post.slug);
      await deletePost(post.slug);
      setPosts((currentPosts) =>
        currentPosts.filter((currentPost) => currentPost.id !== post.id),
      );
      setError(null);
    } catch (deleteError) {
      setError(
        deleteError instanceof Error
          ? deleteError.message
          : 'Unable to delete post.',
      );
    } finally {
      setDeletingSlug(null);
    }
  }

  return (
    <section className="admin-panel">
      <div className="admin-panel__header">
        <div>
          <h2>All Posts</h2>
          <p className="admin-panel__subcopy">
            Manage drafts and published stories from one place.
          </p>
        </div>
        <a className="admin-button admin-button--primary" href="/admin/posts/new">
          Create new post
        </a>
      </div>

      {loading ? <p>Loading posts…</p> : null}
      {error ? <div className="admin-panel admin-panel--error">{error}</div> : null}

      {!loading && posts.length === 0 ? (
        <p className="admin-empty-state">No posts yet.</p>
      ) : null}

      {!loading && posts.length > 0 ? (
        <div className="admin-table-wrapper">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Title</th>
                <th>Status</th>
                <th>Author</th>
                <th>Updated</th>
                <th aria-label="Actions" />
              </tr>
            </thead>
            <tbody>
              {posts.map((post) => (
                <tr key={post.id}>
                  <td>
                    <div className="admin-table__title-cell">
                      <strong>{post.title}</strong>
                      <span>{post.slug}</span>
                    </div>
                  </td>
                  <td>
                    <span className={`admin-badge admin-badge--${post.status}`}>
                      {post.status}
                    </span>
                  </td>
                  <td>{post.author}</td>
                  <td>{new Date(post.updatedAt).toLocaleString()}</td>
                  <td>
                    <div className="admin-table__actions">
                      <a
                        className="admin-button"
                        href={`/admin/posts/edit/${post.id}`}
                      >
                        Edit
                      </a>
                      <button
                        className="admin-button admin-button--danger"
                        disabled={deletingSlug === post.slug}
                        onClick={() => void handleDelete(post)}
                        type="button"
                      >
                        {deletingSlug === post.slug ? 'Deleting…' : 'Delete'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
    </section>
  );
}
