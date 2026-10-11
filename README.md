# Scalify

[![CI](https://github.com/Jay-Raam/Scalify/actions/workflows/ci.yml/badge.svg)](https://github.com/Jay-Raam/Scalify/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/Node.js-20.x-339933?logo=node.js)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-18-61DAFB?logo=react)](https://react.dev/)
[![GraphQL](https://img.shields.io/badge/GraphQL-Yoga-E10098?logo=graphql)](https://the-guild.dev/graphql/yoga-server)

A full-featured AI chat application that brings intelligent conversations to life. Scalify understands both **English and Tamil**, supports file and image attachments, remembers your conversation history, and is powered by a large language model via OpenRouter.

---

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Prerequisites](#prerequisites)
- [Environment Variables](#environment-variables)
- [Getting Started](#getting-started)
  - [Backend](#backend)
  - [Frontend](#frontend)
- [API](#api)
- [Architecture](#architecture)
- [Security](#security)
- [License](#license)

---

## Overview

Scalify is a full-stack AI chat application built for real conversations. Users can chat in English or Tamil, attach files and images, and get intelligent, context-aware responses powered by an LLM (default: `meta-llama/llama-3.3-8b-instruct` via OpenRouter). Chat sessions are persisted in MongoDB and cached with Redis for fast, responsive interactions.

---

## Features

- **Full Chat Experience** — real-time, multi-turn conversations with full session history
- **Bilingual AI** — automatically detects and responds in English or Tamil
- **FAQ-Aware Responses** — answers are grounded in configured FAQ data before falling back to the LLM
- **File & Image Attachments** — attach PDFs, documents, or images (up to 2 MB) for context-aware replies
- **Session Continuity** — full conversation history is tracked and maintained across messages
- **Business Owner Auth** — JWT-based registration and login with bcrypt password hashing
- **Rate Limiting** — per-IP and per-GraphQL-operation rate limits backed by Redis
- **Real-time Thinking Indicator** — animated typing cursor with context-sensitive thinking phrases
- **Quick Prompts** — pre-built prompt chips to start a conversation instantly
- **Copy Responses** — one-click copy for any assistant reply
- **Health Endpoint** — `/health` route reports uptime, memory, and connectivity status
- **Structured Logging** — Winston + Morgan for request and application logs

---

## Tech Stack

### Backend

| Layer      | Technology                         |
| ---------- | ---------------------------------- |
| Runtime    | Node.js (ESM) + TypeScript         |
| Framework  | Express                            |
| API        | GraphQL Yoga                       |
| Database   | MongoDB (Mongoose)                 |
| Cache      | Redis (ioredis)                    |
| AI         | OpenRouter API (OpenAI-compatible) |
| Auth       | JSON Web Tokens + bcryptjs         |
| Validation | Zod                                |
| Logging    | Winston + Morgan                   |
| Security   | Helmet, CORS, express-rate-limit   |

### Frontend

| Layer          | Technology            |
| -------------- | --------------------- |
| Framework      | React 18 + TypeScript |
| Build Tool     | Vite                  |
| Styling        | Tailwind CSS v4       |
| GraphQL Client | Apollo Client         |
| Animations     | Framer Motion         |
| Notifications  | react-hot-toast       |
| Icons          | Lucide React          |
| Routing        | React Router v6       |

---

## Project Structure

```
Scalify/
├── Backend/
│   ├── src/
│   │   ├── index.ts              # Express app entry point
│   │   ├── config/
│   │   │   ├── db.ts             # MongoDB connection
│   │   │   ├── env.ts            # Zod-validated environment config
│   │   │   └── redis.ts          # Redis connection
│   │   ├── graphql/
│   │   │   ├── yoga.ts           # GraphQL Yoga server setup
│   │   │   ├── resolvers/
│   │   │   │   ├── authResolver.ts
│   │   │   │   ├── chatResolver.ts
│   │   │   │   └── index.ts
│   │   │   └── schema/
│   │   │       └── typeDefs.ts   # GraphQL schema
│   │   ├── middleware/
│   │   │   ├── auth.ts           # JWT authentication middleware
│   │   │   ├── errorHandler.ts
│   │   │   └── rateLimiter.ts
│   │   ├── models/
│   │   │   ├── BusinessOwner.ts
│   │   │   ├── ChatSession.ts
│   │   │   └── FAQ.ts
│   │   ├── services/
│   │   │   ├── aiService.ts      # OpenRouter LLM calls
│   │   │   ├── cacheService.ts   # Redis caching helpers
│   │   │   └── faqService.ts     # FAQ lookup logic
│   │   └── utils/
│   │       ├── logger.ts
│   │       └── validators.ts
│   ├── package.json
│   └── tsconfig.json
│
└── Frontend/
    ├── src/
    │   ├── App.tsx
    │   ├── main.tsx
    │   ├── components/
    │   │   ├── chat/
    │   │   │   ├── ChatInput.tsx
    │   │   │   ├── ChatWindow.tsx
    │   │   │   ├── MessageBubble.tsx
    │   │   │   └── TypingIndicator.tsx
    │   │   └── ui/
    │   │       ├── Button.tsx
    │   │       ├── Card.tsx
    │   │       ├── Modal.tsx
    │   │       └── Spinner.tsx
    │   ├── hooks/
    │   │   └── useChat.ts
    │   ├── lib/
    │   │   ├── apolloClient.ts
    │   │   ├── cn.ts
    │   │   └── graphql.ts        # GraphQL query/mutation definitions
    │   ├── pages/
    │   │   └── ChatPageV2.tsx    # Main chat page
    │   └── types/
    │       └── index.ts
    ├── package.json
    ├── vite.config.ts
    └── tsconfig.json
```

---

## Prerequisites

- **Node.js** v18 or later
- **MongoDB** (local or Atlas)
- **Redis** (local or managed)
- **OpenRouter API Key** — get one at [openrouter.ai](https://openrouter.ai)

---

## Environment Variables

Create a `.env` file inside the `Backend/` directory:

```env
# Server
PORT=4000
NODE_ENV=development

# Database
MONGODB_URI=mongodb://localhost:27017/scalify

# Cache
REDIS_URL=redis://localhost:6379

# Auth
JWT_SECRET=your_super_secret_key_at_least_32_characters
JWT_EXPIRES_IN=7d

# AI
OPENROUTER_API_KEY=your_openrouter_api_key
LLM_MODEL=meta-llama/llama-3.3-8b-instruct:free
LLM_VISION_MODEL=openai/gpt-4o          # optional, for image attachments

# CORS
FRONTEND_URL=http://localhost:5173
```

> All variables are validated at startup with Zod. The server will exit with a descriptive error if any required variable is missing or invalid.

---

## Getting Started

### Backend

```bash
cd Backend
npm install
npm run dev        # development with hot-reload (tsx watch)
```

For production:

```bash
npm run build      # compiles TypeScript → dist/
npm start          # runs dist/index.js
```

The GraphQL API will be available at `http://localhost:4000/graphql`.  
The health check is at `http://localhost:4000/health`.

### Frontend

```bash
cd Frontend
npm install
npm run dev        # Vite dev server
```

The app will be available at `http://localhost:5173`.

For production:

```bash
npm run build      # outputs to dist/
npm run preview    # local preview of the production build
```

---

## API

The backend exposes a single **GraphQL** endpoint at `/graphql`.

### Key Operations

| Type     | Name             | Description                                     |
| -------- | ---------------- | ----------------------------------------------- |
| Mutation | `register`       | Register a new business owner                   |
| Mutation | `login`          | Authenticate and receive a JWT                  |
| Mutation | `sendMessage`    | Send a chat message (with optional attachments) |
| Query    | `getChatHistory` | Retrieve messages for a session                 |
| Query    | `getHealth`      | Service health status                           |

### `sendMessage` Input

```graphql
mutation SendMessage(
  $businessId: ID!
  $sessionId: ID
  $message: String!
  $attachments: [AttachmentInput!]
) {
  sendMessage(
    businessId: $businessId
    sessionId: $sessionId
    message: $message
    attachments: $attachments
  ) {
    message
    detectedLanguage
    sessionId
  }
}
```

**AttachmentInput fields:** `name`, `type` (`FILE` | `IMAGE`), `mimeType`, `size`, `content` (base64 for images, plain text for documents).

---

## Architecture

```
Browser (React + Apollo)
        │
        │  HTTP / GraphQL
        ▼
Express + GraphQL Yoga
        │
   ┌────┴────┐
   │         │
MongoDB    Redis
(sessions  (FAQ cache,
 FAQs      rate limits)
 owners)
        │
        ▼
  OpenRouter API
  (LLM inference)
```

**Request flow for a chat message:**

1. Frontend sends a `sendMessage` GraphQL mutation.
2. The `authenticateToken` middleware validates the JWT (for protected routes).
3. `chatResolver` loads the business's FAQs (Redis-cached).
4. Language detection runs on the user message.
5. `aiService` builds a system prompt from FAQs + chat history and calls the LLM.
6. The response is saved to the `ChatSession` in MongoDB and returned to the client.

---

## Security

- **Helmet** sets secure HTTP headers on every response.
- **CORS** is restricted to the configured `FRONTEND_URL`.
- **Rate limiting** is applied globally and per GraphQL operation (Redis-backed).
- **JWT** tokens are signed with a secret of at least 32 characters.
- **Passwords** are hashed with bcryptjs before storage — plain-text passwords are never persisted.
- **Request body size** is capped at 10 MB server-side; file uploads are capped at 2 MB client-side.
- **Environment variables** are validated at startup — the server refuses to start with a misconfigured environment.

---

## License

This project is proprietary. All rights reserved © Jayasriraam.
