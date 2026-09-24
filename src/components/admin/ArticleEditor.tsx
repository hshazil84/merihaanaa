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
import CarouselModal from "@/components/admin/CarouselModal";
import type { MediaBlockAttrs } from "@/components/admin/InsertMediaModal";
import {
  Bold, Italic, Underline as UnderlineIcon,
  Heading2, Heading3, Quote, Minus,
  AlignRight, AlignCenter, AlignLeft,
  Link as LinkIcon, LayoutGrid,
  List, ListOrdered,
  Trash2, GalleryHorizontal,
} from "lucide-react";

// ── Vimeo node ─────────────────────────────────────────────
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
        ["iframe", { src: "https://player.vimeo.com/video/" + videoId + "?autoplay=0&title=0&byline=0&portrait=0", style: "position:absolute;top:0;left:0;width:100%;height:100%;border:0;", allowfullscreen: "true", loading: "lazy" }],
      ],
      ...(caption ? [["p", { style: "text-align:center;font-size:11px;font-weight:700;color:#888;margin-top:4px;" }, caption]] : []),
    ];
  },
  addCommands() {
    return {
      insertVimeo: (attrs: { videoId: string; caption?: string }) => ({ commands }: any) =>
        commands.insertContent([{ type: "vimeo", attrs }, { type: "paragraph" }]),
    } as any;
  },
});

// ── Social node ────────────────────────────────────────────
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
    const safeUrl = url && !url.startsWith("http") ? "https://" + url : (url ?? "");
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

// ── Pull Quote node ────────────────────────────────────────
const PullQuoteNode = Node.create({
  name: "pullQuote",
  group: "block",
  atom: true,
  addAttributes() {
    return {
      text:   { default: "" },
      author: { default: "" },
    };
  },
  parseHTML() { return [{ tag: "div[data-pull-quote]" }]; },
  renderHTML({ HTMLAttributes }) {
    const { text, author } = HTMLAttributes;
    return [
      "div", mergeAttributes({ "data-pull-quote": "" }, {
        style: "margin:2rem auto;padding:0 2rem;text-align:center;max-width:600px;",
      }),
      ["p", { style: "font-family:'MVTypewriter','Noto Sans Thaana',sans-serif;font-size:1.35rem;font-weight:700;color:rgb(26,26,26);line-height:1.8;margin:0 0 0.5rem;" }, '"' + text + '"'],
      ...(author ? [["p", { style: "font-family:'MVTypewriter',sans-serif;font-size:11px;font-weight:700;color:rgb(160,158,152);line-height:2;margin:0;" }, "— " + author]] : []),
    ];
  },
  addCommands() {
    return {
      insertPullQuote: (attrs: { text: string; author?: string }) => ({ commands }: any) =>
        commands.insertContent([{ type: "pullQuote", attrs }, { type: "paragraph" }]),
    } as any;
  },
});

// ── Interview Q&A node ─────────────────────────────────────
const InterviewNode = Node.create({
  name: "interview",
  group: "block",
  atom: true,
  addAttributes() {
    return {
      question: { default: "" },
      answer:   { default: "" },
    };
  },
  parseHTML() { return [{ tag: "div[data-interview]" }]; },
  renderHTML({ HTMLAttributes }) {
    const { question, answer } = HTMLAttributes;
    return [
      "div", mergeAttributes({ "data-interview": "" }, { style: "margin:1.5rem 0;" }),
      ["div", { style: "background:rgb(240,239,233);border:1px solid rgb(224,221,214);border-radius:8px;padding:14px 18px;margin-bottom:8px;direction:rtl;" },
        ["p", { style: "font-family:'MVTypewriter',sans-serif;font-size:10px;font-weight:700;color:rgb(100,98,92);letter-spacing:0.05em;margin:0 0 4px;opacity:0.7;" }, "ސ"],
        ["p", { style: "font-family:'MVTypewriter','Noto Sans Thaana',sans-serif;font-size:14px;color:rgb(26,26,26);line-height:1.9;margin:0;" }, question],
      ],
      ["div", { style: "background:rgb(249,248,245);border:1px solid rgb(224,221,214);border-radius:8px;padding:14px 18px;direction:rtl;" },
        ["p", { style: "font-family:'MVTypewriter',sans-serif;font-size:10px;font-weight:700;color:rgb(100,98,92);letter-spacing:0.05em;margin:0 0 4px;opacity:0.7;" }, "ޖ"],
        ["p", { style: "font-family:'MVTypewriter','Noto Sans Thaana',sans-serif;font-size:14px;color:rgb(26,26,26);line-height:1.9;margin:0;" }, answer],
      ],
    ];
  },
  addCommands() {
    return {
      insertInterview: (attrs: { question: string; answer: string }) => ({ commands }: any) =>
        commands.insertContent([{ type: "interview", attrs }, { type: "paragraph" }]),
    } as any;
  },
});

