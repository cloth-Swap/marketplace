
import React, { useEffect, useState } from "react";
import API_URL, { apiFetch, refreshAccessToken } from "./api";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import Sidebar from "./components/Sidebar";
import LoginRequired from "./components/LoginRequired";
import { registerNotifications } from "./notification";

const CreateProfile = React.lazy(() => import("./pages/CreateProfile"));
const Home = React.lazy(() => import("./pages/Home"));
const Login = React.lazy(() => import("./pages/Login"));
const Register = React.lazy(() => import("./pages/Register"));
const BrowseClothes = React.lazy(() => import("./pages/BrowseClothes"));
const ItemDetails = React.lazy(() => import("./pages/ItemDetails"));
const ListClothes = React.lazy(() => import("./pages/ListClothes"));
const SwapRequests = React.lazy(() => import("./pages/SwapRequests"));
const Chat = React.lazy(() => import("./pages/Chat"));
const Dashboard = React.lazy(() => import("./pages/Dashboard"));
const Wishlist = React.lazy(() => import("./pages/Wishlist"));
const AdminPanel = React.lazy(() => import("./pages/AdminPanel"));
const AdminDashboard = React.lazy(() => import("./pages/AdminDashboard"));
const LocationMatching = React.lazy(() => import("./pages/LocationMatching"));
const SwapCalculator = React.lazy(() => import("./pages/SwapCalculator"));
const CourierDelivery = React.lazy(() => import("./pages/CourierDelivery"));
const AIChat = React.lazy(() => import("./pages/AIChat"));
const Settings = React.lazy(() => import("./pages/Settings"));
const HowClothSwapWorks = React.lazy(() => import("./pages/HowClothSwapWorks"));
const FAQ = React.lazy(() => import("./pages/FAQ"));
const Notifications = React.lazy(() => import("./pages/Notifications"));
const PrivacyPolicy = React.lazy(() => import("./pages/PrivacyPolicy"));
const TermsConditions = React.lazy(() => import("./pages/TermsConditions"));
const CommunityGuidelines = React.lazy(() => import("./pages/CommunityGuidelines"));
const MyListings = React.lazy(() => import("./pages/MyListings"));
const PublicProfile = React.lazy(() => import("./pages/PublicProfile"));
import { connectSocket, disconnectSocket } from "./socket";

