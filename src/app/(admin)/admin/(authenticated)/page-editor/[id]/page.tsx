'use client';
export const runtime = 'edge';

import { useEffect, useState, useCallback, use } from 'react';
import { adminFetch, triggerRevalidate } from '@/utils/adminApi';
import { useToast } from '../../layout';
import { useRouter } from 'next/navigation';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import TiptapLink from '@tiptap/extension-link';
import TiptapImage from '@tiptap/extension-image';
import TextAlign from '@tiptap/extension-text-align';
import { Save, ArrowLeft, Bold, Italic, UnderlineIcon, Strikethrough, List, ListOrdered, Quote, Code, Image as ImageIcon, Link as LinkIcon, AlignLeft, AlignCenter, AlignRight, Heading1, Heading2, Heading3, Undo, Redo, Sparkles, ExternalLink, Code2, Eye } from 'lucide-react';

export default function PageEditorPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const showToast = useToast();
  const router = useRouter();
  const isNew = id === 'new';

  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [htmlMode, setHtmlMode] = useState(false);
  const [form, setForm] = useState({
    title: '', slug: '', status: 'published', content: '',
  });

  const editor = useEditor({
    extensions: [
      StarterKit.configure({ heading: { levels: [1, 2, 3] } }),
      Underline,
      TiptapLink.configure({ openOnClick: false }),
      TiptapImage,
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
    ],
    content: form.content,
    onUpdate: ({ editor }) => {
      setForm(prev => ({ ...prev, content: editor.getHTML() }));
    },
  });

  // Load page data
  useEffect(() => {
    if (isNew) return;
    (async () => {
      try {
        const data = await adminFetch(`/pages/${id}`);
        const page = data.page || data;
        setForm({
          title: page.title || '',
          slug: page.slug || '',
          status: page.status || 'published',
          content: page.content || '',
        });
        if (editor) editor.commands.setContent(page.content || '');
      } catch (err) { showToast(err.message, 'error'); }
      finally { setLoading(false); }
    })();
  }, [id, isNew, editor, showToast]);

  const generateSlug = (title) => title.toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-');

  const handleTitleChange = (value) => {
    setForm(prev => ({
      ...prev,
      title: value,
      slug: isNew || !prev.slug ? generateSlug(value) : prev.slug,
    }));
  };

  const handleSave = async () => {
    if (!form.title.trim()) return showToast('Title is required', 'error');
    if (!form.slug.trim()) return showToast('Slug is required', 'error');

    setSaving(true);
    try {
      const payload = { ...form, content: editor?.getHTML() || form.content };

      if (isNew) {
        await adminFetch('/pages', { method: 'POST', body: JSON.stringify(payload) });
        showToast('Page created!');
      } else {
        await adminFetch(`/pages/${id}`, { method: 'PUT', body: JSON.stringify(payload) });
        showToast('Page updated!');
      }
      await triggerRevalidate('pages');
      router.push('/admin/pages');
    } catch (err) { showToast(err.message, 'error'); }
    finally { setSaving(false); }
  };

  const addImage = () => {
    const url = prompt('Enter image URL:');
    if (url && editor) {
      editor.chain().focus().setImage({ src: url }).run();
    }
  };

  const addLink = () => {
    const url = prompt('Enter link URL:');
    if (url && editor) {
      editor.chain().focus().setLink({ href: url }).run();
    }
  };

  const insertAiTemplate = () => {
    const template = `
      <h2>Main Question or Topic Overview</h2>
      <p>Here is a direct answer or brief introduction that hooks the reader.</p>
      <h3>Key Benefits / Features</h3>
      <ul>
        <li>Benefit 1</li>
        <li>Benefit 2</li>
      </ul>
      <h3>Detailed Breakdown</h3>
      <p>Elaborate on the topic with clear, concise paragraphs.</p>
      <h3>FAQ</h3>
      <p><strong>Q: Question here?</strong><br>A: Answer here.</p>
    `;
    if (editor) {
      editor.commands.setContent(form.content + template);
    }
  };

  if (loading) {
    return (
      <div className="admin-card">
        <div className="admin-card-body">
          {Array(4).fill(0).map((_, i) => (
            <div key={i} className="admin-skeleton admin-skeleton-text-lg" style={{ width: `${60 + Math.random() * 40}%`, marginBottom: 16 }} />
          ))}
        </div>
      </div>
    );
  }

  const ToolbarButton = ({ onClick, active, children, title }: any) => (
    <button
      type="button"
      onClick={onClick}
      className={`admin-editor-btn ${active ? 'active' : ''}`}
      title={title}
    >
      {children}
    </button>
  );

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 10 }}>
        <button className="admin-btn admin-btn-ghost" onClick={() => router.push('/admin/pages')}>
          <ArrowLeft size={16} /> Back
        </button>
        <div style={{ display: 'flex', gap: 8 }}>
          {!isNew && (
            <a href={`/${form.slug}`} target="_blank" rel="noreferrer" className="admin-btn admin-btn-secondary" title="View Live">
              <ExternalLink size={15} /> View Live
            </a>
          )}
          <select value={form.status} onChange={e => setForm(p => ({ ...p, status: e.target.value }))} className="admin-select" style={{ width: 'auto' }}>
            <option value="published">Published</option>
            <option value="draft">Draft</option>
          </select>
          <button className="admin-btn admin-btn-primary" onClick={handleSave} disabled={saving}>
            <Save size={16} /> {saving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>

      <div className="admin-grid-2" style={{ gridTemplateColumns: '1fr 300px', alignItems: 'start' }}>
        {/* Editor */}
        <div>
          <div className="admin-card" style={{ marginBottom: 16 }}>
            <div className="admin-card-body">
              <div className="admin-form-group">
                <label className="admin-label">Title *</label>
                <input type="text" className="admin-input" value={form.title} onChange={e => handleTitleChange(e.target.value)} placeholder="Page title" style={{ fontSize: '1.1rem', fontWeight: 600, padding: '12px 14px' }} />
              </div>
              <div className="admin-form-group">
                <label className="admin-label">Slug</label>
                <input type="text" className="admin-input" value={form.slug} onChange={e => setForm(p => ({ ...p, slug: e.target.value }))} style={{ fontFamily: 'monospace' }} />
              </div>
            </div>
          </div>

          <div className="admin-card">
            <div className="admin-bg-surface admin-border-b" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 16px', borderBottom: '1px solid' }}>
              <div className="admin-text-muted" style={{ fontSize: '0.85rem', fontWeight: 600 }}>Content Editor</div>
              <div className="admin-bg-surface" style={{ display: 'flex', gap: 4, padding: 3, borderRadius: 6 }}>
                <button type="button" onClick={() => setHtmlMode(false)} className={htmlMode ? "admin-text-muted" : "admin-text-primary-dark admin-bg-surface-light"} style={{ background: htmlMode ? 'transparent' : 'var(--admin-bg)', border: 'none', padding: '4px 10px', borderRadius: 4, fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, boxShadow: htmlMode ? 'none' : '0 1px 2px rgba(0,0,0,0.05)' }}>
                  <Eye size={14} /> Visual
                </button>
                <button type="button" onClick={() => setHtmlMode(true)} className={htmlMode ? "admin-text-primary-dark admin-bg-surface-light" : "admin-text-muted"} style={{ background: htmlMode ? 'var(--admin-bg)' : 'transparent', border: 'none', padding: '4px 10px', borderRadius: 4, fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, boxShadow: htmlMode ? '0 1px 2px rgba(0,0,0,0.05)' : 'none' }}>
                  <Code2 size={14} /> HTML
                </button>
              </div>
            </div>
            
            {!htmlMode ? (
              <>
                <div className="admin-editor-toolbar">
                  <ToolbarButton onClick={() => editor?.chain().focus().undo().run()} title="Undo"><Undo size={15} /></ToolbarButton>
              <ToolbarButton onClick={() => editor?.chain().focus().redo().run()} title="Redo"><Redo size={15} /></ToolbarButton>
              <div className="admin-bg-border" style={{ width: 1, height: 20, margin: '0 4px' }} />
              <ToolbarButton onClick={() => editor?.chain().focus().toggleBold().run()} active={editor?.isActive('bold')} title="Bold"><Bold size={15} /></ToolbarButton>
              <ToolbarButton onClick={() => editor?.chain().focus().toggleItalic().run()} active={editor?.isActive('italic')} title="Italic"><Italic size={15} /></ToolbarButton>
              <ToolbarButton onClick={() => editor?.chain().focus().toggleUnderline().run()} active={editor?.isActive('underline')} title="Underline"><UnderlineIcon size={15} /></ToolbarButton>
              <ToolbarButton onClick={() => editor?.chain().focus().toggleStrike().run()} active={editor?.isActive('strike')} title="Strike"><Strikethrough size={15} /></ToolbarButton>
              <div className="admin-bg-border" style={{ width: 1, height: 20, margin: '0 4px' }} />
              <ToolbarButton onClick={() => editor?.chain().focus().toggleHeading({ level: 1 }).run()} active={editor?.isActive('heading', { level: 1 })} title="H1"><Heading1 size={15} /></ToolbarButton>
              <ToolbarButton onClick={() => editor?.chain().focus().toggleHeading({ level: 2 }).run()} active={editor?.isActive('heading', { level: 2 })} title="H2"><Heading2 size={15} /></ToolbarButton>
              <ToolbarButton onClick={() => editor?.chain().focus().toggleHeading({ level: 3 }).run()} active={editor?.isActive('heading', { level: 3 })} title="H3"><Heading3 size={15} /></ToolbarButton>
              <div className="admin-bg-border" style={{ width: 1, height: 20, margin: '0 4px' }} />
              <ToolbarButton onClick={() => editor?.chain().focus().toggleBulletList().run()} active={editor?.isActive('bulletList')} title="Bullet List"><List size={15} /></ToolbarButton>
              <ToolbarButton onClick={() => editor?.chain().focus().toggleOrderedList().run()} active={editor?.isActive('orderedList')} title="Numbered List"><ListOrdered size={15} /></ToolbarButton>
              <ToolbarButton onClick={() => editor?.chain().focus().toggleBlockquote().run()} active={editor?.isActive('blockquote')} title="Quote"><Quote size={15} /></ToolbarButton>
              <ToolbarButton onClick={() => editor?.chain().focus().toggleCodeBlock().run()} active={editor?.isActive('codeBlock')} title="Code"><Code size={15} /></ToolbarButton>
              <div className="admin-bg-border" style={{ width: 1, height: 20, margin: '0 4px' }} />
              <ToolbarButton onClick={() => editor?.chain().focus().setTextAlign('left').run()} active={editor?.isActive({ textAlign: 'left' })} title="Align Left"><AlignLeft size={15} /></ToolbarButton>
              <ToolbarButton onClick={() => editor?.chain().focus().setTextAlign('center').run()} active={editor?.isActive({ textAlign: 'center' })} title="Center"><AlignCenter size={15} /></ToolbarButton>
              <ToolbarButton onClick={() => editor?.chain().focus().setTextAlign('right').run()} active={editor?.isActive({ textAlign: 'right' })} title="Right"><AlignRight size={15} /></ToolbarButton>
              <div className="admin-bg-border" style={{ width: 1, height: 20, margin: '0 4px' }} />
                <ToolbarButton onClick={addLink} title="Insert Link"><LinkIcon size={15} /></ToolbarButton>
                <ToolbarButton onClick={addImage} title="Insert Image"><ImageIcon size={15} /></ToolbarButton>
              </div>
              <div className="admin-editor-content">
                <EditorContent editor={editor} />
              </div>
            </>
            ) : (
              <div style={{ padding: 0 }}>
                <textarea 
                  value={form.content} 
                  onChange={e => {
                    setForm(prev => ({ ...prev, content: e.target.value }));
                    if (editor) editor.commands.setContent(e.target.value);
                  }}
                  style={{ width: '100%', height: '500px', padding: '16px', background: 'var(--admin-bg-primary-dark)', color: 'var(--admin-text-info)', fontFamily: 'monospace', fontSize: '0.9rem', border: 'none', outline: 'none', resize: 'vertical' }}
                  spellCheck="false"
                />
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div>
          <div className="admin-card">
            <div className="admin-card-header">
              <h3 className="admin-card-title">Settings</h3>
            </div>
            <div className="admin-card-body">
              <div className="admin-form-group">
                <label className="admin-label">Visibility</label>
                <div className="admin-text-muted" style={{ fontSize: '0.8rem', marginBottom: '8px' }}>
                  This page will be visible to everyone.
                </div>
              </div>
            </div>
          </div>

          <div className="admin-card" style={{ marginTop: 16 }}>
            <div className="admin-card-body admin-bg-warning-light admin-border-warning" style={{ border: '1px solid', borderRadius: 8 }}>
              <div className="admin-text-warning" style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 700, fontSize: '0.85rem', marginBottom: 8 }}>
                <Sparkles size={16} /> Quick Content Template
              </div>
              <div className="admin-text-warning-dark" style={{ fontSize: '0.78rem', marginBottom: 12 }}>Insert an SEO-friendly layout with bullet points, FAQ, and headers in one click.</div>
              <button type="button" onClick={insertAiTemplate} className="admin-btn admin-btn-warning" style={{ width: '100%' }}>
                Insert High-Converting Layout
              </button>
            </div>
          </div>

          <div className="admin-card" style={{ marginTop: 16 }}>
            <div className="admin-card-header">
              <h3 className="admin-card-title">SEO Checklist</h3>
            </div>
            <div className="admin-card-body">
              <div className="admin-text-muted" style={{ fontSize: '0.8rem', display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div>✓ <strong>Answer-First:</strong> Core message in the first 2 sentences.</div>
                <div>✓ <strong>Bullet Lists:</strong> Use numbered/bulleted points for benefits.</div>
                <div>✓ <strong>Clear Headings:</strong> Use H2 and H3 for clean AI crawlability.</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @media (max-width: 768px) {
          .admin-grid-2 { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
}
