import React, { useEffect } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import Heading from '@tiptap/extension-heading';
import BulletList from '@tiptap/extension-bullet-list';
import OrderedList from '@tiptap/extension-ordered-list';
import ListItem from '@tiptap/extension-list-item';

interface EditorProps {
  value: string;
  onChange: (content: string) => void;
  height?: number;
}

const Editor: React.FC<EditorProps> = ({ value, onChange, height = 400 }) => {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: false,
        bulletList: false,
        orderedList: false,
        listItem: false,
      }),
      Heading.configure({
        levels: [1, 2, 3],
      }),
      Underline,
      BulletList,
      OrderedList,
      ListItem,
    ],
    content: value,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
  });

  // Đảm bảo editor luôn được cập nhật khi prop value thay đổi từ bên ngoài
  useEffect(() => {
    if (editor && editor.getHTML() !== value) {
      editor.commands.setContent(value);
    }
  }, [value, editor]);

  const MenuButton = ({ 
    onClick, 
    isActive, 
    children 
  }: { 
    onClick: () => void, 
    isActive: boolean, 
    children: React.ReactNode 
  }) => (
    <button
      type="button"
      onClick={onClick}
      className={`px-3 py-1 border mx-1 rounded text-sm ${
        isActive 
          ? 'bg-blue-100 border-blue-300 text-blue-700' 
          : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
      }`}
    >
      {children}
    </button>
  );

  if (!editor) {
    return <div>Loading editor...</div>;
  }

  return (
    <div className="border border-gray-300 rounded-md overflow-hidden">
      <div className="flex flex-wrap gap-1 p-2 bg-gray-50 border-b border-gray-300">
        <MenuButton
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          isActive={editor.isActive('heading', { level: 1 })}
        >
          H1
        </MenuButton>
        
        <MenuButton
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          isActive={editor.isActive('heading', { level: 2 })}
        >
          H2
        </MenuButton>
        
        <MenuButton
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          isActive={editor.isActive('heading', { level: 3 })}
        >
          H3
        </MenuButton>
        
        <MenuButton
          onClick={() => editor.chain().focus().toggleBold().run()}
          isActive={editor.isActive('bold')}
        >
          Bold
        </MenuButton>
        
        <MenuButton
          onClick={() => editor.chain().focus().toggleItalic().run()}
          isActive={editor.isActive('italic')}
        >
          Italic
        </MenuButton>
        
        <MenuButton
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          isActive={editor.isActive('underline')}
        >
          Underline
        </MenuButton>

        <div className="h-6 mx-1 border-r border-gray-300"></div>

        <MenuButton
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          isActive={editor.isActive('bulletList')}
        >
          • Danh sách
        </MenuButton>
        
        <MenuButton
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          isActive={editor.isActive('orderedList')}
        >
          1. Danh sách
        </MenuButton>
      </div>
      
      <EditorContent 
        editor={editor} 
        className="prose max-w-none p-4" 
        style={{ minHeight: height - 50 }}
      />
      
      <style>{`
        .ProseMirror {
          outline: none;
          min-height: ${height - 90}px;
        }
        .ProseMirror p {
          margin: 0.5em 0;
        }
        .ProseMirror h1 {
          font-size: 1.75em;
          font-weight: bold;
          margin: 0.75em 0 0.5em 0;
        }
        .ProseMirror h2 {
          font-size: 1.5em;
          font-weight: bold;
          margin: 0.75em 0 0.5em 0;
        }
        .ProseMirror h3 {
          font-size: 1.25em;
          font-weight: bold;
          margin: 0.75em 0 0.5em 0;
        }
        .ProseMirror ul {
          list-style-type: disc;
          padding-left: 1.5em;
        }
        .ProseMirror ol {
          list-style-type: decimal;
          padding-left: 1.5em;
        }
      `}</style>
    </div>
  );
};

export default Editor; 