import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

function ItemDetails() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isWishlisted, setIsWishlisted] = useState(false);

  const [swapMessage, setSwapMessage] = useState("");
  const [swapMessageType, setSwapMessageType] = useState("success");
  const [swapSending, setSwapSending] = useState(false);

  useEffect(() => {
    loadItem();
    checkWishlist();
  }, [id]);

  function checkWishlist() {
    const saved = localStorage.getItem("clothSwapWishlist");

    if (!saved) {
      setIsWishlisted(false);
      return;
    }

    try {
      const wishlist = JSON.parse(saved);

      const found = wishlist.some(
        (wishlistItem) =>
          String(wishlistItem._id || wishlistItem.id) === String(id)
      );

      setIsWishlisted(found);
    } catch (error) {
      setIsWishlisted(false);
    }
  }

  async function loadItem() {
    setLoading(true);
    setError("");

    try {
      const response = await fetch(
        "http://localhost:5000/api/clothes"
      );

      if (!response.ok) {
        throw new Error("Unable to load clothes.");
      }

      const data = await response.json();

      const clothes = data.clothes || data || [];

      const selectedItem = clothes.find(
        (cloth) =>
          String(cloth._id || cloth.id) === String(id)
      );

      if (!selectedItem) {
        setError("Clothing item not found.");
      } else {
        setItem(selectedItem);
      }
    } catch (err) {
      console.error(err);

      setError(
        "Cannot connect to server. Make sure backend is running."
      );
    } finally {
      setLoading(false);
    }
  }

  function addToWishlist() {
    if (!item) {
      return;
    }

    const saved = localStorage.getItem("clothSwapWishlist");

    let wishlist = [];

    if (saved) {
      try {
        wishlist = JSON.parse(saved);

        if (!Array.isArray(wishlist)) {
          wishlist = [];
        }
      } catch (error) {
        wishlist = [];
      }
    }

    const itemId = item._id || item.id;

    const alreadyExists = wishlist.some(
      (wishlistItem) =>
        String(wishlistItem._id || wishlistItem.id) ===
        String(itemId)
    );

    if (alreadyExists) {
      return;
    }

    wishlist.push(item);

    localStorage.setItem(
      "clothSwapWishlist",
      JSON.stringify(wishlist)
    );

    setIsWishlisted(true);

    window.dispatchEvent(
      new Event("wishlistUpdated")
    );
  }

  function removeFromWishlist() {
    if (!item) {
      return;
    }

    const saved = localStorage.getItem("clothSwapWishlist");

    if (!saved) {
      setIsWishlisted(false);
      return;
    }

    try {
      const wishlist = JSON.parse(saved);

      const itemId = item._id || item.id;

      const updatedWishlist = wishlist.filter(
        (wishlistItem) =>
          String(wishlistItem._id || wishlistItem.id) !==
          String(itemId)
      );

      localStorage.setItem(
        "clothSwapWishlist",
        JSON.stringify(updatedWishlist)
      );

      setIsWishlisted(false);

      window.dispatchEvent(
        new Event("wishlistUpdated")
      );
    } catch (error) {
      console.error(error);
    }
  }

  function handleWishlist() {
    if (isWishlisted) {
      removeFromWishlist();
    } else {
      addToWishlist();
    }
  }

  /* ================================
     REQUEST SWAP
  ================================= */

  async function requestSwap() {
    if (!item) {
      return;
    }

    if (swapSending) {
      return;
    }

    const requester =
      localStorage.getItem("clothSwapUserName") ||
      "ClothSwap User";

    const clothingId = item._id || item.id;

    if (!clothingId) {
      setSwapMessageType("error");
      setSwapMessage(
        "Unable to send swap request."
      );

      setTimeout(function () {
        setSwapMessage("");
      }, 3500);

      return;
    }

   const owner =
  item.owner ||
  "ClothSwap User";

const requesterEmail =
  localStorage.getItem("clothswapUserEmail") ||
  localStorage.getItem("clothswapEmail") ||
  "";

/* Prevent requesting own clothing */

const isOwnClothing =
  item.ownerEmail
    ? item.ownerEmail.toLowerCase() ===
      requesterEmail.toLowerCase()
    : String(owner).trim().toLowerCase() ===
      String(requester).trim().toLowerCase();

if (isOwnClothing) {
  setSwapMessageType("error");

  setSwapMessage(
    "You cannot request your own clothing."
  );

  setTimeout(function () {
    setSwapMessage("");
  }, 3500);

  return;
}

setSwapSending(true);

    try {
      const response = await fetch(
        "http://localhost:5000/api/swap-requests",
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json"
          },

          body: JSON.stringify({
            clothingId: clothingId,
            requester: requester,
            requesterEmail:
  localStorage.getItem("clothswapUserEmail") ||
  localStorage.getItem("clothswapEmail") ||
  "",
            message:
              "I would like to swap for this clothing item."
          })
        }
      );

      const data = await response.json();

      if (data.success) {
        setSwapMessageType("success");

        setSwapMessage(
          "♻️ Swap Request Sent Successfully!"
        );
      } else {
        setSwapMessageType("error");

        setSwapMessage(
          data.message ||
            "Unable to send swap request."
        );
      }
    } catch (error) {
      console.error(
        "Swap request error:",
        error
      );

      setSwapMessageType("error");

      setSwapMessage(
        "Something went wrong. Please make sure the backend is running."
      );
    } finally {
      setSwapSending(false);

      setTimeout(function () {
        setSwapMessage("");
      }, 3500);
    }
  }

  /* ================================
     LOADING
  ================================= */

  if (loading) {
    return React.createElement(
      "div",
      {
        className:
          "container py-5 item-details-loading"
      },

      React.createElement(
        "div",
        {
          className:
            "text-center py-5"
        },

        React.createElement(
          "div",
          {
            className:
              "spinner-border",
            role: "status"
          }
        ),

        React.createElement(
          "p",
          {
            className:
              "mt-3"
          },
          "Loading item..."
        )
      )
    );
  }

  /* ================================
     ERROR
  ================================= */

  if (error || !item) {
    return React.createElement(
      "div",
      {
        className:
          "container py-5 item-details-error"
      },

      React.createElement(
        "div",
        {
          className:
            "text-center py-5"
        },

        React.createElement(
          "div",
          {
            className:
              "item-error-icon"
          },
          "!"
        ),

        React.createElement(
          "h2",
          null,
          error || "Item not found"
        ),

        React.createElement(
          "p",
          null,
          "We couldn't find this clothing item."
        ),

        React.createElement(
          "button",
          {
            className:
              "item-back-btn",
            onClick: () =>
              navigate("/browse")
          },
          "← Back to Browse"
        )
      )
    );
  }

  const title =
    item.title ||
    item.name ||
    "Clothing Item";

  const image =
    item.image ||
    "https://via.placeholder.com/800x900?text=ClothSwap";

  const category =
    item.category ||
    "Fashion";

  const size =
    item.size ||
    "N/A";

  const condition =
    item.condition ||
    "Good";

  const location =
    item.location ||
    "Location not available";

  const owner =
    item.owner ||
    "ClothSwap User";

  const price =
    item.price ||
    item.value ||
    0;

  const description =
    item.description ||
    "No description available for this item.";

  const status =
    item.status ||
    "Available";

  return React.createElement(
    "div",
    {
      className:
        "item-details-page"
    },

    /* ================================
       SWAP TOAST
    ================================= */

    swapMessage &&
      React.createElement(
        "div",
        {
          className:
            swapMessageType === "success"
              ? "swap-toast success"
              : "swap-toast error"
        },

        React.createElement(
          "div",
          {
            className:
              "swap-toast-icon"
          },
          swapMessageType === "success"
            ? "✓"
            : "!"
        ),

        React.createElement(
          "div",
          {
            className:
              "swap-toast-content"
          },

          React.createElement(
            "strong",
            null,
            swapMessageType === "success"
              ? "Success"
              : "Oops!"
          ),

          React.createElement(
            "span",
            null,
            swapMessage
          )
        )
      ),

    React.createElement(
      "div",
      {
        className:
          "container py-5"
      },

      /* BACK */

      React.createElement(
        "button",
        {
          className:
            "item-back-link",
          onClick: () =>
            navigate("/browse")
        },
        "← Back to Browse"
      ),

      React.createElement(
        "div",
        {
          className:
            "row g-5 align-items-start mt-2"
        },

        /* ================================
           IMAGE
        ================================= */

        React.createElement(
          "div",
          {
            className:
              "col-lg-6"
          },

          React.createElement(
            "div",
            {
              className:
                "item-details-image-box"
            },

            React.createElement(
              "img",
              {
                src: image,
                alt: title,
                className:
                  "item-details-image",

                onError: (e) => {
                  e.target.src =
                    "https://via.placeholder.com/800x900?text=ClothSwap";
                }
              }
            ),

            React.createElement(
              "span",
              {
                className:
                  "item-status-badge"
              },
              status
            )
          )
        ),

        /* ================================
           DETAILS
        ================================= */

        React.createElement(
          "div",
          {
            className:
              "col-lg-6"
          },

          React.createElement(
            "div",
            {
              className:
                "item-details-content"
            },

            React.createElement(
              "div",
              {
                className:
                  "item-details-label"
              },
              "♻️ CLOTHSWAP MARKETPLACE"
            ),

            React.createElement(
              "div",
              {
                className:
                  "item-details-category"
              },
              category
            ),

            React.createElement(
              "h1",
              null,
              title
            ),

            React.createElement(
              "div",
              {
                className:
                  "item-details-price"
              },
              "₹",
              price
            ),

            React.createElement(
              "p",
              {
                className:
                  "item-details-description"
              },
              description
            ),

            /* INFO GRID */

            React.createElement(
              "div",
              {
                className:
                  "item-details-info-grid"
              },

              React.createElement(
                "div",
                {
                  className:
                    "item-info-box"
                },

                React.createElement(
                  "span",
                  null,
                  "Category"
                ),

                React.createElement(
                  "strong",
                  null,
                  category
                )
              ),

              React.createElement(
                "div",
                {
                  className:
                    "item-info-box"
                },

                React.createElement(
                  "span",
                  null,
                  "Size"
                ),

                React.createElement(
                  "strong",
                  null,
                  size
                )
              ),

              React.createElement(
                "div",
                {
                  className:
                    "item-info-box"
                },

                React.createElement(
                  "span",
                  null,
                  "Condition"
                ),

                React.createElement(
                  "strong",
                  null,
                  condition
                )
              ),

              React.createElement(
                "div",
                {
                  className:
                    "item-info-box"
                },

                React.createElement(
                  "span",
                  null,
                  "Location"
                ),

                React.createElement(
                  "strong",
                  null,
                  "📍 ",
                  location
                )
              )
            ),

            /* OWNER */

            React.createElement(
              "div",
              {
                className:
                  "item-owner-box"
              },

              React.createElement(
                "div",
                {
                  className:
                    "item-owner-icon"
                },
                "👤"
              ),

              React.createElement(
                "div",
                null,

                React.createElement(
                  "small",
                  null,
                  "Listed by"
                ),

                React.createElement(
                  "strong",
                  null,
                  owner
                )
              )
            ),

            /* ACTIONS */

            React.createElement(
              "div",
              {
                className:
                  "item-details-actions"
              },

              /* WISHLIST */

              React.createElement(
                "button",
                {
                  className:
                    isWishlisted
                      ? "wishlist-action-btn wishlisted"
                      : "wishlist-action-btn",

                  onClick:
                    handleWishlist
                },

                React.createElement(
                  "i",
                  {
                    className:
                      isWishlisted
                        ? "bi bi-heart-fill"
                        : "bi bi-heart"
                  }
                ),

                isWishlisted
                  ? " Remove from Wishlist"
                  : " Add to Wishlist"
              ),

              /* REQUEST SWAP */

              React.createElement(
                "button",
                {
                  className:
                    "swap-request-btn",

                  onClick:
                    requestSwap,

                  disabled:
                    swapSending
                },

                swapSending
                  ? "⏳ Sending..."
                  : "♻️ Request Swap"
              )
            )
          )
        )
      )
    )
  );
}

export default ItemDetails;