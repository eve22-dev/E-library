document.getElementById('loginForm').addEventListener('submit', async function(event) {
    event.preventDefault();

    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const btnSubmit = document.querySelector('button[type="submit"]');
    
    if (!email || !password) {
        alert("Por favor, preencha todos os campos.");
        return;
    }

    // Feedback visual de carregamento
    btnSubmit.disabled = true;
    btnSubmit.innerText = 'Autenticando...';

    try {
        // 1. Faz o login na tabela auth.users do Supabase
        const { data: authData, error: authError } = await window.supabase.auth.signInWithPassword({
            email: email,
            password: password,
        });

        if (authError) {
            alert("Erro ao entrar: " + authError.message);
            btnSubmit.disabled = false;
            btnSubmit.innerText = 'Entrar';
            return;
        }

        const userId = authData.user.id;

        // 2. Busca o papel (role) na sua tabela 'usuarios'
        const { data: perfil, error: perfilError } = await window.supabase
            .from('usuarios')
            .select('papel')
            .eq('id', userId)
            .single();

        if (perfilError || !perfil) {
            alert("Perfil não encontrado na base de dados do sistema.");
            await window.supabase.auth.signOut();
            btnSubmit.disabled = false;
            btnSubmit.innerText = 'Entrar';
            return;
        }

        const papel = perfil.papel;

        // 3. Salva a role e os tokens no frontend para usar nas outras telas e nas chamadas do backend
        localStorage.setItem('userRole', papel);
        localStorage.setItem('userId', userId);
        localStorage.setItem('authToken', authData.session.access_token);

        // 4. Roteamento Inteligente baseado EXCLUSIVAMENTE no banco de dados
        if (papel === 'aluno' || papel === 'professor') {
            window.location.href = "home-aluno.html";
        } 
        else if (papel === 'bibliotecario') {
            window.location.href = "admin-funcionario.html";
        } 
        else {
            alert("Acesso negado! Papel de usuário desconhecido.");
            await window.supabase.auth.signOut();
            btnSubmit.disabled = false;
            btnSubmit.innerText = 'Entrar';
        }

    } catch (err) {
        console.error("Erro inesperado no login:", err);
        alert("Ocorreu um erro ao processar o login. Tente novamente.");
        btnSubmit.disabled = false;
        btnSubmit.innerText = 'Entrar';
    }
});