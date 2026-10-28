// =====================================================================
// chat.js — Bibliotecário Virtual: perguntas básicas, falar com o bibliotecário
// e registrar reclamação (ambos com anexos). Monta a própria janela de chat.
// Precisa do api.js carregado antes.
// =====================================================================
document.addEventListener('DOMContentLoaded', () => {
    const container = document.getElementById('chat-widget-container');
    const toggleBtn = document.getElementById('chat-toggle-btn');
    if (!container || !toggleBtn) return;

    const MAX_ARQUIVOS = 5;
    const MAX_TOTAL = 4 * 1024 * 1024; // 4 MB no total
    const EXTENSOES = ['jpg', 'jpeg', 'png', 'pdf'];

    let modo = 'faq';          // faq | reclamacao | bibliotecario
    let anexos = [];           // arquivos escolhidos (valem para o próximo envio)
    let reclamacao = [];       // mensagens que formam o texto da reclamação
    let enviando = false;

    // ---------- estilos e janela ----------
    const estilo = document.createElement('style');
    estilo.textContent = `
        #chat-box { position: absolute; bottom: 75px; right: 0; width: 360px; max-width: calc(100vw - 30px); height: 520px; max-height: 75vh;
                    background: #fff; border-radius: 16px; box-shadow: 0 10px 30px rgba(0,0,0,.3); display: none; flex-direction: column; overflow: hidden; font-family: 'Poppins', sans-serif; }
        #chat-box .chat-header { background: linear-gradient(135deg, #031330 0%, #1e3a8a 100%); color: #fff; padding: 12px 16px; display: flex; justify-content: space-between; align-items: center; font-weight: 600; }
        #chat-box .chat-x { background: none; border: 0; color: #fff; font-size: 1.5rem; line-height: 1; cursor: pointer; }
        #chat-messages { flex: 1; overflow-y: auto; padding: 12px; background: #f4f6fb; display: flex; flex-direction: column; gap: 8px; }
        #chat-messages .msg-user, #chat-messages .msg-bot { max-width: 85%; padding: 8px 12px; border-radius: 14px; font-size: .88rem; word-wrap: break-word; }
        #chat-messages .msg-user { align-self: flex-end; background: #1e3a8a; color: #fff; border-bottom-right-radius: 4px; white-space: pre-wrap; }
        #chat-messages .msg-bot { align-self: flex-start; background: #fff; color: #212529; border: 1px solid #e3e6ee; border-bottom-left-radius: 4px; }
        #chat-box .chat-acoes { display: flex; gap: 6px; padding: 8px 10px 0; background: #fff; flex-wrap: wrap; }
        #chat-box .chat-acoes button { flex: 1; font-size: .75rem; }
        #chat-anexos { display: flex; flex-wrap: wrap; gap: 6px; padding: 6px 10px 0; background: #fff; }
        #chat-anexos .chip { background: #eef2ff; border: 1px solid #c7d2fe; border-radius: 20px; padding: 2px 8px; font-size: .72rem; display: inline-flex; align-items: center; gap: 6px; max-width: 100%; }
        #chat-anexos .chip span { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 150px; }
        #chat-anexos .chip button { border: 0; background: none; padding: 0; line-height: 1; color: #6c757d; cursor: pointer; }
        #chat-box .chat-entrada { display: flex; gap: 6px; padding: 10px; background: #fff; align-items: center; }
        #chat-box .chat-entrada input[type=text] { flex: 1; border-radius: 20px; }
        #chat-box .chat-entrada .btn { border-radius: 50%; width: 38px; height: 38px; padding: 0; display: inline-flex; align-items: center; justify-content: center; }
    `;
    document.head.appendChild(estilo);

    const box = document.createElement('div');
    box.id = 'chat-box';
    box.innerHTML = `
        <div class="chat-header">
            <span><i class="bi bi-chat-dots-fill me-2"></i>Bibliotecário Virtual</span>
            <button type="button" class="chat-x" id="chat-close-btn" aria-label="Fechar">&times;</button>
        </div>
        <div id="chat-messages"></div>
        <div class="chat-acoes" id="chat-acoes"></div>
        <div id="chat-anexos"></div>
        <div class="chat-entrada">
            <input type="file" id="chat-file" multiple accept=".jpg,.jpeg,.png,.pdf" hidden>
            <button type="button" class="btn btn-outline-secondary" id="chat-attach-btn" title="Anexar arquivo (JPG, PNG ou PDF, até 4 MB no total)"><i class="bi bi-paperclip"></i></button>
            <input type="text" class="form-control" id="chat-input" placeholder="Digite sua mensagem..." autocomplete="off">
            <button type="button" class="btn btn-primary" id="chat-send-btn" title="Enviar"><i class="bi bi-send-fill"></i></button>
        </div>`;
    container.appendChild(box);

    const msgs = box.querySelector('#chat-messages');
    const campo = box.querySelector('#chat-input');
    const arquivoInput = box.querySelector('#chat-file');

    // ---------- mensagens ----------
    function bot(html) {
        const d = document.createElement('div');
        d.className = 'msg-bot';
        d.innerHTML = html;
        msgs.appendChild(d);
        msgs.scrollTop = msgs.scrollHeight;
    }

    function usuario(texto) {
        const d = document.createElement('div');
        d.className = 'msg-user';
        d.textContent = texto;
        msgs.appendChild(d);
        msgs.scrollTop = msgs.scrollHeight;
    }

    // ---------- barra de ações (muda conforme o modo) ----------
    function renderAcoes() {
        const barra = box.querySelector('#chat-acoes');

        if (modo === 'faq') {
            barra.innerHTML = `
                <button type="button" class="btn btn-outline-danger btn-sm" data-acao="reclamacao"><i class="bi bi-megaphone me-1"></i>Registrar reclamação</button>
                <button type="button" class="btn btn-outline-primary btn-sm" data-acao="bibliotecario"><i class="bi bi-person-lines-fill me-1"></i>Falar com o bibliotecário</button>`;
        } else if (modo === 'reclamacao') {
            barra.innerHTML = `
                <button type="button" class="btn btn-danger btn-sm" data-acao="enviar-reclamacao"><i class="bi bi-send me-1"></i>Enviar reclamação</button>
                <button type="button" class="btn btn-outline-secondary btn-sm" data-acao="cancelar">Cancelar</button>`;
        } else {
            barra.innerHTML = `<button type="button" class="btn btn-outline-secondary btn-sm" data-acao="cancelar">Cancelar</button>`;
        }
    }

    box.querySelector('#chat-acoes').addEventListener('click', (e) => {
        const botao = e.target.closest('button[data-acao]');
        if (!botao || enviando) return;

        const acao = botao.dataset.acao;

        if (acao === 'reclamacao') {
            modo = 'reclamacao';
            reclamacao = [];
            bot('Certo, vou registrar a sua reclamação. <b>Descreva o que aconteceu</b> na caixa abaixo (pode mandar mais de uma mensagem) e, se tiver evidências, anexe com o clipe 📎. Quando terminar, toque em <b>Enviar reclamação</b>. Ela será enviada por e-mail à ouvidoria.');
        } else if (acao === 'bibliotecario') {
            modo = 'bibliotecario';
            bot('Escreva a sua dúvida para o bibliotecário. Se precisar, anexe fotos ou PDF com o clipe 📎. Ao enviar a mensagem, ela vai para o painel dele.');
        } else if (acao === 'cancelar') {
            voltarAoInicio('Tudo bem, cancelei. Posso ajudar com outra coisa?');
            return;
        } else if (acao === 'enviar-reclamacao') {
            enviarReclamacao();
            return;
        }

        renderAcoes();
        campo.focus();
    });

    function voltarAoInicio(mensagem) {
        modo = 'faq';
        reclamacao = [];
        anexos = [];
        renderAnexos();
        renderAcoes();
        if (mensagem) bot(mensagem);
    }

    // ---------- anexos (disponíveis em qualquer momento do chat) ----------
    box.querySelector('#chat-attach-btn').addEventListener('click', () => arquivoInput.click());

    arquivoInput.addEventListener('change', () => {
        const novos = Array.from(arquivoInput.files);
        arquivoInput.value = '';

        for (const arq of novos) {
            const ext = arq.name.includes('.') ? arq.name.split('.').pop().toLowerCase() : '';

            if (!EXTENSOES.includes(ext)) {
                bot(`❌ <b>${esc(arq.name)}</b>: use apenas JPG, PNG ou PDF.`);
                continue;
            }

            if (anexos.length >= MAX_ARQUIVOS) {
                bot(`❌ Você pode anexar no máximo ${MAX_ARQUIVOS} arquivos.`);
                break;
            }

            const total = anexos.reduce((s, a) => s + a.size, 0) + arq.size;
            if (total > MAX_TOTAL) {
                bot(`❌ <b>${esc(arq.name)}</b> não coube: os anexos juntos podem ter no máximo 4 MB.`);
                continue;
            }

            anexos.push(arq);
        }

        renderAnexos();
    });

    function renderAnexos() {
        const div = box.querySelector('#chat-anexos');

        div.innerHTML = anexos.map((a, i) => `
            <span class="chip" title="${esc(a.name)}"><i class="bi bi-paperclip"></i><span>${esc(a.name)}</span>
                <button type="button" data-remover="${i}" aria-label="Remover anexo">&times;</button></span>`).join('');
    }

    box.querySelector('#chat-anexos').addEventListener('click', (e) => {
        const botao = e.target.closest('button[data-remover]');
        if (!botao) return;
        anexos.splice(Number(botao.dataset.remover), 1);
        renderAnexos();
    });

    // ---------- envio ----------
    function enviar() {
        const texto = campo.value.trim();
        if (!texto || enviando) return;

        usuario(texto);
        campo.value = '';

        if (modo === 'bibliotecario') {
            enviarParaBibliotecario(texto);
        } else if (modo === 'reclamacao') {
            reclamacao.push(texto);
            bot('Anotado. Pode continuar escrevendo ou tocar em <b>Enviar reclamação</b>.');
        } else {
            responderFaq(texto);
        }
    }

    box.querySelector('#chat-send-btn').addEventListener('click', enviar);
    campo.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); enviar(); } });

    async function enviarParaBibliotecario(texto) {
        enviando = true;

        const dados = new FormData();
        dados.append('duvida', texto);
        anexos.forEach(a => dados.append('arquivos', a));

        try {
            const resposta = await fetch(`${API_URL}/api/chat/suporte`, { method: 'POST', body: dados });
            const retorno = await resposta.text();

            if (!resposta.ok) throw new Error(retorno);

            voltarAoInicio(`✅ ${esc(retorno)}`);
        } catch (erro) {
            bot(`❌ ${esc(erro.message || 'Não foi possível enviar agora. Tente novamente.')}`);
        } finally {
            enviando = false;
        }
    }

    async function enviarReclamacao() {
        const texto = reclamacao.join('\n').trim();

        if (texto.length < 10) {
            bot('Antes de enviar, descreva a reclamação (pelo menos 10 caracteres).');
            return;
        }

        enviando = true;
        bot('Enviando a sua reclamação à ouvidoria...');

        const dados = new FormData();
        dados.append('descricao', texto);
        anexos.forEach(a => dados.append('arquivos', a));

        try {
            const resposta = await fetch(`${API_URL}/api/reclamacoes`, { method: 'POST', body: dados });
            const retorno = await resposta.text();

            if (!resposta.ok) throw new Error(retorno);

            voltarAoInicio(`✅ ${esc(retorno)}`);
        } catch (erro) {
            bot(`❌ ${esc(erro.message || 'Não foi possível enviar agora. Tente novamente.')} Sua reclamação continua aqui: toque em <b>Enviar reclamação</b> para tentar de novo.`);
        } finally {
            enviando = false;
        }
    }

    // ---------- perguntas básicas (FAQ por palavras-chave) ----------
    function responderFaq(texto) {
        const t = texto.toLowerCase();

        setTimeout(() => {
            if (t.includes('prazo') || t.includes('dias') || t.includes('devolver')) {
                bot('O prazo de empréstimo é de <b>14 dias</b> para alunos e <b>30 dias</b> para professores. Perto do vencimento você pode pedir renegociação em Meus Empréstimos; o bibliotecário precisa aprovar. Atraso gera multa de <b>R$ 2,00 por dia</b>.');
            } else if (t.includes('renovar') || t.includes('renovação') || t.includes('renegoci')) {
                bot('Quando faltarem até 3 dias para vencer (ou se já venceu), use o botão <b>Renegociar prazo</b> na tela inicial ou em Meus Empréstimos. O bibliotecário analisa o pedido.');
            } else if (t.includes('multa')) {
                bot('A multa é de <b>R$ 2,00 por dia de atraso</b>, gerada na devolução. Você paga em Meus Empréstimos, na seção Minhas Multas.');
            } else if (t.includes('extravi') || t.includes('perdi')) {
                bot('Se perdeu o livro, avise o bibliotecário. O atraso para de contar e você tem <b>30 dias</b> para entregar um exemplar novo.');
            } else if (t.includes('horario') || t.includes('horário') || t.includes('funcionamento')) {
                bot('A biblioteca física funciona de segunda a sexta-feira, das 08:00 às 21:30.');
            } else {
                bot('Hmm, não encontrei uma resposta exata para isso. Você pode <b>falar com o bibliotecário</b> ou <b>registrar uma reclamação</b> nos botões abaixo.');
            }

            if (anexos.length > 0) {
                bot('📎 Seus anexos estão guardados. Escolha <b>Falar com o bibliotecário</b> ou <b>Registrar reclamação</b> para enviá-los.');
            }
        }, 400);
    }

    // ---------- abrir e fechar ----------
    toggleBtn.addEventListener('click', () => {
        const abrir = box.style.display !== 'flex';
        box.style.display = abrir ? 'flex' : 'none';

        if (abrir && msgs.children.length === 0) {
            bot('Olá! Sou o Bibliotecário Virtual. Posso responder dúvidas básicas (prazo, multa, renovação, horário). Se precisar, use os botões abaixo para falar com o bibliotecário ou registrar uma reclamação. Em qualquer momento você pode anexar arquivos com o clipe 📎.');
            renderAcoes();
        }

        if (abrir) campo.focus();
    });

    box.querySelector('#chat-close-btn').addEventListener('click', () => { box.style.display = 'none'; });
});
