"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import Image from "@tiptap/extension-image";
import Link from "@tiptap/extension-link";
import Underline from "@tiptap/extension-underline";
import TextAlign from "@tiptap/extension-text-align";
import CharacterCount from "@tiptap/extension-character-count";
import { Button } from "@/components/ui/button";
import {
  Bold, Italic, Underline as UnderlineIcon,
  Heading2, Heading3, Quote, Minus,
  AlignRight, AlignCenter, AlignLeft,
  Link as LinkIcon, Image as ImageIcon,
  List, ListOrdered,
} from "lucide-react";

interface ArticleEditorProps {
  content?: Record<string, unknown>;
  onChange?: (content: Record<string, unknown>) => void;
  placeholder?: string;
}

export default function ArticleEditor({
  content,
  onChange,
  placeholder = "ލިޔުން ފަށާ...",
}: ArticleEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({ placeholder }),
      Image,
      Link.configure({ openOnClick: false }),
      Underline,
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      CharacterCount,
    ],
    content: content || "",
    editorProps: {
      attributes: {
        class: "tiptap-editor-content focus:outline-none",
        dir: "rtl",
      },
    },
    onUpdate: ({ editor }) => {
      onChange?.(editor.getJSON() as Record<string, unknown>);
    },
  });

  if (!editor) return null;

  const addImage = () => {
    const url = window.prompt("ފޮޓޯ URL:");
    if (url) editor.chain().focus().setImage({ src: url }).run();
  };

  const addLink = () => {
    const url = window.prompt("ލިންކް URL:");
    if (url) editor.chain().focus().setLink({ href: url }).run();
  };

  return (
    <div className="border border-border rounded-xl overflow-hidden bg-background">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-0.5 p-2 border-b border-border bg-muted/30">
        {/* Text style */}
        <ToolbarGroup>
          <ToolbarBtn
            onClick={() => editor.chain().focus().toggleBold().run()}
            active={editor.isActive("bold")}
            title="ބޯލްޑް"
          >
            <Bold size={14} />
          </ToolbarBtn>
          <ToolbarBtn
            onClick={() => editor.chain().focus().toggleItalic().run()}
            active={editor.isActive("italic")}
            title="އިޓަލިކް"
          >
            <Italic size={14} />
          </ToolbarBtn>
          <ToolbarBtn
            onClick={() => editor.chain().focus().toggleUnderline().run()}
            active={editor.isActive("underline")}
            title="އަންޑަލައިން"
          >
            <UnderlineIcon size={14} />
          </ToolbarBtn>
        </ToolbarGroup>

        <Divider />

        {/* Headings */}
        <ToolbarGroup>
          <ToolbarBtn
            onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
            active={editor.isActive("heading", { level: 2 })}
            title="ސުރުހީ ٢"
          >
            <Heading2 size={14} />
          </ToolbarBtn>
          <ToolbarBtn
            onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
            active={editor.isActive("heading", { level: 3 })}
            title="ސުރުހީ ٣"
          >
            <Heading3 size={14} />
          </ToolbarBtn>
        </ToolbarGroup>

        <Divider />

        {/* Lists */}
        <ToolbarGroup>
          <ToolbarBtn
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            active={editor.isActive("bulletList")}
            title="ލިސްޓް"
          >
            <List size={14} />
          </ToolbarBtn>
          <ToolbarBtn
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            active={editor.isActive("orderedList")}
            title="ނަންބަރު ލިސްޓް"
          >
            <ListOrdered size={14} />
          </ToolbarBtn>
        </ToolbarGroup>

        <Divider />

        {/* Blocks */}
        <ToolbarGroup>
          <ToolbarBtn
            onClick={() => editor.chain().focus().toggleBlockquote().run()}
            active={editor.isActive("blockquote")}
            title="ޕުލް ކޯޓް"
          >
            <Quote size={14} />
          </ToolbarBtn>
          <ToolbarBtn
            onClick={() => editor.chain().focus().setHorizontalRule().run()}
            title="ތިރި"
          >
            <Minus size={14} />
          </ToolbarBtn>
        </ToolbarGroup>

        <Divider />

        {/* Alignment */}
        <ToolbarGroup>
          <ToolbarBtn
            onClick={() => editor.chain().focus().setTextAlign("right").run()}
            active={editor.isActive({ textAlign: "right" })}
            title="ކަނާތް"
          >
            <AlignRight size={14} />
          </ToolbarBtn>
          <ToolbarBtn
            onClick={() => editor.chain().focus().setTextAlign("center").run()}
            active={editor.isActive({ textAlign: "center" })}
            title="މެދު"
          >
            <AlignCenter size={14} />
          </ToolbarBtn>
          <ToolbarBtn
            onClick={() => editor.chain().focus().setTextAlign("left").run()}
            active={editor.isActive({ textAlign: "left" })}
            title="ވައަތް"
          >
            <AlignLeft size={14} />
          </ToolbarBtn>
        </ToolbarGroup>

        <Divider />

        {/* Media */}
        <ToolbarGroup>
          <ToolbarBtn onClick={addLink} title="ލިންކް">
            <LinkIcon size={14} />
          </ToolbarBtn>
          <ToolbarBtn onClick={addImage} title="ފޮޓޯ">
            <ImageIcon size={14} />
          </ToolbarBtn>
        </ToolbarGroup>

        {/* Character count */}
        <div className="mr-auto font-body text-xs text-muted-foreground px-2">
          {editor.storage.characterCount.words()} ބަސް
        </div>
      </div>

      {/* Editor content */}
      <div className="p-6 min-h-96">
        <EditorContent editor={editor} className="article-body" />
      </div>
    </div>
  );
}

// ── Toolbar helpers ───────────────────────────────────────

function ToolbarGroup({ children }: { children: React.ReactNode }) {
  return <div className="flex items-center gap-0.5">{children}</div>;
}

function ToolbarBtn({
  children, onClick, active, title,
}: {
  children: React.ReactNode;
  onClick: () => void;
  active?: boolean;
  title?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className={`
        p-1.5 rounded-md transition-colors
        ${active
          ? "bg-foreground text-background"
          : "text-muted-foreground hover:bg-muted hover:text-foreground"
        }
      `}
    >
      {children}
    </button>
  );
}

function Divider() {
  return <div className="w-px h-5 bg-border mx-1" />;
}