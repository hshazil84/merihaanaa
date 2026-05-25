"use client";

import { useEditor, EditorContent, BubbleMenu } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import Image from "@tiptap/extension-image";
import Link from "@tiptap/extension-link";
import Underline from "@tiptap/extension-underline";
import TextAlign from "@tiptap/extension-text-align";
import CharacterCount from "@tiptap/extension-character-count";
import Youtube from "@tiptap/extension-youtube";
import { Node, mergeAttributes } from "@tiptap/core";
import { useCallback, useEffect, useRef, useState } from "react";
import InsertMediaModal from "@/components/admin/InsertMediaModal";
import type { MediaBlockAttrs } from "@/components/admin/InsertMediaModal";
import {
  Bold, Italic, Underline as UnderlineIcon,
  Heading2, Heading3, Quote, Minus,
  AlignRight, AlignCenter, AlignLeft,
  Link as LinkIcon, LayoutGrid,
  List, ListOrdered,
  Maximize2, Trash2,
} from "lucide-react";

// ── Vimeo node ────────────────────────────────────────────
const VimeoNode = Node.create({
  name: "vimeo",
  group: "block",
  atom: true,
  addAttributes() {
    return {
      videoId: { default: null },
      caption: { default: "" },
    };
  },
  parseHTML() { return [{ tag: "div[data-vimeo]" }]; },
  renderHTML({ HTMLAttributes }) {
    const { videoId, caption } = HTMLAttributes;
    return [
      "div", mergeAttributes({ "data-vimeo": "" }, { style: "margin:1rem 0;" }),
      ["div", { style: "position:relative;padding-bottom:56.25%;height:0;overflow:hidden;border-radius:12px;background:#000;" },
        ["iframe", { src: `https://player.vimeo.com/video/${videoId}?autoplay=0&title=0&byline=0&portrait=0`, style: "position:absolute;top:0;left:0;width:100%;height:100%;border:0;", allowfullscreen: "true", loading: "lazy" }],
      ],
      ...(caption ? [["p", { style: "text-align:center;font-size:11px;color:#888;font-style:italic;margin-top:4px;" }, caption]] : []),
    ];
  },
  addCommands() {
    return {
      insertVimeo: (attrs: { videoId: string; caption?: string }) => ({ commands }: any) =>
        commands.insertContent([{ type: "vimeo", attrs }, { type: "paragraph" }]),
    } as any;
  },
});

// ── Social node ───────────────────────────────────────────
const SocialNode = Node.create({
  name: "socialEmbed",
  group: "block",
  atom: true,
  addAttributes() {
    return {
      provider: { default: null },
      url:      { default: null },
      author:   { default: "" },
      text:     { default: "" },
      thumb:    { default: null },
    };
  },
  parseHTML() { return [{ tag: "div[data-social-embed]" }]; },
  renderHTML({ HTMLAttributes }) {
    const { provider, url, author, text, thumb } = HTMLAttributes;
    const icon = provider === "twitter" ? "𝕏" : provider === "instagram" ? "📸" : "🎵";
    // Ensure absolute URL and LTR display
    const safeUrl = url && !url.startsWith("http") ? `https://${url}` : (url ?? "");
    return [
      "div", mergeAttributes({ "data-social-embed": "" }, { style: "border:1px solid #e5e7eb;border-radius:12px;overflow:hidden;margin:1rem 0;max-width:540px;direction:ltr;text-align:left;" }),
      ...(thumb ? [["img", { src: thumb, alt: "", style: "width:100%;height:180px;object-fit:cover;" }]] : []),
      ["div", { style: "padding:12px;" },
        ["div", { style: "display:flex;align-items:center;gap:8px;margin-bottom:6px;direction:ltr;" },
          ["span", { style: "font-size:16px;" }, icon],
          ["strong", { style: "font-size:12px;" }, author ?? ""],
        ],
        ...(text ? [["p", { style: "font-size:12px;color:#666;margin:0 0 8px;line-height:1.5;direction:auto;text-align:left;" }, text]] : []),
        ["a", { href: safeUrl, target: "_blank", rel: "noopener noreferrer", style: "font-size:11px;color:#999;word-break:break-all;direction:ltr;display:block;" }, safeUrl],
      ],
    ];
  },
  addCommands() {
    return {
      insertSocial: (attrs: { provider: string; url: string; author?: string; text?: string; thumb?: string }) =>
        ({ commands }: any) => commands.insertContent([{ type: "socialEmbed", attrs }, { type: "paragraph" }]),
    } as any;
  },
});

// ── Editor component ──────────────────────────────────────

interface ArticleEditorProps {
  content?: Record<string, unknown>;
  onChange?: (content: Record<string, unknown>) => void;
  placeholder?: string;
}

