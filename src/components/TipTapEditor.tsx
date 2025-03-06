import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { 
  Bold, 
  Italic, 
  List, 
  ListOrdered, 
  Heading1, 
  Heading2, 
  Heading3,
  Quote,
  Code
} from 'lucide-react';

const MenuBar = ({ editor }: { editor: any }) => {
  if (!editor) {
    return null;
  }

  return (
    <div className="flex flex-wrap gap-2 p-2 bg-gray-700 rounded-t-lg border-b border-gray-600">
      <button
        onClick={(e) => {
          e.preventDefault();
          editor.chain().focus().toggleBold().run();
        }}
        disabled={!editor.can().chain().focus().toggleBold().run()}
        className={`p-2 rounded hover:bg-gray-600 ${editor.isActive('bold') ? 'bg-gray-600' : ''}`}
      >
        <Bold className="h-4 w-4 text-gray-200" />
      </button>
      <button
        onClick={(e) => {
          e.preventDefault();
          editor.chain().focus().toggleItalic().run();
        }}
        disabled={!editor.can().chain().focus().toggleItalic().run()}
        className={`p-2 rounded hover:bg-gray-600 ${editor.isActive('italic') ? 'bg-gray-600' : ''}`}
      >
        <Italic className="h-4 w-4 text-gray-200" />
      </button>
      <button
        onClick={(e) => {
          e.preventDefault();
          editor.chain().focus().toggleHeading({ level: 1 }).run();
        }}
        className={`p-2 rounded hover:bg-gray-600 ${editor.isActive('heading', { level: 1 }) ? 'bg-gray-600' : ''}`}
      >
        <Heading1 className="h-4 w-4 text-gray-200" />
      </button>
      <button
        onClick={(e) => {
          e.preventDefault();
          editor.chain().focus().toggleHeading({ level: 2 }).run();
        }}
        className={`p-2 rounded hover:bg-gray-600 ${editor.isActive('heading', { level: 2 }) ? 'bg-gray-600' : ''}`}
      >
        <Heading2 className="h-4 w-4 text-gray-200" />
      </button>
      <button
        onClick={(e) => {
          e.preventDefault();
          editor.chain().focus().toggleHeading({ level: 3 }).run();
        }}
        className={`p-2 rounded hover:bg-gray-600 ${editor.isActive('heading', { level: 3 }) ? 'bg-gray-600' : ''}`}
      >
        <Heading3 className="h-4 w-4 text-gray-200" />
      </button>
      <button
        onClick={(e) => {
          e.preventDefault();
          editor.chain().focus().toggleBulletList().run();
        }}
        className={`p-2 rounded hover:bg-gray-600 ${editor.isActive('bulletList') ? 'bg-gray-600' : ''}`}
      >
        <List className="h-4 w-4 text-gray-200" />
      </button>
      <button
        onClick={(e) => {
          e.preventDefault();
          editor.chain().focus().toggleOrderedList().run();
        }}
        className={`p-2 rounded hover:bg-gray-600 ${editor.isActive('orderedList') ? 'bg-gray-600' : ''}`}
      >
        <ListOrdered className="h-4 w-4 text-gray-200" />
      </button>
      <button
        onClick={(e) => {
          e.preventDefault();
          editor.chain().focus().toggleBlockquote().run();
        }}
        className={`p-2 rounded hover:bg-gray-600 ${editor.isActive('blockquote') ? 'bg-gray-600' : ''}`}
      >
        <Quote className="h-4 w-4 text-gray-200" />
      </button>
      <button
        onClick={(e) => {
          e.preventDefault();
          editor.chain().focus().toggleCode().run();
        }}
        className={`p-2 rounded hover:bg-gray-600 ${editor.isActive('code') ? 'bg-gray-600' : ''}`}
      >
        <Code className="h-4 w-4 text-gray-200" />
      </button>
    </div>
  );
};

export default function TipTapEditor({ content, onChange }: { content: string; onChange: (content: string) => void }) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3]
        },
        history: true
      }),
    ],
    content,
    onUpdate: ({ editor }) => {
      // Only update content if it's different from current content
      const newContent = editor.getHTML();
      onChange(newContent);
    },
    editorProps: {
      attributes: {
        class: 'prose prose-sm sm:prose lg:prose-lg xl:prose-2xl focus:outline-none min-h-[200px] p-4 text-white',
      },
      handleKeyDown: (view, event) => {
        // Prevent form submission on Enter key
        if (event.key === 'Enter' && !event.shiftKey) {
          event.preventDefault();
          return true;
        }
        return false;
      }
    },
  });

  return (
    <div className="border border-gray-600 rounded-lg overflow-hidden bg-gray-700">
      <MenuBar editor={editor} />
      <EditorContent editor={editor} />
    </div>
  );
}