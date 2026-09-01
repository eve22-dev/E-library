document.addEventListener("DOMContentLoaded", () => {
    const toggleBtn = document.getElementById("chat-toggle-btn");
    const chatBox = document.getElementById("chat-box");
    const closeBtn = document.getElementById("chat-close-btn");
    const sendBtn = document.getElementById("chat-send-btn");
    const chatInput = document.getElementById("chat-input");
    const chatMessages = document.getElementById("chat-messages");

    toggleBtn.addEventListener("click", () => {
        chatBox.style.display = chatBox.style.display === "none" ? "flex" : "none";
    });

    closeBtn.addEventListener("click", () => {
        chatBox.style.display = "none";
    });

    async function enviarMensagem() {
        const texto = chatInput.value.trim();
        if (!texto) return;

        const userMsg = document.createElement("div");
        userMsg.className = "msg-user";
        userMsg.textContent = texto;
        chatMessages.appendChild(userMsg);
        chatInput.value = "";
        chatMessages.scrollTop = chatMessages.scrollHeight;

        try {
            const resposta = await fetch('http://localhost:8080/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'text/plain' },
                body: texto
            });

            const data = await resposta.text();

            const botMsg = document.createElement("div");
            botMsg.className = "msg-bot";
            botMsg.textContent = data;
            chatMessages.appendChild(botMsg);
            chatMessages.scrollTop = chatMessages.scrollHeight;

        } catch (error) {
            const errorMsg = document.createElement("div");
            errorMsg.className = "msg-bot";
            errorMsg.textContent = "Erro de conexão com o servidor do chat.";
            chatMessages.appendChild(errorMsg);
        }
    }

    sendBtn.addEventListener("click", enviarMensagem);
    chatInput.addEventListener("keypress", (e) => {
        if (e.key === "Enter") enviarMensagem();
    });
});