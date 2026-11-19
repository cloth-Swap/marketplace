import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import API_URL, { apiFetch } from "../api";
import { connectSocket } from "../socket";


function Login() {
  const navigate = useNavigate();
  async function continueAfterTerms(nextPath) {
  try {
    // Admin users do not need to create a profile
    if (
      localStorage.getItem("clothswapIsAdmin") === "true"
    ) {
      navigate(nextPath);
      return;
    }

    const response = await apiFetch(
      `${API_URL}/api/user/profile`
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(
        data.message || "Unable to check profile"
      );
    }

    if (
      data.profile &&
      data.profile.profileCompleted
    ) {
      navigate(nextPath);
    } else {
      navigate("/create-profile");
    }

  } catch (error) {
    console.log("Profile check error:", error);
    setError(
      "Unable to verify your profile. Please try again."
    );
  }
}
  async function checkTermsAndNavigate(nextPath) {
  try {
    const response = await apiFetch(
      `${API_URL}/api/auth/terms-status`,
      {
        method: "GET"
      }
    );

    const data = await response.json();

    if (!response.ok || !data.success) {
      setError(
        data.message || "Unable to verify Terms & Conditions."
      );
      return;
    }
     if (data.accepted) {
    await continueAfterTerms(nextPath);
    } else {
      navigate("/terms-conditions", {
        state: {
          requireAcceptance: true,
          returnTo: nextPath
        }
      });
    }

  } catch (error) {
    console.error("Terms Check Error:", error);

    setError(
      "Unable to verify Terms & Conditions. Please try again."
    );
  }
}

  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const googleButtonRef = React.useRef(null);

  const handleGoogleResponse = async function (response) {
    try {
      setError("");

      if (!response || !response.credential) {
        setError("Google sign in failed. Please try again.");
        return;
      }

      const result = await fetch(
        `${API_URL}/api/auth/google`,
        {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json"
          },
          credentials: "include",
          body: JSON.stringify({
            credential: response.credential
          })
        }
      );

      const data = await result.json();

      if (!result.ok || !data.success || !data.user) {
        setError(
          data.message ||
          "Google sign in failed. Please try again."
        );
        return;
      }

      const googleUser = data.user;

     
      const googleName =
        String(googleUser.name || "Google User").trim();

      const googleEmail =
        String(googleUser.email || "")
          .trim()
          .toLowerCase();

      localStorage.setItem(
        "clothswapLoggedIn",
        "true"
      );

      localStorage.setItem(
        "clothswapToken",
        data.token
      );

      localStorage.setItem(
        "clothswapIsAdmin",
        googleUser.role === "Admin"
          ? "true"
          : "false"
      );

      localStorage.setItem(
        "clothswapUserName",
        googleName
      );

      localStorage.setItem(
        "clothSwapUserName",
        googleName
      );

      localStorage.setItem(
        "clothswapEmail",
        googleEmail
      );

      localStorage.setItem(
        "clothswapUserEmail",
        googleEmail
      );
if (googleUser.location) {
  localStorage.setItem(
    "clothswapUserLocation",
    googleUser.location
  );
}
connectSocket();
      await checkTermsAndNavigate("/");

    } catch (error) {
      console.error(
        "Google sign in error:",
        error
      );

      setError(
        "Unable to connect to Google sign in. Please try again."
      );
    }
  };


