const API_URL =
  import.meta.env.VITE_API_URL ||
  "http://localhost:5000";

let refreshPromise = null;

const apiResponseCache = new Map();

function getCachedResponse(cacheKey) {
  const cached = apiResponseCache.get(cacheKey);

  if (!cached) {
    return null;
  }

  if (Date.now() > cached.expiresAt) {
    apiResponseCache.delete(cacheKey);
    return null;
  }

  return new Response(cached.body, {
    status: cached.status,
    statusText: cached.statusText,
    headers: cached.headers
  });
}

export async function apiFetchCached(
  url,
  options = {},
  ttl = 30000
) {
  const method = (options.method || "GET").toUpperCase();

  if (method !== "GET") {
    return apiFetch(url, options);
  }

  const email =
    localStorage.getItem("clothswapUserEmail") ||
    localStorage.getItem("clothswapEmail") ||
    "";

  const cacheKey =
    email.trim().toLowerCase() + "::" + url;

  const cachedResponse = getCachedResponse(cacheKey);

  if (cachedResponse) {
    return cachedResponse;
  }

  const response = await apiFetch(url, options);

  if (response.ok) {
    const body = await response.clone().text();

    apiResponseCache.set(cacheKey, {
      body: body,
      status: response.status,
      statusText: response.statusText,
      headers: Array.from(response.headers.entries()),
      expiresAt: Date.now() + ttl
    });
  }

  return response;
}
export async function refreshAccessToken() {

  if (refreshPromise) {
    return refreshPromise;
  }

  refreshPromise = (async function () {
    try {
      const response = await fetch(
        `${API_URL}/api/auth/refresh`,
        {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json"
          }
        }
      );

      const data = await response.json();

      if (response.ok && data.success && data.token) {
        localStorage.setItem(
          "clothswapToken",
          data.token
        );

        return data.token;
      }

      if (response.status === 401) {
        localStorage.removeItem("clothswapToken");
        localStorage.removeItem("clothswapLoggedIn");
        localStorage.removeItem("clothswapIsAdmin");
      }

      return null;

    } catch (error) {
      console.error("Access Token Refresh Error:", error);
      return null;

    } finally {
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}

export async function apiFetch(url, options = {}) {

  const requestOptions = {
    ...options,
    credentials: "include"
  };

  const headers = new Headers(options.headers || {});

  const currentToken =
    localStorage.getItem("clothswapToken");

  if (currentToken) {
    headers.set(
      "Authorization",
      `Bearer ${currentToken}`
    );
  }

  requestOptions.headers = headers;

  let response = await fetch(url, requestOptions);

  const isAuthRoute =
    url.includes("/api/auth/login") ||
    url.includes("/api/auth/google") ||
    url.includes("/api/auth/register") ||
    url.includes("/api/auth/refresh") ||
    url.includes("/api/auth/logout");

 
if (response.status === 403) {
  const errorData = await response.clone().json().catch(
    function () {
      return null;
    }
  );
  if (
    errorData &&
    errorData.code === "HAND_TO_HAND_CONFIRMATION_OVERDUE"
  ) {
    window.alert(
      errorData.message ||
      "Your Hand-to-Hand swap confirmation is overdue. Your ClothSwap activities are temporarily restricted until this pending confirmation is resolved."
    );

    return response;
  }
  if (
    errorData &&
    (
      errorData.message === "Your account has been blocked." ||
      errorData.message === "Your account has been blocked"
    )
  ) {
    localStorage.removeItem("clothswapToken");
    localStorage.removeItem("clothswapLoggedIn");
    localStorage.removeItem("clothswapIsAdmin");

    window.alert("Your account has been blocked.");

    window.location.href = "/login";

    return response;
  }
}


if (response.status !== 401 || isAuthRoute) {
  return response;
}

  const newToken = await refreshAccessToken();

  if (!newToken) {
    return response;
  }

  const retryHeaders = new Headers(options.headers || {});

  retryHeaders.set(
    "Authorization",
    `Bearer ${newToken}`
  );

  return fetch(url, {
    ...options,
    credentials: "include",
    headers: retryHeaders
  });
}


export default API_URL;