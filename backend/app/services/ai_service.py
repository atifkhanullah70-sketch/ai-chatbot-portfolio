import os
from groq import Groq

client = Groq(api_key=os.getenv("GROQ_API_KEY"))

def get_ai_response(conversation):
    response = client.chat.completions.create(
        model="llama-3.2-3b-preview",
        messages=conversation
    )
    return response.choices[0].message.content