// ── Styled Blockquote node ─────────────────────────────────
const StyledBlockquoteNode = Node.create({
  name: "styledBlockquote",
  group: "block",
  atom: true,
  addAttributes() {
    return {
      text:   { default: "" },
      author: { default: "" },
    };
  },
  parseHTML() { return [{ tag: "div[data-styled-blockquote]" }]; },
  renderHTML({ HTMLAttributes }) {
    const { text, author } = HTMLAttributes;
    return [
      "div", mergeAttributes({ "data-styled-blockquote": "" }, {
        style: "margin:1.5rem 0;padding:4px 0 4px 0;border-right:2px solid rgba(0,0,0,0.5);padding-right:20px;direction:rtl;",
      }),
      ["p", { style: "font-family:'MVTypewriter','Noto Sans Thaana',sans-serif;font-size:16px;color:rgb(60,58,52);line-height:2;margin:0 0 4px;" }, text],
      ...(author ? [["p", { style: "font-family:'MVTypewriter',sans-serif;font-size:11px;font-weight:700;color:rgb(160,158,152);line-height:2;margin:0;" }, "— " + author]] : []),
    ];
  },
  addCommands() {
    return {
      insertStyledBlockquote: (attrs: { text: string; author?: string }) => ({ commands }: any) =>
        commands.insertContent([{ type: "styledBlockquote", attrs }, { type: "paragraph" }]),
    } as any;
  },
});

// ── Carousel node ──────────────────────────────────────────
const CarouselNode = Node.create({
  name: "carousel",
  group: "block",
  atom: true,
  addAttributes() {
    return {
      images: { default: "[]" },
      ratio:  { default: "4:5" },
    };
  },
  parseHTML() { return [{ tag: "div[data-carousel]" }]; },
  renderHTML({ HTMLAttributes }) {
    const { images, ratio } = HTMLAttributes;
    const imagesStr = typeof images === "string" ? images : JSON.stringify(images);
    return [
      "div", mergeAttributes({ "data-carousel": "" }, {
        "data-images": imagesStr,
        "data-ratio": ratio,
        style: "margin:1.5rem 0;background:rgb(240,239,233);border-radius:12px;padding:16px;text-align:center;font-family:'MVTypewriter',sans-serif;font-size:12px;color:rgb(160,158,152);",
      }),
      ["span", {}, "🖼 ކެރޯސަލް (" + ratio + ")"],
    ];
  },
  addCommands() {
    return {
      insertCarousel: (attrs: { images: string[]; ratio: string }) => ({ commands }: any) =>
        commands.insertContent([{ type: "carousel", attrs: { images: JSON.stringify(attrs.images), ratio: attrs.ratio } }, { type: "paragraph" }]),
    } as any;
  },
});

// ── Quote modal ────────────────────────────────────────────
type QuoteType = "pullQuote" | "interview" | "styledBlockquote";

const QUOTE_STYLES: { type: QuoteType; label: string; preview: React.ReactNode }[] = [
  {
    type: "pullQuote",
    label: "ޕުލް ކޯޓް",
    preview: (
      <div className="flex items-center justify-center h-16">
        <span className="text-4xl font-bold text-foreground/20 leading-none">"</span>
      </div>
    ),
  },
  {
    type: "styledBlockquote",
    label: "ބްލޮކްކޯޓް",
    preview: (
      <div className="flex items-center justify-end h-16 pr-3">
        <div className="border-r-2 border-foreground/30 pr-3 h-8" />
      </div>
    ),
  },
  {
    type: "interview",
    label: "ސ/ޖ އިންޓަވިއު",
    preview: (
      <div className="flex flex-col gap-1.5 justify-center h-16">
        <div className="bg-muted rounded-md px-2 py-1 text-right">
          <span className="font-body text-[10px] font-bold text-muted-foreground">ސ</span>
        </div>
        <div className="border border-border rounded-md px-2 py-1 text-right">
          <span className="font-body text-[10px] font-bold text-muted-foreground">ޖ</span>
        </div>
      </div>
    ),
  },
];

