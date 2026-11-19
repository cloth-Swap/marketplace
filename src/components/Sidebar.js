import React, { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";

function Sidebar() {
  const location = useLocation();

  const [isOpen, setIsOpen] = useState(true);

  const [darkTheme, setDarkTheme] = useState(
    localStorage.getItem("clothswapTheme") === "dark"
  );

  useEffect(function () {
    document.body.classList.toggle(
      "clothswap-dark-theme",
      darkTheme
    );

    localStorage.setItem(
      "clothswapTheme",
      darkTheme ? "dark" : "light"
    );
  }, [darkTheme]);

  const toggleTheme = function () {
    setDarkTheme(function (currentTheme) {
      return !currentTheme;
    });
  };

  const isMobile = window.innerWidth <= 767;

  React.useEffect(function () {
    if (window.innerWidth <= 767) {
      setIsOpen(false);
    }

    const handleResize = function () {
      if (window.innerWidth <= 767) {
        setIsOpen(false);
      } else {
        setIsOpen(true);
      }
    };

    window.addEventListener("resize", handleResize);

    return function () {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  const isActive = function (path) {
    return location.pathname === path;
  };

  const menuItem = function (icon, text, path) {
    return React.createElement(
      Link,
      {
        to: path,

        className:
          "clothswap-sidebar-link " +
          (isActive(path)
            ? "clothswap-sidebar-active"
            : ""),

        onClick: function () {
          if (window.innerWidth <= 767) {
            setIsOpen(false);
          }
        }
      },

      React.createElement(
        "span",
        {
          className: "clothswap-sidebar-icon"
        },
        icon
      ),

      isOpen &&
        React.createElement(
          "span",
          {
            className: "clothswap-sidebar-text"
          },
          text
        )
    );
  };

  return React.createElement(
    React.Fragment,
    null,

    /* MOBILE OPEN BUTTON */

    !isOpen &&
      isMobile &&
      React.createElement(
        "button",
        {
          className:
            "clothswap-sidebar-mobile-button",

          onClick: function () {
            setIsOpen(true);
          },

          type: "button",

          "aria-label": "Open sidebar"
        },
        "☰"
      ),

// SIDEBAR 
    React.createElement(
      "aside",
      {
        className:
          "clothswap-sidebar " +
          (isOpen
            ? "clothswap-sidebar-open"
            : "clothswap-sidebar-collapsed")
      },


      React.createElement(
        "div",
        {
          className: "clothswap-sidebar-title"
        },

        isOpen &&
          React.createElement(
            React.Fragment,
            null,

            React.createElement(
              "div",
              {
                className:
                  "clothswap-sidebar-logo"
              },
              "CS"
            ),

            React.createElement(
              "div",
              {
                className:
                  "clothswap-sidebar-title-text"
              },

              React.createElement(
                "strong",
                null,
                "ClothSwap"
              ),

              React.createElement(
                "small",
                null,
                "Quick Access"
              )
            )
          ),

        !isOpen &&
          React.createElement(
            "div",
            {
              className:
                "clothswap-sidebar-collapsed-logo"
            },
            "CS"
          ),


        React.createElement(
          "button",
          {
            type: "button",

            className:
              "clothswap-sidebar-toggle",

            onClick: function () {
              setIsOpen(!isOpen);
            },

            "aria-label": isOpen
              ? "Collapse sidebar"
              : "Open sidebar"
          },

          isOpen ? "‹" : "›"
        )
      ),


      React.createElement(
        "div",
        {
          className:
            "clothswap-sidebar-menu"
        },

        isOpen &&
          React.createElement(
            "p",
            {
              className:
                "clothswap-sidebar-heading"
            },
            "TOOLS"
          ),


        menuItem(
          "🤖",
          "AI Chat",
          "/ai-chat"
        ),


        menuItem(
          "⚙️",
          "Settings",
          "/settings"
        ),

        isOpen &&
          React.createElement(
            "p",
            {
              className:
                "clothswap-sidebar-heading clothswap-sidebar-heading-space"
            },
            "ACCOUNT"
          ),


        menuItem(
          "👤",
          "Dashboard",
          "/dashboard"
        ),
        menuItem(
  "👕",
  "My Listings",
  "/my-listings"
),

        // ADMIN PANEL - OWNER ONLY

        localStorage.getItem(
          "clothswapIsAdmin"
        ) === "true" &&
          menuItem(
            "🔐",
            "Admin Panel",
            "/admin"
          ),
localStorage.getItem("clothswapIsAdmin") === "true" &&
  menuItem(
    "📊",
    "CEO Dashboard",
    "/admin-dashboard"
  ),
        
      ),


      isOpen &&
        React.createElement(
          "div",
          {
            className:
              "clothswap-sidebar-bottom"
          },

          React.createElement(
            "div",
            {
              className:
                "clothswap-sidebar-help"
            },

            React.createElement(
              "span",
              {
                className:
                  "clothswap-sidebar-help-icon"
              },
              "♻️"
            ),

            React.createElement(
              "div",
              null,

              React.createElement(
                "strong",
                null,
                "Swap sustainably"
              ),

              React.createElement(
                "small",
                null,
                "Give clothes a second life."
              )
            )
          )
        )
    )
  );
}

export default Sidebar;