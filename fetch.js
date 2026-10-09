const API_URL = "https://e-library-backend-qytl.onrender.com";
// const API_URL = "http://localhost:8080";

async function authFetch(url, options = {}) {
    const token = getAccessToken();

    options.headers = {
        ...options.headers,
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json"
    };

    const response = await fetch(`${API_URL}${url}`, options);

    if (response.status === 401) {
        const refreshed = await refreshToken();

        if (!refreshed) {
            window.location.href = "index.html";
            return;
        }

        options.headers.Authorization = `Bearer ${getAccessToken()}`;

        return fetch(`${API_URL}${url}`, options);
    }

    return response;
}