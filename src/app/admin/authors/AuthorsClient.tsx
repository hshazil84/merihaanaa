"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Author = {
  id: string;
  user_id: string | null;
  full_name: string;
  slug: string;
  bio: string | null;
  avatar: string | null;
  role: string;
  social_twitter: string | null;
  social_instagram: string | null;
  is_active: boolean | null;
  created_at: string | null;
};

type Props = { authors: Author[] };

function slugify(name: string) {
  return name.toLowerCase().trim().replace(/\s+/g, "-").replace(/[^\w-]/g, "");
}

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;

function avatarUrl(path: string | null): string | null {
  if (!path) return null;
  if (path.startsWith("http")) return path;
  return `${SUPABASE_URL}/storage/v1/object/public/avatars/${path}`;
}

const emptyForm = {
  full_name: "",
  slug: "",
  bio: "",
  avatar: "",
  role: "author",
  social_twitter: "",
  social_instagram: "",
  is_active: true,
};

function AuthorRow({
  author,
  index,
  onEdit,
  onDelete,
  onToggle,
}: {
  author: Author;
  index: number;
  onEdit: (a: Author) => void;
  onDelete: (a: Author) => void;
  onToggle: (a: Author) => void;
}) {
  const av = avatarUrl(author.avatar);
  return (
    <tr
      className={`border-b border-gray-100 dark:border-gray-800 last:border-0 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors ${
        index % 2 === 0 ? "" : "bg-gray-50/50 dark:bg-gray-800/20"
      }`}
    >
      <td className="px-4 py-3">
        <div className="flex items-center gap-3">
          {av ? (
            <img src={av} alt={author.full_name} className="w-8 h-8 rounded-full object-cover flex-shrink-0" />
          ) : (
            <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-xs font-medium text-gray-500 flex-shrink-0">
              {author.full_name.charAt(0).toUpperCase()}
            </div>
          )}
          <div>
            <div className="font-medium text-gray-900 dark:text-white">{author.full_name}</div>
            {author.bio && (
              <div className="text-xs text-gray-400 truncate max-w-[200px]">{author.bio}</div>
            )}
          </div>
        </div>
      </td>
      <td className="px-4 py-3 text-gray-500 dark:text-gray-400 font-mono text-xs">{author.slug}</td>
      <td className="px-4 py-3">
        <button
          onClick={() => onToggle(author)}
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
            author.is_active
              ? "bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-400"
              : "bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400"
          }`}
        >
          <span className={`w-1.5 h-1.5 rounded-full ${author.is_active ? "bg-green-500" : "bg-gray-400"}`} />
          {author.is_active ? "އެކްޓިވް" : "ނުހިމެނޭ"}
        </button>
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-2 text-gray-400">
          {author.social_twitter && (
            <a href={`https://x.com/${author.social_twitter}`} target="_blank" rel="noopener noreferrer" className="hover:text-gray-700 dark:hover:text-gray-200 transition-colors">
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.746l7.73-8.835L1.254 2.25H8.08l4.253 5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
              </svg>
            </a>
          )}
          {author.social_instagram && (
            <a href={`https://instagram.com/${author.social_instagram}`} target="_blank" rel="noopener noreferrer" className="hover:text-gray-700 dark:hover:text-gray-200 transition-colors">
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
              </svg>
            </a>
          )}
          {!author.social_twitter && !author.social_instagram && (
            <span className="text-xs text-gray-300 dark:text-gray-600">—</span>
          )}
        </div>
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-2 justify-end">
          <button
            onClick={() => onEdit(author)}
            className="text-xs px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          >
            އެޑިޓް
          </button>
          <button
            onClick={() => onDelete(author)}
            className="text-xs px-3 py-1.5 rounded-lg border border-red-100 dark:border-red-900/40 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
          >
            ފޮހޭ
          </button>
        </div>
      </td>
    </tr>
  );
}

