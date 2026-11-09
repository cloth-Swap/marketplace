
import React, { useEffect, useState } from "react";
import API_URL, {apiFetch,refreshAccessToken} from "./api";
import {Routes,Route,Navigate,useLocation} from "react-router-dom";

import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import Sidebar from "./components/Sidebar";

import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import BrowseClothes from "./pages/BrowseClothes";
import ItemDetails from "./pages/ItemDetails";
import ListClothes from "./pages/ListClothes";
import SwapRequests from "./pages/SwapRequests";
import Chat from "./pages/Chat";
import Dashboard from "./pages/Dashboard";
import Wishlist from "./pages/Wishlist";
import AdminPanel from "./pages/AdminPanel";
import AdminDashboard from "./pages/AdminDashboard";
import LocationMatching from "./pages/LocationMatching";
import SwapCalculator from "./pages/SwapCalculator";
import CourierDelivery from "./pages/CourierDelivery";
import AIChat from "./pages/AIChat";
import Settings from "./pages/Settings";

import { registerNotifications } from "./notification";

import HowClothSwapWorks from "./pages/HowClothSwapWorks";
import FAQ from "./pages/FAQ";
import Notifications from "./pages/Notifications";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import TermsConditions from "./pages/TermsConditions";
import CommunityGuidelines from "./pages/CommunityGuidelines";
import LoginRequired from "./components/LoginRequired";

function App() {
  const location = useLocation();
    const [sessionReady, setSessionReady] = useState(false);
    const [termsAccepted, setTermsAccepted] = useState(false);
const [termsCheckReady, setTermsCheckReady] = useState(false);
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
  async function checkMandatoryTerms() {
    if (!sessionReady) {
      return;
    }

    const isLoggedIn =
      localStorage.getItem("clothswapLoggedIn") === "true";

    const currentPath = location.pathname;

    if (
      !isLoggedIn ||
      currentPath === "/login" ||
      currentPath === "/register" ||
      currentPath === "/terms-conditions"
    ) {
      setTermsCheckReady(true);
      return;
    }

    setTermsCheckReady(false);

    try {
      const response = await apiFetch(
        `${API_URL}/api/auth/terms-status`,
        {
          method: "GET"
        }
      );

      const data = await response.json();

      if (response.ok && data.success && data.accepted === true) {
        setTermsAccepted(true);
      } else {
        setTermsAccepted(false);
      }

    } catch (error) {
      console.error("Mandatory Terms Check Error:", error);
      setTermsAccepted(false);

    } finally {
      setTermsCheckReady(true);
    }
  }

  checkMandatoryTerms();

}, [sessionReady, location.pathname]);
  /* ================= AUTOMATIC BLOCK CHECK ================= */

  useEffect(function () {
    let isRedirecting = false;

    async function checkAccountStatus() {
      const isLoggedIn =
        localStorage.getItem("clothswapLoggedIn") === "true";

if (!sessionReady || !isLoggedIn || isRedirecting) {
  return;
}
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
      }
    }

    checkAccountStatus();

    const interval = setInterval(
      checkAccountStatus,
      2000
    );

    return function () {
      clearInterval(interval);
    };
}, [sessionReady]);
  // CEO Dashboard route check
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
  !termsCheckReady;

const mustBlockForTerms =
  sessionReady &&
  isLoggedIn &&
  !isTermsExempt &&
  termsCheckReady &&
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

  return React.createElement(
    React.Fragment,
    null,

    // Hide website Navbar on CEO Dashboard
    !isCEODashboard &&
      React.createElement(Navbar),

    // Main layout
    React.createElement(
      "div",
      {
        className: isCEODashboard
          ? "clothswap-page-layout clothswap-ceo-page-layout"
          : "clothswap-page-layout"
      },

      // Hide website Sidebar on CEO Dashboard
      !isCEODashboard &&
        React.createElement(Sidebar),

      // Page content
      React.createElement(
        "main",
        {
          className: isCEODashboard
            ? "clothswap-page-content clothswap-ceo-page-content"
            : "clothswap-page-content"
        },

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
    ),

    // Hide website Footer on CEO Dashboard
    !isCEODashboard &&
      React.createElement(Footer)
  );
}

export default App;
