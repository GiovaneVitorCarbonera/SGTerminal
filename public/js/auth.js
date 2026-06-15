document.addEventListener('DOMContentLoaded', () => {
    const formLogin = document.getElementById('form-login');
    const alertBox = document.getElementById('login-alert');

    // Se já houver token salvo, redireciona preventivamente para o painel
    if (localStorage.getItem('jwt_token')) {
        window.location.href = 'dashboard.html';
        return;
    }

    formLogin.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const usuario = document.getElementById('usuario').value.trim();
        const senha = document.getElementById('senha').value;

        // Ocultar alertas prévios
        alertBox.classList.add('d-none');
        alertBox.textContent = '';

        try {
            const response = await fetch('/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ usuario, senha })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.erro || 'Falha ao efetuar autenticação');
            }

            // Armazena o token JWT localmente no navegador
            localStorage.setItem('jwt_token', data.token);
            localStorage.setItem('logged_username', usuario);
            
            // Redireciona com sucesso ao Dashboard
            window.location.href = 'dashboard.html';

        } catch (error) {
            alertBox.classList.remove('d-none');
            alertBox.textContent = error.message;
        }
    });
});