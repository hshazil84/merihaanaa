# މެރިހާނާ

ދިވެހި ލައިފްސްޓައިލް، ފިލްމް، މިއުޒިކް، ކަލްޗަރ މެގަޒިން

---

## Stack

- **Frontend + SSR** — Next.js 14 App Router
- **Database + Auth** — Supabase (PostgreSQL)
- **Rich Text Editor** — Tiptap
- **Video** — Cloudflare Stream
- **Storage** — Cloudflare R2
- **Email** — Resend
- **Deploy** — Vercel
- **DNS + CDN** — Cloudflare

---

## Fonts

Place these files in `/public/fonts/` before running:

```
public/fonts/
  Sangu Suruhee 2.0.woff   ← Display / Headings
  MVTypewriter.woff         ← Body regular
  MVTypewriter-Bold.woff    ← Body bold / subheadings
```

---

## Setup

### 1. Clone and install

```bash
git clone https://github.com/YOUR_USERNAME/merihaanaa.git
cd merihaanaa
npm install
```

### 2. Environment variables

```bash
cp .env.example .env.local
```

Fill in your Supabase, Cloudflare, and Resend keys.

### 3. Supabase database

- Create a new Supabase project
- Go to SQL Editor
- Run the contents of `supabase/migrations/001_initial_schema.sql`

### 4. Add fonts

Copy your font files into `public/fonts/`

### 5. Run locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

Admin panel: [http://localhost:3000/admin](http://localhost:3000/admin)

---

## Project Structure

```
src/
├── app/
│   ├── admin/          ← Admin panel (all in Thaana)
│   ├── article/        ← Article pages
│   ├── category/       ← Category pages
│   ├── video/          ← Video episode pages
│   ├── login/          ← Auth
│   └── layout.tsx      ← Root layout (RTL, fonts, dark mode)
│
├── components/
│   ├── layout/         ← Navbar, Footer, PageWrapper
│   ├── homepage/       ← Hero, EditorsChoice, Reels, Reviews
│   ├── article/        ← ArticleBody, PullQuote, DropCap
│   ├── cards/          ← CardLarge, CardMedium, CardSmall
│   ├── ui/             ← CategoryPill, AuthorAvatar, Toggle
│   ├── admin/          ← Admin-specific components
│   └── animation/      ← FadeIn, Lottie, Parallax
│
├── lib/
│   ├── supabase/       ← Supabase clients
│   └── utils.ts        ← Helpers
│
├── types/
│   └── index.ts        ← All TypeScript types
│
└── styles/
    └── globals.css     ← Fonts, RTL, dark mode, base styles
```

---

## Deploy

1. Push to GitHub
2. Connect repo to Vercel
3. Add environment variables in Vercel dashboard
4. Deploy — done
