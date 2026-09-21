# Health Memory

> Your health history, finally connected.

Health Memory is a mobile-first health companion that turns scattered medical records into an organized, longitudinal health timeline. Upload a prescription, lab report, imaging report, visit note, or other health document, then review extracted events, prepare for appointments, and ask questions about documented trends.

![Health Memory](public/icon.svg)

## Highlights

- **Secure sign-in** with Google OAuth, email/password, or phone OTP through Supabase Auth
- **Personal health profile** with demographics, blood type, allergies, and contact details
- **Document upload and extraction** for PDFs and images using Google Gemini
- **Longitudinal timeline** for visits, labs, medications, symptoms, hospitalizations, and imaging
- **AI health-history assistant** that separates documented facts, observed patterns, and discussion points
- **Doctor preparation** with concise summaries and questions to ask a healthcare professional
- **Appointment tracking** with upcoming appointment reminders and timeline events
- **Responsive mobile UI** designed around a focused, app-like experience
- **Row-level security** for Supabase profiles, appointments, and private document storage

## Tech stack

| Area | Technology |
| --- | --- |
| UI | React 19, TypeScript |
| Styling | Tailwind CSS 4 |
| Build tool | Vite |
| Server | Express, Vite middleware |
| Authentication and data | Supabase |
| AI | Google Gemini via `@google/genai` |
| Icons and motion | Lucide React, Motion |

## Project structure

```text
.
├── api/                  # Serverless API handlers for deployment platforms
├── public/               # Static assets and web app manifest
├── src/
│   ├── components/       # Screens, navigation, modals, and flows
│   ├── data/             # Demo and seed data
│   ├── lib/              # Supabase client and persistence helpers
│   ├── utils/            # Client-side utilities
│   ├── App.tsx           # Main application shell and routing state
│   └── main.tsx          # Application entry point
├── supabase/schema.sql   # Database, storage, and RLS policies
├── server.ts             # Local/production Express server
├── vite.config.ts        # Vite and Tailwind configuration
└── package.json          # Scripts and dependencies
```

## Getting started

### Prerequisites

- Node.js 18 or newer
- npm
- A Supabase project
- A Google Gemini API key for AI features

### Install

```bash
npm install
```

### Configure environment variables

Create a local `.env` file in the project root:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
GEMINI_API_KEY=your-gemini-api-key
PORT=3000
```

Never commit `.env`, API keys, service-role keys, or other credentials. The repository's `.gitignore` excludes local environment files.

### Configure Supabase

1. Create a Supabase project.
2. In the Supabase SQL editor, run [`supabase/schema.sql`](supabase/schema.sql).
3. Enable the authentication providers you want to use: Google, email, and/or phone.
4. Add your local and deployed application URLs to Supabase Auth redirect settings.

### Run locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Available scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Start the Express + Vite development server |
| `npm run build` | Build the frontend and bundle the production server |
| `npm start` | Start the bundled production server |
| `npm run preview` | Preview the Vite production build |
| `npm run lint` | Run the TypeScript type check |
| `npm run clean` | Remove generated build output |

Before opening a pull request, run:

```bash
npm run lint
npm run build
```

## AI and privacy notes

Health Memory is an organizational and preparation tool, not a diagnostic system. The AI assistant is instructed not to diagnose conditions or prescribe treatments. It should use the records supplied to it, identify documented information and patterns, and suggest topics to discuss with a qualified healthcare professional.

Uploaded health documents and profile data are sensitive. Use a properly configured Supabase project, review its authentication settings, and keep production credentials out of source control. The Gemini API key must remain server-side and should not be exposed as a `VITE_` variable.

## Deployment

The project includes both:

- `server.ts` for the Express/Vite development and Node production server
- `api/` handlers for serverless deployments such as Vercel

For a production deployment:

1. Build with `npm run build`.
2. Configure `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, and `GEMINI_API_KEY` in the hosting provider.
3. Configure the production URL in Supabase Auth.
4. Verify authentication, document scanning, AI questions, and appointment persistence in the deployed environment.

## Disclaimer

Health Memory does not replace a doctor, emergency service, or professional medical advice. Always consult a qualified healthcare professional for diagnosis, treatment, and urgent health concerns.

## License

No open-source license has been selected yet. Until a license is added, all rights are reserved by the project owner.
