import React, { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import API_URL, { apiFetch } from "../api";
function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();

  const [wishlistCount, setWishlistCount] = useState(0);
  const [notificationCount, setNotificationCount] = useState(0);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userName, setUserName] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);

  const searchPages = [
    {
      name: "Home",
      keywords: ["home", "main", "homepage"],
      path: "/"
    },
    {
      name: "Browse Clothes",
      keywords: [
        "browse",
        "browse clothes",
        "clothes",
        "clothing",
        "marketplace"
      ],
      path: "/browse"
    },
    {
      name: "List Your Clothes",
      keywords: [
        "list",
        "list clothes",
        "sell",
        "upload",
        "add clothes"
      ],
      path: "/list-clothes"
    },
    {
      name: "Swap Requests",
      keywords: [
        "swap",
        "swap requests",
        "requests"
      ],
      path: "/swap-requests"
    },
    {
      name: "Swap Calculator",
      keywords: [
        "calculator",
        "swap calculator",
        "value",
        "calculate"
      ],
      path: "/swap-calculator"
    },
    {
      name: "Nearby Swaps",
      keywords: [
        "nearby",
        "nearby swaps",
        "location",
        "location matching",
        "near me"
      ],
      path: "/location-matching"
    },
    {
      name: "Notifications",
      keywords: [
        "notification",
        "notifications",
        "alerts"
      ],
      path: "/notifications"
    },
    {
      name: "Wishlist",
      keywords: [
        "wishlist",
        "saved",
        "favorites",
        "favourite"
      ],
      path: "/wishlist"
    },
    {
      name: "Dashboard",
      keywords: [
        "dashboard",
        "profile",
        "account"
      ],
      path: "/dashboard"
    },
    {
      name: "Chat",
      keywords: [
        "chat",
        "messages",
        "message"
      ],
      path: "/chat"
    },
    {
      name: "Settings",
      keywords: [
        "settings",
        "setting",
        "preferences"
      ],
      path: "/settings"
    },
    {
      name: "Login",
      keywords: [
        "login",
        "log in",
        "sign in"
      ],
      path: "/login"
    },
    {
      name: "Register",
      keywords: [
        "register",
        "registration",
        "sign up",
        "signup",
        "create account"
      ],
      path: "/register"
    }
  ];

  const [searchText, setSearchText] = useState("");
  const [showSearchResults, setShowSearchResults] =
    useState(false);

  const searchValue =
    searchText.trim().toLowerCase();

  const searchResults =
    searchValue.length === 0
      ? searchPages.slice(0, 6)
      : searchPages.filter(function (page) {
          const searchableText = (
            page.name +
            " " +
            page.keywords.join(" ")
          ).toLowerCase();

          return searchableText.includes(searchValue);
        });

  function openSearchPage(path) {
    setSearchText("");
    setShowSearchResults(false);
    setMenuOpen(false);
    navigate(path);
  }

  function handleSearchSubmit(event) {
    event.preventDefault();

    if (searchResults.length > 0) {
      openSearchPage(searchResults[0].path);
      return;
    }

    setShowSearchResults(true);
  }

  function updateLoginStatus() {
    const loggedIn =
      localStorage.getItem("clothswapLoggedIn") ===
      "true";

    const savedName =
      localStorage.getItem("clothSwapUserName") ||
      localStorage.getItem("clothswapUserName") ||
      "";

    setIsLoggedIn(loggedIn);
    setUserName(savedName);
  }

  function updateWishlistCount() {
    const savedWishlist =
      localStorage.getItem("clothSwapWishlist");

    if (!savedWishlist) {
      setWishlistCount(0);
      return;
    }

    try {
      const wishlist = JSON.parse(savedWishlist);

      if (Array.isArray(wishlist)) {
        setWishlistCount(wishlist.length);
      } else {
        setWishlistCount(0);
      }
    } catch (error) {
      console.error(
        "Wishlist count error:",
        error
      );

      setWishlistCount(0);
    }
  }


  async function updateNotificationCount() {
    const email =
      localStorage.getItem("clothswapUserEmail") ||
      localStorage.getItem("clothswapEmail") ||
      "";

    if (!email) {
      setNotificationCount(0);
      return;
    }

    const notificationKey =
      "clothSwapNotifications_" +
      email.trim().toLowerCase();

    const notificationsEnabled =
      localStorage.getItem(notificationKey) !== "false";

    if (!notificationsEnabled) {
      setNotificationCount(0);
      return;
    }

    try {
     const response = await apiFetch(
  `${API_URL}/api/notifications/${encodeURIComponent(
    email
  )}`
);

      const data = await response.json();

      if (
        response.ok &&
        Array.isArray(data.notifications)
      ) {
        const unreadCount =
          data.notifications.filter(
            function (notification) {
              return notification.isRead === false;
            }
          ).length;

        setNotificationCount(unreadCount);
      } else {
        setNotificationCount(0);
      }
    } catch (error) {
      console.error(
        "Notification count error:",
        error
      );

      setNotificationCount(0);
    }
  }


  useEffect(function () {
    updateLoginStatus();
    updateWishlistCount();
    updateNotificationCount();

    const handleWishlistUpdate = function () {
      updateWishlistCount();
    };

    const handleStorageChange = function () {
      updateLoginStatus();
      updateWishlistCount();
      updateNotificationCount();
    };

    window.addEventListener(
      "wishlistUpdated",
      handleWishlistUpdate
    );

    window.addEventListener(
      "storage",
      handleStorageChange
    );

    return function () {
      window.removeEventListener(
        "wishlistUpdated",
        handleWishlistUpdate
      );

      window.removeEventListener(
        "storage",
        handleStorageChange
      );
    };
  }, []);


  useEffect(function () {
    function handleNotificationUpdate() {
      updateNotificationCount();
    }

    window.addEventListener(
      "notificationsUpdated",
      handleNotificationUpdate
    );

    return function () {
      window.removeEventListener(
        "notificationsUpdated",
        handleNotificationUpdate
      );
    };
  }, []);


  useEffect(
    function () {
      updateLoginStatus();
      updateNotificationCount();
      setMenuOpen(false);
      setShowSearchResults(false);
      setSearchText("");
    },
    [location.pathname]
  );


  function closeMenu() {
    setMenuOpen(false);
  }


  function navLink(path, text, extraClass) {
    return React.createElement(
      "li",
      {
        className: "nav-item",
        key: path
      },

      React.createElement(
        Link,
        {
          to: path,

          className:
            "nav-link " +
            (location.pathname === path
              ? "active "
              : "") +
            (extraClass || ""),

          onClick: closeMenu
        },

        text
      )
    );
  }

  return React.createElement(
    "nav",
    {
      className:
       "bg-white border-bottom sticky-top clothswap-navbar"
    },

    React.createElement(
      "div",
      {
        className: "container-fluid"
      },


      React.createElement(
        Link,
        {
          to: "/",
          className:
            "navbar-brand fw-bold clothswap-navbar-brand",
          onClick: closeMenu
        },

        React.createElement("i", {
          className:
            "bi bi-recycle me-2 clothswap-logo-icon"
        }),

        "Cloth",

        React.createElement(
          "span",
          null,
          "Swap"
        )
      ),
React.createElement(
  "button",
  {
    className:
      "navbar-toggler clothswap-mobile-toggler",

    type: "button",

    onClick: function () {
      setMenuOpen(!menuOpen);
    },

    "aria-controls": "mainNavbar",

    "aria-expanded":
      menuOpen ? "true" : "false",

    "aria-label":
      "Toggle navigation"
  },

  React.createElement("span", {
    className:
      "navbar-toggler-icon"
  })
),
      

      React.createElement(
        "div",
        {
          className:
            "collapse navbar-collapse " +
  (menuOpen ? "show" : ""),
          id: "mainNavbar"
        },

        React.createElement(
          "ul",
          {
            className:
              "navbar-nav ms-auto clothswap-main-nav"
          },

          navLink("/", "Home"),

          navLink(
            "/browse",
            "Browse Clothes"
          ),

          navLink(
            "/list-clothes",
            "List Your Clothes"
          ),

          navLink(
            "/swap-requests",
            "Swap Requests",
            "swap-requests-nav-link"
          ),

          navLink(
            "/swap-calculator",
            "Swap Calculator"
          ),

          navLink(
            "/location-matching",
            "Nearby Swaps"
          )
        ),

        React.createElement(
          "div",
          {
            className:
              "d-flex align-items-center gap-2 clothswap-user-area"
          },


          React.createElement(
            "div",
            {
              className:
                "clothswap-search-wrapper"
            },

            React.createElement(
              "form",
              {
                className:
                  "clothswap-search-form",

                onSubmit:
                  handleSearchSubmit
              },

              React.createElement("i", {
                className:
                  "bi bi-search clothswap-search-icon"
              }),

              React.createElement(
                "input",
                {
                  type: "text",

                  value: searchText,

                  onChange: function (event) {
                    const value =
                      event.target.value;

                    setSearchText(value);

                    if (
                      value.trim().length > 0
                    ) {
                      setShowSearchResults(true);
                    } else {
                      setShowSearchResults(false);
                    }
                  },

                  placeholder:
                    "Search ClothSwap...",

                  className:
                    "clothswap-search-input",

                  "aria-label":
                    "Search ClothSwap"
                }
              ),

              searchText &&
                React.createElement(
                  "button",
                  {
                    type: "button",

                    className:
                      "clothswap-search-clear",

                    onClick: function () {
                      setSearchText("");
                      setShowSearchResults(false);
                    },

                    "aria-label":
                      "Clear search"
                  },

                  React.createElement("i", {
                    className:
                      "bi bi-x"
                  })
                )
            ),

            showSearchResults &&
              React.createElement(
                "div",
                {
                  className:
                    "clothswap-search-results"
                },

                searchResults.length > 0
                  ? searchResults.map(
                      function (page) {
                        return React.createElement(
                          "button",
                          {
                            type: "button",

                            key: page.path,

                            className:
                              "clothswap-search-result",

                            onMouseDown:
                              function (event) {
                                event.preventDefault();

                                openSearchPage(
                                  page.path
                                );
                              }
                          },

                          React.createElement(
                            "span",
                            {
                              className:
                                "clothswap-search-result-icon"
                            },

                            React.createElement(
                              "i",
                              {
                                className:
                                  "bi bi-arrow-right-circle"
                              }
                            )
                          ),

                          React.createElement(
                            "span",
                            {
                              className:
                                "clothswap-search-result-name"
                            },

                            page.name
                          )
                        );
                      }
                    )
                  : React.createElement(
                      "div",
                      {
                        className:
                          "clothswap-search-empty"
                      },

                      React.createElement("i", {
                        className:
                          "bi bi-search"
                      }),

                      React.createElement(
                        "span",
                        null,
                        "No page found"
                      )
                    )
              )
          ),

          React.createElement(
            Link,
            {
              to: "/notifications",

              className:
                "clothswap-notification-icon " +
                (location.pathname ===
                "/notifications"
                  ? "active"
                  : ""),

              onClick: closeMenu,

              title: "Notifications",

              "aria-label":
                "Notifications"
            },

            React.createElement("i", {
              className:
                "bi bi-bell"
            }),

            notificationCount > 0 &&
              React.createElement(
                "span",
                {
                  className:
                    "notification-count-badge"
                },

                notificationCount
              )
          ),

          React.createElement(
            Link,
            {
              to: "/wishlist",

              className:
                "clothswap-wishlist-icon " +
                (location.pathname ===
                "/wishlist"
                  ? "active"
                  : ""),

              onClick: closeMenu,

              title: "Wishlist",

              "aria-label":
                "Wishlist"
            },

            React.createElement("i", {
              className:
                wishlistCount > 0
                  ? "bi bi-heart-fill"
                  : "bi bi-heart"
            }),

            wishlistCount > 0 &&
              React.createElement(
                "span",
                {
                  className:
                    "wishlist-count-badge"
                },

                wishlistCount
              )
          ),


          isLoggedIn
            ? React.createElement(
                React.Fragment,
                null,

               

                React.createElement(
                  "span",
                  {
                    className:
                      "rounded-circle d-flex align-items-center justify-content-center",

                    title: userName || "User",

                    "aria-label":
                      userName || "User",

                    style: {
                      width: "34px",
                      height: "34px",
                      fontSize: "14px",
                      fontWeight: "700",
                      flexShrink: 0,
                      background:
                        "linear-gradient(135deg, #f3a6c8, #c9a7e8)",
                      color: "#ffffff"
                    }
                  },

                  userName
                    ? userName
                        .charAt(0)
                        .toUpperCase()
                    : "U"
                )
              )

            : React.createElement(
                React.Fragment,
                null,

                React.createElement(
                  Link,
                  {
                    to: "/login",

                    className:
                      "btn btn-outline-dark",

                    onClick:
                      closeMenu
                  },

                  "Login"
                ),

                React.createElement(
                  Link,
                  {
                    to: "/register",

                    className:
                      "btn btn-dark",

                    onClick:
                      closeMenu
                  },

                  "Register"
                )
              )
        )
      )
    )
  );
}

export default Navbar;