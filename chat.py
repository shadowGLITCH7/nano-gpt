"""Chat with the local chatgpt-mini model.

Usage:
    python chat.py              # interactive chat
    python chat.py "Hello"      # one-shot prompt
"""
import sys
import torch
from transformers import AutoModelForCausalLM, AutoTokenizer

MODEL_DIR = r"D:\project\chatgpt-mini"

tok = AutoTokenizer.from_pretrained(MODEL_DIR)
model = AutoModelForCausalLM.from_pretrained(MODEL_DIR, dtype=torch.float32)
model.eval()


def generate(history):
    # Plain "User: / Assistant:" format -- tested to give much better answers than ChatML tags
    names = {"user": "User", "assistant": "Assistant"}
    prompt = "".join(f"{names[role]}: {text}\n" for role, text in history)
    prompt += "Assistant:"
    ids = tok(prompt, return_tensors="pt")
    with torch.no_grad():
        out = model.generate(
            **ids,
            max_new_tokens=200,
            do_sample=True,
            temperature=0.7,
            top_p=0.9,
            repetition_penalty=1.2,
            pad_token_id=tok.eos_token_id,
        )
    text = tok.decode(out[0][ids["input_ids"].shape[1]:], skip_special_tokens=True)
    # stop where the model starts writing the next turn itself
    return text.split("\nUser:")[0].split("\nAssistant:")[0].strip()


if len(sys.argv) > 1:
    print(generate([("user", " ".join(sys.argv[1:]))]))
    sys.exit()

history = []
print("chatgpt-mini ready. Type 'exit' to quit, 'reset' to clear history.")
while True:
    msg = input("\nYou: ").strip()
    if msg.lower() in ("exit", "quit"):
        break
    if msg.lower() == "reset":
        history = []
        continue
    history.append(("user", msg))
    reply = generate(history[-6:])  # keep context short for a small model
    history.append(("assistant", reply))
    print("Bot:", reply)
