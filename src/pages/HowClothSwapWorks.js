import React from "react";
import { useNavigate } from "react-router-dom";

function HowClothSwapWorks() {
  const navigate = useNavigate();

  function stepCard(number, icon, title, text) {
    return React.createElement(
      "div",
      {
        className: "clothswap-info-step"
      },

      React.createElement(
        "div",
        {
          className: "clothswap-info-step-number"
        },
        number
      ),

      React.createElement(
        "div",
        {
          className: "clothswap-info-step-icon"
        },
        icon
      ),

      React.createElement(
        "div",
        {
          className: "clothswap-info-step-content"
        },

        React.createElement(
          "h3",
          null,
          title
        ),

        React.createElement(
          "p",
          null,
          text
        )
      )
    );
  }

  return React.createElement(
    "div",
    {
      className: "clothswap-info-page"
    },

    React.createElement(
      "div",
      {
        className: "clothswap-info-container"
      },

      React.createElement(
        "button",
        {
          type: "button",
          className: "clothswap-info-back",
          onClick: function () {
            navigate("/settings");
          }
        },
        "← Back to Settings"
      ),

      React.createElement(
        "div",
        {
          className: "clothswap-info-hero"
        },

        React.createElement(
          "div",
          {
            className: "clothswap-info-hero-icon"
          },
          "♻️"
        ),

        React.createElement(
          "h1",
          null,
          "How ClothSwap Works"
        ),

        React.createElement(
          "p",
          null,
          "Exchange clothes with other people instead of buying new ones."
        )
      ),

      React.createElement(
        "div",
        {
          className: "clothswap-info-card"
        },

        stepCard(
          "01",
          "👕",
          "List Your Clothes",
          "Add clothes you no longer need by creating a listing with an image, title, description, category, size and other available details."
        ),

        stepCard(
          "02",
          "🔎",
          "Browse Clothes",
          "Explore clothing listings from other users and find items that you would like to exchange."
        ),

        stepCard(
          "03",
          "🔄",
          "Send a Swap Request",
          "Choose a clothing item and send a swap request to its owner with the item you would like to exchange."
        ),

        stepCard(
          "04",
          "💬",
          "Discuss the Swap",
          "Use the chat feature to communicate with the other user and discuss the exchange."
        ),

        stepCard(
          "05",
          "🤝",
          "Agree to the Swap",
          "Both users confirm that they agree to the exchange before the swap moves forward."
        ),

        stepCard(
          "06",
          "📦",
          "Courier & Tracking",
          "After the swap is accepted, the courier and tracking process can be used to move the exchanged clothing items."
        ),

        stepCard(
          "07",
          "🔐",
          "Delivery Confirmation",
          "The delivery process can be confirmed using the available verification and delivery steps."
        ),

        stepCard(
          "08",
          "🎉",
          "Swap Completed",
          "Once the exchange is successfully completed, the clothing swap is finished."
        )
      ),

      React.createElement(
        "div",
        {
          className: "clothswap-info-footer-card"
        },

        React.createElement(
          "span",
          null,
          "🌱"
        ),

        React.createElement(
          "div",
          null,

          React.createElement(
            "strong",
            null,
            "Why ClothSwap?"
          ),

          React.createElement(
            "p",
            null,
            "ClothSwap encourages reuse, reduces unnecessary clothing waste and gives users a simple way to exchange clothes with others."
          )
        )
      )
    )
  );
}

export default HowClothSwapWorks;