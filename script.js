document.getElementById('loginForm').addEventListener('submit', function(event) {
    event.preventDefault();

    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const tipoUsuario = document.querySelector('input[name="userType"]:checked').value;

    if (email && password) {
        
        console.log(`Autenticando ${tipoUsuario}...`);

        if (tipoUsuario === "aluno") {
            window.location.href = "home-aluno.html";
        } 
        else if (tipoUsuario === "funcionario") {
            window.location.href = "admin-funcionario.html";
        }

    } else {
        alert("Por favor, preencha todos os campos corretamente.");
    }
});