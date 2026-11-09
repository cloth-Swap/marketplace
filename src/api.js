const API_URL =
  import.meta.env.VITE_API_URL ||
  "http://localhost:5000";

let refreshPromise = null;

/* ================= REFRESH ACCESS TOKEN ================= */
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


/* ================= COMMON API FETCH ================= */

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

 
// CHECK IF USER ACCOUNT IS BLOCKED OR HAND-TO-HAND OVERDUE
if (response.status === 403) {
  const errorData = await response.clone().json().catch(
    function () {
      return null;
    }
  );

  // HAND-TO-HAND OVERDUE POP-UP
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

  // CHECK IF USER ACCOUNT IS BLOCKED
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