const DEBOUNCE_MS = 600;

export default function ArticleEditor({ content, onChange, placeholder = "ލިޔުން ފަށާ..." }: ArticleEditorProps) {
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const onChangeRef = useRef(onChange);
  useEffect(() => { onChangeRef.current = onChange; }, [onChange]);

  const [mediaModalOpen, setMediaModalOpen] = useState(false);

  const handleUpdate = useCallback(({ editor }: any) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      onChangeRef.current?.(editor.getJSON() as Record<string, unknown>);
    }, DEBOUNCE_MS);
  }, []);

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit,
      Placeholder.configure({ placeholder }),
      Image.configure({ allowBase64: false, inline: false }),
      Link.configure({ openOnClick: false }),
      Underline,
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      CharacterCount,
      Youtube.configure({ controls: true, nocookie: true, width: 640, height: 360 }),
      VimeoNode,
      SocialNode,
    ],
    content: content || "",
    editorProps: {
      attributes: { class: "tiptap-editor-content focus:outline-none", dir: "rtl" },
      scrollThreshold: 0,
      scrollMargin: 0,
    },
    onUpdate: handleUpdate,
  });

  useEffect(() => {
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, []);

  const handleInsertMedia = useCallback((attrs: MediaBlockAttrs) => {
    if (!editor) return;

    if (attrs.type === "image" && attrs.src) {
      editor.commands.focus();
      editor.commands.setImage({ src: attrs.src, alt: attrs.alt ?? "" });
      editor.commands.createParagraphNear();
      return;
    }

    if (attrs.type === "video" && attrs.videoId) {
      if (attrs.videoProvider === "youtube") {
        editor.commands.focus();
        editor.commands.setYoutubeVideo({
          src: `https://www.youtube.com/watch?v=${attrs.videoId}`,
          width: 640,
          height: 360,
        });
      } else {
        (editor.chain().focus() as any)
          .insertVimeo({ videoId: attrs.videoId, caption: attrs.caption ?? "" })
          .focus().run();
      }
      return;
    }

    if (attrs.type === "social" && attrs.socialUrl) {
      const cleanUrl = attrs.socialUrl.startsWith("http")
        ? attrs.socialUrl
        : `https://${attrs.socialUrl}`;
      (editor.chain().focus() as any)
        .insertSocial({
          provider: attrs.socialProvider,
          url: cleanUrl,
          author: attrs.socialAuthor ?? "",
          text: attrs.socialText ?? "",
          thumb: attrs.socialThumb ?? null,
        })
        .focus().run();
      return;
    }
  }, [editor]);

  const addLink = (e: React.MouseEvent) => {
    e.preventDefault();
    const url = window.prompt("ލިންކް URL:");
    if (url) editor?.chain().focus().setLink({ href: url }).run();
  };

  if (!editor) return null;

  return (
    <>
      <div className="border border-border rounded-xl overflow-hidden bg-background">

        {/* ── Image bubble menu ── */}
        <BubbleMenu
          editor={editor}
          tippyOptions={{ duration: 150, placement: "top" }}
          shouldShow={({ editor }) => editor.isActive("image")}
        >
          <div className="flex items-center gap-0.5 px-1.5 py-1 rounded-lg bg-background border border-border shadow-lg">
            <BubbleBtn title="ފުރިހަމަ" onClick={() => editor.chain().focus().setImage({ src: editor.getAttributes("image").src, alt: editor.getAttributes("image").alt }).run()}>
              <Maximize2 size={13} />
            </BubbleBtn>
            <BubbleBtn title="ފޮހެލާ" danger onClick={() => editor.chain().focus().deleteSelection().run()}>
              <Trash2 size={13} />
            </BubbleBtn>
          </div>
        </BubbleMenu>

        {/* Toolbar */}
        <div className="flex flex-wrap items-center gap-0.5 p-2 border-b border-border bg-muted/30">
          <ToolbarGroup>
            <ToolbarBtn onClick={(e) => { e.preventDefault(); editor.chain().focus().toggleBold().run(); }}      active={editor.isActive("bold")}      title="ބޯލްޑް"><Bold size={14} /></ToolbarBtn>
            <ToolbarBtn onClick={(e) => { e.preventDefault(); editor.chain().focus().toggleItalic().run(); }}    active={editor.isActive("italic")}    title="އިޓަލިކް"><Italic size={14} /></ToolbarBtn>
            <ToolbarBtn onClick={(e) => { e.preventDefault(); editor.chain().focus().toggleUnderline().run(); }} active={editor.isActive("underline")} title="އަންޑަލައިން"><UnderlineIcon size={14} /></ToolbarBtn>
          </ToolbarGroup>
          <Divider />
          <ToolbarGroup>
            <ToolbarBtn onClick={(e) => { e.preventDefault(); editor.chain().focus().toggleHeading({ level: 2 }).run(); }} active={editor.isActive("heading", { level: 2 })} title="ސުރުހީ ٢"><Heading2 size={14} /></ToolbarBtn>
            <ToolbarBtn onClick={(e) => { e.preventDefault(); editor.chain().focus().toggleHeading({ level: 3 }).run(); }} active={editor.isActive("heading", { level: 3 })} title="ސުރުހީ ٣"><Heading3 size={14} /></ToolbarBtn>
          </ToolbarGroup>
          <Divider />
          <ToolbarGroup>
            <ToolbarBtn onClick={(e) => { e.preventDefault(); editor.chain().focus().toggleBulletList().run(); }}  active={editor.isActive("bulletList")}  title="ލިސްޓް"><List size={14} /></ToolbarBtn>
            <ToolbarBtn onClick={(e) => { e.preventDefault(); editor.chain().focus().toggleOrderedList().run(); }} active={editor.isActive("orderedList")} title="ނަންބަރު ލިސްޓް"><ListOrdered size={14} /></ToolbarBtn>
          </ToolbarGroup>
          <Divider />
          <ToolbarGroup>
            <ToolbarBtn onClick={(e) => { e.preventDefault(); editor.chain().focus().toggleBlockquote().run(); }}   active={editor.isActive("blockquote")} title="ޕުލް ކޯޓް"><Quote size={14} /></ToolbarBtn>
            <ToolbarBtn onClick={(e) => { e.preventDefault(); editor.chain().focus().setHorizontalRule().run(); }} title="ތިރި"><Minus size={14} /></ToolbarBtn>
          </ToolbarGroup>
          <Divider />
          <ToolbarGroup>
            <ToolbarBtn onClick={(e) => { e.preventDefault(); editor.chain().focus().setTextAlign("right").run(); }}  active={editor.isActive({ textAlign: "right" })}  title="ކަނާތް"><AlignRight size={14} /></ToolbarBtn>
            <ToolbarBtn onClick={(e) => { e.preventDefault(); editor.chain().focus().setTextAlign("center").run(); }} active={editor.isActive({ textAlign: "center" })} title="މެދު"><AlignCenter size={14} /></ToolbarBtn>
            <ToolbarBtn onClick={(e) => { e.preventDefault(); editor.chain().focus().setTextAlign("left").run(); }}   active={editor.isActive({ textAlign: "left" })}   title="ވައަތް"><AlignLeft size={14} /></ToolbarBtn>
          </ToolbarGroup>
          <Divider />
          <ToolbarGroup>
            <ToolbarBtn onClick={addLink} title="ލިންކް"><LinkIcon size={14} /></ToolbarBtn>
            <ToolbarBtn onClick={(e) => { e.preventDefault(); setMediaModalOpen(true); }} active={mediaModalOpen} title="މީޑިއާ">
              <LayoutGrid size={14} />
            </ToolbarBtn>
          </ToolbarGroup>
          <div className="mr-auto font-body text-xs text-muted-foreground px-2">
            {editor.storage.characterCount.words()} ބަސް
          </div>
        </div>

        <div className="p-6 min-h-96">
          <EditorContent editor={editor} className="article-body" />
        </div>
      </div>

      <InsertMediaModal
        open={mediaModalOpen}
        onClose={() => setMediaModalOpen(false)}
        onInsert={handleInsertMedia}
      />
    </>
  );
}

function BubbleBtn({ children, onClick, title, danger }: {
  children: React.ReactNode;
  onClick: () => void;
  title?: string;
  danger?: boolean;
}) {
  return (
    <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={onClick} title={title}
      className={`w-6 h-6 rounded-md flex items-center justify-center transition-colors ${danger ? "text-destructive hover:bg-destructive/10" : "text-muted-foreground hover:bg-muted hover:text-foreground"}`}>
      {children}
    </button>
  );
}

function ToolbarGroup({ children }: { children: React.ReactNode }) {
  return <div className="flex items-center gap-0.5">{children}</div>;
}

function ToolbarBtn({ children, onClick, active, title }: {
  children: React.ReactNode;
  onClick: (e: React.MouseEvent) => void;
  active?: boolean;
  title?: string;
}) {
  return (
    <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={onClick} title={title}
      className={`p-1.5 rounded-md transition-colors ${active ? "bg-foreground text-background" : "text-muted-foreground hover:bg-muted hover:text-foreground"}`}>
      {children}
    </button>
  );
}

function Divider() {
  return <div className="w-px h-5 bg-border mx-1" />;
}
