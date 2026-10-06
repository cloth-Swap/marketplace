import React from "react";
import { Link } from "react-router-dom";

function Footer() {
  return React.createElement(
    "footer",
    {
      className: "footer-section mt-5"
    },

    React.createElement(
      "div",
      {
        className: "container py-5"
      },

      React.createElement(
        "div",
        {
          className: "row g-4"
        },

        React.createElement(
          "div",
          {
            className: "col-lg-4 col-md-6"
          },

         React.createElement(
  "h4",
  {
    className: "clothswap-footer-brand"
  },
  React.createElement(
    "span",
    {
      className: "clothswap-footer-logo-icon"
    },
    React.createElement("i", {
      className: "bi bi-arrow-left-right"
    })
  ),
  React.createElement(
    "span",
    {
      className: "clothswap-footer-brand-main"
    },
    "Cloth"
  ),
  React.createElement(
    "span",
    {
      className: "clothswap-footer-brand-accent"
    },
    "Swap"
  )
),

          React.createElement(
            "p",
            {
              className: "text-muted mt-3"
            },
            "Swap clothes. Save money. Reduce waste. Build a more sustainable fashion community."
          )
        ),

        React.createElement(
          "div",
          {
            className: "col-lg-2 col-md-6"
          },

          React.createElement(
            "h6",
            {
              className: "fw-bold"
            },
            "Marketplace"
          ),

          React.createElement(
            "ul",
            {
              className: "list-unstyled footer-links"
            },

            React.createElement(
              "li",
              null,
              React.createElement(
                Link,
                { to: "/browse" },
                "Browse Clothes"
              )
            ),

            React.createElement(
              "li",
              null,
              React.createElement(
                Link,
                { to: "/list-clothes" },
                "List Clothes"
              )
            ),

            React.createElement(
              "li",
              null,
              React.createElement(
                Link,
                { to: "/wishlist" },
                "Wishlist"
              )
            )
          )
        ),

        React.createElement(
          "div",
          {
            className: "col-lg-2 col-md-6"
          },

          React.createElement(
            "h6",
            {
              className: "fw-bold"
            },
            "Account"
          ),

          React.createElement(
            "ul",
            {
              className: "list-unstyled footer-links"
            },

            React.createElement(
              "li",
              null,
              React.createElement(
                Link,
                { to: "/login" },
                "Login"
              )
            ),

            React.createElement(
              "li",
              null,
              React.createElement(
                Link,
                { to: "/register" },
                "Register"
              )
            ),

            React.createElement(
              "li",
              null,
              React.createElement(
                Link,
                { to: "/dashboard" },
                "Dashboard"
              )
            )
          )
        ),

        React.createElement(
          "div",
          {
            className: "col-lg-4 col-md-6"
          },

          React.createElement(
            "h6",
            {
              className: "fw-bold"
            },
            "Follow the idea"
          ),

          React.createElement(
            "p",
            {
              className: "text-muted"
            },
            "Sustainable fashion starts with one swap."
          ),

          React.createElement(
            "div",
            {
              className: "social-icons"
            },

            React.createElement("i", {
              className: "bi bi-instagram"
            }),

            React.createElement("i", {
              className: "bi bi-facebook"
            }),

            React.createElement("i", {
              className: "bi bi-twitter-x"
            }),

            React.createElement("i", {
              className: "bi bi-linkedin"
            })
          )
        )
      )
    ),

    React.createElement(
      "div",
      {
        className: "footer-bottom"
      },

      React.createElement(
        "div",
        {
          className: "container text-center py-3"
        },

        React.createElement(
          "small",
          null,
          "© 2026 ClothSwap. All rights reserved."
        )
      )
    )
  );
}

export default Footer;