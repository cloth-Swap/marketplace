import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

function ReportProblem() {
  const navigate = useNavigate();

  const [problem, setProblem] = useState("");
  const [message, setMessage] = useState("");

  function handleSubmit(e) {
    e.preventDefault();

    if (!problem || !message.trim()) {
      alert("Please select a problem and describe it.");
      return;
    }

    alert("Your problem has been submitted successfully.");

    setProblem("");
    setMessage("");
  }

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
          "🛠️"
        ),

        React.createElement(
          "div",
          null,

          React.createElement(
            "h1",
            null,
            "Report a Problem"
          ),

          React.createElement(
            "p",
            null,
            "Tell us about an issue you are experiencing on ClothSwap."
          )
        )
      ),

      React.createElement(
        "form",
        {
          className: "clothswap-report-card",
          onSubmit: handleSubmit
        },

        React.createElement(
          "label",
          null,
          "What type of problem are you facing?"
        ),

        React.createElement(
          "select",
          {
            value: problem,
            onChange: function (e) {
              setProblem(e.target.value);
            },
            className: "clothswap-report-select"
          },

          React.createElement(
            "option",
            { value: "" },
            "Select a problem"
          ),

          React.createElement(
            "option",
            { value: "Technical issue" },
            "Technical issue"
          ),

          React.createElement(
            "option",
            { value: "Account problem" },
            "Account problem"
          ),

          React.createElement(
            "option",
            { value: "Swap problem" },
            "Swap problem"
          ),

          React.createElement(
            "option",
            { value: "Chat problem" },
            "Chat problem"
          ),

          React.createElement(
            "option",
            { value: "Other" },
            "Other"
          )
        ),

        React.createElement(
          "label",
          null,
          "Describe the problem"
        ),

        React.createElement("textarea", {
          value: message,
          onChange: function (e) {
            setMessage(e.target.value);
          },
          className: "clothswap-report-textarea",
          placeholder: "Please describe what went wrong...",
          rows: 6
        }),

        React.createElement(
          "button",
          {
            type: "submit",
            className: "clothswap-report-submit"
          },
          "Submit Report"
        )
      )
    )
  );
}

export default ReportProblem;