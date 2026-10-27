// =====================================================================
// api.js — conversa com o back-end e guarda a sessão do usuário.
// Carregue este arquivo ANTES dos outros scripts de cada página.
// Substitui os antigos fetch.js e auth-guard.js.
// =====================================================================

// Em localhost usa o back local; no Vercel usa o Render.
const API_URL = ["localhost", "127.0.0.1"].includes(window.location.hostname)
    ? "http://localhost:8080"
    : "https://e-library-backend-qytl.onrender.com";

const BACKEND_URL = API_URL; // nome usado nas páginas

// Para onde cada papel vai depois do login
const HOME_POR_PAPEL = {
    aluno: "home-aluno.html",
    professor: "home-aluno.html",
    bibliotecario: "admin-funcionario.html"
};

// ---------------- sessão ----------------
function salvarSessao(dados) {
    localStorage.setItem("accessToken", dados.accessToken);
    localStorage.setItem("refreshToken", dados.refreshToken);
    localStorage.setItem("role", dados.role);
    localStorage.setItem("userName", dados.name || "");
}

function getAccessToken() { return localStorage.getItem("accessToken"); }
function getRefreshToken() { return localStorage.getItem("refreshToken"); }
function getRole() { return localStorage.getItem("role"); }
function getUserName() { return localStorage.getItem("userName"); }

function limparSessao() {
    ["accessToken", "refreshToken", "role", "userName", "authToken", "userId", "userRole"]
        .forEach(k => localStorage.removeItem(k));
}

function sair() {
    limparSessao();
    window.location.href = "index.html";
}

// Manda o usuário para a home do papel dele. Papel desconhecido: limpa a sessão e fica no login.
function irParaHome() {
    const destino = HOME_POR_PAPEL[getRole()];

    if (!destino) {
        limparSessao();
        return;
    }

    window.location.href = destino;
}

// Proteção de página. Uso: exigirPapel(['bibliotecario']);
// Sem login volta ao login; papel errado vai para a home do próprio papel.
function exigirPapel(papeisPermitidos) {
    if (!getAccessToken() || !getRole()) {
        window.location.href = "index.html";
        return false;
    }

    if (!papeisPermitidos.includes(getRole())) {
        irParaHome();
        return false;
    }

    return true;
}

// ---------------- renovação automática do token ----------------
const fetchOriginal = window.fetch.bind(window);
let renovacaoEmAndamento = null;

async function renovarSessao() {
    // Evita várias renovações ao mesmo tempo
    if (renovacaoEmAndamento) return renovacaoEmAndamento;

    renovacaoEmAndamento = (async () => {
        const refresh = getRefreshToken();
        if (!refresh) return false;

        try {
            const resp = await fetchOriginal(`${API_URL}/auth/refresh`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ refreshToken: refresh })
            });

            if (!resp.ok) return false;

            salvarSessao(await resp.json());
            return true;
        } catch (e) {
            return false;
        }
    })();

    const resultado = await renovacaoEmAndamento;
    renovacaoEmAndamento = null;
    return resultado;
}

let avisouExpiracao = false;

function sessaoExpirada() {
    if (!avisouExpiracao) {
        avisouExpiracao = true;
        alert("Sua sessão expirou. Faça login novamente.");
    }
    sair();
}

// Toda chamada ao back-end (exceto /auth/) recebe o token sozinha.
// Se o token expirou (401), renova e repete a chamada uma vez.
window.fetch = async function (input, init = {}) {
    const url = typeof input === "string" ? input : input.url;

    if (!url.startsWith(API_URL) || url.includes("/auth/")) {
        return fetchOriginal(input, init);
    }

    const montar = () => {
        const headers = new Headers(init.headers || {});
        headers.set("Authorization", `Bearer ${getAccessToken()}`);
        return { ...init, headers };
    };

    let resposta = await fetchOriginal(input, montar());

    if (resposta.status === 401) {
        if (await renovarSessao()) {
            resposta = await fetchOriginal(input, montar());
        } else {
            sessaoExpirada();
        }
    }

    return resposta;
};

// Cabeçalhos padrão para chamadas com corpo JSON
function getAuthHeaders() {
    return {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${getAccessToken()}`
    };
}

// Utilitários usados em várias telas
const esc = s => String(s ?? "-").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const formatarReal = v => Number(v).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const VALOR_MULTA_DIA = 2; // R$ por dia de atraso (RN02)

function diasParaVencer(dataPrevista) {
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    return Math.round((new Date(dataPrevista + "T00:00:00") - hoje) / 86400000);
}

// Acessibilidade (fonte e contraste salvos no navegador)
let tamanhoFonteAtual = 16;

function aplicarAcessibilidadeSalva() {
    const fonteSalva = localStorage.getItem("acessibilidade_fonte");
    if (fonteSalva) {
        tamanhoFonteAtual = parseInt(fonteSalva);
        document.documentElement.style.fontSize = tamanhoFonteAtual + "px";
    }
    if (localStorage.getItem("acessibilidade_contraste") === "true") document.body.classList.add("alto-contraste");
}

function alterarFonte(acao) {
    if (acao === 1 && tamanhoFonteAtual < 24) tamanhoFonteAtual += 2;
    else if (acao === -1 && tamanhoFonteAtual > 12) tamanhoFonteAtual -= 2;
    else if (acao === 0) tamanhoFonteAtual = 16;
    document.documentElement.style.fontSize = tamanhoFonteAtual + "px";
    localStorage.setItem("acessibilidade_fonte", tamanhoFonteAtual);
}

function toggleAltoContraste() {
    document.body.classList.toggle("alto-contraste");
    localStorage.setItem("acessibilidade_contraste", document.body.classList.contains("alto-contraste"));
}
