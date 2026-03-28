import { useEffect, useMemo, useRef, useState, type ChangeEvent } from 'react';
import { EditorContent, useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import Image from '@tiptap/extension-image';
import Placeholder from '@tiptap/extension-placeholder';
import {
  createPost,
  getPostById,
  triggerSiteRebuild,
  uploadImage,
  updatePost,
} from '../../lib/posts-api';
import type { BlogPostDocument, BlogPostInput } from '../../lib/blog-types';
import { parseTagInput, slugify } from '../../lib/blog-utils';
import ImageUploadField from './ImageUploadField';

interface PostEditorProps {
  mode: 'create' | 'edit';
  postId?: string;
}

interface PostFormState {
  author: string;
  body: string;
  excerpt: string;
  featuredImage: string;
  ogImage: string;
  publishedAt: string;
  seoDescription: string;
  seoTitle: string;
  slug: string;
  tagsInput: string;
  title: string;
}

const EMPTY_FORM: PostFormState = {
  author: '',
  body: '',
  excerpt: '',
  featuredImage: '',
  ogImage: '',
  publishedAt: '',
  seoDescription: '',
  seoTitle: '',
  slug: '',
  tagsInput: '',
  title: '',
};

const PUBLISH_REQUIRED_FIELDS: Array<{
  key: Exclude<keyof BlogPostInput, 'publishedAt' | 'status'> | 'body' | 'tags';
  label: string;
}> = [
  { key: 'title', label: 'Title' },
  { key: 'body', label: 'Body' },
  { key: 'slug', label: 'Slug' },
  { key: 'excerpt', label: 'Excerpt' },
  { key: 'author', label: 'Author' },
  { key: 'seoTitle', label: 'SEO Title' },
  { key: 'seoDescription', label: 'SEO Description' },
  { key: 'tags', label: 'Tags' },
  { key: 'featuredImage', label: 'Featured Image' },
  { key: 'ogImage', label: 'OG Image' },
];

function mapPostToForm(post: BlogPostDocument): PostFormState {
  return {
    author: post.author,
    body: post.body,
    excerpt: post.excerpt,
    featuredImage: post.featuredImage,
    ogImage: post.ogImage,
    publishedAt: post.publishedAt,
    seoDescription: post.seoDescription,
    seoTitle: post.seoTitle,
    slug: post.slug,
    tagsInput: post.tags.join(', '),
    title: post.title,
  };
}

function formatDateTimeLocal(value: string): string {
  if (!value) {
    return '';
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return '';
  }

  const offset = date.getTimezoneOffset();
  const localDate = new Date(date.getTime() - offset * 60_000);
  return localDate.toISOString().slice(0, 16);
}

function parseDateTimeLocal(value: string): string {
  if (!value) {
    return '';
  }

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '' : date.toISOString();
}

function hasMeaningfulBody(value: string): boolean {
  if (/<(img|video|iframe|embed|object|figure)\b/i.test(value)) {
    return true;
  }

  const textContent = value
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  return textContent.length > 0;
}

function createDraftSlug(title: string): string {
  return slugify(title) || `draft-${Date.now()}`;
}

function getMissingFields(
  payload: BlogPostInput,
  requireFullValidation: boolean,
): string[] {
  if (!requireFullValidation) {
    const missingFields: string[] = [];

    if (!payload.title) {
      missingFields.push('Title');
    }

    if (!payload.author) {
      missingFields.push('Author');
    }

    return missingFields;
  }

  return PUBLISH_REQUIRED_FIELDS.flatMap(({ key, label }) => {
    if (key === 'body') {
      return hasMeaningfulBody(payload.body) ? [] : [label];
    }

    if (key === 'tags') {
      return payload.tags.length > 0 ? [] : [label];
    }

    const value = payload[key];
    return typeof value === 'string' && value.trim() ? [] : [label];
  });
}

export default function PostEditor({ mode, postId }: PostEditorProps) {
  const [form, setForm] = useState<PostFormState>(EMPTY_FORM);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(mode === 'edit');
  const [isSaving, setIsSaving] = useState(false);
  const [manualSlug, setManualSlug] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [post, setPost] = useState<BlogPostDocument | null>(null);
  const [warning, setWarning] = useState<string | null>(null);
  const [isEditorImageUploading, setIsEditorImageUploading] = useState(false);
  const editorImageInputRef = useRef<HTMLInputElement | null>(null);

  const editor = useEditor({
    content: '<p></p>',
    editorProps: {
      attributes: {
        class: 'admin-editor__content',
      },
    },
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [2, 3, 4],
        },
      }),
      Link.configure({
        openOnClick: false,
      }),
      Image,
      Placeholder.configure({
        placeholder: 'Write your post here…',
      }),
    ],
    immediatelyRender: false,
    onUpdate({ editor: currentEditor }) {
      setForm((currentForm) => ({
        ...currentForm,
        body: currentEditor.getHTML(),
      }));
    },
  });

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const saved = params.get('saved');
    const rebuild = params.get('rebuild');

    if (saved === 'published' && rebuild === 'success') {
      setNotice(
        'Post saved! Site rebuild triggered — changes will be live in 1-2 minutes.',
      );
    }

    if (saved === 'published' && rebuild === 'failed') {
      setNotice('Post saved successfully.');
      setWarning(
        'The post was saved, but the site rebuild could not be triggered automatically. Please trigger it manually from the dashboard.',
      );
    }

    if (saved === 'draft') {
      setNotice('Draft saved successfully.');
    }

    if (saved) {
      params.delete('saved');
      params.delete('rebuild');
      const nextQuery = params.toString();
      const nextUrl = nextQuery
        ? `${window.location.pathname}?${nextQuery}`
        : window.location.pathname;

      window.history.replaceState({}, '', nextUrl);
    }
  }, []);

  useEffect(() => {
    if (mode !== 'edit') {
      return;
    }

    let cancelled = false;

    async function loadPost() {
      try {
        setIsLoading(true);
        const resolvedPostId =
          postId ??
          new URLSearchParams(window.location.search).get('id') ??
          undefined;

        if (!resolvedPostId) {
          throw new Error('A post ID is required to edit a post.');
        }

        const existingPost = await getPostById(resolvedPostId);

        if (cancelled) {
          return;
        }

        if (!existingPost) {
          throw new Error('Post not found.');
        }

        setPost(existingPost);
        setForm(mapPostToForm(existingPost));
        setManualSlug(true);
        setError(null);
      } catch (loadError) {
        if (!cancelled) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : 'Unable to load this post.',
          );
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    void loadPost();

    return () => {
      cancelled = true;
    };
  }, [mode, postId]);

  useEffect(() => {
    if (!editor) {
      return;
    }

    const nextContent = form.body || '<p></p>';

    if (editor.getHTML() !== nextContent) {
      editor.commands.setContent(nextContent, { emitUpdate: false });
    }
  }, [editor, form.body]);

  const currentStatus = useMemo(
    () => post?.status ?? 'draft',
    [post?.status],
  );

  function updateForm<K extends keyof PostFormState>(
    key: K,
    value: PostFormState[K],
  ) {
    setForm((currentForm) => ({
      ...currentForm,
      [key]: value,
    }));
  }

  function handleTitleChange(value: string) {
    setForm((currentForm) => ({
      ...currentForm,
      title: value,
      slug: manualSlug ? currentForm.slug : slugify(value),
    }));
  }

  function handleSlugModeChange(enabled: boolean) {
    if (mode === 'edit') {
      return;
    }

    setManualSlug(enabled);

    if (!enabled) {
      setForm((currentForm) => ({
        ...currentForm,
        slug: slugify(currentForm.title),
      }));
    }
  }

  function runPromptAction(type: 'image' | 'link') {
    if (!editor) {
      return;
    }

    if (type === 'image') {
      const imageUrl = window.prompt('Paste an image URL');
      if (imageUrl) {
        editor.chain().focus().setImage({ src: imageUrl }).run();
      }
      return;
    }

    const previousUrl = editor.getAttributes('link').href as string | undefined;
    const nextUrl = window.prompt('Paste a link URL', previousUrl ?? '');

    if (nextUrl === null) {
      return;
    }

    if (!nextUrl) {
      editor.chain().focus().unsetLink().run();
      return;
    }

    editor.chain().focus().extendMarkRange('link').setLink({ href: nextUrl }).run();
  }

  async function handleEditorImageUpload(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    if (!file || !editor) {
      return;
    }

    try {
      setIsEditorImageUploading(true);
      const { url } = await uploadImage(file);
      editor.chain().focus().setImage({ src: url }).run();
      setWarning(null);
    } catch (uploadError) {
      setWarning(
        uploadError instanceof Error
          ? uploadError.message
          : 'Unable to upload image.',
      );
    } finally {
      setIsEditorImageUploading(false);
      event.target.value = '';
    }
  }

  function buildPayload(status: 'draft' | 'published'): BlogPostInput {
    const normalizedSlug =
      status === 'draft' && !form.slug.trim()
        ? createDraftSlug(form.title)
        : form.slug.trim();
    const normalizedPublishedAt =
      status === 'published'
        ? form.publishedAt || post?.publishedAt || new Date().toISOString()
        : form.publishedAt;

    return {
      author: form.author.trim(),
      body: form.body,
      excerpt: form.excerpt.trim(),
      featuredImage: form.featuredImage.trim(),
      ogImage: form.ogImage.trim(),
      publishedAt: normalizedPublishedAt,
      seoDescription: form.seoDescription.trim(),
      seoTitle: form.seoTitle.trim(),
      slug: normalizedSlug,
      status,
      tags: parseTagInput(form.tagsInput),
      title: form.title.trim(),
    };
  }

  function shouldTriggerRebuild(
    previousPost: BlogPostDocument | null,
    nextStatus: 'draft' | 'published',
  ): boolean {
    return nextStatus === 'published' || previousPost?.status === 'published';
  }

  async function triggerRebuildWithFeedback(): Promise<boolean> {
    try {
      await triggerSiteRebuild();
      setNotice(
        'Post saved! Site rebuild triggered — changes will be live in 1-2 minutes.',
      );
      setWarning(null);
      return true;
    } catch (triggerError) {
      setNotice('Post saved successfully.');
      setWarning(
        triggerError instanceof Error
          ? `${triggerError.message} Trigger a rebuild manually from the dashboard.`
          : 'The post was saved, but the site rebuild could not be triggered automatically. Please trigger it manually from the dashboard.',
      );
      return false;
    }
  }

  async function savePost(status: 'draft' | 'published') {
    try {
      setIsSaving(true);
      setError(null);
      setNotice(null);
      setWarning(null);

      const payload = buildPayload(status);
      const requiresFullValidation =
        status === 'published' || post?.status === 'published';
      const missingFields = getMissingFields(payload, requiresFullValidation);

      if (status === 'draft' && payload.title && payload.slug !== form.slug.trim()) {
        updateForm('slug', payload.slug);
      }

      if (missingFields.length > 0) {
        if (!requiresFullValidation) {
          throw new Error(
            `Please complete the required fields to save this draft: ${missingFields.join(', ')}.`,
          );
        }

        const actionLabel =
          status === 'published'
            ? 'publish this post'
            : 'save changes to a published post';

        throw new Error(
          `Please complete the required fields to ${actionLabel}: ${missingFields.join(', ')}.`,
        );
      }

      if (mode === 'edit' && post) {
        const updatePayload: Partial<BlogPostInput> = { ...payload };

        if (!updatePayload.publishedAt) {
          delete updatePayload.publishedAt;
        }

        const updatedPost = await updatePost(post.slug, updatePayload);
        setPost(updatedPost);
        setForm(mapPostToForm(updatedPost));

        if (shouldTriggerRebuild(post, updatedPost.status)) {
          await triggerRebuildWithFeedback();
        } else {
          setNotice('Draft saved successfully.');
        }

        return;
      }

      const createdPost = await createPost(payload);

      if (shouldTriggerRebuild(null, createdPost.status)) {
        const rebuildTriggered = await triggerRebuildWithFeedback();
        const rebuildState = rebuildTriggered ? 'success' : 'failed';

        window.location.assign(
          `/admin/posts/edit?id=${encodeURIComponent(createdPost.id)}&saved=published&rebuild=${rebuildState}`,
        );
        return;
      }

      window.location.assign(
        `/admin/posts/edit?id=${encodeURIComponent(createdPost.id)}&saved=draft`,
      );
    } catch (saveError) {
      setError(
        saveError instanceof Error ? saveError.message : 'Unable to save post.',
      );
    } finally {
      setIsSaving(false);
    }
  }

  if (isLoading) {
    return <div className="admin-panel">Loading post editor…</div>;
  }

  if (error && mode === 'edit' && !post) {
    return <div className="admin-panel admin-panel--error">{error}</div>;
  }

  return (
    <div className="admin-stack">
      <section className="admin-panel">
        <div className="admin-panel__header">
          <div>
            <h2>{mode === 'create' ? 'New Post' : 'Edit Post'}</h2>
            <p className="admin-panel__subcopy">
              Draft freely, then publish when the story is ready.
            </p>
          </div>
          <span className={`admin-badge admin-badge--${currentStatus}`}>
            {currentStatus}
          </span>
        </div>

        {error ? <div className="admin-panel admin-panel--error">{error}</div> : null}
        {notice ? <div className="admin-panel admin-panel--success">{notice}</div> : null}
        {warning ? <div className="admin-panel admin-panel--warning">{warning}</div> : null}

        <div className="admin-editor-layout">
          <div className="admin-editor-main">
            <label className="admin-field">
              <span>Title</span>
              <input
                className="admin-input"
                onChange={(event) => handleTitleChange(event.target.value)}
                placeholder="Your post title"
                type="text"
                value={form.title}
              />
            </label>

            <div className="admin-slug-row">
              <label className="admin-field">
                <span>Slug</span>
                <input
                  className="admin-input"
                  disabled={mode === 'edit' || !manualSlug}
                  onChange={(event) => updateForm('slug', slugify(event.target.value))}
                  placeholder="post-slug"
                  type="text"
                  value={form.slug}
                />
              </label>

              {mode === 'create' ? (
                <label className="admin-checkbox">
                  <input
                    checked={manualSlug}
                    onChange={(event) => handleSlugModeChange(event.target.checked)}
                    type="checkbox"
                  />
                  <span>Manual override</span>
                </label>
              ) : (
                <p className="admin-field-note">
                  Slug is locked after creation because it is the Cosmos partition key.
                </p>
              )}
            </div>

            <label className="admin-field">
              <span>Author</span>
              <input
                className="admin-input"
                onChange={(event) => updateForm('author', event.target.value)}
                placeholder="Author name"
                type="text"
                value={form.author}
              />
            </label>

            <div className="admin-editor">
              <div className="admin-editor__toolbar">
                <button
                  className={editor?.isActive('bold') ? 'is-active' : ''}
                  onClick={() => editor?.chain().focus().toggleBold().run()}
                  type="button"
                >
                  Bold
                </button>
                <button
                  className={editor?.isActive('italic') ? 'is-active' : ''}
                  onClick={() => editor?.chain().focus().toggleItalic().run()}
                  type="button"
                >
                  Italic
                </button>
                <button
                  className={editor?.isActive('heading', { level: 2 }) ? 'is-active' : ''}
                  onClick={() =>
                    editor?.chain().focus().toggleHeading({ level: 2 }).run()
                  }
                  type="button"
                >
                  H2
                </button>
                <button
                  className={editor?.isActive('heading', { level: 3 }) ? 'is-active' : ''}
                  onClick={() =>
                    editor?.chain().focus().toggleHeading({ level: 3 }).run()
                  }
                  type="button"
                >
                  H3
                </button>
                <button
                  className={editor?.isActive('heading', { level: 4 }) ? 'is-active' : ''}
                  onClick={() =>
                    editor?.chain().focus().toggleHeading({ level: 4 }).run()
                  }
                  type="button"
                >
                  H4
                </button>
                <button
                  className={editor?.isActive('bulletList') ? 'is-active' : ''}
                  onClick={() => editor?.chain().focus().toggleBulletList().run()}
                  type="button"
                >
                  Bullets
                </button>
                <button
                  className={editor?.isActive('orderedList') ? 'is-active' : ''}
                  onClick={() => editor?.chain().focus().toggleOrderedList().run()}
                  type="button"
                >
                  Numbered
                </button>
                <button
                  className={editor?.isActive('blockquote') ? 'is-active' : ''}
                  onClick={() => editor?.chain().focus().toggleBlockquote().run()}
                  type="button"
                >
                  Quote
                </button>
                <button
                  className={editor?.isActive('codeBlock') ? 'is-active' : ''}
                  onClick={() => editor?.chain().focus().toggleCodeBlock().run()}
                  type="button"
                >
                  Code
                </button>
                <button onClick={() => runPromptAction('link')} type="button">
                  Link
                </button>
                <button
                  disabled={isEditorImageUploading}
                  onClick={() => editorImageInputRef.current?.click()}
                  type="button"
                >
                  {isEditorImageUploading ? 'Uploading…' : 'Upload Image'}
                </button>
                <button onClick={() => runPromptAction('image')} type="button">
                  Image URL
                </button>
                <button
                  disabled={!editor?.can().undo()}
                  onClick={() => editor?.chain().focus().undo().run()}
                  type="button"
                >
                  Undo
                </button>
                <button
                  disabled={!editor?.can().redo()}
                  onClick={() => editor?.chain().focus().redo().run()}
                  type="button"
                >
                  Redo
                </button>
              </div>

              <input
                accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                hidden
                onChange={(event) => void handleEditorImageUpload(event)}
                ref={editorImageInputRef}
                type="file"
              />

              <EditorContent editor={editor} />
            </div>
          </div>

          <aside className="admin-editor-sidebar">
            <div className="admin-sidebar-section">
              <h3>Publishing</h3>

              <label className="admin-field">
                <span>Published At</span>
                <input
                  className="admin-input"
                  onChange={(event) =>
                    updateForm('publishedAt', parseDateTimeLocal(event.target.value))
                  }
                  type="datetime-local"
                  value={formatDateTimeLocal(form.publishedAt)}
                />
              </label>
            </div>

            <div className="admin-sidebar-section">
              <h3>SEO & Metadata</h3>

              <label className="admin-field">
                <span>SEO Title</span>
                <input
                  className="admin-input"
                  onChange={(event) => updateForm('seoTitle', event.target.value)}
                  type="text"
                  value={form.seoTitle}
                />
              </label>

              <label className="admin-field">
                <span>SEO Description</span>
                <textarea
                  className="admin-input admin-textarea"
                  onChange={(event) =>
                    updateForm('seoDescription', event.target.value)
                  }
                  rows={4}
                  value={form.seoDescription}
                />
              </label>

              <label className="admin-field">
                <span>Excerpt</span>
                <textarea
                  className="admin-input admin-textarea"
                  onChange={(event) => updateForm('excerpt', event.target.value)}
                  rows={4}
                  value={form.excerpt}
                />
              </label>

              <label className="admin-field">
                <span>Tags</span>
                <input
                  className="admin-input"
                  onChange={(event) => updateForm('tagsInput', event.target.value)}
                  placeholder="healing, first-gen, relationships"
                  type="text"
                  value={form.tagsInput}
                />
              </label>

              <ImageUploadField
                label="Featured Image"
                onChange={(value) => updateForm('featuredImage', value)}
                value={form.featuredImage}
              />

              <ImageUploadField
                label="OG Image"
                onChange={(value) => updateForm('ogImage', value)}
                value={form.ogImage}
              />
            </div>
          </aside>
        </div>

        <div className="admin-actions">
          <button
            className="admin-button"
            disabled={isSaving}
            onClick={() => void savePost('draft')}
            type="button"
          >
            {isSaving ? 'Saving…' : 'Save as Draft'}
          </button>
          <button
            className="admin-button admin-button--primary"
            disabled={isSaving}
            onClick={() => void savePost('published')}
            type="button"
          >
            {isSaving ? 'Saving…' : 'Publish'}
          </button>
        </div>
      </section>
    </div>
  );
}
