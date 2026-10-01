'use client';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { TextStyle } from '@tiptap/extension-text-style';
import Color from '@tiptap/extension-color';
import TextAlign from '@tiptap/extension-text-align';
import Link from '@tiptap/extension-link';
import Underline from '@tiptap/extension-underline';
import { 
  Bold, Italic, Underline as UnderlineIcon, Strikethrough, 
  AlignLeft, AlignCenter, AlignRight, AlignJustify,
  List, ListOrdered, Link as LinkIcon, Unlink
} from 'lucide-react';
import { useEffect, useRef } from 'react';

const MenuBar = ({ editor }) => {
  if (!editor) return null;

  const btnClass = "admin-editor-btn";
  const activeClass = "admin-editor-btn-active";

  const setLink = () => {
    const previousUrl = editor.getAttributes('link').href
    const url = window.prompt('URL', previousUrl)
    if (url === null) return;
    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run()
      return
    }
    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run()
  }

  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 4, padding: '8px', borderBottom: '1px solid var(--admin-border)', background: 'var(--admin-bg)', borderTopLeftRadius: '8px', borderTopRightRadius: '8px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 4, paddingRight: '8px', borderRight: '1px solid var(--admin-border)' }}>
        <button type="button" onClick={() => editor.chain().focus().toggleBold().run()} className={`${btnClass} ${editor.isActive('bold') ? activeClass : ''}`} title="Bold"><Bold size={16} /></button>
        <button type="button" onClick={() => editor.chain().focus().toggleItalic().run()} className={`${btnClass} ${editor.isActive('italic') ? activeClass : ''}`} title="Italic"><Italic size={16} /></button>
        <button type="button" onClick={() => editor.chain().focus().toggleUnderline().run()} className={`${btnClass} ${editor.isActive('underline') ? activeClass : ''}`} title="Underline"><UnderlineIcon size={16} /></button>
        <button type="button" onClick={() => editor.chain().focus().toggleStrike().run()} className={`${btnClass} ${editor.isActive('strike') ? activeClass : ''}`} title="Strikethrough"><Strikethrough size={16} /></button>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '0 8px', borderRight: '1px solid var(--admin-border)' }}>
        <button type="button" onClick={() => editor.chain().focus().setTextAlign('left').run()} className={`${btnClass} ${editor.isActive({ textAlign: 'left' }) ? activeClass : ''}`} title="Align Left"><AlignLeft size={16} /></button>
        <button type="button" onClick={() => editor.chain().focus().setTextAlign('center').run()} className={`${btnClass} ${editor.isActive({ textAlign: 'center' }) ? activeClass : ''}`} title="Align Center"><AlignCenter size={16} /></button>
        <button type="button" onClick={() => editor.chain().focus().setTextAlign('right').run()} className={`${btnClass} ${editor.isActive({ textAlign: 'right' }) ? activeClass : ''}`} title="Align Right"><AlignRight size={16} /></button>
        <button type="button" onClick={() => editor.chain().focus().setTextAlign('justify').run()} className={`${btnClass} ${editor.isActive({ textAlign: 'justify' }) ? activeClass : ''}`} title="Justify"><AlignJustify size={16} /></button>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '0 8px', borderRight: '1px solid var(--admin-border)' }}>
        <button type="button" onClick={() => editor.chain().focus().toggleBulletList().run()} className={`${btnClass} ${editor.isActive('bulletList') ? activeClass : ''}`} title="Bullet List"><List size={16} /></button>
        <button type="button" onClick={() => editor.chain().focus().toggleOrderedList().run()} className={`${btnClass} ${editor.isActive('orderedList') ? activeClass : ''}`} title="Numbered List"><ListOrdered size={16} /></button>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '0 8px', borderRight: '1px solid var(--admin-border)' }}>
        <button type="button" onClick={setLink} className={`${btnClass} ${editor.isActive('link') ? activeClass : ''}`} title="Add Link"><LinkIcon size={16} /></button>
        <button type="button" onClick={() => editor.chain().focus().unsetLink().run()} className={btnClass} disabled={!editor.isActive('link')} title="Remove Link"><Unlink size={16} /></button>
      </div>
      
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, paddingLeft: '8px' }}>
         <input type="color" onInput={event => editor.chain().focus().setColor((event.target as HTMLInputElement).value).run()} value={editor.getAttributes('textStyle').color || '#000000'} title="Text Color" style={{width: '24px', height: '24px', padding: 0, border: 'none', cursor: 'pointer', borderRadius: '4px', background: 'transparent'}} />
      </div>
    </div>
  );
};

export default function TipTapEditor({ value, onChange, placeholder = 'Write something...' }) {
  const isUpdatingRef = useRef(false);

  const editor = useEditor({
    extensions: [
      StarterKit,
      TextStyle,
      Color,
      Underline,
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      Link.configure({ openOnClick: false })
    ],
    content: value,
    onUpdate: ({ editor }) => {
      isUpdatingRef.current = true;
      onChange(editor.getHTML());
      setTimeout(() => { isUpdatingRef.current = false; }, 0);
    },
  });

  useEffect(() => {
    if (editor && value !== editor.getHTML() && !isUpdatingRef.current) {
      editor.commands.setContent(value);
    }
  }, [value, editor]);

  return (
    <div className="admin-card" style={{ padding: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
      <MenuBar editor={editor} />
      <div style={{ flex: 1, minHeight: '250px', maxHeight: '500px', overflowY: 'auto', padding: '16px', background: 'var(--admin-surface)', color: 'var(--admin-text)' }}>
        <EditorContent editor={editor} />
      </div>
      <style jsx global>{`
        .admin-editor-btn {
          padding: 6px;
          border-radius: 4px;
          color: var(--admin-text-muted);
          background: transparent;
          border: none;
          cursor: pointer;
          transition: background 0.2s, color 0.2s;
          display: inline-flex;
          align-items: center;
          justify-content: center;
        }
        .admin-editor-btn:hover {
          background: var(--admin-bg-hover);
          color: var(--admin-text);
        }
        .admin-editor-btn-active {
          background: var(--admin-bg-hover);
          color: var(--admin-text);
          box-shadow: inset 0 0 0 1px var(--admin-border);
        }
        .ProseMirror { outline: none; min-height: 200px; }
        .ProseMirror p { margin-top: 0.5em; margin-bottom: 0.5em; }
        .ProseMirror h1, .ProseMirror h2, .ProseMirror h3 { margin-top: 1em; margin-bottom: 0.5em; font-weight: bold; color: var(--admin-text); }
        .ProseMirror h1 { font-size: 1.5em; }
        .ProseMirror h2 { font-size: 1.25em; }
        .ProseMirror h3 { font-size: 1.1em; }
        .ProseMirror ul { list-style-type: disc; padding-left: 1.5em; margin-bottom: 1em; }
        .ProseMirror ol { list-style-type: decimal; padding-left: 1.5em; margin-bottom: 1em; }
        .ProseMirror a { color: #3b82f6; text-decoration: underline; cursor: pointer; }
        .ProseMirror blockquote { border-left: 3px solid var(--admin-border); padding-left: 1em; color: var(--admin-text-muted); font-style: italic; }
      `}</style>
    </div>
  );
}
