import React from "react";
import { Link } from "react-router-dom";

function PrivacyPolicy() {
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
          "🔐"
        ),

        React.createElement(
          "div",
          null,

          React.createElement(
            "h1",
            { style: styles.title },
            "Privacy Policy"
          ),

          React.createElement(
            "p",
            { style: styles.subtitle },
            "Learn how your information is handled on ClothSwap."
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
          "1. Information We Collect"
        ),

        React.createElement(
          "p",
          { style: styles.text },
          "ClothSwap may collect information such as your name, email address, profile information, clothing listings, swap requests, and other information you provide while using the platform."
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
          "2. How We Use Your Information"
        ),

        React.createElement(
          "p",
          { style: styles.text },
          "Your information is used to provide ClothSwap services, manage clothing listings, process swap requests, communicate with other users, and improve the platform."
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
          "Information and images that you choose to include in a clothing listing may be visible to other ClothSwap users so they can browse and request swaps."
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
          "4. Communication"
        ),

        React.createElement(
          "p",
          { style: styles.text },
          "Information required for a swap may be used to facilitate communication and coordination between the users involved in that swap."
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
          "5. Data Security"
        ),

        React.createElement(
          "p",
          { style: styles.text },
          "ClothSwap takes reasonable steps to protect user information from unauthorized access, alteration, or disclosure."
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
          "6. Your Choices"
        ),

        React.createElement(
          "p",
          { style: styles.text },
          "You can review and update information associated with your account through the available account and settings features."
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
          "7. Contact"
        ),

        React.createElement(
          "p",
          { style: styles.text },
          "If you have questions about this Privacy Policy, please contact the ClothSwap support team."
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

export default PrivacyPolicy;