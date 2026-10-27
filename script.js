// Se já está logado, vai direto para a home do papel.
if (getAccessToken() && getRole()) {
    irParaHome();
}

document.getElementById('loginForm').addEventListener('submit', async function (event) {
    event.preventDefault();

    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;
    const botao = document.getElementById('btnSubmit');

    if (!email || !password) {
        alert("Por favor, preencha todos os campos.");
        return;
    }

    botao.disabled = true;
    botao.textContent = "Entrando...";

    // O servidor gratuito pode demorar a "acordar" na primeira visita
    const aviso = setTimeout(() => { botao.textContent = "Acordando o servidor..."; }, 4000);

    try {
        const resp = await fetch(`${API_URL}/auth/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, password })
        });

        if (resp.status === 401) {
            alert("E-mail ou senha inválidos.");
            return;
        }

        if (resp.status === 403) {
            alert("Usuário inativo. Procure a biblioteca.");
            return;
        }

        if (!resp.ok) {
            alert("Não foi possível entrar agora. Tente novamente em instantes.");
            return;
        }

        // O back devolve: accessToken, refreshToken, role (aluno | professor | bibliotecario) e name
        salvarSessao(await resp.json());

        // aluno/professor -> home-aluno.html | bibliotecario -> admin-funcionario.html
        irParaHome();

    } catch (err) {
        console.error("Erro no login:", err);
        alert("Não foi possível conectar ao servidor. Tente novamente em instantes.");
    } finally {
        clearTimeout(aviso);
        botao.disabled = false;
        botao.textContent = "Entrar";
    }
});
