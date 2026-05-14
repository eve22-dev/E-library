const API_URL = "https://e-library-backend-qytl.onrender.com";

function saveTokens(accessToken, refreshToken) {
    localStorage.setItem("accessToken", accessToken);
    localStorage.setItem("refreshToken", refreshToken);
}

function getAccessToken() {
    return localStorage.getItem("accessToken");
}

function getRefreshToken() {
    return localStorage.getItem("refreshToken");
}

function clearTokens() {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
}

const loginForm =
    document.getElementById("loginForm");

if (loginForm) {
    loginForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        const email =
            document.getElementById("email").value;
        const password =
            document.getElementById("password").value;
        try {
            const response = await fetch(
                `${API_URL}/auth/login`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        email,
                        password
                    })
                }
            );
            if (!response.ok) {
                alert("Email ou senha inválidos");
                return;
            }
            const data = await response.json();
            saveTokens(
                data.accessToken,
                data.refreshToken
            );
            window.location.href = "home-aluno.html";
        } catch (error) {
            console.error(error);
            alert("Erro ao conectar no servidor");
        }
    });
}

async function verifyToken() {
    const token = getAccessToken();
    if (!token) {
        return false;
    }
    try {
        const response = await fetch(
            `${API_URL}/auth/verify`,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    token
                })
            }
        );
        const valid = await response.json();
        return valid;
    } catch (error) {
        return false;
    }
}

async function refreshToken() {
    const refreshToken =
        getRefreshToken();
    if (!refreshToken) {
        return false;
    }
    try {
        const response = await fetch(
            `${API_URL}/auth/refresh`,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    refreshToken
                })
            }
        );
        if (!response.ok) {
            clearTokens();
            return false;
        }
        const data = await response.json();
        saveTokens(
            data.accessToken,
            data.refreshToken
        );
        return true;
    } catch (error) {
        clearTokens();
        return false;
    }
}

async function checkAuth() {
    const isValid =
        await verifyToken();
    if (isValid) {
        return true;
    }
    const refreshed =
        await refreshToken();
    if (refreshed) {
        return true;
    }
    clearTokens();
    window.location.href = "index.html";
    return false;
}