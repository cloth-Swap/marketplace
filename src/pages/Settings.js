import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "../LanguageContext";

function Settings() {
  const navigate = useNavigate();

  const { language, changeLanguage, t } = useLanguage();

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

  function changeSettingsLanguage(value) {
    changeLanguage(value);
  }

  /* ================= LOGOUT ================= */

  function handleLogout() {
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

    localStorage.removeItem("clothswapLoggedIn");
    localStorage.removeItem("clothswapUserName");
    localStorage.removeItem("clothSwapUserName");
    localStorage.removeItem("clothswapEmail");
    localStorage.removeItem("clothswapUserEmail");

    navigate("/");
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

        React.createElement(
          "h3",
          null,
          title
        ),

        React.createElement(
          "p",
          null,
          description
        )
      )
    );
  }

  function navigationRow(
    icon,
    title,
    description,
    path
  ) {
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
          className:
            "clothswap-settings-action-icon"
        },
        icon
      ),

      React.createElement(
        "div",
        {
          className:
            "clothswap-settings-action-content"
        },

        React.createElement(
          "strong",
          null,
          title
        ),

        React.createElement(
          "p",
          null,
          description
        )
      ),

      React.createElement(
        "span",
        {
          className:
            "clothswap-settings-arrow"
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
        className:
          "clothswap-settings-header"
      },

      React.createElement(
        "div",
        {
          className:
            "clothswap-settings-icon"
        },
        "⚙️"
      ),

      React.createElement(
        "div",
        null,

        React.createElement(
          "h2",
          null,
          t("settingsTitle")
        ),

        React.createElement(
          "p",
          null,
          t("settingsSubtitle")
        )
      )
    ),

    /* PREFERENCES */

    React.createElement(
      "div",
      {
        className:
          "clothswap-settings-card"
      },

      sectionTitle(
        "⚙️",
        t("preferences"),
        t("preferencesDescription")
      ),

      divider(),

      React.createElement(
        "div",
        {
          className:
            "clothswap-setting-row"
        },

        React.createElement(
          "div",
          {
            className:
              "clothswap-setting-info"
          },

          React.createElement(
            "span",
            {
              className:
                "clothswap-setting-symbol"
            },
            "🔔"
          ),

          React.createElement(
            "div",
            null,

            React.createElement(
              "strong",
              null,
              t("notificationsTitle")
            ),

            React.createElement(
              "p",
              null,
              t("notificationsDescription")
            )
          )
        ),

        settingSwitch(
          notifications,
          changeNotifications
        )
      ),

      divider(),

      React.createElement(
        "div",
        {
          className:
            "clothswap-setting-row"
        },

        React.createElement(
          "div",
          {
            className:
              "clothswap-setting-info"
          },

          React.createElement(
            "span",
            {
              className:
                "clothswap-setting-symbol"
            },
            "📱"
          ),

          React.createElement(
            "div",
            null,

            React.createElement(
              "strong",
              null,
              t("compactMode")
            ),

            React.createElement(
              "p",
              null,
              t("compactModeDescription")
            )
          )
        ),

        settingSwitch(
          compactMode,
          changeCompactMode
        )
      ),

      divider(),

      React.createElement(
        "div",
        {
          className:
            "clothswap-setting-row"
        },

        React.createElement(
          "div",
          {
            className:
              "clothswap-setting-info"
          },

          React.createElement(
            "span",
            {
              className:
                "clothswap-setting-symbol"
            },
            "🌐"
          ),

          React.createElement(
            "div",
            null,

            React.createElement(
              "strong",
              null,
              t("languageTitle")
            ),

            React.createElement(
              "p",
              null,
              t("languageDescription")
            )
          )
        ),

        React.createElement(
          "select",
          {
            className:
              "clothswap-settings-select",

            value: language,

            onChange: function (event) {
              changeSettingsLanguage(
                event.target.value
              );
            }
          },

          React.createElement(
            "option",
            {
              value: "english"
            },
            "English"
          ),

          React.createElement(
            "option",
            {
              value: "hindi"
            },
            "Hindi"
          ),

          React.createElement(
            "option",
            {
              value: "gujarati"
            },
            "Gujarati"
          )
        )
      )
    ),

    /* COMMUNICATION */

    React.createElement(
      "div",
      {
        className:
          "clothswap-settings-card"
      },

      sectionTitle(
        "💬",
        t("communication"),
        t("communicationDescription")
      ),

      divider(),

      React.createElement(
        "div",
        {
          className:
            "clothswap-setting-row"
        },

        React.createElement(
          "div",
          {
            className:
              "clothswap-setting-info"
          },

          React.createElement(
            "span",
            {
              className:
                "clothswap-setting-symbol"
            },
            "💬"
          ),

          React.createElement(
            "div",
            null,

            React.createElement(
              "strong",
              null,
              t("chatNotifications")
            ),

            React.createElement(
              "p",
              null,
              t("chatNotificationsDescription")
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
          className:
            "clothswap-setting-row"
        },

        React.createElement(
          "div",
          {
            className:
              "clothswap-setting-info"
          },

          React.createElement(
            "span",
            {
              className:
                "clothswap-setting-symbol"
            },
            "🔄"
          ),

          React.createElement(
            "div",
            null,

            React.createElement(
              "strong",
              null,
              t("swapRequestNotifications")
            ),

            React.createElement(
              "p",
              null,
              t("swapRequestNotificationsDescription")
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
        className:
          "clothswap-settings-card"
      },

      sectionTitle(
        "❓",
        t("helpSupport"),
        t("helpSupportDescription")
      ),

      divider(),

      navigationRow(
        "📖",
        t("howClothSwapWorks"),
        t("howClothSwapWorksDescription"),
        "/how-clothswap-works"
      ),

      divider(),

      navigationRow(
        "❓",
        t("frequentlyAskedQuestions"),
        t("frequentlyAskedQuestionsDescription"),
        "/faq"
      ),

      divider(),

      navigationRow(
        "🐛",
        t("reportProblem"),
        t("reportProblemDescription"),
        "/report-problem"
      )
    ),

    /* LEGAL & PRIVACY */

    React.createElement(
      "div",
      {
        className:
          "clothswap-settings-card"
      },

      sectionTitle(
        "📄",
        t("legalPrivacy"),
        t("legalPrivacyDescription")
      ),

      divider(),

      navigationRow(
        "🔐",
        t("privacyPolicy"),
        t("privacyPolicyDescription"),
        "/privacy-policy"
      ),

      divider(),

      navigationRow(
        "📜",
        t("termsConditions"),
        t("termsConditionsDescription"),
        "/terms-conditions"
      ),

      divider(),

      navigationRow(
        "♻️",
        t("communityGuidelines"),
        t("communityGuidelinesDescription"),
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
            className:
              "clothswap-settings-action-icon"
          },
          "🚪"
        ),

        React.createElement(
          "div",
          {
            className:
              "clothswap-settings-action-content"
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
            className:
              "clothswap-settings-arrow"
          },
          "›"
        )
      )
    ),

    React.createElement(
      "div",
      {
        className:
          "clothswap-settings-note"
      },
      "💡 ",
      t("settingsSaved")
    )
  );
}

export default Settings;