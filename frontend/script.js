const input = document.getElementById("message-input");
const sendButton = document.getElementById("send-button");
const chatBox = document.getElementById("chat-box");

const themeButton = document.getElementById("theme-button");
const newChatButton = document.getElementById("new-chat-button");

const menuButton = document.getElementById("menu-button");
const closeSidebarButton =
    document.getElementById("close-sidebar");

const sidebar =
    document.getElementById("sidebar");

const sidebarOverlay =
    document.getElementById("sidebar-overlay");

const suggestions =
    document.querySelectorAll(".suggestion");

const API_URL = "joyful-enchantment-production-4656.up.railway.app"; // This is fine for now, we will change it later.

let sessionId =
    localStorage.getItem("chat_session_id");


/* =========================
   SESSION
========================= */

async function initializeChat() {

    try {

        if (!sessionId) {
            await createSession();
            return;
        }


        const response = await fetch(
            `${API_URL}/sessions/${sessionId}/messages`
        );


        if (!response.ok) {
            throw new Error(
                "Existing session not found"
            );
        }


        const data = await response.json();

        chatBox.innerHTML = "";


        if (data.messages.length === 0) {

            showWelcomeScreen();

            return;
        }


        data.messages.forEach(message => {

            addMessage(
                message.content,
                message.role === "user"
                    ? "user"
                    : "ai"
            );

        });


    } catch (error) {

        console.error(
            "Session initialization error:",
            error
        );

        await createSession();

    }

}


async function createSession() {

    const response = await fetch(
        `${API_URL}/sessions`,
        {
            method: "POST"
        }
    );


    if (!response.ok) {

        throw new Error(
            "Could not create chat session"
        );

    }


    const data = await response.json();


    sessionId =
        data.session_id;


    localStorage.setItem(
        "chat_session_id",
        sessionId
    );


    chatBox.innerHTML = "";

    showWelcomeScreen();

}


/* =========================
   WELCOME SCREEN
========================= */

function showWelcomeScreen() {

    chatBox.innerHTML = `
        <div
            id="welcome-screen"
            class="welcome-screen"
        >

            <div class="welcome-icon">
                ✦
            </div>

            <h1>
                How can I help you?
            </h1>

            <p>
                Ask me anything. Your conversation
                is stored locally on your computer.
            </p>

            <div class="suggestions">

                <button
                    class="suggestion"
                    data-message="Explain artificial intelligence in simple words."
                >
                    <span>💡</span>
                    Explain AI simply
                </button>

                <button
                    class="suggestion"
                    data-message="Help me write a professional resume."
                >
                    <span>📝</span>
                    Write a resume
                </button>

                <button
                    class="suggestion"
                    data-message="Teach me Python programming from the basics."
                >
                    <span>🐍</span>
                    Learn Python
                </button>

                <button
                    class="suggestion"
                    data-message="Give me five ideas for a software engineering project."
                >
                    <span>🚀</span>
                    Project ideas
                </button>

            </div>

        </div>
    `;


    document
        .querySelectorAll(".suggestion")
        .forEach(button => {

            button.addEventListener(
                "click",
                () => {

                    input.value =
                        button.dataset.message;

                    autoResize();

                    input.focus();

                }
            );

        });

}


/* =========================
   SEND MESSAGE
========================= */

async function sendMessage() {

    const message =
        input.value.trim();


    if (!message) {
        return;
    }


    hideWelcomeScreen();


    addMessage(
        message,
        "user"
    );


    input.value = "";

    autoResize();


    sendButton.disabled = true;
    input.disabled = true;


    const typingMessage =
        addTypingMessage();


    try {

        const response =
            await fetch(
                `${API_URL}/chat`,
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body: JSON.stringify({
                        session_id:
                            sessionId,

                        message:
                            message
                    })
                }
            );


        if (!response.ok) {

            throw new Error(
                `Server returned ${response.status}`
            );

        }


        const data =
            await response.json();


        typingMessage.remove();


        addMessage(
            data.response,
            "ai"
        );


    } catch (error) {

        console.error(
            "Chat error:",
            error
        );


        typingMessage.remove();


        addMessage(
            "Sorry, I couldn't connect to the AI server. Please make sure FastAPI and Ollama are running.",
            "ai"
        );

    }


    sendButton.disabled = false;
    input.disabled = false;

    input.focus();

}


/* =========================
   ADD MESSAGE
========================= */

