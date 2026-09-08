document.getElementById('loginForm').addEventListener('submit', async function(event) {
    event.preventDefault();

    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    
    // Pega qual opção o usuário marcou no botão de seleção (aluno ou funcionario)
    const tipoSelecionado = document.querySelector('input[name="userType"]:checked');

    if (!email || !password || !tipoSelecionado) {
        alert("Por favor, preencha todos os campos e selecione o tipo de usuário.");
        return;
    }

    const tipoUsuario = tipoSelecionado.value;
    console.log(`Autenticando ${tipoUsuario}...`);

    try {
        const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
            email: email,
            password: password,
        });

        if (authError) {
            alert("Erro ao entrar: " + authError.message);
            return;
        }

        const { data: perfil, error: perfilError } = await supabase
            .from('usuarios')
            .select('papel')
            .eq('id', authData.user.id)
            .single();

        if (perfilError || !perfil) {
            alert("Perfil não encontrado na base de dados do sistema.");
            await supabase.auth.signOut();
            return;
        }

        if (tipoUsuario === "aluno") {
            if (perfil.papel !== 'aluno' && perfil.papel !== 'professor') {
                alert("Acesso negado! Este e-mail não possui permissão para acessar a área de docentes.");
                await supabase.auth.signOut();
                return;
            }
            window.location.href = "home-aluno.html";
        } 
        else if (tipoUsuario === "funcionario") {
            if (perfil.papel === 'bibliotecario') {
                window.location.href = "admin-funcionario.html";
            } 
            else if (perfil.papel === 'professor') {
                window.location.href = "home-aluno.html";
            }
            else {
                alert("Acesso negado! Esta área é restrita para o bibliotecário.");
                await supabase.auth.signOut();
            }
        }

    } catch (err) {
        console.error("Erro inesperado no login:", err);
        alert("Ocorreu um erro ao processar o login. Tente novamente.");
    }
});