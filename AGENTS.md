# Food Map Project Agent Rules

## Project Goal

This project is not a CRUD practice project.

The goal is to build a production-quality restaurant map service that demonstrates:

- Product thinking
- Frontend architecture design
- State management
- Performance optimization
- Scalability
- Maintainability

Always prioritize solving user problems over implementing features.

---

# Tech Stack

Frontend

- Next.js App Router
- TypeScript
- TanStack Query
- Zustand
- Tailwind CSS
- React Hook Form
- Zod

Backend

- Next.js Route Handler
- Prisma
- PostgreSQL

Deployment

- Vercel

---

# Next.js Rule

This is NOT the Next.js version in your training data.

Before generating code:

1. Read relevant documentation from:

node_modules/next/dist/docs/

1. Follow current Next.js conventions.
2. Avoid deprecated APIs.
3. Prefer Server Components unless client-side interaction is required.
4. Minimize Client Components.

---

# Architecture Rule

Use Feature-Sliced Design.

Structure:

src

- app
- widgets
- features
- entities
- shared

Responsibilities:

app

- routing
- providers

widgets

- page composition

features

- user actions

entities

- business models

shared

- reusable infrastructure

Never place business logic inside UI components.

---

# State Management Rule

Use:

TanStack Query

- server state

Zustand

- client state

Do not duplicate server state into Zustand.

Prefer derived state over stored state.

Avoid unnecessary useEffect.

---

# Development Workflow

Before implementing any feature:

1. Define Problem
2. Explain Why
3. Compare Options
4. Make Decision
5. Implement
6. Measure Result
7. Write Retrospective

Do not immediately generate code.

Always explain design decisions first.

---

# Documentation Rule

Every feature must create documentation.

Create:

docs/features/{feature-name}.md

Template:

# Problem

What problem is being solved?

# Why

Why is it important?

# Decision

Why was this approach selected?

# Implementation

How was it implemented?

# Result

What changed?

# Retrospective

What can be improved later?

---

# Troubleshooting Rule

Whenever a bug is fixed:

Create:

docs/troubleshooting/YYYY-MM-DD-{issue-name}.md

Template:

# Problem

# Cause

# Solution

# Verification

# Lessons Learned

---

# Architecture Decision Rule

Whenever an important architectural decision is made:

Create:

docs/adr/YYYY-MM-DD-{decision}.md

Template:

# Context

# Options

# Decision

# Consequences

---

# Performance Rule

Always consider:

- unnecessary renders
- API request frequency
- bundle size
- map marker rendering cost
- lazy loading
- code splitting

Explain performance impact when introducing a new feature.

---

# Code Quality Rule

Use strict TypeScript.

Avoid any.

Prefer readability over clever code.

Avoid magic numbers.

Use meaningful naming.

---

# Output Rule

When implementing:

1. Show file tree changes.
2. Explain why files are added.
3. Generate code.
4. Update documentation.

Never modify architecture without explanation.

Always keep documentation synchronized with code changes.