useEffect(function () {
  let cancelled = false;
  let scriptElement = null;

  const initializeGoogle = function () {
    if (
      cancelled ||
      !window.google ||
      !window.google.accounts ||
      !googleButtonRef.current
    ) {
      return;
    }

    const clientId =
      import.meta.env.VITE_GOOGLE_CLIENT_ID;

    if (!clientId) {
      setError(
        "Google Client ID is missing. Please check the frontend .env file."
      );
      return;
    }

    // Keep the latest page's Google callback.
    window.__clothSwapGoogleCallback =
      handleGoogleResponse;

    // Initialize Google only once for this website.
    if (
      window.__clothSwapGoogleClientId !== clientId
    ) {
      window.google.accounts.id.initialize({
        client_id: clientId,
        callback: function (response) {
          if (
            typeof window.__clothSwapGoogleCallback ===
            "function"
          ) {
            window.__clothSwapGoogleCallback(response);
          }
        },
        auto_select: false
      });

      window.__clothSwapGoogleClientId = clientId;
    }

    googleButtonRef.current.innerHTML = "";

    window.google.accounts.id.renderButton(
      googleButtonRef.current,
      {
        type: "standard",
        theme: "outline",
        size: "medium",
        width: 360,
        text: "signin_with",
        shape: "pill",
        logo_alignment: "left"
      }
    );
  };

  if (
    window.google &&
    window.google.accounts
  ) {
    initializeGoogle();
  } else {
    scriptElement = document.querySelector(
      'script[src="https://accounts.google.com/gsi/client"]'
    );

    if (!scriptElement) {
      scriptElement = document.createElement("script");
      scriptElement.src =
        "https://accounts.google.com/gsi/client";
      scriptElement.async = true;
      scriptElement.defer = true;
      document.head.appendChild(scriptElement);
    }

    scriptElement.addEventListener(
      "load",
      initializeGoogle
    );
  }

  return function () {
    cancelled = true;

    if (scriptElement) {
      scriptElement.removeEventListener(
        "load",
        initializeGoogle
      );
    }
  };
}, []);


  const handleLogin = async function (event) {
    event.preventDefault();

    setError("");

    if (!username || !email || !password) {
      setError(
        "Please enter your username, email and password."
      );
      return;
    }

    if (!email.trim().toLowerCase().endsWith("@gmail.com")) {
      setError(
        "Please enter a valid Gmail address ending with @gmail.com."
      );
      return;
    }

    try {
      const response = await fetch(
        `${API_URL}/api/auth/login`,
        {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            name: username.trim(),
            email: email.trim().toLowerCase(),
            password: password
          })
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        setError(
          data.message ||
          "Please register first or enter correct login details."
        );
        return;
      }

      localStorage.setItem(
        "clothswapLoggedIn",
        "true"
      );

      localStorage.setItem(
        "clothswapToken",
        data.token
      );
console.log("LOGIN USER ROLE:", data.user.role);
      localStorage.setItem(
        "clothswapIsAdmin",
        data.user.role === "Admin"
          ? "true"
          : "false"
      );

      localStorage.setItem(
        "clothswapUserName",
        username.trim()
      );

      localStorage.setItem(
        "clothSwapUserName",
        username.trim()
      );

      const loginEmail =
        email.trim().toLowerCase();

      localStorage.setItem(
        "clothswapEmail",
        loginEmail
      );

      localStorage.setItem(
        "clothswapUserEmail",
        loginEmail
      );

      if (data.user && data.user.location) {
        localStorage.setItem(
          "clothswapUserLocation",
          data.user.location
        );
      }

    if (data.user && data.user.location) {
  localStorage.setItem(
    "clothswapUserLocation",
    data.user.location
  );
}

connectSocket();

await checkTermsAndNavigate("/dashboard");

    } catch (error) {
      console.error(
        "Login error:",
        error
      );

      setError(
        "Unable to connect to server. Please try again."
      );
    }
  };

  const styles = `
    * {
      box-sizing: border-box;
    }

    .clothswap-login-page {
      min-height: 100vh;
      width: 100%;
      padding: 28px;
      background:
        radial-gradient(
          circle at top right,
          rgba(220, 190, 235, 0.45),
          transparent 32%
        ),
        linear-gradient(
          135deg,
          #fff8fb 0%,
          #f9f0fa 48%,
          #eee3f7 100%
        );
      display: flex;
      align-items: center;
      justify-content: center;
      font-family:
        Inter,
        -apple-system,
        BlinkMacSystemFont,
        "Segoe UI",
        sans-serif;
    }

    .clothswap-login-container {
      width: 100%;
      max-width: 1380px;
      min-height: 720px;
      display: grid;
      grid-template-columns: 1.05fr 0.95fr;
      overflow: hidden;
      border-radius: 34px;
      background: rgba(255, 255, 255, 0.48);
      border: 1px solid rgba(255, 255, 255, 0.9);
      box-shadow:
        0 30px 80px rgba(92, 60, 110, 0.14),
        0 8px 30px rgba(92, 60, 110, 0.06);
      backdrop-filter: blur(20px);
      -webkit-backdrop-filter: blur(20px);
    }

    .clothswap-login-visual {
      position: relative;
      min-height: 720px;
      overflow: hidden;
      background: #e9dfd8;
    }

    .clothswap-login-visual img {
      width: 100%;
      height: 100%;
      display: block;
      object-fit: cover;
      object-position: 25% center;
    }

    .clothswap-visual-overlay {
      position: absolute;
      inset: 0;
      padding: 42px;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      background:
        linear-gradient(
          180deg,
          rgba(255, 255, 255, 0.28) 0%,
          rgba(255, 255, 255, 0.02) 35%,
          rgba(45, 35, 55, 0.08) 100%
        );
    }

    .clothswap-brand {
      display: flex;
      align-items: center;
      gap: 12px;
      color: #302744;
    }

    .clothswap-brand-icon {
      width: 45px;
      height: 45px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      background: rgba(255, 255, 255, 0.76);
      color: #80549a;
      font-size: 22px;
      box-shadow:
        0 8px 20px rgba(80, 55, 90, 0.12);
    }

    .clothswap-brand-name {
      font-family: Georgia, "Times New Roman", serif;
      font-size: 31px;
      font-weight: 600;
      letter-spacing: -0.7px;
    }

    .clothswap-brand-tagline {
      margin-top: 4px;
      font-size: 11px;
      letter-spacing: 2px;
      text-transform: uppercase;
      color: #4f4860;
    }

    .clothswap-visual-content {
      max-width: 430px;
      padding-bottom: 20px;
    }

    .clothswap-visual-content h2 {
      margin: 0 0 16px;
      color: #302744;
      font-family: Georgia, "Times New Roman", serif;
      font-size: clamp(42px, 4vw, 68px);
      line-height: 0.98;
      font-weight: 500;
      letter-spacing: -2px;
    }

    .clothswap-visual-content h2 span {
      color: #9a70ad;
    }

    .clothswap-visual-content p {
      margin: 0;
      max-width: 390px;
      color: #51495d;
      font-size: 16px;
      line-height: 1.7;
    }

    .clothswap-feature-list {
      margin-top: 28px;
      display: flex;
      flex-direction: column;
      gap: 13px;
    }

    .clothswap-feature {
      width: fit-content;
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 9px 15px 9px 9px;
      border-radius: 40px;
      background: rgba(255, 255, 255, 0.66);
      border: 1px solid rgba(255, 255, 255, 0.8);
      color: #433b52;
      font-size: 14px;
      box-shadow:
        0 6px 20px rgba(70, 50, 80, 0.08);
    }

    .clothswap-feature-icon {
      width: 34px;
      height: 34px;
      flex-shrink: 0;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      background: #eadcf2;
      color: #78518d;
      font-size: 16px;
    }

    .clothswap-login-form-area {
      position: relative;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 60px;
      background:
        radial-gradient(
          circle at top right,
          rgba(216, 190, 229, 0.30),
          transparent 38%
        ),
        rgba(255, 250, 253, 0.72);
    }

    .clothswap-login-form-area::before {
      content: "";
      position: absolute;
      width: 220px;
      height: 220px;
      top: -90px;
      right: -70px;
      border-radius: 50%;
      background: rgba(203, 169, 219, 0.18);
    }

    .clothswap-login-form-area::after {
      content: "";
      position: absolute;
      width: 180px;
      height: 180px;
      bottom: -100px;
      left: -70px;
      border-radius: 50%;
      background: rgba(232, 210, 239, 0.30);
    }

    .clothswap-login-card {
      position: relative;
      z-index: 2;
      width: 100%;
      max-width: 500px;
      padding: 46px 44px;
      border-radius: 30px;
      background: rgba(255, 255, 255, 0.78);
      border: 1px solid rgba(255, 255, 255, 0.95);
      box-shadow:
        0 24px 60px rgba(82, 55, 95, 0.10),
        inset 0 1px 0 rgba(255, 255, 255, 0.9);
      backdrop-filter: blur(18px);
      -webkit-backdrop-filter: blur(18px);
    }

    .clothswap-welcome-label {
      margin-bottom: 8px;
      color: #9a70ad;
      font-size: 12px;
      font-weight: 700;
      letter-spacing: 2px;
      text-transform: uppercase;
    }

    .clothswap-login-card h1 {
      margin: 0;
      color: #302744;
      font-family: Georgia, "Times New Roman", serif;
      font-size: clamp(36px, 4vw, 50px);
      line-height: 1.05;
      font-weight: 500;
      letter-spacing: -1.5px;
    }

    .clothswap-login-subtitle {
      margin: 13px 0 30px;
      color: #706879;
      font-size: 15px;
      line-height: 1.6;
    }

    .clothswap-alert {
      margin-bottom: 20px;
      padding: 13px 16px;
      border-radius: 14px;
      color: #842029;
      background: #fff0f2;
      border: 1px solid #f3c4cb;
      font-size: 13px;
      line-height: 1.5;
    }

    .clothswap-field {
      margin-bottom: 21px;
    }

    .clothswap-field-label {
      display: block;
      margin-bottom: 8px;
      color: #3b3445;
      font-size: 13px;
      font-weight: 600;
    }

    .clothswap-input-wrapper {
      position: relative;
    }

    .clothswap-input {
      width: 100%;
      height: 56px;
      padding: 0 18px;
      border-radius: 16px;
      border: 1px solid #ded5e3;
      outline: none;
      background: rgba(255, 255, 255, 0.82);
      color: #302744;
      font-size: 15px;
      transition:
        border-color 0.2s ease,
        box-shadow 0.2s ease,
        background 0.2s ease,
        transform 0.2s ease;
    }

    .clothswap-input::placeholder {
      color: #aaa2af;
    }

    .clothswap-input:hover {
      background: #fff;
      border-color: #cdbbd7;
    }

    .clothswap-input:focus {
      background: #fff;
      border-color: #9d73b0;
      box-shadow:
        0 0 0 4px rgba(157, 115, 176, 0.12);
    }

    .clothswap-password-input {
      padding-right: 55px;
    }

    .clothswap-password-toggle {
      position: absolute;
      top: 50%;
      right: 14px;
      transform: translateY(-50%);
      width: 36px;
      height: 36px;
      border: none;
      border-radius: 10px;
      background: transparent;
      color: #81778a;
      cursor: pointer;
      font-size: 17px;
      transition:
        background 0.2s ease,
        color 0.2s ease;
    }

    .clothswap-password-toggle:hover {
      background: #f1e8f4;
      color: #714987;
    }

    .clothswap-submit {
      width: 100%;
      height: 56px;
      margin-top: 4px;
      border: none;
      border-radius: 16px;
      background:
        linear-gradient(
          135deg,
          #a978b8 0%,
          #815095 100%
        );
      color: #fff;
      font-size: 15px;
      font-weight: 700;
      letter-spacing: 0.2px;
      cursor: pointer;
      box-shadow:
        0 12px 25px rgba(128, 79, 149, 0.24);
      transition:
        transform 0.2s ease,
        box-shadow 0.2s ease,
        filter 0.2s ease;
    }

    .clothswap-submit:hover {
      transform: translateY(-2px);
      box-shadow:
        0 16px 30px rgba(128, 79, 149, 0.30);
      filter: brightness(1.03);
    }

    .clothswap-submit:active {
      transform: translateY(0);
    }

    .clothswap-divider {
      display: flex;
      align-items: center;
      gap: 14px;
      margin: 30px 0 24px;
      color: #aaa1ad;
      font-size: 11px;
      letter-spacing: 1px;
    }

    .clothswap-divider span {
      flex: 1;
      height: 1px;
      background: #e6dfe9;
    }

    .clothswap-register-text {
      margin: 0;
      text-align: center;
      color: #77707d;
      font-size: 14px;
    }

    .clothswap-register-link {
      margin-left: 5px;
      color: #87559b;
      font-weight: 700;
      text-decoration: none;
      transition: color 0.2s ease;
    }

    .clothswap-register-link:hover {
      color: #623875;
      text-decoration: underline;
    }

    @media (max-width: 1050px) {
      .clothswap-login-page {
        padding: 20px;
      }

      .clothswap-login-container {
        min-height: 650px;
        grid-template-columns: 0.9fr 1.1fr;
      }

      .clothswap-login-visual {
        min-height: 650px;
      }

      .clothswap-visual-overlay {
        padding: 30px;
      }

      .clothswap-brand-name {
        font-size: 26px;
      }

      .clothswap-visual-content h2 {
        font-size: 48px;
      }

      .clothswap-login-form-area {
        padding: 35px;
      }

      .clothswap-login-card {
        padding: 38px 32px;
      }
    }

    @media (max-width: 780px) {
      .clothswap-login-page {
        min-height: 100vh;
        padding: 0;
        align-items: stretch;
      }

      .clothswap-login-container {
        min-height: 100vh;
        grid-template-columns: 1fr;
        border-radius: 0;
        border: none;
      }

      .clothswap-login-visual {
        min-height: 390px;
        height: 390px;
      }

      .clothswap-visual-overlay {
        padding: 25px;
      }

      .clothswap-brand-name {
        font-size: 25px;
      }

      .clothswap-brand-tagline {
        display: none;
      }

      .clothswap-visual-content {
        padding-bottom: 0;
      }

      .clothswap-visual-content h2 {
        font-size: 42px;
        max-width: 330px;
      }

      .clothswap-visual-content p {
        font-size: 14px;
        max-width: 310px;
      }

      .clothswap-feature-list {
        display: none;
      }

      .clothswap-login-form-area {
        min-height: 610px;
        padding: 25px 18px 40px;
      }

      .clothswap-login-card {
        max-width: 560px;
        padding: 34px 25px;
        border-radius: 26px;
      }
    }

    @media (max-width: 480px) {
      .clothswap-login-visual {
        min-height: 320px;
        height: 320px;
      }

      .clothswap-visual-overlay {
        padding: 20px;
      }

      .clothswap-brand-icon {
        width: 38px;
        height: 38px;
        font-size: 18px;
      }

      .clothswap-brand-name {
        font-size: 22px;
      }

      .clothswap-visual-content h2 {
        font-size: 36px;
        letter-spacing: -1px;
        margin-bottom: 10px;
      }

      .clothswap-visual-content p {
        font-size: 13px;
        line-height: 1.5;
      }

      .clothswap-login-form-area {
        padding: 18px 14px 30px;
      }

      .clothswap-login-card {
        padding: 30px 20px;
        border-radius: 22px;
      }

      .clothswap-login-card h1 {
        font-size: 35px;
      }

      .clothswap-login-subtitle {
        margin-bottom: 25px;
      }

      .clothswap-input {
        height: 53px;
      }

      .clothswap-submit {
        height: 54px;
      }
    }
  `;

  return React.createElement(
    "div",
    {
      className: "clothswap-login-page"
    },

    React.createElement(
      "style",
      null,
      styles
    ),

    React.createElement(
      "div",
      {
        className: "clothswap-login-container"
      },

      React.createElement(
        "div",
        {
          className: "clothswap-login-visual"
        },

        React.createElement("img", {
          src: "/login-fashion.jpg",
          alt: "ClothSwap fashion"
        }),

        React.createElement(
          "div",
          {
            className: "clothswap-visual-overlay"
          },

          React.createElement(
            "div",
            {
              className: "clothswap-brand"
            },

            React.createElement(
              "div",
              {
                className: "clothswap-brand-icon"
              },
              React.createElement("i", {
                className: "bi bi-arrow-repeat"
              })
            ),

            React.createElement(
              "div",
              null,

              React.createElement(
                "div",
                {
                  className: "clothswap-brand-name"
                },
                "ClothSwap"
              ),

              React.createElement(
                "div",
                {
                  className: "clothswap-brand-tagline"
                },
                "Exchange · Rewear · Make a Difference"
              )
            )
          ),

          React.createElement(
            "div",
            {
              className: "clothswap-visual-content"
            },

            React.createElement(
              "h2",
              null,
              "Swap more.",
              React.createElement("br"),
              React.createElement(
                "span",
                null,
                "Waste less."
              )
            ),

            React.createElement(
              "p",
              null,
              "Give your pre-loved clothes a new home and be part of a more sustainable fashion journey."
            ),

            React.createElement(
              "div",
              {
                className: "clothswap-feature-list"
              },

              React.createElement(
                "div",
                {
                  className: "clothswap-feature"
                },

                React.createElement(
                  "div",
                  {
                    className: "clothswap-feature-icon"
                  },
                  React.createElement("i", {
                    className: "bi bi-leaf"
                  })
                ),

                "Sustainable Fashion"
              ),

              React.createElement(
                "div",
                {
                  className: "clothswap-feature"
                },

                React.createElement(
                  "div",
                  {
                    className: "clothswap-feature-icon"
                  },
                  React.createElement("i", {
                    className: "bi bi-arrow-repeat"
                  })
                ),

                "Reduce Textile Waste"
              ),

              React.createElement(
                "div",
                {
                  className: "clothswap-feature"
                },

                React.createElement(
                  "div",
                  {
                    className: "clothswap-feature-icon"
                  },
                  React.createElement("i", {
                    className: "bi bi-heart"
                  })
                ),

                "Build a Community"
              )
            )
          )
        )
      ),

      React.createElement(
        "div",
        {
          className: "clothswap-login-form-area"
        },

        React.createElement(
          "div",
          {
            className: "clothswap-login-card"
          },

          React.createElement(
  "div",
  {
    className: "clothswap-welcome-label"
  },
  "WELCOME TO CLOTHSWAP"
),

React.createElement(
  "h1",
  null,
  "Welcome Back!"
),

          React.createElement(
            "p",
            {
              className: "clothswap-login-subtitle"
            },
            "Continue your sustainable fashion journey."
          ),

          error
            ? React.createElement(
                "div",
                {
                  className: "clothswap-alert"
                },
                error
              )
            : null,

          React.createElement(
            "form",
            {
  onSubmit: handleLogin,
  autoComplete: "off"
},

            React.createElement(
              "div",
              {
                className: "clothswap-field"
              },

              React.createElement(
                "label",
                {
                  className:
                    "clothswap-field-label"
                },
                "Username"
              ),

             React.createElement("input", {
  type: "text",
  name: "clothswap-login-username",
  autoComplete: "new-password",
  readOnly: true,
  onFocus: function (event) {
    event.target.removeAttribute("readonly");
  },
  className: "clothswap-input",
  placeholder: "Enter your username",
  value: username,
  onChange: function (event) {
    setUsername(event.target.value);
  }
})
            ),

            React.createElement(
              "div",
              {
                className: "clothswap-field"
              },

              React.createElement(
                "label",
                {
                  className:
                    "clothswap-field-label"
                },
                "Email address"
              ),

             React.createElement("input", {
  type: "email",
  name: "clothswap-login-email",
  autoComplete: "new-password",
  readOnly: true,
  onFocus: function (event) {
    event.target.removeAttribute("readonly");
  },
  className: "clothswap-input",
  placeholder: "you@example.com",
  value: email,
  onChange: function (event) {
    setEmail(event.target.value);
  }
})
            ),

            React.createElement(
              "div",
              {
                className: "clothswap-field"
              },

              React.createElement(
                "label",
                {
                  className:
                    "clothswap-field-label"
                },
                "Password"
              ),

              React.createElement(
                "div",
                {
                  className:
                    "clothswap-input-wrapper"
                },

                React.createElement("input", {
                  type: showPassword
                    ? "text"
                    : "password",
                  autoComplete: "new-password",
                  className:
                    "clothswap-input clothswap-password-input",
                  placeholder:
                    "Enter your password",
                  value: password,
                  onChange: function (event) {
                    setPassword(
                      event.target.value
                    );
                  }
                }),

                React.createElement(
                  "button",
                  {
                    type: "button",
                    className:
                      "clothswap-password-toggle",
                    onClick: function () {
                      setShowPassword(
                        !showPassword
                      );
                    }
                  },

                  React.createElement("i", {
                    className: showPassword
                      ? "bi bi-eye-slash"
                      : "bi bi-eye"
                  })
                )
              )
            ),

            React.createElement(
              "button",
              {
                type: "submit",
                className:
                  "clothswap-submit"
              },

              "Sign In ",

              React.createElement("i", {
                className:
                  "bi bi-arrow-right"
              })
            )
          ),

          React.createElement(
            "div",
            {
              className:
                "clothswap-divider"
            },

            React.createElement("span", null),

            React.createElement(
              "small",
              null,
              "OR"
            ),

            React.createElement("span", null)
          ),

          React.createElement(
            "div",
            {
              className: "clothswap-google-area",
              ref: googleButtonRef
            }
          ),

          React.createElement(
            "p",
            {
              className:
                "clothswap-register-text"
            },

            "Don't have an account? ",

            React.createElement(
              Link,
              {
                to: "/register",
                className:
                  "clothswap-register-link"
              },
              "Create one"
            )
          )
        )
      )
    )
  );
}

export default Login;