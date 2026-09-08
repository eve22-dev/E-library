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
                adicionarMensagemBot("O prazo padrão de empréstimo de livros é de **14 dias**, podendo ser renovado caso não haja reservas pendentes.");
            } 
            else if (mensagemLower.includes('renovar') || mensagemLower.includes('renovação')) {
                adicionarMensagemBot("Você pode solicitar a renovação diretamente na sua aba de empréstimos no perfil ou balcão da biblioteca.");
            } 
            else if (mensagemLower.includes('horario') || mensagemLower.includes('funcionamento')) {
                adicionarMensagemBot("A biblioteca física funciona de segunda a sexta-feira, das 08:00 às 21:30.");
            } 
            else {
                // Se o bot não entendeu, oferecemos a opção de chamar o bibliotecário humano
                adicionarMensagemBot("Hmm, não encontrei uma resposta exata para isso. Deseja enviar sua dúvida diretamente para o bibliotecário humano?<br><br><button id='btnChamarHumano' class='btn btn-sm btn-primary w-100 mt-1'>Falar com o Bibliotecário</button>");
                
                // Atribui a ação do botão criado dinamicamente
                document.getElementById('btnChamarHumano').addEventListener('click', () => {
                    enviarParaBancoSupabase(texto);
                });
            }
        }, 500);
    }

    // Função que salva a dúvida na tabela 'mensagens_suporte' do Supabase
    async function enviarParaBancoSupabase(duvidaTexto) {
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) {
                alert("Você precisa estar logado para enviar mensagens ao suporte.");
                return;
            }

            const { error } = await supabase
                .from('mensagens_suporte')
                .insert([
                    { user_id: session.user.id, mensagem: duvidaTexto, status: 'pendente' }
                ]);

            if (error) throw error;

            adicionarMensagemBot("✅ Sua dúvida foi enviada com sucesso para o bibliotecário! Em breve você receberá um retorno.");
        } catch (err) {
            console.error("Erro ao enviar suporte:", err);
            adicionarMensagemBot("❌ Erro ao enviar mensagem para o suporte. Tente novamente mais tarde.");
        }
    }
});