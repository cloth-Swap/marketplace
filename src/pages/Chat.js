
import React, { useEffect, useState, useRef } from "react";
import { Link, useSearchParams } from "react-router-dom";
import API_URL from "../api";

const CHAT_WARNING =
  "This chat is only for ClothSwap-related communication.";

function isClothSwapRelatedMessage(message) {
  const text = String(message || "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();

  if (!text) return false;

  const blockedPatterns = [
    /\bi\s+love\s+you\b/,
    /\blove\s+u\b/,
    /\bi\s+like\s+you\b/,
    /\b(date|dating)\s+you\b/,
    /\bdate\s+me\b/,
    /\bgo\s+on\s+a\s+date\b/,
    /\bgirlfriend\b/,
    /\bboyfriend\b/,
    /\bkiss\b/,
    /\bflirt(?:ing)?\b/,
    /\bromance\b/,
    /\bsweetheart\b/,
    /\bdarling\b/,
    /\bcrush\s+on\s+you\b/,
    /\bare\s+you\s+single\b/,
    /\bselfie\b/,
    /\byour\s+phone\s+number\b/,
    /\byour\s+instagram\b/,
    /\byour\s+whatsapp\b/,
    /\byour\s+snapchat\b/
  ];

  return !blockedPatterns.some(function (pattern) {
    return pattern.test(text);
  });
}

function Chat() {

  const [searchParams] = useSearchParams();
  const requestId = searchParams.get("requestId");

  const [request, setRequest] = useState(null);
  const [messages, setMessages] = useState([]);
  const [messageText, setMessageText] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");

  const sendingRef = useRef(false);
  const currentUser =
    localStorage.getItem("clothSwapUserName") ||
    localStorage.getItem("clothswapUserName") ||
    "";

  function mergeMessages(previous, incoming) {
    const messageMap = new Map();

    [...previous, ...incoming].forEach(function (message) {
      if (!message) return;

      // Saved messages are identified by their MongoDB ID.
      if (message._id) {
        messageMap.set(String(message._id), message);
      }
    });

    return Array.from(messageMap.values()).sort(function (a, b) {
      return (
        new Date(a.createdAt || 0) -
        new Date(b.createdAt || 0)
      );
    });
  }

  async function loadChatData(showLoading = true) {
    try {
      if (!requestId) {
        setError("Swap request ID is missing.");
        return;
      }

      if (showLoading) setLoading(true);

      const requestResponse = await fetch(
        `${API_URL}/api/swap-requests/${requestId}`
      );

      if (!requestResponse.ok) {
        throw new Error("Failed to load swap request.");
      }

      const requestData = await requestResponse.json();

      const actualRequest =
        requestData?.request ||
        requestData?.swapRequest ||
        requestData?.data ||
        requestData;

      setRequest(actualRequest);

      const messageResponse = await fetch(
        `${API_URL}/api/messages/${requestId}`,
        { cache: "no-store" }
      );

      if (!messageResponse.ok) {
        throw new Error("Failed to load messages.");
      }

      const messageData = await messageResponse.json();

      const actualMessages = Array.isArray(messageData)
        ? messageData
        : Array.isArray(messageData.messages)
        ? messageData.messages
        : Array.isArray(messageData.data)
        ? messageData.data
        : [];

      setMessages(function (previousMessages) {
        return mergeMessages(previousMessages, actualMessages);
      });

      if (showLoading) setError("");
    } catch (err) {
      console.error("Chat loading error:", err);

      if (showLoading) {
        setError(err.message || "Unable to load chat.");
      }
    } finally {
      if (showLoading) setLoading(false);
    }
  }

  useEffect(function () {
    if (!requestId) {
      setError("Swap request ID is missing.");
      setLoading(false);
      return;
    }

    loadChatData(true);

    const refreshInterval = setInterval(function () {
      loadChatData(false);
    }, 3000);

    return function () {
      clearInterval(refreshInterval);
    };
  }, [requestId]);

  async function handleSendMessage(event) {
    event.preventDefault();

    const textToSend = messageText.trim();

    if (!textToSend) return;
    if (!isClothSwapRelatedMessage(textToSend)) {
  setError(CHAT_WARNING);
  return;
}

    if (!requestId || !currentUser) {
      setError("Please login and open a valid swap chat.");
      return;
    }

    if (sendingRef.current) return;

    sendingRef.current = true;
    setSending(true);
    setError("");
    setMessageText("");

    try {
      console.log("SENDING MESSAGE REQUEST");
      const response = await fetch(`${API_URL}/api/messages`, {
        method: "POST",
       headers: {
  "Content-Type": "application/json",
  "Authorization": "Bearer " + localStorage.getItem("clothswapToken")
},
body: JSON.stringify({
  swapRequestId: requestId,
  sender: currentUser,
  text: textToSend,
  chatNotificationsEnabled: true
})

      });

      const data = await response.json();
      console.log("MESSAGE RESPONSE RECEIVED", response.status, data);

      if (!response.ok || data.success === false) {
        throw new Error(data.message || "Message send failed.");
      }

      const savedMessage = data.savedMessage;

      if (!savedMessage || !savedMessage._id) {
        throw new Error("Server did not return the saved message.");
      }

      setMessages(function (previousMessages) {
        return mergeMessages(previousMessages, [savedMessage]);
      });

      setMessageText("");
    } catch (err) {
      console.error("Send message error:", err);

      setMessageText(function (currentText) {
  return currentText || textToSend;
});
     if (err.message === CHAT_WARNING) {
  setError(CHAT_WARNING);
} else {
  setError(
    (err.message || "Unable to send message.") +
      " Please try sending this message again."
  );
}
    } finally {
      sendingRef.current = false;
      setSending(false);
    }
  }


  if (loading) {
    return React.createElement(
      "div",
      { className: "chat-page" },
      React.createElement(
        "div",
        { className: "container py-5 text-center" },
        React.createElement(
          "div",
          { className: "chat-loading" },
          "Loading chat..."
        )
      )
    );
  }

  if (error && !request) {
    return React.createElement(
      "div",
      { className: "chat-page" },
      React.createElement(
        "div",
        { className: "container py-5" },
        React.createElement(
          "div",
          { className: "chat-error-card" },
          React.createElement("h2", null, "Unable to open chat"),
          React.createElement("p", null, error),
          React.createElement(
            Link,
            { to: "/swap-requests", className: "chat-back-btn" },
            "← Back to Swap Requests"
          )
        )
      )
    );
  }

  const ownerName =
    typeof request?.owner === "string" && request.owner.trim()
      ? request.owner
      : "Unknown";

  const requesterName =
    typeof request?.requester === "string" && request.requester.trim()
      ? request.requester
      : "Unknown";

  const clothingTitle =
    typeof request?.clothingTitle === "string" &&
    request.clothingTitle.trim()
      ? request.clothingTitle
      : "Clothing Item";

  const clothingImage =
    typeof request?.clothingImage === "string"
      ? request.clothingImage
      : "";

  const requestStatus = request?.status || "Pending";

  let otherUser = "User";

  if (ownerName === currentUser) {
    otherUser = requesterName;
  } else if (requesterName === currentUser) {
    otherUser = ownerName;
  } else if (ownerName !== "Unknown") {
    otherUser = ownerName;
  } else if (requesterName !== "Unknown") {
    otherUser = requesterName;
  }

  const safeOtherUser = otherUser || "User";

  return React.createElement(
    "div",
    { className: "chat-page" },
    React.createElement(
      "div",
      { className: "container" },

      React.createElement(
        "div",
        { className: "chat-page-header" },
        React.createElement(
          Link,
          { to: "/swap-requests", className: "chat-back-link" },
          "← Back to Swap Requests"
        ),
        React.createElement("h1", null, "Chat / Negotiate"),
        React.createElement(
          "p",
          null,
          "Discuss the swap details before confirming."
        )
      ),

      React.createElement(
        "div",
        { className: "chat-main-card" },

        React.createElement(
          "div",
          { className: "chat-item-section" },

          React.createElement(
            "div",
            { className: "chat-item-image-wrapper" },
            clothingImage
              ? React.createElement("img", {
                  src: clothingImage,
                  alt: clothingTitle,
                  className: "chat-item-image",
                  onError: function (event) {
                    event.target.style.display = "none";
                  }
                })
              : React.createElement(
                  "div",
                  { className: "chat-item-placeholder" },
                  "👕"
                )
          ),

          React.createElement(
            "div",
            { className: "chat-item-info" },
            React.createElement("h2", null, clothingTitle),
            React.createElement("p", null, "Owner: ", ownerName),
            React.createElement("p", null, "Requester: ", requesterName),
            React.createElement(
              "span",
              { className: "chat-status-badge" },
              requestStatus
            )
          )
        ),

        React.createElement(
          "div",
          { className: "chat-user-section" },
          React.createElement(
            "div",
            { className: "chat-user-avatar" },
            safeOtherUser.charAt(0).toUpperCase()
          ),
          React.createElement(
            "div",
            { className: "chat-user-info" },
            React.createElement("h2", null, safeOtherUser),
            React.createElement("p", null, "Negotiating with you")
          )
        ),

        error &&
          React.createElement(
            "div",
            { className: "chat-inline-error" },
            error
          ),

        React.createElement(
          "div",
          { className: "chat-messages" },

          messages.length === 0
            ? React.createElement(
                "div",
                { className: "chat-empty" },
                React.createElement(
                  "div",
                  { className: "chat-empty-icon" },
                  "💬"
                ),
                React.createElement("h3", null, "Start the conversation"),
                React.createElement(
                  "p",
                  null,
                  "Discuss the clothing condition, swap value, pickup or delivery details."
                )
              )
            : messages.map(function (message, index) {
                const sender =
                  typeof message.sender === "string" &&
                  message.sender.trim()
                    ? message.sender
                    : "User";

                const text =
                  typeof message.text === "string"
                    ? message.text
                    : "";

                const isMine = currentUser && sender === currentUser;

                return React.createElement(
                  "div",
                  {
                    key: message._id || index,
                    className: isMine
                      ? "chat-message-row mine"
                      : "chat-message-row"
                  },
                  React.createElement(
                    "div",
                    {
                      className: isMine
                        ? "chat-message-bubble mine"
                        : "chat-message-bubble"
                    },
                    React.createElement(
                      "div",
                      { className: "chat-message-sender" },
                      sender
                    ),
                    React.createElement(
                      "div",
                      { className: "chat-message-text" },
                      text
                    ),
                    message.createdAt &&
                      React.createElement(
                        "div",
                        { className: "chat-message-time" },
                        new Date(message.createdAt).toLocaleString()
                      )
                  )
                );
              })
        ),

        React.createElement(
          "form",
          {
            className: "chat-input-area",
            onSubmit: handleSendMessage
          },

          React.createElement("textarea", {
            value: messageText,
           onChange: function (event) {
  setMessageText(event.target.value);
  setError("");
},
            placeholder: currentUser
              ? "Write a message about the swap..."
              : "Please login to send a message...",
            rows: 3,
            disabled: !currentUser || sending
          }),

          React.createElement(
            "button",
            {
              type: "submit",
              className: "chat-send-btn",
              disabled:
                !currentUser || !messageText.trim() || sending
            },
            sending ? "Sending..." : "Send Message →"
          )
        )
      )
    )
  );
}

export default Chat;
