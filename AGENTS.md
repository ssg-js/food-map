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

## Frontend

- Next.js App Router
- TypeScript
- TanStack Query
- Zustand
- Tailwind CSS
- React Hook Form
- Zod

## Backend

- Next.js Route Handler
- Prisma
- PostgreSQL

## Deployment

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

## app

- routing
- providers

## widgets

- page composition

## features

- user actions

## entities

- business models

## shared

- reusable infrastructure

Never place business logic inside UI components.

---

# State Management Rule

Use:

## TanStack Query

- server state

## Zustand

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

# Approval Rule

The agent may perform the following without approval:

- Read files
- Search code
- Analyze architecture
- Create documentation
- Create feature branches
- Create commits
- Generate commit messages
- Propose implementations

The following require explicit client approval:

- Push to remote repository
- Merge into main branch
- Delete files
- Modify project architecture
- Replace major libraries
- Change database schema
- Introduce new infrastructure

Before requesting approval, provide:

1. Problem
2. Proposed solution
3. Files affected
4. Expected impact
5. Risks
6. Verification plan

Wait for approval before proceeding.

---

# Git Workflow Rule

## Branch Strategy

Use GitHub Flow.

Branches:

main

- stable branch
- always deployable

feature/*

- feature development

Examples:

feature/map  
feature/search  
feature/filter  
feature/favorite  
feature/auth

Never develop directly on main.

---

## Development Process

1. Create feature branch
2. Implement feature
3. Update documentation
4. Create commit
5. Request approval
6. Merge after approval

---

## Commit Rule

The agent may:

- stage files
- generate commit messages
- create commits

Commit format:

feat(scope): description  
fix(scope): description  
refactor(scope): description  
docs(scope): description  
test(scope): description  
chore(scope): description

Examples:

feat(map): add map container  
feat(search): implement restaurant search  
fix(filter): resolve category state issue  
docs(adr): add map sdk decision

---

## Push Rule

Never push directly to main.

Before pushing:

1. Summarize changes
2. Show modified files
3. Explain impact
4. Request approval

Push only after approval.

---

## Merge Rule

Never merge automatically.

Before merge:

1. Summarize implementation
2. Explain architectural impact
3. Show documentation updates
4. Request approval

Merge only after approval.

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

Explain performance impact when introducing a feature.

Document major performance decisions in ADR.

---

# Code Quality Rule

Use strict TypeScript.

Avoid any.

Prefer readability over clever code.

Avoid magic numbers.

Use meaningful naming.

Prefer composition over duplication.

---

# Output Rule

Before implementation:

1. Define Problem
2. Explain Why
3. Compare Options
4. Recommend Decision

After implementation:

1. Show file tree changes
2. Explain why files were added or modified
3. Show documentation updates
4. Show commit message
5. Explain verification steps

Cursor-specific response style rules live in `.cursor/rules`.

Always keep documentation synchronized with code changes.

Never modify architecture without explanation.

# Validation Rule

Before creating a commit:

1. Run ESLint
2. Run TypeScript type check
3. Run build check

Commands:

npm run lint

npx tsc --noEmit

npm run build

Do not create commits if validation fails.

Report all errors first.

# Project Knowledge Rule

Before implementing a feature:

1. Search existing ADR documents
2. Search feature documents
3. Search troubleshooting documents

Avoid creating duplicate solutions.

Reuse previous decisions whenever possible.