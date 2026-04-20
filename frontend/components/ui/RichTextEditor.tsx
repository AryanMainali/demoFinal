'use client';

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import Placeholder from '@tiptap/extension-placeholder';
import {
    Bold, Italic, Underline as UnderlineIcon,
    List, ListOrdered, Heading2, Heading3,
    Minus, Undo2, Redo2,
} from 'lucide-react';

interface RichTextEditorProps {
    value: string;
    onChange: (html: string) => void;
    placeholder?: string;
    minHeight?: string;
    label?: string;
    hint?: string;
}

function ToolbarBtn({
    onClick,
    active,
    title,
    children,
}: {
    onClick: () => void;
    active?: boolean;
    title: string;
    children: React.ReactNode;
}) {
    return (
        <button
            type="button"
            onMouseDown={(e) => { e.preventDefault(); onClick(); }}
            title={title}
            className={`p-1.5 rounded transition-colors ${
                active
                    ? 'bg-gray-200 text-gray-900'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
            }`}
        >
            {children}
        </button>
    );
}

export function RichTextEditor({
    value,
    onChange,
    placeholder = 'Write here…',
    minHeight = '160px',
    label,
    hint,
}: RichTextEditorProps) {
    const editor = useEditor({
        extensions: [
            StarterKit,
            Underline,
            Placeholder.configure({ placeholder }),
        ],
        content: value || '',
        immediatelyRender: false,
        onUpdate({ editor }) {
            onChange(editor.getHTML());
        },
        editorProps: {
            attributes: {
                class: 'focus:outline-none prose prose-sm max-w-none',
            },
        },
    });

    if (!editor) return null;

    return (
        <div>
            {label && (
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    {label}
                    {hint && <span className="ml-1 text-xs font-normal text-gray-400">{hint}</span>}
                </label>
            )}
            <div className="rounded-lg border border-gray-300 overflow-hidden focus-within:ring-2 focus-within:ring-[#862733] focus-within:border-transparent transition-all">
                {/* Toolbar */}
                <div className="flex flex-wrap items-center gap-0.5 px-2 py-1.5 border-b border-gray-200 bg-gray-50">
                    <ToolbarBtn title="Bold" active={editor.isActive('bold')} onClick={() => editor.chain().focus().toggleBold().run()}>
                        <Bold className="w-4 h-4" />
                    </ToolbarBtn>
                    <ToolbarBtn title="Italic" active={editor.isActive('italic')} onClick={() => editor.chain().focus().toggleItalic().run()}>
                        <Italic className="w-4 h-4" />
                    </ToolbarBtn>
                    <ToolbarBtn title="Underline" active={editor.isActive('underline')} onClick={() => editor.chain().focus().toggleUnderline().run()}>
                        <UnderlineIcon className="w-4 h-4" />
                    </ToolbarBtn>

                    <div className="w-px h-4 bg-gray-300 mx-1" />

                    <ToolbarBtn title="Heading 2" active={editor.isActive('heading', { level: 2 })} onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}>
                        <Heading2 className="w-4 h-4" />
                    </ToolbarBtn>
                    <ToolbarBtn title="Heading 3" active={editor.isActive('heading', { level: 3 })} onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}>
                        <Heading3 className="w-4 h-4" />
                    </ToolbarBtn>

                    <div className="w-px h-4 bg-gray-300 mx-1" />

                    <ToolbarBtn title="Bullet list" active={editor.isActive('bulletList')} onClick={() => editor.chain().focus().toggleBulletList().run()}>
                        <List className="w-4 h-4" />
                    </ToolbarBtn>
                    <ToolbarBtn title="Ordered list" active={editor.isActive('orderedList')} onClick={() => editor.chain().focus().toggleOrderedList().run()}>
                        <ListOrdered className="w-4 h-4" />
                    </ToolbarBtn>

                    <div className="w-px h-4 bg-gray-300 mx-1" />

                    <ToolbarBtn title="Horizontal rule" onClick={() => editor.chain().focus().setHorizontalRule().run()} active={false}>
                        <Minus className="w-4 h-4" />
                    </ToolbarBtn>

                    <div className="w-px h-4 bg-gray-300 mx-1" />

                    <ToolbarBtn title="Undo" onClick={() => editor.chain().focus().undo().run()} active={false}>
                        <Undo2 className="w-4 h-4" />
                    </ToolbarBtn>
                    <ToolbarBtn title="Redo" onClick={() => editor.chain().focus().redo().run()} active={false}>
                        <Redo2 className="w-4 h-4" />
                    </ToolbarBtn>
                </div>

                {/* Editor area */}
                <EditorContent
                    editor={editor}
                    className="px-3 py-2.5 text-sm"
                    style={{ minHeight }}
                />
            </div>
        </div>
    );
}
