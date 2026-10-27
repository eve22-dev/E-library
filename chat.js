document.addEventListener('DOMContentLoaded', () => {
    const toggleBtn = document.getElementById('chat-toggle-btn');
    const chatBox = document.getElementById('chat-box');
    const closeBtn = document.getElementById('chat-close-btn');
    const sendBtn = document.getElementById('chat-send-btn');
    const chatInput = document.getElementById('chat-input');
    const chatMessages = document.getElementById('chat-messages');

    // Abrir e fechar a janelinha do chat
    toggleBtn.addEventListener('click', () => {
        chatBox.style.display = chatBox.style.display === 'none' ? 'flex' : 'none';
        if (chatBox.style.display === 'flex' && chatMessages.children.length === 0) {
            adicionarMensagemBot("Olá! Sou o Bibliotecário Virtual. Como posso te ajudar hoje? (Ex: prazo de empréstimo, renovar, livros disponíveis)");
        }
    });

    closeBtn.addEventListener('click', () => {
        chatBox.style.display = 'none';
    });

    // Enviar mensagem ao clicar no botão ou apertar Enter
    sendBtn.addEventListener('click', enviarMensagem);
    chatInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') enviarMensagem();
    });

    function adicionarMensagemUsuario(texto) {
        const div = document.createElement('div');
        div.className = 'msg-user';
        div.textContent = texto;
        chatMessages.appendChild(div);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    function adicionarMensagemBot(texto) {
        const div = document.createElement('div');
        div.className = 'msg-bot';
        div.innerHTML = texto;
        chatMessages.appendChild(div);
        chatMessages.scrollTop = chatMessages.scrollHeight;
        return div;
    }

    async function enviarMensagem() {
        const texto = chatInput.value.trim();
        if (!texto) return;

        adicionarMensagemUsuario(texto);
        chatInput.value = '';

        // Resposta baseada em regras / palavras-chave (FAQ)
        setTimeout(() => {
            const mensagemLower = texto.toLowerCase();

            if (mensagemLower.includes('prazo') || mensagemLower.includes('dias') || mensagemLower.includes('devolver')) {
                adicionarMensagemBot("O prazo de empréstimo é de <b>14 dias</b> para alunos e <b>30 dias</b> para professores. Perto do vencimento você pode pedir renegociação do prazo em Meus Empréstimos; o bibliotecário precisa aprovar. Atraso gera multa de <b>R$ 2,00 por dia</b>.");
            }
            else if (mensagemLower.includes('renovar') || mensagemLower.includes('renovação') || mensagemLower.includes('renegoci')) {
                adicionarMensagemBot("Quando faltarem até 3 dias para vencer (ou se já venceu), use o botão <b>Renegociar prazo</b> na tela inicial ou em Meus Empréstimos. O bibliotecário analisa o pedido.");
            }
            else if (mensagemLower.includes('multa')) {
                adicionarMensagemBot("A multa é de <b>R$ 2,00 por dia de atraso</b>, gerada na devolução. Você paga em Meus Empréstimos, na seção Minhas Multas.");
            }
            else if (mensagemLower.includes('horario') || mensagemLower.includes('horário') || mensagemLower.includes('funcionamento')) {
                adicionarMensagemBot("A biblioteca física funciona de segunda a sexta-feira, das 08:00 às 21:30.");
            }
            else {
                // Se o bot não entendeu, oferecemos a opção de chamar o bibliotecário humano
                const msg = adicionarMensagemBot("Hmm, não encontrei uma resposta exata para isso. Deseja enviar sua dúvida diretamente para o bibliotecário humano?<br><br><button class='btn btn-sm btn-primary w-100 mt-1'>Falar com o Bibliotecário</button>");

                msg.querySelector('button').addEventListener('click', (e) => {
                    e.target.disabled = true;
                    enviarParaBibliotecario(texto);
                });
            }
        }, 500);
    }

    // Envia a dúvida para o bibliotecário pelo back-end (usuário identificado pelo login)
    async function enviarParaBibliotecario(duvidaTexto) {
        try {
            const resposta = await fetch(`${API_URL}/api/chat/suporte`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ duvida: duvidaTexto })
            });

            if (!resposta.ok) throw new Error(await resposta.text());

            adicionarMensagemBot("✅ Sua dúvida foi enviada com sucesso para o bibliotecário! Em breve você receberá um retorno.");
        } catch (err) {
            console.error("Erro ao enviar suporte:", err);
            adicionarMensagemBot("❌ Erro ao enviar mensagem para o suporte. Tente novamente mais tarde.");
        }
    }
});
