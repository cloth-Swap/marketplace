import React, { useState } from "react";
import { Link } from "react-router-dom";

function SwapCalculator() {
  const categoryValues = {
    Dresses: 350,
    Tops: 220,
    Jeans: 400,
    Jackets: 500,
    Accessories: 180
  };

  const brandMultiplier = {
    Zara: 1.15,
    "H&M": 1.0,
    "Levi's": 1.25,
    Mango: 1.1,
    Uniqlo: 1.15,
    Other: 0.9
  };

  const conditionMultiplier = {
    "Like New": 1.0,
    Excellent: 0.85,
    Good: 0.65
  };

  const [yourCategory, setYourCategory] = useState("Dresses");
  const [yourBrand, setYourBrand] = useState("Zara");
  const [yourCondition, setYourCondition] = useState("Like New");

  const [otherCategory, setOtherCategory] = useState("Jeans");
  const [otherBrand, setOtherBrand] = useState("Levi's");
  const [otherCondition, setOtherCondition] = useState("Excellent");

  const [comparison, setComparison] = useState(null);

  function calculateItemValue(category, brand, condition) {
    const baseValue = categoryValues[category] || 200;
    const brandFactor = brandMultiplier[brand] || 0.9;
    const conditionFactor = conditionMultiplier[condition] || 0.65;

    return Math.round(
      baseValue * brandFactor * conditionFactor
    );
  }

  function compareValues() {
    const yourValue = calculateItemValue(
      yourCategory,
      yourBrand,
      yourCondition
    );

    const otherValue = calculateItemValue(
      otherCategory,
      otherBrand,
      otherCondition
    );

    const difference = Math.abs(yourValue - otherValue);

    let status = "";
    let statusClass = "";

    if (difference <= 50) {
      status = "Fair Swap";
      statusClass = "fair";
    } else if (difference <= 120) {
      status = "Close Value Match";
      statusClass = "close";
    } else {
      status = "Value Difference";
      statusClass = "difference";
    }

    setComparison({
      yourValue: yourValue,
      otherValue: otherValue,
      difference: difference,
      status: status,
      statusClass: statusClass
    });
  }

  function SelectField(
    label,
    value,
    onChange,
    options
  ) {
    return React.createElement(
      "div",
      { className: "comparison-field" },

      React.createElement(
        "label",
        null,
        label
      ),

      React.createElement(
        "select",
        {
          value: value,
          onChange: function (e) {
            onChange(e.target.value);
            setComparison(null);
          }
        },

        options.map(function (option) {
          return React.createElement(
            "option",
            {
              key: option,
              value: option
            },
            option
          );
        })
      )
    );
  }

  const categories = [
    "Dresses",
    "Tops",
    "Jeans",
    "Jackets",
    "Accessories"
  ];

  const brands = [
    "Zara",
    "H&M",
    "Levi's",
    "Mango",
    "Uniqlo",
    "Other"
  ];

  const conditions = [
    "Like New",
    "Excellent",
    "Good"
  ];

  return React.createElement(
    "div",
    { className: "swap-calculator-page" },

    React.createElement(
      "div",
      { className: "swap-calculator-container" },

      /* ================= HEADER ================= */

      React.createElement(
        "div",
        { className: "swap-calculator-header" },

        React.createElement(
          "div",
          { className: "swap-calculator-label" },
          "♻️ CLOTHSWAP"
        ),

        React.createElement(
          "h1",
          null,
          "Swap ",
          React.createElement(
            "em",
            null,
            "Value Calculator"
          )
        ),

        React.createElement(
          "p",
          null,
          "Compare clothing values and find a fair swap."
        )
      ),

      /* ================= COMPARISON ================= */

      React.createElement(
        "div",
        { className: "comparison-card" },

        React.createElement(
          "div",
          { className: "comparison-title" },

          React.createElement(
            "h2",
            null,
            "Compare Swap Value"
          ),

          React.createElement(
            "p",
            null,
            "Compare your clothing item with another item before sending a swap request."
          )
        ),

        React.createElement(
          "div",
          { className: "comparison-grid" },

          /* YOUR ITEM */

          React.createElement(
            "div",
            { className: "comparison-item your-item" },

            React.createElement(
              "div",
              { className: "comparison-item-header" },
              React.createElement(
                "span",
                { className: "comparison-icon" },
                "👕"
              ),
              React.createElement(
                "h3",
                null,
                "Your Item"
              )
            ),

            SelectField(
              "Category",
              yourCategory,
              setYourCategory,
              categories
            ),

            SelectField(
              "Brand",
              yourBrand,
              setYourBrand,
              brands
            ),

            SelectField(
              "Condition",
              yourCondition,
              setYourCondition,
              conditions
            )
          ),

          /* OTHER ITEM */

          React.createElement(
            "div",
            { className: "comparison-item other-item" },

            React.createElement(
              "div",
              { className: "comparison-item-header" },
              React.createElement(
                "span",
                { className: "comparison-icon" },
                "👗"
              ),
              React.createElement(
                "h3",
                null,
                "Other Item"
              )
            ),

            SelectField(
              "Category",
              otherCategory,
              setOtherCategory,
              categories
            ),

            SelectField(
              "Brand",
              otherBrand,
              setOtherBrand,
              brands
            ),

            SelectField(
              "Condition",
              otherCondition,
              setOtherCondition,
              conditions
            )
          )
        ),

        /* COMPARE BUTTON */

        React.createElement(
          "button",
          {
            type: "button",
            className: "compare-button",
            onClick: compareValues
          },
          "⚖️ Compare Values"
        ),

        /* RESULT */

        comparison &&
          React.createElement(
            "div",
            {
              className:
                "comparison-result " +
                comparison.statusClass
            },

            React.createElement(
              "div",
              { className: "result-heading" },
              "Swap Comparison"
            ),

            React.createElement(
              "div",
              { className: "value-comparison" },

              React.createElement(
                "div",
                { className: "value-box" },

                React.createElement(
                  "span",
                  null,
                  "Your Item"
                ),

                React.createElement(
                  "strong",
                  null,
                  comparison.yourValue,
                  " Points"
                )
              ),

              React.createElement(
                "div",
                { className: "vs-text" },
                "VS"
              ),

              React.createElement(
                "div",
                { className: "value-box" },

                React.createElement(
                  "span",
                  null,
                  "Other Item"
                ),

                React.createElement(
                  "strong",
                  null,
                  comparison.otherValue,
                  " Points"
                )
              )
            ),

            React.createElement(
              "div",
              { className: "difference-text" },
              "Value Difference: ",
              comparison.difference,
              " Points"
            ),

            React.createElement(
              "div",
              { className: "swap-status" },
              comparison.status
            ),

            React.createElement(
              "p",
              null,
              comparison.difference <= 50
                ? "These items have very similar values. This looks like a fair swap."
                : comparison.difference <= 120
                ? "The values are fairly close. You can negotiate with the other user."
                : "There is a noticeable value difference. Consider negotiating before confirming the swap."
            )
          )
      ),

      /* ================= BROWSE ================= */

      React.createElement(
        "div",
        { className: "swap-calculator-browse" },

        React.createElement(
          Link,
          {
            to: "/browse",
            className: "swap-calculator-browse-button"
          },
          "Browse Clothes"
        )
      )
    )
  );
}

export default SwapCalculator;