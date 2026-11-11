"""Mini-GPT backend: a small FastAPI server around the local chatgpt-mini model.

Run:  python -m uvicorn main:app --port 8000      (from the backend/ folder)

Endpoints
  GET  /api/health  -> model status and context limits
  POST /api/chat    -> {"messages": [{"role": "user"|"assistant", "content": str}, ...]}
                       returns {"reply": str, "context_messages": int, "context_tokens": int}

The model has no memory of its own: the frontend sends the current conversation's
messages with every request, and this server trims them to fit the context budget.
""" 
from pathlib import Path
from threading import Lock
from typing import List, Literal

import torch
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field
from transformers import AutoModelForCausalLM, AutoTokenizer

MODEL_DIR = Path(__file__).resolve().parent.parent / "chatgpt-mini"
MAX_CONTEXT_TOKENS = 1024   # prompt budget (model supports 8192, but CPU speed matters more for a demo)
MAX_NEW_TOKENS = 320
NAMES = {"user": "User", "assistant": "Assistant"}

print(f"Loading model from {MODEL_DIR} ...")
tok = AutoTokenizer.from_pretrained(MODEL_DIR)
model = AutoModelForCausalLM.from_pretrained(MODEL_DIR, dtype=torch.float32)
model.eval()
generate_lock = Lock()  # one generation at a time on CPU
print("Model ready.")

app = FastAPI(title="Mini-GPT")


class Message(BaseModel):
    role: Literal["user", "assistant"]
    content: str = Field(min_length=1, max_length=8000)


class ChatRequest(BaseModel):
    messages: List[Message] = Field(min_length=1, max_length=200)
    temperature: float = Field(default=0.0, ge=0.0, le=1.5)  # 0 = greedy (steadier facts)


def build_prompt(messages: List[Message]):
    """Keep the newest messages that fit MAX_CONTEXT_TOKENS; the latest user turn always stays."""
    lines = [f"{NAMES[m.role]}: {m.content.strip()}\n" for m in messages]
    kept, used = [], len(tok("Assistant:")["input_ids"])
    for line in reversed(lines):
        n = len(tok(line)["input_ids"])
        if kept and used + n > MAX_CONTEXT_TOKENS:
            break
        kept.append(line)
        used += n
    kept.reverse()
    return "".join(kept) + "Assistant:", len(kept), used


def clean(text: str) -> str:
    # The model sometimes keeps writing the next turn itself; cut there.
    for stop in ("\nUser:", "\nAssistant:", "<|endoftext|>", "<|im_end|>"):
        text = text.split(stop)[0]
    return text.strip()


@app.get("/api/health")
def health():
    return {
        "status": "ok",
        "model": "chatgpt-mini (SmolLM2-135M fine-tune)",
        "max_context_tokens": MAX_CONTEXT_TOKENS,
        "max_new_tokens": MAX_NEW_TOKENS,
    }


@app.post("/api/chat")
def chat(req: ChatRequest):  # plain def -> FastAPI runs it in a worker thread
    if req.messages[-1].role != "user":
        raise HTTPException(400, "The last message must be from the user.")
    prompt, n_msgs, n_tokens = build_prompt(req.messages)
    ids = tok(prompt, return_tensors="pt")
    sampling = req.temperature > 0
    with generate_lock, torch.no_grad():
        out = model.generate(
            **ids,
            max_new_tokens=MAX_NEW_TOKENS,
            do_sample=sampling,
            temperature=req.temperature if sampling else None,
            top_p=0.9 if sampling else None,
            repetition_penalty=1.2,
            stop_strings=["\nUser:", "\nAssistant:"],
            tokenizer=tok,
            pad_token_id=tok.eos_token_id,
        )
    reply = clean(tok.decode(out[0][ids["input_ids"].shape[1]:], skip_special_tokens=True))
    if not reply:
        reply = "I'm not sure how to answer that. Could you rephrase it?"
    return {"reply": reply, "context_messages": n_msgs, "context_tokens": n_tokens}
