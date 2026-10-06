import React from "react";
import { useNavigate } from "react-router-dom";

function FAQ() {
  const navigate = useNavigate();

  const faqs = [
    {
      question: "What is ClothSwap?",
      answer:
        "ClothSwap is a clothing exchange marketplace where users can exchange clothes with other users instead of buying or selling them."
    },
    {
      question: "How can I list my clothes?",
      answer:
        "Login to your account and open List Your Clothes. Fill in the clothing details and submit your listing."
    },
    {
      question: "How does a clothing swap work?",
      answer:
        "You can browse available clothes, choose an item you like and send a swap request. The owner can accept or reject your request."
    },
    {
      question: "Can I cancel a swap request?",
      answer:
        "You can manage your swap requests from the Swap Requests section according to the current request status."
    },
    {
      question: "How does courier delivery work?",
      answer:
        "After a swap is accepted and both users confirm the exchange, the courier process can begin. Tracking and delivery confirmation are handled through the delivery flow."
    },
    {
      question: "How can I contact another user?",
      answer:
        "You can use the Chat feature to communicate with users involved in your swap."
    },
    {
      question: "Is ClothSwap available worldwide?",
      answer:
        "ClothSwap is designed for users to discover clothing listings and swap opportunities from different locations."
    },
    {
      question: "What should I do if I face a problem?",
      answer:
        "Open Settings → Help & Support → Report a Problem and submit the issue."
    }
  ];

  return React.createElement(
    "div",
    { className: "clothswap-info-page" },

    React.createElement(
      "div",
      { className: "clothswap-info-container" },

      React.createElement(
        "button",
        {
          className: "clothswap-info-back",
          onClick: function () {
            navigate("/settings");
          }
        },
        "← Back to Settings"
      ),

      React.createElement(
        "div",
        { className: "clothswap-info-hero" },

        React.createElement(
          "div",
          { className: "clothswap-info-hero-icon" },
          "❓"
        ),

        React.createElement(
          "div",
          null,

          React.createElement(
            "h1",
            null,
            "Frequently Asked Questions"
          ),

          React.createElement(
            "p",
            null,
            "Find answers to common questions about ClothSwap."
          )
        )
      ),

      React.createElement(
        "div",
        { className: "clothswap-faq-list" },

        faqs.map(function (faq, index) {
          return React.createElement(
            "div",
            {
              className: "clothswap-faq-card",
              key: index
            },

            React.createElement(
              "div",
              { className: "clothswap-faq-question" },

              React.createElement(
                "span",
                { className: "clothswap-faq-number" },
                String(index + 1).padStart(2, "0")
              ),

              React.createElement(
                "h3",
                null,
                faq.question
              )
            ),

            React.createElement(
              "p",
              { className: "clothswap-faq-answer" },
              faq.answer
            )
          );
        })
      )
    )
  );
}

export default FAQ;