function App() {
  const location = useLocation();

  const [sessionReady, setSessionReady] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [termsCheckReady, setTermsCheckReady] = useState(false);
  const [termsCheckedEmail, setTermsCheckedEmail] = useState("");
  const [termsCheckedPath, setTermsCheckedPath] = useState("");
  const [termsCheckedAt, setTermsCheckedAt] = useState(0);

  /* ================= AUTO SESSION RESTORE ================= */

  useEffect(function () {
    async function restoreSession() {
      const isLoggedIn =
        localStorage.getItem("clothswapLoggedIn") === "true";

      if (!isLoggedIn) {
        setSessionReady(true);
        return;
      }

      try {
        const newToken = await refreshAccessToken();

        if (newToken) {
          console.log("ClothSwap session restored successfully.");
        } else {
          console.log("Session could not be restored.");
        }
      } catch (error) {
        console.error("Session Restore Error:", error);
      } finally {
        setSessionReady(true);
      }
    }

    restoreSession();
  }, []);

  /* ================= MANDATORY TERMS PROTECTION ================= */

  useEffect(function () {
    let cancelled = false;

    async function checkMandatoryTerms() {
      if (!sessionReady) {
        return;
      }

      const isLoggedIn =
        localStorage.getItem("clothswapLoggedIn") === "true";

      const currentPath = location.pathname;

      if (!isLoggedIn) {
        setTermsAccepted(false);
        setTermsCheckedEmail("");
        setTermsCheckedAt(0);
        setTermsCheckedPath(currentPath);
        setTermsCheckReady(true);
        return;
      }

      if (
        currentPath === "/login" ||
        currentPath === "/register" ||
        currentPath === "/terms-conditions"
      ) {
        setTermsCheckReady(true);
        setTermsCheckedPath(currentPath);
        return;
      }

      const currentEmail =
        localStorage.getItem("clothswapUserEmail") ||
        localStorage.getItem("clothswapEmail") ||
        "";

      const cacheIsValid =
        termsAccepted &&
        currentEmail === termsCheckedEmail &&
        Date.now() - termsCheckedAt < 5 * 60 * 1000;

      if (cacheIsValid) {
        setTermsCheckedPath(currentPath);
        setTermsCheckReady(true);
        return;
      }

      setTermsCheckReady(false);
      setTermsAccepted(false);

      try {
        const response = await apiFetch(
          `${API_URL}/api/auth/terms-status`,
          {
            method: "GET"
          }
        );

        const data = await response.json();

        if (cancelled) return;

        if (response.ok && data.success && data.accepted === true) {
          setTermsAccepted(true);
          setTermsCheckedEmail(currentEmail);
          setTermsCheckedAt(Date.now());
        } else {
          setTermsAccepted(false);
          setTermsCheckedEmail("");
          setTermsCheckedAt(0);
        }

      } catch (error) {
        if (cancelled) return;

        console.error("Mandatory Terms Check Error:", error);
        setTermsAccepted(false);
        setTermsCheckedEmail("");
        setTermsCheckedAt(0);

      } finally {
        if (!cancelled) {
          setTermsCheckedPath(currentPath);
          setTermsCheckReady(true);
        }
      }
    }

    checkMandatoryTerms();

    return function () {
      cancelled = true;
    };

  }, [sessionReady, location.pathname]);

  /* ================= AUTOMATIC BLOCK CHECK ================= */

  useEffect(function () {
    let isRedirecting = false;
    let isChecking = false;

    async function checkAccountStatus() {
      const isLoggedIn =
        localStorage.getItem("clothswapLoggedIn") === "true";

      if (
        !sessionReady ||
        !isLoggedIn ||
        isRedirecting ||
        isChecking
      ) {
        return;
      }

      isChecking = true;

      try {
        const response = await apiFetch(
          `${API_URL}/api/auth/status`,
          {
            method: "GET"
          }
        );

        if (response.status === 403) {
          const data = await response.json();

          if (
            data.message === "Your account has been blocked." ||
            data.message === "Your account has been blocked"
          ) {
            isRedirecting = true;

            localStorage.removeItem("clothswapToken");
            localStorage.removeItem("clothswapLoggedIn");
            localStorage.removeItem("clothswapIsAdmin");

            window.alert("Your account has been blocked.");

            window.location.href = "/login";
          }
        }

      } catch (error) {
        console.error("Account Status Check Error:", error);

      } finally {
        isChecking = false;
      }
    }

    checkAccountStatus();

    function handleVisibilityChange() {
      if (document.visibilityState === "visible") {
        checkAccountStatus();
      }
    }

    function handleWindowFocus() {
      checkAccountStatus();
    }

    document.addEventListener(
      "visibilitychange",
      handleVisibilityChange
    );

    window.addEventListener(
      "focus",
      handleWindowFocus
    );

    const interval = setInterval(
      checkAccountStatus,
      60000
    );

    return function () {
      clearInterval(interval);

      document.removeEventListener(
        "visibilitychange",
        handleVisibilityChange
      );

      window.removeEventListener(
        "focus",
        handleWindowFocus
      );
    };

  }, [sessionReady]);
  /* ================= GLOBAL SOCKET CONNECTION ================= */

useEffect(function () {
  if (!sessionReady) {
    return;
  }

  const isLoggedIn =
    localStorage.getItem("clothswapLoggedIn") === "true";

  const token =
    localStorage.getItem("clothswapToken");

  if (isLoggedIn && token) {
    connectSocket();
  } else {
    disconnectSocket();
  }

  return function () {
    disconnectSocket();
  };

}, [sessionReady]);

  /* ================= ROUTE CHECKS ================= */

  const isCEODashboard =
    location.pathname === "/admin-dashboard";

  const isLoggedIn =
    localStorage.getItem("clothswapLoggedIn") === "true";

  const isTermsExempt =
    location.pathname === "/login" ||
    location.pathname === "/register" ||
    location.pathname === "/terms-conditions";

  const shouldWaitForTerms =
    sessionReady &&
    isLoggedIn &&
    !isTermsExempt &&
    (!termsCheckReady ||
      termsCheckedPath !== location.pathname);

  const mustBlockForTerms =
    sessionReady &&
    isLoggedIn &&
    !isTermsExempt &&
    termsCheckReady &&
    termsCheckedPath === location.pathname &&
    !termsAccepted;

  /* ================= PC NOTIFICATIONS ================= */

  useEffect(function () {
    registerNotifications();
  }, []);

  /* ================= LOGIN PROTECTION ================= */

  useEffect(function () {
    function handleProtectedClick(event) {
      const isLoggedIn =
        localStorage.getItem("clothswapLoggedIn") === "true";

      if (isLoggedIn) {
        return;
      }

      const currentPath = window.location.pathname;

     if (
  currentPath === "/" ||
  currentPath === "/login" ||
  currentPath === "/register"
) {
  return;
}

      const clickedElement = event.target.closest(
        "a, button, [role='button'], [onclick]"
      );

      if (!clickedElement) {
        return;
      }

      const href =
        clickedElement.getAttribute("href") || "";

      if (
        href === "/login" ||
        href === "/register"
      ) {
        return;
      }

      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();

      window.alert(
        "Please login first to use ClothSwap."
      );

      window.location.href = "/login";
    }

    document.addEventListener(
      "click",
      handleProtectedClick,
      true
    );

    return function () {
      document.removeEventListener(
        "click",
        handleProtectedClick,
        true
      );
    };
  }, []);

  /* ================= MAIN LAYOUT ================= */

  return React.createElement(
    React.Fragment,
    null,

    !isCEODashboard &&
      React.createElement(Navbar),

    React.createElement(
      "div",
      {
        className: isCEODashboard
          ? "clothswap-page-layout clothswap-ceo-page-layout"
          : "clothswap-page-layout"
      },

      !isCEODashboard &&
        React.createElement(Sidebar),

      React.createElement(
        "main",
        {
          className: isCEODashboard
            ? "clothswap-page-content clothswap-ceo-page-content"
            : "clothswap-page-content"
        },

        location.pathname !== "/login" &&
location.pathname !== "/register" &&
React.createElement(LoginRequired),

        shouldWaitForTerms
          ? React.createElement(
              "div",
              {
                className: "container py-5 text-center"
              },
              "Checking Terms & Conditions..."
            )
          : mustBlockForTerms
            ? React.createElement(Navigate, {
                to: "/terms-conditions",
                replace: true,
                state: {
                  requireAcceptance: true,
                  returnTo: location.pathname
                }
              })
            : React.createElement(
                React.Suspense,
                {
                  fallback: React.createElement(
                    "div",
                    {
                      className: "container py-5 text-center"
                    },
                    "Loading page..."
                  )
                },

                React.createElement(
                  Routes,
                  null,

                  React.createElement(Route, {
                    path: "/",
                    element: !sessionReady
                      ? React.createElement(
                          "div",
                          {
                            className: "container py-5 text-center"
                          },
                          "Please wait..."
                        )
                      : localStorage.getItem("clothswapLoggedIn") === "true"
                        ? React.createElement(Home)
                        : React.createElement(Register)
                  }),

                  React.createElement(Route, {
                    path: "/login",
                    element: React.createElement(Login)
                  }),

                  React.createElement(Route, {
                    path: "/register",
                    element: React.createElement(Register)
                  }),

                  React.createElement(Route, {
                    path: "/swap-calculator",
                    element: React.createElement(SwapCalculator)
                  }),

                  React.createElement(Route, {
                    path: "/location-matching",
                    element: React.createElement(LocationMatching)
                  }),

                  React.createElement(Route, {
                    path: "/courier-delivery",
                    element: React.createElement(CourierDelivery)
                  }),

                  React.createElement(Route, {
                    path: "/browse",
                    element: React.createElement(BrowseClothes)
                  }),

                  React.createElement(Route, {
                    path: "/item/:id",
                    element: React.createElement(ItemDetails)
                  }),

                  React.createElement(Route, {
                    path: "/profile/:id",
                    element: React.createElement(PublicProfile)
                  }),

                  React.createElement(Route, {
                    path: "/list-clothes",
                    element: React.createElement(ListClothes)
                  }),

                  React.createElement(Route, {
                    path: "/swap-requests",
                    element: React.createElement(SwapRequests)
                  }),

                  React.createElement(Route, {
                    path: "/chat",
                    element: React.createElement(Chat)
                  }),

                  React.createElement(Route, {
                    path: "/dashboard",
                    element: React.createElement(Dashboard)
                  }),

                  React.createElement(Route, {
                    path: "/my-listings",
                    element: React.createElement(MyListings)
                  }),

                  React.createElement(Route, {
                    path: "/notifications",
                    element: React.createElement(Notifications)
                  }),

                  React.createElement(Route, {
                    path: "/wishlist",
                    element: React.createElement(Wishlist)
                  }),

                  React.createElement(Route, {
                    path: "/admin",
                    element:
                      localStorage.getItem("clothswapIsAdmin") === "true"
                        ? React.createElement(AdminPanel)
                        : React.createElement(Navigate, {
                            to: "/dashboard"
                          })
                  }),

                  React.createElement(Route, {
                    path: "/admin-dashboard",
                    element:
                      localStorage.getItem("clothswapLoggedIn") === "true" &&
                      localStorage.getItem("clothswapIsAdmin") === "true"
                        ? React.createElement(AdminDashboard)
                        : React.createElement(Navigate, {
                            to: "/"
                          })
                  }),

                  React.createElement(Route, {
                    path: "/ai-chat",
                    element: React.createElement(AIChat)
                  }),

                  React.createElement(Route, {
                    path: "/settings",
                    element: React.createElement(Settings)
                  }),

                  React.createElement(Route, {
                    path: "/privacy-policy",
                    element: React.createElement(PrivacyPolicy)
                  }),

                  React.createElement(Route, {
                    path: "/terms-conditions",
                    element: React.createElement(TermsConditions)
                  }),

                  React.createElement(Route, {
                    path: "/create-profile",
                    element: React.createElement(CreateProfile)
                  }),

                  React.createElement(Route, {
                    path: "/community-guidelines",
                    element: React.createElement(CommunityGuidelines)
                  }),

                  React.createElement(Route, {
                    path: "/how-clothswap-works",
                    element: React.createElement(HowClothSwapWorks)
                  }),

                  React.createElement(Route, {
                    path: "/faq",
                    element: React.createElement(FAQ)
                  }),

                  React.createElement(Route, {
                    path: "*",
                    element: React.createElement(
                      "div",
                      {
                        className: "container py-5 text-center"
                      },
                      React.createElement("h1", null, "404"),
                      React.createElement(
                        "p",
                        null,
                        "Page not found."
                      )
                    )
                  })

                )
              )
      )
    ),

    !isCEODashboard &&
      React.createElement(Footer)
  );
}

export default App;
