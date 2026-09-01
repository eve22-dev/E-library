function abrirFecharChat() {
    const janelaChat = document.getElementById("janela-chat");
    if (janelaChat.style.display === "none") {
        janelaChat.style.display = "block";
    } else {
        janelaChat.style.display = "none";
    }
}

async function enviarMensagemParaBiblioteca() {
    const inputMensagem = document.getElementById("chat-input").value;
    const chatBox = document.getElementById("chat-box");
    
    chatBox.innerHTML += `<div class="text-end mb-2"><b>Você:</b> ${inputMensagem}</div>`;
    document.getElementById("chat-input").value = ""; 

    try {
        const resposta = await fetch('/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'text/plain' },
            body: inputMensagem
        });

        const textoDaIA = await resposta.text();
        
        chatBox.innerHTML += `<div class="text-start text-primary mb-2"><b>IA:</b> ${textoDaIA}</div>`;
        chatBox.scrollTop = chatBox.scrollHeight; // Rola o chat para baixo
        
    } catch (error) {
        console.error("Erro na comunicação com o servidor:", error);
    }

    document.getElementById("chat-input").addEventListener("keypress", function(event) {
    if (event.key === "Enter") {
        event.preventDefault(); // Evita que a página faça scroll ou recarregue
        enviarMensagemParaBiblioteca();
    }
});
}
