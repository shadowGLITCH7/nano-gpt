# Mini-GPT

A small ChatGPT-style app: a React frontend talking to a FastAPI backend that runs the
local `chatgpt-mini` model (a ~135M-parameter SmolLM2 fine-tune) on the CPU.

## Run it

You need two terminals.

**1. Backend** (from `D:\project`), port 8000:

```bash
python -m uvicorn main:app --app-dir backend --port 8000
```

Wait for `Model ready.` (about 10–20 s).

**2. Frontend** (from `D:\project\frontend`), port 5173:

```bash
npm run dev
```

Open http://localhost:5173 and sign in with the demo account **Big Smoke / santamaria**
(or press **Fill in** on the login screen).

First-time setup on a new machine: `pip install -r backend/requirements.txt` and
`npm install` inside `frontend/`.

## How it works

| Piece | Where | What it does |
|---|---|---|
| Model server | `backend/main.py` | `POST /api/chat` takes the conversation's messages, keeps the newest ones that fit 1,024 tokens, formats them as `User: … / Assistant: …` and generates a reply. `GET /api/health` reports status. |
| Conversation memory | `frontend/src/hooks/useChat.js` | Each chat has its own ordered message list. A request only sends messages from the chat it was started in, and the reply is written back to that same chat, so chats never leak into each other. |
| Context window | `frontend/src/lib/api.js` | Sends at most the last 12 messages / 4,000 characters of the current chat; the backend trims again by real token count. |
| History | browser `localStorage` | Chats, the usage counter, theme and login survive a refresh. Stored per user. |
| Login | `frontend/src/lib/auth.js` | Demo-only login with one hard-coded account. Not real authentication. |
| Usage limit | `useChat.js` | Pretend 50-prompt allowance; only successful replies use a credit. Reset it in Settings. |

## Shortcuts

- **Enter** send, **Shift + Enter** new line
- **Ctrl + Shift + O** new chat
- **Ctrl + K** search chats
- **Ctrl + B** show or hide the sidebar

## Notes for the demo

- Answers use greedy decoding (always the most likely word) for steadier facts;
  **Regenerate** samples a more varied answer.
- It is a very small model: fluent, but it will get facts wrong sometimes.
