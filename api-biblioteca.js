// 1. Correção do Botão "Sair"
function realizarLogout() {
    // Remove os tokens de autenticação armazenados
    localStorage.removeItem('authToken');
    localStorage.removeItem('userId');
    // Redireciona para o ecrã de login
    window.location.href = '/login'; 
}

// 2. Pesquisa de Livros com Filtros
async function buscarLivros() {
    const filtro = document.getElementById('select-filtro').value; // ex: 'titulo', 'autor', 'isbn'
    const termo = document.getElementById('input-termo').value;

    const resposta = await fetch(`/api/livros/pesquisa?filtro=${filtro}&termo=${encodeURIComponent(termo)}`);
    const livros = await resposta.json();
    
    // Função hipotética que desenha os livros no ecrã
    renderizarTabelaLivros(livros); 
}

// 3. Cancelar Reserva (Visão do Utilizador)
async function cancelarReserva(emprestimoId, statusAtual) {
    if (statusAtual === 'retirado') {
        alert('Não é possível cancelar a reserva de um livro já retirado.');
        return;
    }

    const resposta = await fetch(`/api/emprestimos/${emprestimoId}/cancelar`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('authToken')}` }
    });

    if (resposta.ok) {
        alert('Reserva cancelada com sucesso!');
        // Atualiza a listagem de empréstimos
        carregarEmprestimos(); 
    }
}

// 4. Desativar Livro com Motivo (Visão do Bibliotecário)
async function desativarLivro(livroId) {
    const motivo = prompt("Por favor, informe o motivo para desativar este livro:");
    
    if (!motivo) {
        alert('O motivo é obrigatório para inativar um livro.');
        return;
    }

    const resposta = await fetch(`/api/livros/${livroId}/desativar`, {
        method: 'PUT',
        headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('authToken')}` 
        },
        body: JSON.stringify({ motivo: motivo })
    });

    if (resposta.ok) {
        alert('Livro inativado e registado com sucesso.');
        buscarLivros(); // Recarrega a tabela
    }
}

// 5. Lógica do Chatbot e Transbordo
let modoTransbordo = false;

async function enviarMensagemChat(textoMensagem) {
    const userId = localStorage.getItem('userId'); 

    // Se a IA tiver ativado o modo de suporte, envia direto para o banco do bibliotecário
    if (modoTransbordo) {
        const resposta = await fetch('/api/chat/suporte', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ duvida: textoMensagem, userId: userId })
        });
        
        adicionarMensagemNoEcra('Bot', 'Sua dúvida foi enviada! Um bibliotecário responderá em breve nas Solicitações de Chat.');
        modoTransbordo = false; // Retorna ao modo IA normal
        return;
    }

    // Fluxo normal do Gemini
    const resposta = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mensagem: textoMensagem })
    });
    
    const textoBot = await resposta.text();

    // Interceta a mensagem de transbordo vinda do backend
    if (textoBot.includes("Descreva sua dúvida brevemente")) {
        modoTransbordo = true;
    }

    adicionarMensagemNoEcra('Bot', textoBot);
}