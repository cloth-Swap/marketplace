
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import API_URL from "../api";

function Settings() {
  const navigate = useNavigate();

  const currentUserEmail =
    localStorage.getItem("clothswapUserEmail") ||
    localStorage.getItem("clothswapEmail") ||
    "";

  const notificationKey =
    "clothSwapNotifications_" +
    currentUserEmail.trim().toLowerCase();

  const [notifications, setNotifications] = useState(
    localStorage.getItem(notificationKey) !== "false"
  );

  const [compactMode, setCompactMode] = useState(
    localStorage.getItem("clothSwapCompactMode") === "true"
  );

  useEffect(function () {
    document.body.classList.toggle(
      "clothswap-compact-mode",
      compactMode
    );
  }, [compactMode]);

  const [chatNotifications, setChatNotifications] = useState(
    localStorage.getItem("clothSwapChatNotifications") !== "false"
  );

  const [swapNotifications, setSwapNotifications] = useState(
    localStorage.getItem("clothSwapSwapNotifications") !== "false"
  );

  function changeNotifications(value) {
    setNotifications(value);

    const currentUserEmail =
      localStorage.getItem("clothswapUserEmail") ||
      localStorage.getItem("clothswapEmail") ||
      "";

    const notificationKey =
      "clothSwapNotifications_" +
      currentUserEmail.trim().toLowerCase();

    localStorage.setItem(
      notificationKey,
      value ? "true" : "false"
    );
  }

  function changeCompactMode(value) {
    setCompactMode(value);

    localStorage.setItem(
      "clothSwapCompactMode",
      value ? "true" : "false"
    );
  }

  function changeChatNotifications(value) {
    setChatNotifications(value);

    localStorage.setItem(
      "clothSwapChatNotifications",
      value ? "true" : "false"
    );
  }

  function changeSwapNotifications(value) {
    setSwapNotifications(value);

    localStorage.setItem(
      "clothSwapSwapNotifications",
      value ? "true" : "false"
    );
  }

  /* ================= LOGOUT ================= */

  async function handleLogout() {
    const isLoggedIn =
      localStorage.getItem("clothswapLoggedIn") === "true";

    if (!isLoggedIn) {
      window.alert(
        "You are already logged out. Please login first."
      );
      return;
    }

    const confirmLogout = window.confirm(
      "Are you sure you want to logout from your ClothSwap account?"
    );

    if (!confirmLogout) {
      return;
    }

    try {
      await fetch(`${API_URL}/api/auth/logout`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json"
        }
      });

    } catch (error) {
      console.error("Logout Error:", error);

    } finally {
      localStorage.removeItem("clothswapToken");
      localStorage.removeItem("clothswapLoggedIn");
      localStorage.removeItem("clothswapIsAdmin");

      localStorage.removeItem("clothswapUserName");
      localStorage.removeItem("clothSwapUserName");
      localStorage.removeItem("clothswapEmail");
      localStorage.removeItem("clothswapUserEmail");

      navigate("/");
    }
  }

  function settingSwitch(checked, onChange) {
    return React.createElement(
      "label",
      {
        className: "clothswap-switch"
      },

      React.createElement("input", {
        type: "checkbox",
        checked: checked,
        onChange: function (event) {
          onChange(event.target.checked);
        }
      }),

      React.createElement("span", {
        className: "clothswap-slider"
      })
    );
  }

  function divider() {
    return React.createElement("div", {
      className: "clothswap-setting-divider"
    });
  }

  function sectionTitle(icon, title, description) {
    return React.createElement(
      "div",
      {
        className: "clothswap-settings-section-title"
      },

      React.createElement(
        "div",
        {
          className: "clothswap-settings-section-icon"
        },
        icon
      ),

      React.createElement(
        "div",
        null,

        React.createElement("h3", null, title),

        React.createElement("p", null, description)
      )
    );
  }

  function navigationRow(icon, title, description, path) {
    return React.createElement(
      "button",
      {
        type: "button",
        className: "clothswap-settings-action",

        onClick: function () {
          navigate(path);
        }
      },

      React.createElement(
        "span",
        {
          className: "clothswap-settings-action-icon"
        },
        icon
      ),

      React.createElement(
        "div",
        {
          className: "clothswap-settings-action-content"
        },

        React.createElement("strong", null, title),

        React.createElement("p", null, description)
      ),

      React.createElement(
        "span",
        {
          className: "clothswap-settings-arrow"
        },
        "›"
      )
    );
  }

  return React.createElement(
    "div",
    {
      className: "clothswap-settings-page"
    },

    /* PAGE HEADER */

    React.createElement(
      "div",
      {
        className: "clothswap-settings-header"
      },

      React.createElement(
        "div",
        {
          className: "clothswap-settings-icon"
        },
        "⚙️"
      ),

      React.createElement(
        "div",
        null,

        React.createElement("h2", null, "Settings"),

        React.createElement(
          "p",
          null,
          "Manage your ClothSwap account preferences."
        )
      )
    ),

    /* PREFERENCES */

    React.createElement(
      "div",
      {
        className: "clothswap-settings-card"
      },

      sectionTitle(
        "⚙️",
        "Preferences",
        "Manage your personal settings."
      ),

      divider(),

      React.createElement(
        "div",
        {
          className: "clothswap-setting-row"
        },

        React.createElement(
          "div",
          {
            className: "clothswap-setting-info"
          },

          React.createElement(
            "span",
            {
              className: "clothswap-setting-symbol"
            },
            "🔔"
          ),

          React.createElement(
            "div",
            null,

            React.createElement(
              "strong",
              null,
              "Notifications"
            ),

            React.createElement(
              "p",
              null,
              "Receive notifications about your account."
            )
          )
        ),

        settingSwitch(notifications, changeNotifications)
      ),

      divider(),

      React.createElement(
        "div",
        {
          className: "clothswap-setting-row"
        },

        React.createElement(
          "div",
          {
            className: "clothswap-setting-info"
          },

          React.createElement(
            "span",
            {
              className: "clothswap-setting-symbol"
            },
            "📱"
          ),

          React.createElement(
            "div",
            null,

            React.createElement(
              "strong",
              null,
              "Compact Mode"
            ),

            React.createElement(
              "p",
              null,
              "Use a more compact layout."
            )
          )
        ),

        settingSwitch(compactMode, changeCompactMode)
      )
    ),

    /* COMMUNICATION */

    React.createElement(
      "div",
      {
        className: "clothswap-settings-card"
      },

      sectionTitle(
        "💬",
        "Communication",
        "Manage your communication preferences."
      ),

      divider(),

      React.createElement(
        "div",
        {
          className: "clothswap-setting-row"
        },

        React.createElement(
          "div",
          {
            className: "clothswap-setting-info"
          },

          React.createElement(
            "span",
            {
              className: "clothswap-setting-symbol"
            },
            "💬"
          ),

          React.createElement(
            "div",
            null,

            React.createElement(
              "strong",
              null,
              "Chat Notifications"
            ),

            React.createElement(
              "p",
              null,
              "Receive notifications for new chat messages."
            )
          )
        ),

        settingSwitch(
          chatNotifications,
          changeChatNotifications
        )
      ),

      divider(),

      React.createElement(
        "div",
        {
          className: "clothswap-setting-row"
        },

        React.createElement(
          "div",
          {
            className: "clothswap-setting-info"
          },

          React.createElement(
            "span",
            {
              className: "clothswap-setting-symbol"
            },
            "🔄"
          ),

          React.createElement(
            "div",
            null,

            React.createElement(
              "strong",
              null,
              "Swap Request Notifications"
            ),

            React.createElement(
              "p",
              null,
              "Receive updates about your swap requests."
            )
          )
        ),

        settingSwitch(
          swapNotifications,
          changeSwapNotifications
        )
      )
    ),

    /* HELP & SUPPORT */

    React.createElement(
      "div",
      {
        className: "clothswap-settings-card"
      },

      sectionTitle(
        "❓",
        "Help & Support",
        "Get help and learn more about ClothSwap."
      ),

      divider(),

      navigationRow(
        "📖",
        "How ClothSwap Works",
        "Learn how to use ClothSwap.",
        "/how-clothswap-works"
      ),

      divider(),

      navigationRow(
        "❓",
        "Frequently Asked Questions",
        "Find answers to common questions.",
        "/faq"
      ),

      divider(),

      navigationRow(
        "🐛",
        "Report a Problem",
        "Let us know if you face any issues.",
        "/report-problem"
      )
    ),

    /* LEGAL & PRIVACY */

    React.createElement(
      "div",
      {
        className: "clothswap-settings-card"
      },

      sectionTitle(
        "📄",
        "Legal & Privacy",
        "Read our policies and community rules."
      ),

      divider(),

      navigationRow(
        "🔐",
        "Privacy Policy",
        "Learn how your information is protected.",
        "/privacy-policy"
      ),

      divider(),

      navigationRow(
        "📜",
        "Terms & Conditions",
        "Read the terms of using ClothSwap.",
        "/terms-conditions"
      ),

      divider(),

      navigationRow(
        "♻️",
        "Community Guidelines",
        "Learn about our community rules.",
        "/community-guidelines"
      )
    ),

    /* LOGOUT */

    React.createElement(
      "div",
      {
        className: "clothswap-settings-card"
      },

      React.createElement(
        "button",
        {
          type: "button",
          className: "clothswap-settings-action",

          onClick: handleLogout,

          style: {
            width: "100%",
            border: "none",
            background: "transparent",
            textAlign: "left"
          }
        },

        React.createElement(
          "span",
          {
            className: "clothswap-settings-action-icon"
          },
          "🚪"
        ),

        React.createElement(
          "div",
          {
            className: "clothswap-settings-action-content"
          },

          React.createElement(
            "strong",
            null,
            "Logout"
          ),

          React.createElement(
            "p",
            null,
            "Log out from your ClothSwap account."
          )
        ),

        React.createElement(
          "span",
          {
            className: "clothswap-settings-arrow"
          },
          "›"
        )
      )
    ),

    React.createElement(
      "div",
      {
        className: "clothswap-settings-note"
      },
      "💡 Your settings are saved automatically."
    )
  );
}

export default Settings;
