import React, { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";

function Chat() {
  const [searchParams] = useSearchParams();

  const requestId = searchParams.get("requestId");

  const [request, setRequest] = useState(null);
  const [messages, setMessages] = useState([]);
  const [messageText, setMessageText] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");

  /* ================= CURRENT USER ================= */

  const currentUser =
    localStorage.getItem("clothSwapUserName") ||
    localStorage.getItem("clothswapUserName") ||
    "";

  /* ================= LOAD CHAT ================= */

  useEffect(function () {
    if (!requestId) {
      setError("Swap request ID is missing.");
      setLoading(false);
      return;
    }

    loadChatData();
  }, [requestId]);

  /* ================= LOAD REQUEST + MESSAGES ================= */

  async function loadChatData() {
    try {
      setLoading(true);
      setError("");

      /* ================= REQUEST ================= */

      const requestResponse = await fetch(
        "http://localhost:5000/api/swap-requests/" +
          requestId
      );

      if (!requestResponse.ok) {
        throw new Error(
          "Failed to load swap request."
        );
      }

      const requestData =
        await requestResponse.json();

      console.log(
        "CHAT REQUEST DATA:",
        requestData
      );

      /*
        Backend response safely handle:
        direct object
        OR { request: object }
        OR { swapRequest: object }
        OR { data: object }
      */

      const actualRequest =
        requestData &&
        requestData.request
          ? requestData.request
          : requestData &&
            requestData.swapRequest
          ? requestData.swapRequest
          : requestData &&
            requestData.data
          ? requestData.data
          : requestData;

      setRequest(actualRequest);

      /* ================= MESSAGES ================= */

      const messageResponse = await fetch(
        "http://localhost:5000/api/messages/" +
          requestId
      );

      if (messageResponse.ok) {
        const messageData =
          await messageResponse.json();

        console.log(
          "CHAT MESSAGE DATA:",
          messageData
        );

        let actualMessages = [];

        if (Array.isArray(messageData)) {
          actualMessages = messageData;
        } else if (
          messageData &&
          Array.isArray(messageData.messages)
        ) {
          actualMessages =
            messageData.messages;
        } else if (
          messageData &&
          Array.isArray(messageData.data)
        ) {
          actualMessages =
            messageData.data;
        }

        setMessages(actualMessages);
      } else {
        setMessages([]);
      }
    } catch (error) {
      console.error(
        "Chat loading error:",
        error
      );

      setError(
        error.message ||
          "Unable to load chat."
      );
    } finally {
      setLoading(false);
    }
  }

  /* ================= SEND MESSAGE ================= */

  async function handleSendMessage(event) {
  event.preventDefault();

  const text = messageText.trim();

  if (!text) {
    return;
  }

  if (!requestId) {
    setError("Swap request ID is missing.");
    return;
  }

  if (!currentUser) {
    setError("Please login before sending a message.");
    return;
  }

  try {
    setSending(true);
    setError("");

    const response = await fetch(
      "http://localhost:5000/api/messages",
      {
        method: "POST",

        headers: {
          "Content-Type": "application/json"
        },

        body: JSON.stringify({
          swapRequestId: requestId,
          sender: currentUser,
          text: text
        })
      }
    );

    const data = await response.json();

    console.log("SEND MESSAGE RESPONSE:", data);

    if (!response.ok) {
      throw new Error(
        data.message || "Failed to send message."
      );
    }

    /*
      Backend different response formats handle
    */

    const newMessage =
      data.savedMessage ||
      data.newMessage ||
      data.messageData ||
      data.data ||
      (
        data &&
        typeof data.message === "object"
          ? data.message
          : null
      );

    /*
      If backend returns only success message,
      create the message locally using current user.
    */

    const finalMessage =
      newMessage &&
      typeof newMessage === "object"
        ? newMessage
        : {
            _id:
              "local-" +
              Date.now(),

            sender: currentUser,

            text: text,

            createdAt:
              new Date().toISOString()
          };

    console.log(
      "FINAL CHAT MESSAGE:",
      finalMessage
    );

    setMessages(function (
      previousMessages
    ) {
      return [
        ...previousMessages,
        finalMessage
      ];
    });

    setMessageText("");
  } catch (error) {
    console.error(
      "Send message error:",
      error
    );

    setError(
      error.message ||
        "Unable to send message."
    );
  } finally {
    setSending(false);
  }
}
  /* ================= LOADING ================= */

  if (loading) {
    return React.createElement(
      "div",
      {
        className: "chat-page"
      },

      React.createElement(
        "div",
        {
          className:
            "container py-5 text-center"
        },

        React.createElement(
          "div",
          {
            className:
              "chat-loading"
          },
          "Loading chat..."
        )
      )
    );
  }

  /* ================= ERROR ================= */

  if (error && !request) {
    return React.createElement(
      "div",
      {
        className: "chat-page"
      },

      React.createElement(
        "div",
        {
          className:
            "container py-5"
        },

        React.createElement(
          "div",
          {
            className:
              "chat-error-card"
          },

          React.createElement(
            "h2",
            null,
            "Unable to open chat"
          ),

          React.createElement(
            "p",
            null,
            error
          ),

          React.createElement(
            Link,
            {
              to: "/swap-requests",
              className:
                "chat-back-btn"
            },
            "← Back to Swap Requests"
          )
        )
      )
    );
  }

  /* ================= SAFE REQUEST VALUES ================= */

  const ownerName =
    request &&
    typeof request.owner === "string" &&
    request.owner.trim()
      ? request.owner
      : "Unknown";

  const requesterName =
    request &&
    typeof request.requester === "string" &&
    request.requester.trim()
      ? request.requester
      : "Unknown";

  const clothingTitle =
    request &&
    typeof request.clothingTitle === "string" &&
    request.clothingTitle.trim()
      ? request.clothingTitle
      : "Clothing Item";

  const clothingImage =
    request &&
    typeof request.clothingImage === "string"
      ? request.clothingImage
      : "";

  const requestStatus =
    request &&
    request.status
      ? request.status
      : "Pending";

  /* ================= OTHER USER ================= */

  let otherUser = "User";

  if (
    currentUser &&
    ownerName !== "Unknown" &&
    requesterName !== "Unknown"
  ) {
    if (ownerName === currentUser) {
      otherUser = requesterName;
    } else if (
      requesterName === currentUser
    ) {
      otherUser = ownerName;
    } else {
      otherUser = ownerName;
    }
  } else if (
    ownerName !== "Unknown"
  ) {
    otherUser = ownerName;
  } else if (
    requesterName !== "Unknown"
  ) {
    otherUser = requesterName;
  }

  const safeOtherUser =
    otherUser || "User";

  /* ================= PAGE ================= */

  return React.createElement(
    "div",
    {
      className: "chat-page"
    },

    React.createElement(
      "div",
      {
        className: "container"
      },

      /* ================= HEADER ================= */

      React.createElement(
        "div",
        {
          className:
            "chat-page-header"
        },

        React.createElement(
          Link,
          {
            to: "/swap-requests",
            className:
              "chat-back-link"
          },
          "← Back to Swap Requests"
        ),

        React.createElement(
          "h1",
          null,
          "Chat / Negotiate"
        ),

        React.createElement(
          "p",
          null,
          "Discuss the swap details before confirming."
        )
      ),

      /* ================= MAIN CARD ================= */

      React.createElement(
        "div",
        {
          className:
            "chat-main-card"
        },

        /* ================= CLOTHING INFO ================= */

        React.createElement(
          "div",
          {
            className:
              "chat-item-section"
          },

          React.createElement(
            "div",
            {
              className:
                "chat-item-image-wrapper"
            },

            clothingImage
              ? React.createElement(
                  "img",
                  {
                    src:
                      clothingImage,
                    alt:
                      clothingTitle,
                    className:
                      "chat-item-image",
                    onError:
                      function (event) {
                        event.target.style.display =
                          "none";
                      }
                  }
                )
              : React.createElement(
                  "div",
                  {
                    className:
                      "chat-item-placeholder"
                  },
                  "👕"
                )
          ),

          React.createElement(
            "div",
            {
              className:
                "chat-item-info"
            },

            React.createElement(
              "h2",
              null,
              clothingTitle
            ),

            React.createElement(
              "p",
              null,
              "Owner: ",
              ownerName
            ),

            React.createElement(
              "p",
              null,
              "Requester: ",
              requesterName
            ),

            React.createElement(
              "span",
              {
                className:
                  "chat-status-badge"
              },
              requestStatus
            )
          )
        ),

        /* ================= CHAT USER ================= */

        React.createElement(
          "div",
          {
            className:
              "chat-user-section"
          },

          React.createElement(
            "div",
            {
              className:
                "chat-user-avatar"
            },
            safeOtherUser
              .charAt(0)
              .toUpperCase()
          ),

          React.createElement(
            "div",
            {
              className:
                "chat-user-info"
            },

            React.createElement(
              "h2",
              null,
              safeOtherUser
            ),

            React.createElement(
              "p",
              null,
              "Negotiating with you"
            )
          )
        ),

        /* ================= ERROR ================= */

        error &&
          React.createElement(
            "div",
            {
              className:
                "chat-inline-error"
            },
            error
          ),

        /* ================= MESSAGES ================= */

        React.createElement(
          "div",
          {
            className:
              "chat-messages"
          },

          messages.length === 0
            ? React.createElement(
                "div",
                {
                  className:
                    "chat-empty"
                },

                React.createElement(
                  "div",
                  {
                    className:
                      "chat-empty-icon"
                  },
                  "💬"
                ),

                React.createElement(
                  "h3",
                  null,
                  "Start the conversation"
                ),

                React.createElement(
                  "p",
                  null,
                  "Discuss the clothing condition, swap value, pickup or delivery details."
                )
              )

            : messages.map(function (
                message,
                index
              ) {
                const sender =
                  message &&
                  typeof message.sender === "string" &&
                  message.sender.trim()
                    ? message.sender
                    : "User";

                const text =
                  message &&
                  typeof message.text === "string"
                    ? message.text
                    : "";

                const isMine =
                  currentUser &&
                  sender === currentUser;

                return React.createElement(
                  "div",
                  {
                    key:
                      message._id ||
                      index,

                    className:
                      isMine
                        ? "chat-message-row mine"
                        : "chat-message-row"
                  },

                  React.createElement(
                    "div",
                    {
                      className:
                        isMine
                          ? "chat-message-bubble mine"
                          : "chat-message-bubble"
                    },

                    React.createElement(
                      "div",
                      {
                        className:
                          "chat-message-sender"
                      },
                      sender
                    ),

                    React.createElement(
                      "div",
                      {
                        className:
                          "chat-message-text"
                      },
                      text
                    ),

                    message.createdAt &&
                      React.createElement(
                        "div",
                        {
                          className:
                            "chat-message-time"
                        },

                        new Date(
                          message.createdAt
                        ).toLocaleString()
                      )
                  )
                );
              })
        ),

        /* ================= SEND FORM ================= */

        React.createElement(
          "form",
          {
            className:
              "chat-input-area",
            onSubmit:
              handleSendMessage
          },

          React.createElement(
            "textarea",
            {
              value:
                messageText,

              onChange:
                function (event) {
                  setMessageText(
                    event.target.value
                  );
                },

              placeholder:
                currentUser
                  ? "Write a message about the swap..."
                  : "Please login to send a message...",

              rows: 3,

              disabled:
                sending ||
                !currentUser
            }
          ),

          React.createElement(
            "button",
            {
              type: "submit",

              className:
                "chat-send-btn",

              disabled:
                sending ||
                !currentUser ||
                !messageText.trim()
            },

            sending
              ? "Sending..."
              : "Send Message →"
          )
        )
      )
    )
  );
}

export default Chat;