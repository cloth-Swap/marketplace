import React from "react";
import { Link } from "react-router-dom";

function TermsConditions() {
  const sectionStyle = {
    padding: "24px 26px",
    marginBottom: "16px",
    borderRadius: "20px",
    background: "rgba(255,255,255,0.48)",
    border: "1px solid rgba(255,255,255,0.75)",
    boxShadow: "0 8px 25px rgba(92,60,110,0.06)",
    transition: "transform 0.25s ease, box-shadow 0.25s ease",
    cursor: "default"
  };

  function handleMouseEnter(event) {
    event.currentTarget.style.transform =
      "translateY(-3px) scale(1.01)";

    event.currentTarget.style.boxShadow =
      "0 12px 30px rgba(108,52,131,0.15)";
  }

  function handleMouseLeave(event) {
    event.currentTarget.style.transform =
      "translateY(0) scale(1)";

    event.currentTarget.style.boxShadow =
      "0 8px 25px rgba(92,60,110,0.06)";
  }

  return React.createElement(
    "div",
    { style: styles.page },

    React.createElement(
      "div",
      { style: styles.container },

      React.createElement(
        Link,
        {
          to: "/settings",
          style: styles.back
        },
        "← Back to Settings"
      ),

      React.createElement(
        "div",
        { style: styles.headerCard },

        React.createElement(
          "div",
          { style: styles.iconBox },
          "📜"
        ),

        React.createElement(
          "div",
          null,

          React.createElement(
            "h1",
            { style: styles.title },
            "Terms & Conditions"
          ),

          React.createElement(
            "p",
            { style: styles.subtitle },
            "Please review the terms for using ClothSwap."
          )
        )
      ),

      React.createElement(
        "p",
        { style: styles.updated },
        "Last updated: September 2026"
      ),

      React.createElement(
        "section",
        {
          style: sectionStyle,
          onMouseEnter: handleMouseEnter,
          onMouseLeave: handleMouseLeave
        },

        React.createElement(
          "h2",
          { style: styles.heading },
          "1. Acceptance of Terms"
        ),

        React.createElement(
          "p",
          { style: styles.text },
          "By using ClothSwap, you agree to follow these Terms & Conditions and use the platform responsibly."
        )
      ),

      React.createElement(
        "section",
        {
          style: sectionStyle,
          onMouseEnter: handleMouseEnter,
          onMouseLeave: handleMouseLeave
        },

        React.createElement(
          "h2",
          { style: styles.heading },
          "2. User Accounts"
        ),

        React.createElement(
          "p",
          { style: styles.text },
          "Users are responsible for providing accurate information and keeping their account credentials secure."
        )
      ),

      React.createElement(
        "section",
        {
          style: sectionStyle,
          onMouseEnter: handleMouseEnter,
          onMouseLeave: handleMouseLeave
        },

        React.createElement(
          "h2",
          { style: styles.heading },
          "3. Clothing Listings"
        ),

        React.createElement(
          "p",
          { style: styles.text },
          "Users must provide accurate information about clothing items they list. Items should be suitable for exchange and should be described honestly."
        )
      ),

      React.createElement(
        "section",
        {
          style: sectionStyle,
          onMouseEnter: handleMouseEnter,
          onMouseLeave: handleMouseLeave
        },

        React.createElement(
          "h2",
          { style: styles.heading },
          "4. Swap Requests"
        ),

        React.createElement(
          "p",
          { style: styles.text },
          "Users may send and accept swap requests through ClothSwap. Users should communicate respectfully and agree on exchange details before completing a swap."
        )
      ),

      React.createElement(
        "section",
        {
          style: sectionStyle,
          onMouseEnter: handleMouseEnter,
          onMouseLeave: handleMouseLeave
        },

        React.createElement(
          "h2",
          { style: styles.heading },
          "5. Prohibited Activities"
        ),

        React.createElement(
          "p",
          { style: styles.text },
          "Users must not use ClothSwap for fraudulent activities, misleading listings, harassment, unauthorized access, or any activity that violates applicable laws."
        )
      ),

      React.createElement(
        "section",
        {
          style: sectionStyle,
          onMouseEnter: handleMouseEnter,
          onMouseLeave: handleMouseLeave
        },

        React.createElement(
          "h2",
          { style: styles.heading },
          "6. Account Restrictions"
        ),

        React.createElement(
          "p",
          { style: styles.text },
          "ClothSwap may restrict or suspend accounts that violate these terms or misuse the platform."
        )
      ),

      React.createElement(
        "section",
        {
          style: sectionStyle,
          onMouseEnter: handleMouseEnter,
          onMouseLeave: handleMouseLeave
        },

        React.createElement(
          "h2",
          { style: styles.heading },
          "7. Changes to These Terms"
        ),

        React.createElement(
          "p",
          { style: styles.text },
          "These Terms & Conditions may be updated when necessary. Continued use of ClothSwap after changes means that users accept the updated terms."
        )
      )
    )
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    padding: "55px 20px",
    background:
      "linear-gradient(135deg, #fde8f1 0%, #f6edf9 50%, #eadcf7 100%)",
    boxSizing: "border-box"
  },

  container: {
    maxWidth: "1000px",
    margin: "0 auto",
    padding: "28px",
    borderRadius: "30px",
    background: "rgba(255,255,255,0.42)",
    backdropFilter: "blur(20px)",
    WebkitBackdropFilter: "blur(20px)",
    border: "1px solid rgba(255,255,255,0.85)",
    boxShadow: "0 20px 60px rgba(92,60,110,0.12)"
  },

  back: {
    display: "inline-block",
    textDecoration: "none",
    color: "#6c3483",
    fontWeight: "700",
    background: "rgba(255,255,255,0.72)",
    padding: "13px 20px",
    borderRadius: "14px",
    marginBottom: "28px",
    boxShadow: "0 8px 25px rgba(92,60,110,0.08)"
  },

  headerCard: {
    display: "flex",
    alignItems: "center",
    gap: "18px",
    padding: "28px",
    borderRadius: "24px",
    background: "rgba(255,255,255,0.48)",
    border: "1px solid rgba(255,255,255,0.8)",
    marginBottom: "22px"
  },

  iconBox: {
    width: "62px",
    height: "62px",
    borderRadius: "18px",
    background:
      "linear-gradient(135deg, rgba(235,207,239,0.85), rgba(249,222,237,0.9))",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "28px",
    flexShrink: 0,
    border: "1px solid rgba(196,139,207,0.25)"
  },

  title: {
    margin: "0",
    color: "#302737",
    fontSize: "32px",
    fontWeight: "800"
  },

  subtitle: {
    margin: "6px 0 0",
    color: "#786d7e",
    fontSize: "16px"
  },

  updated: {
    color: "#806f85",
    fontSize: "14px",
    margin: "0 8px 22px"
  },

  heading: {
    margin: "0 0 12px",
    color: "#332b3a",
    fontSize: "20px",
    fontWeight: "750"
  },

  text: {
    margin: "0",
    color: "#766b7d",
    fontSize: "16px",
    lineHeight: "1.75"
  }
};

export default TermsConditions;