export default function AuthorsClient({ authors: initial }: Props) {
  const supabase = createClient();
  const [authors, setAuthors] = useState<Author[]>(initial);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Author | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Author | null>(null);
  const [search, setSearch] = useState("");

  function openCreate() {
    setEditing(null);
    setForm(emptyForm);
    setAvatarFile(null);
    setAvatarPreview(null);
    setShowModal(true);
  }

  function openEdit(author: Author) {
    setEditing(author);
    setForm({
      full_name: author.full_name,
      slug: author.slug,
      bio: author.bio ?? "",
      avatar: author.avatar ?? "",
      role: author.role,
      social_twitter: author.social_twitter ?? "",
      social_instagram: author.social_instagram ?? "",
      is_active: author.is_active ?? true,
    });
    setAvatarFile(null);
    setAvatarPreview(avatarUrl(author.avatar));
    setShowModal(true);
  }

  function handleNameChange(name: string) {
    setForm((f) => ({
      ...f,
      full_name: name,
      slug: editing ? f.slug : slugify(name),
    }));
  }

  function handleAvatarPick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  }

  async function uploadAvatar(file: File, slug: string): Promise<string | null> {
    const ext = file.name.split(".").pop();
    const path = `${slug}-${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from("avatars").upload(path, file, { upsert: true });
    if (error) { console.error(error); return null; }
    return path;
  }

  async function handleSave() {
    if (!form.full_name.trim() || !form.slug.trim()) return;
    setSaving(true);
    let avatarPath = form.avatar;
    if (avatarFile) {
      const uploaded = await uploadAvatar(avatarFile, form.slug);
      if (uploaded) avatarPath = uploaded;
    }
    const payload = {
      full_name: form.full_name.trim(),
      slug: form.slug.trim(),
      bio: form.bio.trim() || null,
      avatar: avatarPath || null,
      role: form.role,
      social_twitter: form.social_twitter.replace("@", "").trim() || null,
      social_instagram: form.social_instagram.replace("@", "").trim() || null,
      is_active: form.is_active,
    };
    if (editing) {
      const { data, error } = await supabase.from("authors").update(payload).eq("id", editing.id).select().single();
      if (!error && data) setAuthors((prev) => prev.map((a) => (a.id === editing.id ? data : a)));
    } else {
      const { data, error } = await supabase.from("authors").insert(payload).select().single();
      if (!error && data) setAuthors((prev) => [data, ...prev]);
    }
    setSaving(false);
    setShowModal(false);
  }

  async function handleDelete(author: Author) {
    const { error } = await supabase.from("authors").delete().eq("id", author.id);
    if (!error) setAuthors((prev) => prev.filter((a) => a.id !== author.id));
    setDeleteTarget(null);
  }

  async function toggleActive(author: Author) {
    const next = !author.is_active;
    const { error } = await supabase.from("authors").update({ is_active: next }).eq("id", author.id);
    if (!error) setAuthors((prev) => prev.map((a) => (a.id === author.id ? { ...a, is_active: next } : a)));
  }

  const filtered = authors.filter((a) =>
    a.full_name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-6 max-w-5xl mx-auto" dir="rtl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-semibold text-gray-900 dark:text-white">ލިޔުންތެރިން</h1>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 px-4 py-2 bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-sm rounded-lg hover:opacity-80 transition-opacity"
        >
          <span className="text-lg leading-none">+</span>
          ލިޔުންތެރިއެއް އިތުރުކުރޭ
        </button>
      </div>

      <div className="mb-4">
        <input
          type="text"
          placeholder="ލިޔުންތެރިއެއް ހޯދާ..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full px-4 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-300 dark:focus:ring-gray-600"
        />
      </div>

      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden">
        {filtered.length === 0 ? (
          <div className="py-16 text-center text-sm text-gray-400">ލިޔުންތެރިން ނެތް</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 dark:border-gray-800 text-gray-500 dark:text-gray-400 text-right">
                <th className="px-4 py-3 font-medium">ލިޔުންތެރިޔާ</th>
                <th className="px-4 py-3 font-medium">ސްލަގް</th>
                <th className="px-4 py-3 font-medium">ހާލަތު</th>
                <th className="px-4 py-3 font-medium">ސޯޝަލް</th>
                <th className="px-4 py-3 font-medium"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((author, index) => (
                <AuthorRow
                  key={author.id}
                  author={author}
                  index={index}
                  onEdit={openEdit}
                  onDelete={setDeleteTarget}
                  onToggle={toggleActive}
                />
              ))}
            </tbody>
          </table>
        )}
      </div>

      <p className="mt-3 text-xs text-gray-400 text-right">{filtered.length} ލިޔުންތެރިން</p>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-900 rounded-xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden" dir="rtl">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-800">
              <h2 className="font-semibold text-gray-900 dark:text-white">
                {editing ? "ލިޔުންތެރިޔާ އެޑިޓްކުރޭ" : "އާ ލިޔުންތެރިއެއް"}
              </h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors text-xl leading-none">✕</button>
            </div>

            <div className="px-6 py-5 space-y-4 max-h-[70vh] overflow-y-auto">
              <div className="flex items-center gap-4">
                <div className="relative">
                  {avatarPreview ? (
                    <img src={avatarPreview} alt="avatar" className="w-16 h-16 rounded-full object-cover" />
                  ) : (
                    <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-400">
                      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                  )}
                  <label className="absolute -bottom-1 -left-1 w-6 h-6 bg-gray-900 dark:bg-white rounded-full flex items-center justify-center cursor-pointer hover:opacity-80 transition-opacity">
                    <svg className="w-3 h-3 text-white dark:text-gray-900" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    <input type="file" accept="image/*" className="hidden" onChange={handleAvatarPick} />
                  </label>
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400">ފޮޓޯ ބަދަލުކުރަން + ފިތާ</div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">ފުރިހަމަ ނަން *</label>
                <input
                  type="text"
                  value={form.full_name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  placeholder="Ahmed Mohamed"
                  className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-gray-300 dark:focus:ring-gray-600"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">ސްލަގް *</label>
                <input
                  type="text"
                  value={form.slug}
                  onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))}
                  placeholder="ahmed-mohamed"
                  dir="ltr"
                  className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white font-mono focus:outline-none focus:ring-2 focus:ring-gray-300 dark:focus:ring-gray-600"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">ބަޔޯ</label>
                <textarea
                  value={form.bio}
                  onChange={(e) => setForm((f) => ({ ...f, bio: e.target.value }))}
                  placeholder="ލިޔުންތެރިޔާ މިއީ ކޮން ވައްތަރެއްގެ ލިޔުމެއް ލިޔާ ބޭފުޅެއްތޯ..."
                  rows={3}
                  className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white resize-none focus:outline-none focus:ring-2 focus:ring-gray-300 dark:focus:ring-gray-600"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">X / Twitter</label>
                <div className="flex items-center border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                  <span className="px-3 py-2 text-sm text-gray-400 bg-gray-50 dark:bg-gray-800 border-l border-gray-200 dark:border-gray-700 select-none">@</span>
                  <input
                    type="text"
                    value={form.social_twitter.replace("@", "")}
                    onChange={(e) => setForm((f) => ({ ...f, social_twitter: e.target.value }))}
                    placeholder="username"
                    dir="ltr"
                    className="flex-1 px-3 py-2 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Instagram</label>
                <div className="flex items-center border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                  <span className="px-3 py-2 text-sm text-gray-400 bg-gray-50 dark:bg-gray-800 border-l border-gray-200 dark:border-gray-700 select-none">@</span>
                  <input
                    type="text"
                    value={form.social_instagram.replace("@", "")}
                    onChange={(e) => setForm((f) => ({ ...f, social_instagram: e.target.value }))}
                    placeholder="username"
                    dir="ltr"
                    className="flex-1 px-3 py-2 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between py-1">
                <span className="text-sm text-gray-700 dark:text-gray-300">ލިޔުންތެރިޔާ އެކްޓިވްކުރޭ</span>
                <button
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, is_active: !f.is_active }))}
                  className={`relative w-10 h-6 rounded-full transition-colors ${form.is_active ? "bg-gray-900 dark:bg-white" : "bg-gray-200 dark:bg-gray-700"}`}
                >
                  <span className={`absolute top-1 w-4 h-4 rounded-full bg-white dark:bg-gray-900 transition-all ${form.is_active ? "right-1" : "left-1"}`} />
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100 dark:border-gray-800">
              <button onClick={() => setShowModal(false)} className="text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors">
                ކެންސަލް
              </button>
              <button
                onClick={handleSave}
                disabled={saving || !form.full_name.trim() || !form.slug.trim()}
                className="px-5 py-2 text-sm bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-lg hover:opacity-80 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {saving ? "ސޭވްކުރަނީ..." : editing ? "ސޭވް"}
              </button>
            </div>
          </div>
        </div>
      )}

      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-900 rounded-xl shadow-2xl w-full max-w-sm mx-4 p-6" dir="rtl">
            <h2 className="font-semibold text-gray-900 dark:text-white mb-2">ލިޔުންތެރިޔާ ފޮހެލާ؟</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
              <span className="font-medium text-gray-700 dark:text-gray-200">{deleteTarget.full_name}</span> އެކަށްފުހެވިގެންދާނެ
            </p>
            <div className="flex items-center gap-3">
              <button onClick={() => handleDelete(deleteTarget)} className="px-4 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors">
                އާ، ފޮހޭ
              </button>
              <button onClick={() => setDeleteTarget(null)} className="px-4 py-2 text-sm border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                ނޫން
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
