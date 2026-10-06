import React, { useEffect } from "react";
import { Routes, Route, Navigate } from "react-router-dom";

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
import LocationMatching from "./pages/LocationMatching";
import SwapCalculator from "./pages/SwapCalculator";
import CourierDelivery from "./pages/CourierDelivery";
import AIChat from "./pages/AIChat";
import Settings from "./pages/Settings";

import { registerNotifications } from "./notification";
import HowClothSwapWorks from "./pages/HowClothSwapWorks";
import FAQ from "./pages/FAQ";
import ReportProblem from "./pages/ReportProblem";
import Notifications from "./pages/Notifications";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import TermsConditions from "./pages/TermsConditions";
import CommunityGuidelines from "./pages/CommunityGuidelines";
import LoginRequired from "./components/LoginRequired";

function App() {
  /* =====================================================
     CLOTHSWAP PC NOTIFICATIONS
  ===================================================== */

  useEffect(function () {
    registerNotifications();
  }, []);
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

    const clickedElement =
      event.target.closest(
        "a, button, [role='button'], [onclick]"
      );

    if (!clickedElement) {
      return;
    }

    const href = clickedElement.getAttribute("href") || "";

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

    /* ================= NAVBAR ================= */

    React.createElement(Navbar),

    /* ================= MAIN LAYOUT ================= */

    React.createElement(
      "div",
      {
        className: "clothswap-page-layout"
      },

      /* ================= LEFT SIDEBAR ================= */

      React.createElement(Sidebar),

      /* ================= PAGE CONTENT ================= */

      React.createElement(
  "main",
  { className: "clothswap-page-content" },

  React.createElement(LoginRequired),

  React.createElement(
    Routes,
          null,

          React.createElement(Route, {
            path: "/",
            element: React.createElement(Home)
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

          React.createElement(
            Route,
            {
              path: "/admin",
              element:
                localStorage.getItem(
                  "clothswapIsAdmin"
                ) === "true"
                  ? React.createElement(AdminPanel)
                  : React.createElement(
                      Navigate,
                      {
                        to: "/dashboard"
                      }
                    )
            }
          ),

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
            element: React.createElement(
              PrivacyPolicy
            )
          }),

          React.createElement(Route, {
            path: "/terms-conditions",
            element: React.createElement(
              TermsConditions
            )
          }),

          React.createElement(Route, {
            path: "/community-guidelines",
            element: React.createElement(
              CommunityGuidelines
            )
          }),

          React.createElement(Route, {
            path: "/how-clothswap-works",
            element: React.createElement(
              HowClothSwapWorks
            )
          }),

          React.createElement(Route, {
            path: "/faq",
            element: React.createElement(FAQ)
          }),

          React.createElement(Route, {
            path: "/report-problem",
            element: React.createElement(
              ReportProblem
            )
          }),

         

          React.createElement(Route, {
            path: "*",
            element: React.createElement(
              "div",
              {
                className:
                  "container py-5 text-center"
              },

              React.createElement(
                "h1",
                null,
                "404"
              ),

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

    /* ================= FOOTER ================= */

    React.createElement(Footer)
  );
}

export default App;