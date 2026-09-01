async function authFetch(url, options = {}) {

    const token = getAccessToken();

    options.headers = {
        ...options.headers,
        Authorization: `Bearer ${token}`, // Correção aplicada aqui (usando crases)
        "Content-Type": "application/json"
    };

    const response = await fetch(url, options);

    if (response.status === 401) {

        const refreshed = await refreshToken();

        if (!refreshed) {
            window.location.href = "index.html";
            return;
        }

        options.headers.Authorization = `Bearer ${getAccessToken()}`; // Correção aplicada aqui

        return fetch(url, options);
    }

    return response;
}