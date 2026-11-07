// =====================================================================
// chat.js — Bibliotecário Virtual
//  - conversa de verdade com a IA (Gemini, pelo back-end)
//  - "Falar com o bibliotecário": a conversa acontece aqui, dentro da plataforma
//  - "Registrar reclamação": enviada por e-mail à ouvidoria
//  - anexos (clipe) em qualquer momento
// Precisa do api.js carregado antes.
// =====================================================================
document.addEventListener('DOMContentLoaded', () => {
    const container = document.getElementById('chat-widget-container');
    const toggleBtn = document.getElementById('chat-toggle-btn');
    if (!container || !toggleBtn) return;

    const MAX_ARQUIVOS = 5;
    const MAX_TOTAL = 4 * 1024 * 1024; // 4 MB no total
    const EXTENSOES = ['jpg', 'jpeg', 'png', 'pdf'];

    let modo = 'faq';              // faq | reclamacao | bibliotecario
    let anexos = [];               // arquivos escolhidos (valem para o próximo envio)
    let reclamacao = [];           // mensagens que formam o texto da reclamação
    let historicoIA = [];          // conversa com a IA: [{ papel: 'user' | 'bot', texto }]
    let conversaAtual = null;      // conversa aberta com o bibliotecário
    let respostasMostradas = 0;    // quantas respostas dessa conversa já foram desenhadas
    let naoLidasTotal = 0;         // respostas do bibliotecário ainda não vistas
    let intervaloConversa = null;
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
        #chat-messages .msg-biblio { align-self: flex-start; background: #ecfdf3; color: #14532d; border: 1px solid #bbf7d0; border-bottom-left-radius: 4px; max-width: 85%; padding: 8px 12px; border-radius: 14px; font-size: .88rem; word-wrap: break-word; }
        #chat-messages .msg-aviso { align-self: center; font-size: .75rem; color: #6c757d; background: #e9ecef; border-radius: 20px; padding: 2px 12px; }
        #chat-box .chat-acoes { display: flex; gap: 6px; padding: 8px 10px 0; background: #fff; flex-wrap: wrap; }
        #chat-box .chat-acoes button { flex: 1; font-size: .75rem; }
        #chat-anexos { display: flex; flex-wrap: wrap; gap: 6px; padding: 6px 10px 0; background: #fff; }
        #chat-anexos .chip { background: #eef2ff; border: 1px solid #c7d2fe; border-radius: 20px; padding: 2px 8px; font-size: .72rem; display: inline-flex; align-items: center; gap: 6px; max-width: 100%; }
        #chat-anexos .chip span { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 150px; }
        #chat-anexos .chip button { border: 0; background: none; padding: 0; line-height: 1; color: #6c757d; cursor: pointer; }
        #chat-box .chat-entrada { display: flex; gap: 6px; padding: 10px; background: #fff; align-items: center; }
        #chat-box .chat-entrada input[type=text] { flex: 1; border-radius: 20px; }
        #chat-box .chat-entrada .btn { border-radius: 50%; width: 38px; height: 38px; padding: 0; display: inline-flex; align-items: center; justify-content: center; }
        #chat-toggle-btn { position: relative; }
        #chat-badge { position: absolute; top: -4px; right: -4px; min-width: 22px; height: 22px; border-radius: 11px; background: #dc3545; color: #fff; font-size: .72rem; font-weight: 700; display: none; align-items: center; justify-content: center; padding: 0 5px; border: 2px solid #fff; }
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
            <input type="text" class="form-control" id="chat-input" placeholder="Digite sua mensagem..." autocomplete="off" maxlength="800">
            <button type="button" class="btn btn-primary" id="chat-send-btn" title="Enviar"><i class="bi bi-send-fill"></i></button>
        </div>`;
    container.appendChild(box);

    const badge = document.createElement('span');
    badge.id = 'chat-badge';
    toggleBtn.appendChild(badge);

    const msgs = box.querySelector('#chat-messages');
    const campo = box.querySelector('#chat-input');
    const arquivoInput = box.querySelector('#chat-file');

    // ---------- mensagens ----------
    // Texto da IA: escapa o HTML e converte **negrito** e quebras de linha
    function formatar(texto) {
        return esc(texto).replace(/\*\*(.+?)\*\*/g, '<b>$1</b>').replace(/\n/g, '<br>');
    }

    function rolar() { msgs.scrollTop = msgs.scrollHeight; }

    function bot(html) {
        const d = document.createElement('div');
        d.className = 'msg-bot';
        d.innerHTML = html;
        msgs.appendChild(d);
        rolar();
        return d;
    }

    function aviso(texto) {
        const d = document.createElement('div');
        d.className = 'msg-aviso';
        d.textContent = texto;
        msgs.appendChild(d);
        rolar();
    }

    function listaDeAnexos(lista) {
        return (lista && lista.length)
            ? '<br><small>' + lista.map(a => '📎 ' + esc(a.nome)).join('<br>') + '</small>'
            : '';
    }

    function usuario(texto, anexosDaMensagem) {
        const d = document.createElement('div');
        d.className = 'msg-user';
        d.textContent = texto;

        if (anexosDaMensagem && anexosDaMensagem.length) {
            const pequeno = document.createElement('small');
            pequeno.innerHTML = listaDeAnexos(anexosDaMensagem);
            d.appendChild(pequeno);
        }

        msgs.appendChild(d);
        rolar();
    }

    function bibliotecario(texto, anexosDaMensagem) {
        const d = document.createElement('div');
        d.className = 'msg-biblio';
        d.innerHTML = '<b>👤 Bibliotecário</b><br>' + formatar(texto) + listaDeAnexos(anexosDaMensagem);
        msgs.appendChild(d);
        rolar();
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
            barra.innerHTML = `<button type="button" class="btn btn-outline-secondary btn-sm" data-acao="voltar"><i class="bi bi-arrow-left me-1"></i>Voltar ao assistente</button>`;
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
            renderAcoes();
            campo.focus();
        } else if (acao === 'bibliotecario') {
            entrarBibliotecario();
        } else if (acao === 'enviar-reclamacao') {
            enviarReclamacao();
        } else if (acao === 'cancelar') {
            voltarAoInicio('Tudo bem, cancelei. Posso ajudar com outra coisa?');
        } else if (acao === 'voltar') {
            voltarAoInicio('Voltei ao assistente. Em que posso ajudar?');
        }
    });

    function voltarAoInicio(mensagem) {
        pararConversa();
        modo = 'faq';
        reclamacao = [];
        anexos = [];
        conversaAtual = null;
        renderAnexos();
        renderAcoes();
        if (mensagem) bot(mensagem);
        campo.focus();
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
        box.querySelector('#chat-anexos').innerHTML = anexos.map((a, i) => `
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

        campo.value = '';

        if (modo === 'bibliotecario') {
            enviarParaBibliotecario(texto);
        } else if (modo === 'reclamacao') {
            usuario(texto);
            reclamacao.push(texto);
            bot('Anotado. Pode continuar escrevendo ou tocar em <b>Enviar reclamação</b>.');
        } else {
            usuario(texto);
            responderComIA(texto);
        }
    }

    box.querySelector('#chat-send-btn').addEventListener('click', enviar);
    campo.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); enviar(); } });

    // ---------- IA ----------
    async function responderComIA(texto) {
        enviando = true;
        const balao = bot('<i class="text-muted">Digitando...</i>');

        try {
            const resposta = await fetch(`${API_URL}/api/chat`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ mensagem: texto, historico: historicoIA.slice(-10) })
            });

            if (!resposta.ok) throw new Error('IA indisponível');

            const dados = await resposta.json();

            balao.innerHTML = formatar(dados.resposta);
            historicoIA.push({ papel: 'user', texto }, { papel: 'bot', texto: dados.resposta });

            if (dados.transbordo) {
                balao.innerHTML += '<br><br><small class="text-muted">Use os botões abaixo: <b>Falar com o bibliotecário</b> ou <b>Registrar reclamação</b>.</small>';
            }
        } catch (erro) {
            // se a IA estiver fora do ar, responde com as regras básicas
            balao.innerHTML = respostaLocal(texto);
        } finally {
            enviando = false;
            if (anexos.length > 0) {
                bot('📎 Seus anexos estão guardados. Escolha <b>Falar com o bibliotecário</b> ou <b>Registrar reclamação</b> para enviá-los.');
            }
            rolar();
        }
    }

    // Plano B: perguntas básicas por palavra-chave
    function respostaLocal(texto) {
        const t = texto.toLowerCase();

        if (t.includes('prazo') || t.includes('dias') || t.includes('devolver')) {
            return 'O prazo de empréstimo é de <b>14 dias</b> para alunos e <b>30 dias</b> para professores. Atraso gera multa de <b>R$ 2,00 por dia</b>.';
        }
        if (t.includes('renovar') || t.includes('renovação') || t.includes('renegoci')) {
            return 'A partir de 3 dias antes do vencimento use o botão <b>Renegociar prazo</b>. O bibliotecário analisa o pedido.';
        }
        if (t.includes('multa')) {
            return 'A multa é de <b>R$ 2,00 por dia de atraso</b>. Você paga em Meus Empréstimos, em Minhas Multas.';
        }
        if (t.includes('horario') || t.includes('horário') || t.includes('funcionamento')) {
            return 'A biblioteca funciona de segunda a sexta-feira, das 08:00 às 21:30.';
        }
        return 'No momento não consegui consultar o assistente. Você pode <b>falar com o bibliotecário</b> ou <b>registrar uma reclamação</b> nos botões abaixo.';
    }

    // ---------- conversa com o bibliotecário (dentro da plataforma) ----------
    async function buscarConversas() {
        const resposta = await fetch(`${API_URL}/api/chat/conversas`);
        if (!resposta.ok) throw new Error('Falha ao carregar as conversas');
        return resposta.json();
    }

    function atualizarBadge(lista) {
        naoLidasTotal = lista.reduce((soma, c) => soma + (c.naoLidas || 0), 0);
        badge.textContent = naoLidasTotal;
        badge.style.display = naoLidasTotal > 0 ? 'flex' : 'none';
    }

    async function entrarBibliotecario() {
        modo = 'bibliotecario';
        renderAcoes();

        try {
            const lista = await buscarConversas();
            conversaAtual = lista.find(c => String(c.status).toLowerCase() !== 'resolvido') || null;
            atualizarBadge(lista);
        } catch (erro) {
            conversaAtual = null;
        }

        if (conversaAtual) {
            aviso('Conversa com o bibliotecário');
            respostasMostradas = 0;
            desenharConversa(conversaAtual, true);
            marcarComoLida(conversaAtual);
            iniciarConversa();
            bot('Pode continuar a conversa aqui embaixo. Quando o bibliotecário responder, a resposta aparece nesta janela.');
        } else {
            bot('Escreva a sua dúvida para o bibliotecário (anexe fotos ou PDF com o clipe 📎, se precisar). A resposta vai aparecer aqui, nesta janela.');
        }

        campo.focus();
    }

    // Desenha a mensagem inicial (se pedido) e as respostas ainda não mostradas
    function desenharConversa(c, incluirInicial) {
        if (incluirInicial) {
            usuario(c.mensagem, c.anexos);
        }

        const novas = (c.respostas || []).slice(respostasMostradas);

        novas.forEach(r => {
            if (r.autor === 'bibliotecario') bibliotecario(r.texto, r.anexos);
            else usuario(r.texto, r.anexos);
        });

        respostasMostradas = (c.respostas || []).length;

        if (String(c.status).toLowerCase() === 'resolvido') {
            aviso('Conversa encerrada pelo bibliotecário');
            conversaAtual = null;
            pararConversa();
        }
    }

    async function marcarComoLida(c) {
        if (!c || !c.naoLidas) return;

        try {
            await fetch(`${API_URL}/api/chat/conversas/${c.id}/lida`, { method: 'PUT' });
            c.naoLidas = 0;
            const lista = await buscarConversas();
            atualizarBadge(lista);
        } catch (erro) { /* tenta de novo na próxima atualização */ }
    }

    // Atualiza a conversa aberta (respostas novas do bibliotecário)
    async function atualizarConversa() {
        if (!conversaAtual || modo !== 'bibliotecario') return;

        try {
            const lista = await buscarConversas();
            atualizarBadge(lista);

            const c = lista.find(x => x.id === conversaAtual.id);
            if (!c) return;

            const antes = respostasMostradas;
            conversaAtual = c;
            desenharConversa(c, false);

            if (respostasMostradas > antes || c.naoLidas) {
                marcarComoLida(c);
            }
        } catch (erro) { /* tenta de novo na próxima atualização */ }
    }

    function iniciarConversa() {
        pararConversa();
        intervaloConversa = setInterval(() => {
            if (box.style.display === 'flex') atualizarConversa();
        }, 15000);
    }

    function pararConversa() {
        if (intervaloConversa) {
            clearInterval(intervaloConversa);
            intervaloConversa = null;
        }
    }

    async function enviarParaBibliotecario(texto) {
        enviando = true;

        const dados = new FormData();
        anexos.forEach(a => dados.append('arquivos', a));

        let rota;

        if (conversaAtual) {
            dados.append('texto', texto);
            rota = `/api/chat/conversas/${conversaAtual.id}/responder`;
        } else {
            dados.append('duvida', texto);
            rota = '/api/chat/suporte';
        }

        try {
            const resposta = await fetch(`${API_URL}${rota}`, { method: 'POST', body: dados });
            const retorno = await resposta.text();

            if (!resposta.ok) throw new Error(retorno);

            anexos = [];
            renderAnexos();

            if (conversaAtual) {
                await atualizarConversa();
            } else {
                // primeira mensagem: abre a conversa e mostra
                const lista = await buscarConversas();
                conversaAtual = lista.find(c => String(c.status).toLowerCase() !== 'resolvido') || null;
                atualizarBadge(lista);

                if (conversaAtual) {
                    respostasMostradas = 0;
                    desenharConversa(conversaAtual, true);
                    iniciarConversa();
                }

                bot('✅ Mensagem enviada! Assim que o bibliotecário responder, a resposta aparece aqui.');
            }
        } catch (erro) {
            campo.value = texto;
            bot(`❌ ${esc(erro.message || 'Não foi possível enviar agora. Tente novamente.')}`);
        } finally {
            enviando = false;
        }
    }

    // ---------- reclamação (e-mail para a ouvidoria) ----------
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

    // ---------- abrir e fechar ----------
    toggleBtn.addEventListener('click', () => {
        const abrir = box.style.display !== 'flex';
        box.style.display = abrir ? 'flex' : 'none';

        if (!abrir) return;

        if (msgs.children.length === 0) {
            bot('Olá! Sou o Bibliotecário Virtual da E-Library. Pergunte o que quiser sobre empréstimos, prazos, multas e renovações. Se precisar de uma pessoa, use os botões abaixo. Você pode anexar arquivos com o clipe 📎 a qualquer momento.');
            renderAcoes();
        }

        // há resposta do bibliotecário esperando: abre direto a conversa
        if (naoLidasTotal > 0 && modo !== 'bibliotecario') {
            bot('📩 Você tem uma resposta do bibliotecário!');
            entrarBibliotecario();
            return;
        }

        if (modo === 'bibliotecario') atualizarConversa();

        campo.focus();
    });

    box.querySelector('#chat-close-btn').addEventListener('click', () => { box.style.display = 'none'; });

    // ---------- avisos de resposta (bolinha no botão do chat) ----------
    async function verificarNovidades() {
        try {
            atualizarBadge(await buscarConversas());
        } catch (erro) { /* sem aviso por enquanto */ }
    }

    verificarNovidades();
    setInterval(() => {
        if (box.style.display === 'flex' && modo === 'bibliotecario') atualizarConversa();
        else verificarNovidades();
    }, 45000);
});
