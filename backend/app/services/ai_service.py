import os
from groq import Groq

client = Groq(api_key=os.getenv("GROQ_API_KEY"))

def get_ai_response(conversation):
    response = client.chat.completions.create(
        model="llama-3.1-8b-instant",
        messages=conversation
    )
    return response.choices[0].message.content