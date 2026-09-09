import ollama


MODEL_NAME = "llama3.2"


def get_ai_response(messages: list) -> str:
    response = ollama.chat(
        model=MODEL_NAME,
        messages=messages
    )

    return response["message"]["content"]