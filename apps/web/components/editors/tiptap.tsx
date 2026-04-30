'use client';

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import { useEffect } from 'react';
import { Bold, Italic, Heading1, Heading2, List, ListOrdered, Link2, Quote, Undo, Redo } from 'lucide-react';
import { cn } from '@/lib/utils';

export function TiptapEditor({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
}) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
      }),
      Link.configure({ openOnClick: false, autolink: true }),
    ],
    content: value || '',
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class:
          'prose prose-sm max-w-none focus:outline-none min-h-[120px] px-3 py-2 [&_p]:my-2 [&_h1]:text-xl [&_h1]:font-semibold [&_h2]:text-lg [&_h2]:font-semibold [&_a]:text-primary [&_a]:underline [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5 [&_blockquote]:border-l-2 [&_blockquote]:border-muted-foreground/30 [&_blockquote]:pl-3 [&_blockquote]:text-muted-foreground',
      },
    },
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      onChange(html === '<p></p>' ? '' : html);
    },
  });

  useEffect(() => {
    if (!editor) return;
    if (value === editor.getHTML()) return;
    editor.commands.setContent(value || '', false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editor]);

  if (!editor) {
    return (
      <div className="rounded-md border min-h-[160px] bg-muted/20 animate-pulse" />
    );
  }

  return (
    <div className="rounded-md border bg-background overflow-hidden">
      <div className="flex items-center gap-0.5 border-b bg-muted/30 px-1.5 py-1">
        <ToolbarButton
          active={editor.isActive('bold')}
          onClick={() => editor.chain().focus().toggleBold().run()}
          title="Bold"
        >
          <Bold className="h-3.5 w-3.5" />
        </ToolbarButton>
        <ToolbarButton
          active={editor.isActive('italic')}
          onClick={() => editor.chain().focus().toggleItalic().run()}
          title="Italic"
        >
          <Italic className="h-3.5 w-3.5" />
        </ToolbarButton>
        <Divider />
        <ToolbarButton
          active={editor.isActive('heading', { level: 1 })}
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          title="Heading 1"
        >
          <Heading1 className="h-3.5 w-3.5" />
        </ToolbarButton>
        <ToolbarButton
          active={editor.isActive('heading', { level: 2 })}
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          title="Heading 2"
        >
          <Heading2 className="h-3.5 w-3.5" />
        </ToolbarButton>
        <Divider />
        <ToolbarButton
          active={editor.isActive('bulletList')}
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          title="Bulleted list"
        >
          <List className="h-3.5 w-3.5" />
        </ToolbarButton>
        <ToolbarButton
          active={editor.isActive('orderedList')}
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          title="Numbered list"
        >
          <ListOrdered className="h-3.5 w-3.5" />
        </ToolbarButton>
        <ToolbarButton
          active={editor.isActive('blockquote')}
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          title="Quote"
        >
          <Quote className="h-3.5 w-3.5" />
        </ToolbarButton>
        <Divider />
        <ToolbarButton
          active={editor.isActive('link')}
          onClick={() => {
            const previous = editor.getAttributes('link').href as string | undefined;
            const url = window.prompt('URL', previous ?? 'https://');
            if (url === null) return;
            if (url === '') {
              editor.chain().focus().extendMarkRange('link').unsetLink().run();
              return;
            }
            editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
          }}
          title="Insert / edit link"
        >
          <Link2 className="h-3.5 w-3.5" />
        </ToolbarButton>
        <div className="ml-auto flex items-center gap-0.5">
          <ToolbarButton
            onClick={() => editor.chain().focus().undo().run()}
            title="Undo"
            disabled={!editor.can().undo()}
          >
            <Undo className="h-3.5 w-3.5" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().redo().run()}
            title="Redo"
            disabled={!editor.can().redo()}
          >
            <Redo className="h-3.5 w-3.5" />
          </ToolbarButton>
        </div>
      </div>

      <EditorContent editor={editor} />
      {!value && placeholder && (
        <div className="px-3 -mt-12 text-sm text-muted-foreground pointer-events-none relative">
          {placeholder}
        </div>
      )}
    </div>
  );
}

function ToolbarButton({
  active,
  onClick,
  title,
  disabled,
  children,
}: {
  active?: boolean;
  onClick: () => void;
  title: string;
  disabled?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      disabled={disabled}
      className={cn(
        'h-7 w-7 inline-flex items-center justify-center rounded transition-colors',
        active
          ? 'bg-primary text-primary-foreground'
          : 'text-muted-foreground hover:bg-accent hover:text-foreground',
        disabled && 'opacity-40 cursor-not-allowed hover:bg-transparent'
      )}
    >
      {children}
    </button>
  );
}

function Divider() {
  return <div className="h-4 w-px bg-border mx-1" />;
}
