# VKX Sports

## Product Vision

VKX Sports is a SaaS platform focused on sports tournament management.

The platform allows organizers to create, manage and publish sports competitions in a modern, responsive and real-time environment.

The goal is to provide an alternative to platforms like Copa Fácil, with a more modern UI, better performance and advanced automation features.

---

## Main Features

### Tournament Management

- Create tournaments
- Edit tournaments
- Delete tournaments
- Public tournament pages

### Tournament Formats

- Round Robin (Points League)
- Knockout (Single Elimination)
- Group Stage + Knockout
- Custom formats (future)

### Teams

- Team registration
- Team logo upload
- Team profile page

### Players

- Player registration
- Player photo
- Jersey number
- Position

### Matches

- Schedule matches
- Live score updates
- Match status

### Statistics

- Standings table
- Top scorers
- Assists
- Yellow cards
- Red cards
- Suspensions

### Permissions

ADMIN:
- Manage platform

ORGANIZER:
- Manage own tournaments

VIEWER:
- Read only

---

## Technical Stack

### Frontend

- Next.js 15
- React 19
- TypeScript
- Tailwind CSS v4
- Shadcn/UI
- Lucide Icons

### Backend (Future)

- Java 17
- Spring Boot
- Spring Security
- JWT
- PostgreSQL

### Infrastructure

- Docker
- GitHub Actions
- Vercel
- Supabase

---

## Architecture Principles

### Clean Code

- Small components
- Single Responsibility Principle
- Reusable UI

### Folder Structure

src/
├── app
├── components
│ ├── layout
│ ├── ui
│ ├── championship
│ ├── team
│ └── player
├── lib
├── services
├── hooks
├── types
└── utils

---

## Design System

Theme:
- Dark Premium

Primary:
- Gold
- Black

Visual References:
- Champions League
- FIFA
- Copa Fácil
- Sofascore

Style:
- Modern
- Minimalist
- Professional
- Mobile First

---

## Development Rules

- Always use TypeScript.
- Avoid any type.
- Create reusable components.
- Prefer server components when possible.
- Use client components only when necessary.
- Maintain responsive design.
- Follow accessibility best practices.
- Keep code scalable for SaaS growth.

---

## Future Features

- AI generated match summaries
- AI generated news
- Mobile App
- Pix subscriptions
- Multi-language support
- Tournament API
- White-label tournaments