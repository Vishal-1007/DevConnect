import { useEffect } from 'react'
import { EditorContent, useEditor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'
import Link from '@tiptap/extension-link'
import Image from '@tiptap/extension-image'
import { Table } from '@tiptap/extension-table'
import TableRow from '@tiptap/extension-table-row'
import TableCell from '@tiptap/extension-table-cell'
import TableHeader from '@tiptap/extension-table-header'
import {
  Bold, Italic, List, ListOrdered, Code, Heading2, Quote, Link2, ImageIcon, Table2,
} from 'lucide-react'

type RichTextEditorProps = {
  value: string
  onChange: (html: string) => void
  placeholder?: string
}

export function RichTextEditor({ value, onChange, placeholder = 'Write tutorial content…' }: RichTextEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({ codeBlock: { HTMLAttributes: { class: 'tutorial-code-block' } } }),
      Placeholder.configure({ placeholder }),
      Link.configure({ openOnClick: false }),
      Image,
      Table.configure({ resizable: true }),
      TableRow,
      TableHeader,
      TableCell,
    ],
    content: value || '',
    onUpdate: ({ editor: ed }) => onChange(ed.getHTML()),
    editorProps: {
      attributes: {
        class: 'tutorial-editor prose prose-invert max-w-none min-h-[320px] px-4 py-3 focus:outline-none',
      },
    },
  })

  useEffect(() => {
    if (!editor) return
    if (editor.getHTML() !== value) {
      editor.commands.setContent(value || '', { emitUpdate: false })
    }
  }, [editor, value])

  if (!editor) return null

  const btn = (active: boolean) =>
    `p-1.5 rounded border text-xs ${active ? 'border-violet-500/50 bg-violet-500/15 text-violet-300' : 'border-[#2d2e3e] text-[#8b8ca8] hover:text-white'}`

  return (
    <div className="border border-[#2d2e3e] rounded-xl overflow-hidden bg-[#12131c]">
      <div className="flex flex-wrap gap-1 p-2 border-b border-[#2d2e3e] bg-[#161722]">
        <button type="button" className={btn(editor.isActive('heading', { level: 2 }))} onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}><Heading2 size={14} /></button>
        <button type="button" className={btn(editor.isActive('bold'))} onClick={() => editor.chain().focus().toggleBold().run()}><Bold size={14} /></button>
        <button type="button" className={btn(editor.isActive('italic'))} onClick={() => editor.chain().focus().toggleItalic().run()}><Italic size={14} /></button>
        <button type="button" className={btn(editor.isActive('bulletList'))} onClick={() => editor.chain().focus().toggleBulletList().run()}><List size={14} /></button>
        <button type="button" className={btn(editor.isActive('orderedList'))} onClick={() => editor.chain().focus().toggleOrderedList().run()}><ListOrdered size={14} /></button>
        <button type="button" className={btn(editor.isActive('blockquote'))} onClick={() => editor.chain().focus().toggleBlockquote().run()}><Quote size={14} /></button>
        <button type="button" className={btn(editor.isActive('codeBlock'))} onClick={() => editor.chain().focus().toggleCodeBlock().run()}><Code size={14} /></button>
        <button type="button" className={btn(false)} onClick={() => {
          const url = window.prompt('Link URL')
          if (url) editor.chain().focus().setLink({ href: url }).run()
        }}><Link2 size={14} /></button>
        <button type="button" className={btn(false)} onClick={() => {
          const url = window.prompt('Image URL')
          if (url) editor.chain().focus().setImage({ src: url }).run()
        }}><ImageIcon size={14} /></button>
        <button type="button" className={btn(false)} onClick={() => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()}><Table2 size={14} /></button>
      </div>
      <EditorContent editor={editor} />
    </div>
  )
}
