from uuid import uuid4

from fastapi import Depends, FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.database import Base, engine, get_db
from app.models import ChatMessage, ChatSession
from app.services.ai_service import get_ai_response


Base.metadata.create_all(bind=engine)


app = FastAPI(
    title="AI Chatbot API",
    description="AI chatbot powered by FastAPI, SQLite and Ollama",
    version="2.0.0"
)


app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


class ChatRequest(BaseModel):
    session_id: str
    message: str


@app.get("/")
def home():
    return {
        "message": "AI Chatbot API is running!",
        "version": "2.0.0"
    }


@app.post("/sessions")
def create_session(db: Session = Depends(get_db)):
    session_id = str(uuid4())

    new_session = ChatSession(
        id=session_id
    )

    db.add(new_session)
    db.commit()

    return {
        "session_id": session_id
    }


@app.get("/sessions/{session_id}/messages")
def get_messages(
    session_id: str,
    db: Session = Depends(get_db)
):
    session = db.query(ChatSession).filter(
        ChatSession.id == session_id
    ).first()

    if not session:
        raise HTTPException(
            status_code=404,
            detail="Chat session not found."
        )

    messages = db.query(ChatMessage).filter(
        ChatMessage.session_id == session_id
    ).order_by(
        ChatMessage.id
    ).all()

    return {
        "session_id": session_id,
        "messages": [
            {
                "role": message.role,
                "content": message.content
            }
            for message in messages
        ]
    }


@app.post("/chat")
def chat(
    request: ChatRequest,
    db: Session = Depends(get_db)
):
    session = db.query(ChatSession).filter(
        ChatSession.id == request.session_id
    ).first()

    if not session:
        raise HTTPException(
            status_code=404,
            detail="Chat session not found."
        )

    user_message = request.message.strip()

    if not user_message:
        raise HTTPException(
            status_code=400,
            detail="Message cannot be empty."
        )

    previous_messages = db.query(ChatMessage).filter(
        ChatMessage.session_id == request.session_id
    ).order_by(
        ChatMessage.id
    ).all()

    conversation = [
        {
            "role": message.role,
            "content": message.content
        }
        for message in previous_messages
    ]

    conversation.append({
        "role": "user",
        "content": user_message
    })

    try:
        ai_response = get_ai_response(
            conversation
        )
    except Exception as error:
        print(
            f"AI error: {error}"
        )

        raise HTTPException(
            status_code=500,
            detail="Failed to generate AI response."
        )

    user_record = ChatMessage(
        session_id=request.session_id,
        role="user",
        content=user_message
    )

    assistant_record = ChatMessage(
        session_id=request.session_id,
        role="assistant",
        content=ai_response
    )

    db.add(user_record)
    db.add(assistant_record)

    db.commit()

    return {
        "session_id": request.session_id,
        "message": user_message,
        "response": ai_response
    }


@app.post("/sessions/{session_id}/clear")
def clear_chat(
    session_id: str,
    db: Session = Depends(get_db)
):
    session = db.query(ChatSession).filter(
        ChatSession.id == session_id
    ).first()

    if not session:
        raise HTTPException(
            status_code=404,
            detail="Chat session not found."
        )

    db.query(ChatMessage).filter(
        ChatMessage.session_id == session_id
    ).delete(
        synchronize_session=False
    )

    db.commit()

    return {
        "message": "Conversation cleared successfully.",
        "session_id": session_id
    }