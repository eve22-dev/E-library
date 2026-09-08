async function verificarAcesso(papeisPermitidos) {
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    window.location.href = "index.html";
    return;
  }

  const { data: perfil, error } = await supabase
    .from('usuarios')
    .select('papel')
    .eq('id', session.user.id)
    .single();

  if (error || !perfil || !papeisPermitidos.includes(perfil.papel)) {
    alert("Acesso negado! Você não tem permissão para visualizar esta página.");
    await supabase.auth.signOut();
    window.location.href = "index.html";
  }
}