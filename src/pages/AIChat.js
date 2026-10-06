import React, { useEffect, useRef, useState } from "react";

const defaultMessage = {
  sender: "ai",
  text:
    "Hi! 👋 I'm ClothSwap AI Stylist. Ask me about outfits, colors, styling, swaps, or upload a clothing photo for styling help."
};

function AIChat() {
  /* ================= MESSAGES ================= */

  const [messages, setMessages] = useState(function () {
    try {
      const savedMessages = localStorage.getItem(
        "clothswapAIChat"
      );

      if (savedMessages) {
        const parsedMessages = JSON.parse(savedMessages);

        if (
          Array.isArray(parsedMessages) &&
          parsedMessages.length > 0
        ) {
          return parsedMessages;
        }
      }
    } catch (error) {
      console.log("Unable to load saved AI chat:", error);
    }

    return [defaultMessage];
  });

  const [input, setInput] = useState("");
  const [selectedImage, setSelectedImage] = useState(null);
  const [isTyping, setIsTyping] = useState(false);

  /* ================= CAMERA ================= */

  const [cameraOpen, setCameraOpen] = useState(false);
  const [cameraError, setCameraError] = useState("");

  /* ================= REFS ================= */

  const galleryInputRef = useRef(null);
  const videoRef = useRef(null);
  const cameraStreamRef = useRef(null);
  const messagesEndRef = useRef(null);

  /* =========================================================
     SAVE CHAT TO LOCAL STORAGE
     ========================================================= */

  useEffect(function () {
    try {
      localStorage.setItem(
        "clothswapAIChat",
        JSON.stringify(messages)
      );
    } catch (error) {
      console.log("Unable to save AI chat:", error);
    }
  }, [messages]);

  /* =========================================================
     AUTO SCROLL CHAT
     ========================================================= */

  useEffect(
    function () {
      if (messagesEndRef.current) {
        messagesEndRef.current.scrollIntoView({
          behavior: "smooth",
          block: "nearest"
        });
      }
    },
    [messages, isTyping]
  );

  /* =========================================================
     AI REPLY
     ========================================================= */

  const getAIReply = function (question) {
    const text = question.toLowerCase();

    if (
      text.includes("black") &&
      (text.includes("jeans") ||
        text.includes("pant") ||
        text.includes("pants"))
    ) {
      return (
        "🖤 Black jeans are very easy to style!\n\n" +
        "👕 Upper: White, beige, light blue or pastel shirt/T-shirt\n" +
        "👟 Shoes: White sneakers or black shoes\n" +
        "🎨 Best colors: White + black, beige + black, or pastel blue + black\n" +
        "👜 Accessories: Minimal black or brown bag\n" +
        "✨ Style: Casual, clean and versatile."
      );
    }

    if (
      text.includes("blue") &&
      (text.includes("jeans") ||
        text.includes("pant") ||
        text.includes("pants"))
    ) {
      return (
        "💙 Blue jeans have many styling options!\n\n" +
        "👕 Upper: White, black, beige, grey or pastel shades\n" +
        "👟 Shoes: White sneakers, loafers or casual shoes\n" +
        "🎨 Best colors: White + blue is the safest combination\n" +
        "✨ For a smart look: Try a white/cream shirt."
      );
    }

    if (
      text.includes("white") &&
      (text.includes("shirt") ||
        text.includes("tshirt") ||
        text.includes("t-shirt"))
    ) {
      return (
        "🤍 White is a very flexible color!\n\n" +
        "👖 Bottom: Blue jeans, black jeans, beige trousers or grey pants\n" +
        "👟 Shoes: White sneakers or loafers\n" +
        "🎨 Colors: Almost every neutral color works\n" +
        "✨ For a clean look: White + beige + white sneakers."
      );
    }

    if (
      text.includes("party") ||
      text.includes("function") ||
      text.includes("event")
    ) {
      return (
        "✨ For a party/event look:\n\n" +
        "👗 Choose a clean, well-fitted outfit\n" +
        "🎨 Good colors: Black, navy, burgundy, emerald or beige\n" +
        "👟 Shoes: Clean sneakers, heels or loafers depending on the outfit\n" +
        "👜 Accessories: Keep them simple and coordinated\n" +
        "💡 Tip: Don't use too many different colors in one outfit."
      );
    }

    if (
      text.includes("college") ||
      text.includes("university") ||
      text.includes("casual")
    ) {
      return (
        "🎓 For a college/casual look:\n\n" +
        "👕 Oversized T-shirt or casual shirt\n" +
        "👖 Straight-fit jeans or comfortable trousers\n" +
        "👟 White sneakers or casual shoes\n" +
        "🎨 Try neutral colors with one soft/pastel color\n" +
        "✨ Comfortable + simple usually looks best."
      );
    }

    if (
      text.includes("summer") ||
      text.includes("hot") ||
      text.includes("summer outfit")
    ) {
      return (
        "☀️ For summer, go for light and breathable outfits!\n\n" +
        "👕 Cotton/linen shirts or T-shirts\n" +
        "👖 Light trousers, relaxed jeans or shorts\n" +
        "🎨 Best colors: White, cream, light blue, pastel green and beige\n" +
        "👟 Comfortable sneakers/sandals\n" +
        "💡 Avoid very dark/heavy layers in extreme heat."
      );
    }

    if (
      text.includes("color") ||
      text.includes("colour") ||
      text.includes("matching")
    ) {
      return (
        "🎨 Here are some easy color combinations:\n\n" +
        "🤍 White → almost everything\n" +
        "🖤 Black → white, beige, grey, denim\n" +
        "💙 Blue → white, beige, grey, black\n" +
        "🤎 Beige → white, brown, black, olive\n" +
        "🌿 Olive → white, cream, beige, black\n" +
        "❤️ Burgundy → black, cream, beige\n\n" +
        "✨ Tip: Keep your outfit around 2–3 main colors."
      );
    }

    if (
      text.includes("upper") ||
      text.includes("top") ||
      text.includes("shirt") ||
      text.includes("tshirt") ||
      text.includes("t-shirt")
    ) {
      return (
        "👕 I can help you choose the upper!\n\n" +
        "🎨 Safe colors: White, black, beige and grey\n" +
        "✨ For a fresh look: Try pastel blue, pastel green or cream\n" +
        "👖 Match the upper with the color and fit of your bottom.\n\n" +
        "Tell me what bottom you're wearing, for example: \"blue jeans\"."
      );
    }

    if (
      text.includes("bottom") ||
      text.includes("pant") ||
      text.includes("pants") ||
      text.includes("jeans")
    ) {
      return (
        "👖 For the bottom, consider:\n\n" +
        "🖤 Black jeans → very versatile\n" +
        "💙 Blue jeans → casual and easy\n" +
        "🤎 Beige trousers → smart and clean\n" +
        "🩶 Grey trousers → modern neutral\n\n" +
        "If you tell me your upper color, I can suggest the best bottom combination."
      );
    }

    if (
      text.includes("shoe") ||
      text.includes("shoes") ||
      text.includes("footwear")
    ) {
      return (
        "👟 Shoe suggestion depends on your outfit:\n\n" +
        "🤍 White sneakers → safest casual option\n" +
        "🖤 Black shoes → formal/elegant\n" +
        "🤎 Brown loafers → smart casual\n" +
        "👠 Heels → party/formal feminine looks\n\n" +
        "💡 Matching your shoes with the overall outfit is usually better than matching them exactly with your top."
      );
    }

    if (
      text.includes("swap") ||
      text.includes("exchange")
    ) {
      return (
        "🔄 For a good ClothSwap:\n\n" +
        "1️⃣ Find an item you like\n" +
        "2️⃣ Check size, condition and estimated value\n" +
        "3️⃣ Send a swap request\n" +
        "4️⃣ Negotiate through Chat\n" +
        "5️⃣ Accept the swap when both users agree."
      );
    }

    if (text.includes("wishlist")) {
      return "❤️ Wishlist lets you save clothes you may want to swap later.";
    }

    if (text.includes("calculator")) {
      return "🧮 Swap Calculator helps compare the estimated value of two clothing items.";
    }

    if (
      text.includes("nearby") ||
      text.includes("location")
    ) {
      return "📍 Nearby Swaps helps you discover clothing exchange opportunities around your location.";
    }

    if (
      text.includes("login") ||
      text.includes("register")
    ) {
      return "👤 Use Login or Register to access your ClothSwap account and start swapping.";
    }

    if (
      text.includes("hello") ||
      text.includes("hi") ||
      text.includes("hey")
    ) {
      return (
        "Hello! 😊 I'm your ClothSwap AI Stylist.\n\n" +
        "You can ask me:\n" +
        "👕 What should I wear?\n" +
        "🎨 Which color matches?\n" +
        "👖 What goes with my jeans?\n" +
        "✨ What should I wear to a party?\n" +
        "♻️ How does ClothSwap work?"
      );
    }

    return (
      "🤖 I can help you with fashion and ClothSwap!\n\n" +
      "Try asking:\n" +
      "👕 \"What should I wear with black jeans?\"\n" +
      "🎨 \"Which color matches blue?\"\n" +
      "✨ \"What should I wear to a party?\"\n" +
      "☀️ \"Suggest a summer outfit\"\n" +
      "♻️ \"How do I swap clothes?\"\n\n" +
      "You can also 📎 upload a clothing photo or 📷 take a photo."
    );
  };

  /* =========================================================
     CAMERA STOP
     ========================================================= */

  const stopCamera = function () {
    if (cameraStreamRef.current) {
      cameraStreamRef.current
        .getTracks()
        .forEach(function (track) {
          track.stop();
        });

      cameraStreamRef.current = null;
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    setCameraOpen(false);
    setCameraError("");
  };

  /* =========================================================
     OPEN CAMERA
     ========================================================= */

  const openCamera = async function () {
    setCameraError("");

    if (
      !navigator.mediaDevices ||
      !navigator.mediaDevices.getUserMedia
    ) {
      setCameraError(
        "Camera is not supported by this browser. Please use Chrome or Edge."
      );

      setCameraOpen(true);
      return;
    }

    try {
      const stream =
        await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: {
              ideal: "environment"
            }
          },
          audio: false
        });

      cameraStreamRef.current = stream;

      setCameraOpen(true);
    } catch (error) {
      console.error("Camera error:", error);

      let errorMessage =
        "Unable to access camera. Please allow camera permission and try again.";

      if (error.name === "NotAllowedError") {
        errorMessage =
          "Camera permission was denied. Please allow camera permission in your browser settings and try again.";
      }

      if (error.name === "NotFoundError") {
        errorMessage =
          "No camera was found on this device.";
      }

      if (error.name === "NotReadableError") {
        errorMessage =
          "Camera is already being used by another application.";
      }

      setCameraError(errorMessage);
      setCameraOpen(true);
    }
  };

  /* =========================================================
     CAMERA VIDEO START
     ========================================================= */

  useEffect(
    function () {
      if (
        cameraOpen &&
        videoRef.current &&
        cameraStreamRef.current
      ) {
        videoRef.current.srcObject =
          cameraStreamRef.current;

        videoRef.current
          .play()
          .catch(function (error) {
            console.log(
              "Camera video play error:",
              error
            );
          });
      }
    },
    [cameraOpen]
  );

  /* =========================================================
     CAPTURE CAMERA PHOTO
     ========================================================= */

  const capturePhoto = function () {
    if (
      !videoRef.current ||
      !cameraStreamRef.current
    ) {
      return;
    }

    const video = videoRef.current;

    if (
      !video.videoWidth ||
      !video.videoHeight
    ) {
      alert(
        "Camera is still loading. Please wait a moment and try again."
      );

      return;
    }

    const canvas = document.createElement("canvas");

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const context = canvas.getContext("2d");

    context.drawImage(
      video,
      0,
      0,
      canvas.width,
      canvas.height
    );

    const imageUrl = canvas.toDataURL(
      "image/jpeg",
      0.85
    );

    setSelectedImage({
      url: imageUrl,
      name: "camera-photo.jpg"
    });

    stopCamera();
  };

  /* =========================================================
     GALLERY IMAGE
     ========================================================= */

  const handleImageChange = function (event) {
    const file =
      event.target.files &&
      event.target.files[0];

    if (!file) {
      return;
    }

    if (!file.type.startsWith("image/")) {
      alert("Please select an image file.");
      event.target.value = "";
      return;
    }

    const reader = new FileReader();

    reader.onload = function () {
      setSelectedImage({
        url: reader.result,
        name: file.name
      });
    };

    reader.onerror = function () {
      alert("Unable to read this image.");
    };

    reader.readAsDataURL(file);

    event.target.value = "";
  };

  /* =========================================================
     REMOVE SELECTED IMAGE
     ========================================================= */

  const removeSelectedImage = function () {
    setSelectedImage(null);
  };

  /* =========================================================
     SEND MESSAGE
     ========================================================= */

  const sendMessage = function () {
    const cleanText = input.trim();

    if (!cleanText && !selectedImage) {
      return;
    }

    const userMessage = {
      sender: "user",
      text:
        cleanText ||
        "Please help me style this clothing item.",
      image: selectedImage
        ? {
            url: selectedImage.url,
            name: selectedImage.name
          }
        : null
    };

    setMessages(function (previous) {
      return previous.concat([userMessage]);
    });

    setInput("");
    setSelectedImage(null);
    setIsTyping(true);

    setTimeout(function () {
      const reply = cleanText
        ? getAIReply(cleanText)
        : "📸 I've received your clothing photo. Tell me what you want to know, for example: \"What can I wear with this?\", \"Which color goes with it?\", or \"Suggest a complete outfit.\"";

      setMessages(function (previous) {
        return previous.concat([
          {
            sender: "ai",
            text: reply
          }
        ]);
      });

      setIsTyping(false);
    }, 700);
  };

  /* =========================================================
     KEYBOARD
     ========================================================= */

  const handleKeyDown = function (event) {
    if (
      event.key === "Enter" &&
      !event.shiftKey
    ) {
      event.preventDefault();
      sendMessage();
    }
  };

  /* =========================================================
     CLEAR CHAT
     ========================================================= */

  const clearChat = function () {
    stopCamera();

    setMessages([defaultMessage]);

    setInput("");
    setSelectedImage(null);
    setIsTyping(false);

    try {
      localStorage.setItem(
        "clothswapAIChat",
        JSON.stringify([defaultMessage])
      );
    } catch (error) {
      console.log(
        "Unable to clear saved chat:",
        error
      );
    }
  };

  /* =========================================================
     SUGGESTION
     ========================================================= */

  const useSuggestion = function (question) {
    setInput(question);
  };

  /* =========================================================
     COMPONENT CLEANUP
     ========================================================= */

  useEffect(function () {
    return function () {
      if (cameraStreamRef.current) {
        cameraStreamRef.current
          .getTracks()
          .forEach(function (track) {
            track.stop();
          });

        cameraStreamRef.current = null;
      }
    };
  }, []);

  /* =========================================================
     UI
     ========================================================= */

  return React.createElement(
    "div",
    {
      className: "clothswap-ai-page"
    },

    React.createElement(
      "div",
      {
        className: "clothswap-ai-main"
      },

      /* HEADER */

      React.createElement(
        "div",
        {
          className: "clothswap-ai-header"
        },

        React.createElement(
          "div",
          {
            className:
              "clothswap-ai-header-left"
          },

          React.createElement(
            "div",
            {
              className:
                "clothswap-ai-avatar"
            },
            "🤖"
          ),

          React.createElement(
            "div",
            null,

            React.createElement(
              "h2",
              null,
              "ClothSwap AI Stylist"
            ),

            React.createElement(
              "p",
              null,
              "Your personal fashion & swap assistant"
            )
          )
        ),

        React.createElement(
          "button",
          {
            type: "button",
            className:
              "clothswap-ai-clear-btn",
            onClick: clearChat
          },
          "🗑️ Clear"
        )
      ),

      /* SUGGESTIONS */

      React.createElement(
        "div",
        {
          className:
            "clothswap-ai-suggestions"
        },

        React.createElement(
          "button",
          {
            type: "button",
            onClick: function () {
              useSuggestion(
                "What should I wear with black jeans?"
              );
            }
          },
          "👖 Black jeans"
        ),

        React.createElement(
          "button",
          {
            type: "button",
            onClick: function () {
              useSuggestion(
                "Which colors match blue?"
              );
            }
          },
          "🎨 Color match"
        ),

        React.createElement(
          "button",
          {
            type: "button",
            onClick: function () {
              useSuggestion(
                "Suggest a college outfit"
              );
            }
          },
          "🎓 College outfit"
        ),

        React.createElement(
          "button",
          {
            type: "button",
            onClick: function () {
              useSuggestion(
                "Suggest a party outfit"
              );
            }
          },
          "✨ Party outfit"
        )
      ),

      /* CHAT BOX */

      React.createElement(
        "div",
        {
          className:
            "clothswap-ai-chat-box"
        },

        /* MESSAGES */

        React.createElement(
          "div",
          {
            className:
              "clothswap-ai-messages"
          },

          messages.map(function (
            message,
            index
          ) {
            return React.createElement(
              "div",
              {
                key: index,
                className:
                  "clothswap-ai-message-row " +
                  (message.sender === "user"
                    ? "clothswap-ai-user-row"
                    : "clothswap-ai-bot-row")
              },

              message.sender === "ai" &&
                React.createElement(
                  "div",
                  {
                    className:
                      "clothswap-ai-small-avatar"
                  },
                  "🤖"
                ),

              React.createElement(
                "div",
                {
                  className:
                    "clothswap-ai-message " +
                    (message.sender === "user"
                      ? "clothswap-ai-user-message"
                      : "clothswap-ai-bot-message")
                },

                message.image &&
                  React.createElement(
                    "img",
                    {
                      src:
                        message.image.url,
                      alt:
                        "Uploaded clothing",
                      className:
                        "clothswap-ai-chat-image"
                    }
                  ),

                React.createElement(
                  "div",
                  {
                    className:
                      "clothswap-ai-message-text"
                  },
                  message.text
                )
              )
            );
          }),

          isTyping &&
            React.createElement(
              "div",
              {
                className:
                  "clothswap-ai-message-row clothswap-ai-bot-row"
              },

              React.createElement(
                "div",
                {
                  className:
                    "clothswap-ai-small-avatar"
                },
                "🤖"
              ),

              React.createElement(
                "div",
                {
                  className:
                    "clothswap-ai-message clothswap-ai-bot-message clothswap-ai-typing"
                },

                React.createElement(
                  "span",
                  null,
                  "•"
                ),

                React.createElement(
                  "span",
                  null,
                  "•"
                ),

                React.createElement(
                  "span",
                  null,
                  "•"
                )
              )
            ),

          React.createElement("div", {
            ref: messagesEndRef
          })
        ),

        /* SELECTED IMAGE PREVIEW */

        selectedImage &&
          React.createElement(
            "div",
            {
              className:
                "clothswap-ai-image-preview"
            },

            React.createElement(
              "img",
              {
                src:
                  selectedImage.url,
                alt:
                  "Selected clothing preview"
              }
            ),

            React.createElement(
              "div",
              {
                className:
                  "clothswap-ai-image-preview-info"
              },

              React.createElement(
                "strong",
                null,
                "Photo attached"
              ),

              React.createElement(
                "small",
                null,
                selectedImage.name
              )
            ),

            React.createElement(
              "button",
              {
                type: "button",
                onClick:
                  removeSelectedImage,
                "aria-label":
                  "Remove image"
              },
              "✕"
            )
          ),

        /* INPUT AREA */

        React.createElement(
          "div",
          {
            className:
              "clothswap-ai-input-area"
          },

          /* ATTACH BUTTONS */

          React.createElement(
            "div",
            {
              className:
                "clothswap-ai-attach-buttons"
            },

            /* GALLERY */

            React.createElement(
              "button",
              {
                type: "button",
                className:
                  "clothswap-ai-attach-btn",
                onClick: function () {
                  if (
                    galleryInputRef.current
                  ) {
                    galleryInputRef.current.click();
                  }
                },
                title:
                  "Choose photo from gallery"
              },
              "📎"
            ),

            /* CAMERA */

            React.createElement(
              "button",
              {
                type: "button",
                className:
                  "clothswap-ai-attach-btn",
                onClick: openCamera,
                title:
                  "Open camera"
              },
              "📷"
            )
          ),

          /* HIDDEN GALLERY INPUT */

          React.createElement(
            "input",
            {
              ref:
                galleryInputRef,
              type: "file",
              accept: "image/*",
              onChange:
                handleImageChange,
              className:
                "clothswap-ai-hidden-file"
            }
          ),

          /* TEXT INPUT */

          React.createElement(
            "textarea",
            {
              value: input,
              placeholder:
                "Ask about outfits, colors, styling...",
              onChange: function (
                event
              ) {
                setInput(
                  event.target.value
                );
              },
              onKeyDown:
                handleKeyDown,
              rows: 1
            }
          ),

          /* SEND */

          React.createElement(
            "button",
            {
              type: "button",
              className:
                "clothswap-ai-send-btn",
              onClick:
                sendMessage,
              disabled:
                !input.trim() &&
                !selectedImage
            },
            "➤"
          )
        ),

        /* FOOTER */

        React.createElement(
          "div",
          {
            className:
              "clothswap-ai-footer-note"
          },
          "ClothSwap AI can help with outfit ideas, colors, styling and clothing swaps."
        )
      )
    ),

    /* =====================================================
       CAMERA MODAL
       ===================================================== */

    cameraOpen &&
      React.createElement(
        "div",
        {
          className:
            "clothswap-camera-overlay"
        },

        React.createElement(
          "div",
          {
            className:
              "clothswap-camera-modal"
          },

          React.createElement(
            "div",
            {
              className:
                "clothswap-camera-header"
            },

            React.createElement(
              "h3",
              null,
              "📷 Take a Photo"
            ),

            React.createElement(
              "button",
              {
                type: "button",
                className:
                  "clothswap-camera-close",
                onClick:
                  stopCamera,
                "aria-label":
                  "Close camera"
              },
              "✕"
            )
          ),

          cameraError
            ? React.createElement(
                "div",
                {
                  className:
                    "clothswap-camera-error"
                },

                React.createElement(
                  "div",
                  null,
                  "⚠️"
                ),

                React.createElement(
                  "p",
                  null,
                  cameraError
                )
              )
            : React.createElement(
                "div",
                {
                  className:
                    "clothswap-camera-preview"
                },

                React.createElement(
                  "video",
                  {
                    ref: videoRef,
                    autoPlay: true,
                    playsInline: true,
                    muted: true
                  }
                )
              ),

          React.createElement(
            "div",
            {
              className:
                "clothswap-camera-actions"
            },

            React.createElement(
              "button",
              {
                type: "button",
                className:
                  "clothswap-camera-cancel",
                onClick:
                  stopCamera
              },
              "Cancel"
            ),

            !cameraError &&
              React.createElement(
                "button",
                {
                  type: "button",
                  className:
                    "clothswap-camera-capture",
                  onClick:
                    capturePhoto
                },
                "📸 Capture Photo"
              )
          )
        )
      )
  );
}

export default AIChat;