function addMessage(text, sender) {

    const messageDiv =
        document.createElement("div");


    messageDiv.classList.add(
        "message",
        sender === "user"
            ? "user-message"
            : "ai-message"
    );


    const avatar =
        document.createElement("div");


    avatar.classList.add(
        "avatar"
    );


    avatar.textContent =
        sender === "user"
            ? "👤"
            : "✦";


    const content =
        document.createElement("div");


    content.classList.add(
        "message-content"
    );


    content.textContent = text;


    messageDiv.appendChild(
        avatar
    );


    messageDiv.appendChild(
        content
    );


    chatBox.appendChild(
        messageDiv
    );


    scrollToBottom();

}


/* =========================
   TYPING INDICATOR
========================= */

function addTypingMessage() {

    const messageDiv =
        document.createElement("div");


    messageDiv.classList.add(
        "message",
        "ai-message"
    );


    const avatar =
        document.createElement("div");


    avatar.classList.add(
        "avatar"
    );


    avatar.textContent = "✦";


    const content =
        document.createElement("div");


    content.classList.add(
        "message-content"
    );


    content.innerHTML = `
        <div class="typing">
            <span></span>
            <span></span>
            <span></span>
        </div>
    `;


    messageDiv.appendChild(
        avatar
    );


    messageDiv.appendChild(
        content
    );


    chatBox.appendChild(
        messageDiv
    );


    scrollToBottom();


    return messageDiv;

}


/* =========================
   NEW CHAT
========================= */

async function newChat() {

    if (!sessionId) {
        return;
    }


    const confirmed =
        confirm(
            "Start a new chat? Your current conversation will be cleared."
        );


    if (!confirmed) {
        return;
    }


    try {

        const response =
            await fetch(
                `${API_URL}/sessions/${sessionId}/clear`,
                {
                    method: "POST"
                }
            );


        if (!response.ok) {

            throw new Error(
                "Could not clear conversation"
            );

        }


        chatBox.innerHTML = "";

        showWelcomeScreen();


    } catch (error) {

        console.error(
            "New chat error:",
            error
        );

    }


    closeSidebar();

    input.focus();

}


/* =========================
   THEME
========================= */

function toggleTheme() {

    document.body.classList.toggle(
        "dark"
    );


    const isDark =
        document.body.classList.contains(
            "dark"
        );


    themeButton.textContent =
        isDark
            ? "☀"
            : "☾";


    localStorage.setItem(
        "theme",
        isDark
            ? "dark"
            : "light"
    );

}


function loadTheme() {

    const savedTheme =
        localStorage.getItem(
            "theme"
        );


    if (savedTheme === "dark") {

        document.body.classList.add(
            "dark"
        );

        themeButton.textContent = "☀";

    }

}


/* =========================
   MOBILE SIDEBAR
========================= */

function openSidebar() {

    sidebar.classList.add(
        "open"
    );

    sidebarOverlay.classList.add(
        "visible"
    );

}


function closeSidebar() {

    sidebar.classList.remove(
        "open"
    );

    sidebarOverlay.classList.remove(
        "visible"
    );

}


/* =========================
   TEXTAREA
========================= */

function autoResize() {

    input.style.height = "auto";


    input.style.height =
        Math.min(
            input.scrollHeight,
            150
        ) + "px";

}


/* =========================
   HELPERS
========================= */

function hideWelcomeScreen() {

    const welcome =
        document.getElementById(
            "welcome-screen"
        );


    if (welcome) {
        welcome.remove();
    }

}


function scrollToBottom() {

    chatBox.scrollTop =
        chatBox.scrollHeight;

}


/* =========================
   EVENTS
========================= */

sendButton.addEventListener(
    "click",
    sendMessage
);


newChatButton.addEventListener(
    "click",
    newChat
);


themeButton.addEventListener(
    "click",
    toggleTheme
);


menuButton.addEventListener(
    "click",
    openSidebar
);


closeSidebarButton.addEventListener(
    "click",
    closeSidebar
);


sidebarOverlay.addEventListener(
    "click",
    closeSidebar
);


input.addEventListener(
    "input",
    autoResize
);


input.addEventListener(
    "keydown",
    function(event) {

        if (
            event.key === "Enter" &&
            !event.shiftKey
        ) {

            event.preventDefault();

            sendMessage();

        }

    }
);


/* =========================
   START APPLICATION
========================= */

loadTheme();

initializeChat();