function QuoteModal({
  onInsert,
  onClose,
}: {
  onInsert: (type: QuoteType, data: any) => void;
  onClose: () => void;
}) {
  const [selected, setSelected] = useState<QuoteType | null>(null);
  const [text, setText]         = useState("");
  const [author, setAuthor]     = useState("");
  const [question, setQuestion] = useState("");
  const [answer, setAnswer]     = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selected) return;
    if (selected === "interview") {
      if (!question.trim() || !answer.trim()) return;
      onInsert(selected, { question, answer });
    } else {
      if (!text.trim()) return;
      onInsert(selected, { text, author });
    }
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-background rounded-2xl border border-border shadow-xl w-full max-w-lg mx-4 p-5" onClick={(e) => e.stopPropagation()}>
        <h3 className="font-body text-sm font-semibold text-foreground mb-4 text-right">ކޯޓް ސްޓައިލް</h3>

        {!selected && (
          <div className="grid grid-cols-3 gap-3">
            {QUOTE_STYLES.map((s) => (
              <button
                key={s.type}
                type="button"
                onClick={() => setSelected(s.type)}
                className="border border-border rounded-xl p-3 hover:border-foreground hover:bg-muted/40 transition-all text-right"
              >
                <div className="mb-2">{s.preview}</div>
                <p className="font-body text-[11px] text-muted-foreground text-right" dir="rtl">{s.label}</p>
              </button>
            ))}
          </div>
        )}

        {selected && (
          <form onSubmit={handleSubmit} className="space-y-3">
            <button
              type="button"
              onClick={() => setSelected(null)}
              className="font-body text-xs text-muted-foreground hover:text-foreground transition-colors mb-1"
            >
              ← ބަދަލުކުރޭ
            </button>

            {selected === "interview" ? (
              <>
                <div>
                  <label className="font-body text-xs text-muted-foreground block mb-1 text-right">ސުވާލު</label>
                  <textarea value={question} onChange={(e) => setQuestion(e.target.value)} rows={2} dir="rtl" autoFocus
                    className="w-full font-body text-sm p-2.5 rounded-xl border border-border bg-muted/40 outline-none focus:border-foreground resize-none transition-colors"
                    placeholder="ސުވާލު ލިޔެލާ..." />
                </div>
                <div>
                  <label className="font-body text-xs text-muted-foreground block mb-1 text-right">ޖަވާބު</label>
                  <textarea value={answer} onChange={(e) => setAnswer(e.target.value)} rows={3} dir="rtl"
                    className="w-full font-body text-sm p-2.5 rounded-xl border border-border bg-muted/40 outline-none focus:border-foreground resize-none transition-colors"
                    placeholder="ޖަވާބު ލިޔެލާ..." />
                </div>
              </>
            ) : (
              <>
                <div>
                  <label className="font-body text-xs text-muted-foreground block mb-1 text-right">ޖުމްލަ</label>
                  <textarea value={text} onChange={(e) => setText(e.target.value)} rows={3} dir="rtl" autoFocus
                    className="w-full font-body text-sm p-2.5 rounded-xl border border-border bg-muted/40 outline-none focus:border-foreground resize-none transition-colors"
                    placeholder="ޖުމްލަ ލިޔެލާ..." />
                </div>
                <div>
                  <label className="font-body text-xs text-muted-foreground block mb-1 text-right">ލިޔުންތެރިޔާ / މަސްދަރު (އިހްތިޔާރީ)</label>
                  <input value={author} onChange={(e) => setAuthor(e.target.value)} dir="rtl"
                    className="w-full font-body text-sm p-2.5 rounded-xl border border-border bg-muted/40 outline-none focus:border-foreground transition-colors"
                    placeholder="ނަން ނުވަތަ މަސްދަރު..." />
                </div>
              </>
            )}

            <div className="flex gap-2 pt-1">
              <button type="submit"
                className="flex-1 py-2.5 rounded-xl bg-foreground text-background font-body text-xs font-semibold hover:opacity-80 transition-opacity">
                އިންސާޓް
              </button>
              <button type="button" onClick={onClose}
                className="px-4 py-2.5 rounded-xl border border-border font-body text-xs text-muted-foreground hover:bg-muted transition-colors">
                ނޫން
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

// ── Editor component ───────────────────────────────────────

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

  const [mediaModalOpen, setMediaModalOpen]     = useState(false);
  const [quoteModalOpen, setQuoteModalOpen]     = useState(false);
  const [carouselModalOpen, setCarouselModalOpen] = useState(false);

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
      PullQuoteNode,
      InterviewNode,
      StyledBlockquoteNode,
      CarouselNode,
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
        editor.commands.setYoutubeVideo({ src: "https://www.youtube.com/watch?v=" + attrs.videoId, width: 640, height: 360 });
      } else {
        (editor.chain().focus() as any).insertVimeo({ videoId: attrs.videoId, caption: attrs.caption ?? "" }).focus().run();
      }
      return;
    }
    if (attrs.type === "social" && attrs.socialUrl) {
      const cleanUrl = attrs.socialUrl.startsWith("http") ? attrs.socialUrl : "https://" + attrs.socialUrl;
      (editor.chain().focus() as any).insertSocial({ provider: attrs.socialProvider, url: cleanUrl, author: attrs.socialAuthor ?? "", text: attrs.socialText ?? "", thumb: attrs.socialThumb ?? null }).focus().run();
      return;
    }
  }, [editor]);

  const handleQuoteInsert = (type: QuoteType, data: any) => {
    if (!editor) return;
    if (type === "pullQuote") (editor.chain().focus() as any).insertPullQuote(data).focus().run();
    if (type === "interview") (editor.chain().focus() as any).insertInterview(data).focus().run();
    if (type === "styledBlockquote") (editor.chain().focus() as any).insertStyledBlockquote(data).focus().run();
  };

  const handleCarouselInsert = (images: string[], ratio: string) => {
    if (!editor) return;
    (editor.chain().focus() as any).insertCarousel({ images, ratio }).focus().run();
  };

  const addLink = (e: React.MouseEvent) => {
    e.preventDefault();
    const url = window.prompt("ލިންކް URL:");
    if (url) editor?.chain().focus().setLink({ href: url }).run();
  };

  if (!editor) return null;

  return (
    <>
      <div className="border border-border rounded-xl bg-background">

        <BubbleMenu
          editor={editor}
          tippyOptions={{ duration: 150, placement: "top" }}
          shouldShow={({ editor }) => editor.isActive("image")}
        >
          <div className="flex items-center gap-0.5 px-1.5 py-1 rounded-lg bg-background border border-border shadow-lg">
            <BubbleBtn title="ފޮހެލާ" danger onClick={() => editor.chain().focus().deleteSelection().run()}>
              <Trash2 size={13} />
            </BubbleBtn>
          </div>
        </BubbleMenu>

        {/* Sticky Toolbar */}
        <div
        className="flex flex-wrap items-center gap-0.5 p-2 border-b border-border sticky top-0 z-10 rounded-t-xl"
        style={{ backgroundColor: "hsl(var(--background))", isolation: "isolate" }}
        >
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
            <ToolbarBtn onClick={(e) => { e.preventDefault(); setQuoteModalOpen(true); }} title="ކޯޓް"><Quote size={14} /></ToolbarBtn>
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
            <ToolbarBtn onClick={(e) => { e.preventDefault(); setCarouselModalOpen(true); }} active={carouselModalOpen} title="ކެރޯސަލް">
              <GalleryHorizontal size={14} />
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

      {quoteModalOpen && (
        <QuoteModal
          onInsert={handleQuoteInsert}
          onClose={() => setQuoteModalOpen(false)}
        />
      )}

      {carouselModalOpen && (
        <CarouselModal
          onInsert={handleCarouselInsert}
          onClose={() => setCarouselModalOpen(false)}
        />
      )}
    </>
  );
}

function BubbleBtn({ children, onClick, title, danger }: {
  children: React.ReactNode; onClick: () => void; title?: string; danger?: boolean;
}) {
  return (
    <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={onClick} title={title}
      className={"w-6 h-6 rounded-md flex items-center justify-center transition-colors " + (danger ? "text-destructive hover:bg-destructive/10" : "text-muted-foreground hover:bg-muted hover:text-foreground")}>
      {children}
    </button>
  );
}

function ToolbarGroup({ children }: { children: React.ReactNode }) {
  return <div className="flex items-center gap-0.5">{children}</div>;
}

function ToolbarBtn({ children, onClick, active, title }: {
  children: React.ReactNode; onClick: (e: React.MouseEvent) => void; active?: boolean; title?: string;
}) {
  return (
    <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={onClick} title={title}
      className={"p-1.5 rounded-md transition-colors " + (active ? "bg-foreground text-background" : "text-muted-foreground hover:bg-muted hover:text-foreground")}>
      {children}
    </button>
  );
}

function Divider() {
  return <div className="w-px h-5 bg-border mx-1" />;
}
