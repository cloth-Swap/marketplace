
import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import API_URL from "../api";

function ItemDetails() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [item, setItem] = useState(null);
  const [sellerProfile, setSellerProfile] = useState(null);
const [sellerProfileLoading, setSellerProfileLoading] = useState(false);
useEffect(() => {
  if (!item || !(item._id || item.id)) return;

  let cancelled = false;

  async function loadSellerProfile() {
    setSellerProfileLoading(true);

    try {
      const response = await fetch(
        `${API_URL}/api/clothes/${item._id || item.id}/seller-profile`
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Unable to load seller profile");
      }

      if (!cancelled) {
        setSellerProfile(data.seller);
      }
    } catch (error) {
      console.error("Seller profile error:", error);

      if (!cancelled) {
        setSellerProfile(null);
      }
    } finally {
      if (!cancelled) {
        setSellerProfileLoading(false);
      }
    }
  }

  loadSellerProfile();

  return function () {
    cancelled = true;
  };
}, [item]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isWishlisted, setIsWishlisted] = useState(false);

  const [swapMessage, setSwapMessage] = useState("");
  const [swapMessageType, setSwapMessageType] = useState("success");
  const [swapSending, setSwapSending] = useState(false);

  const [reportSending, setReportSending] = useState(false);
  const [reportChecking, setReportChecking] = useState(false);
  const [reportReason, setReportReason] = useState("");
  const [reportDescription, setReportDescription] = useState("");
  const [showReportForm, setShowReportForm] = useState(false);

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

      setIsWishlisted(
        Array.isArray(wishlist) &&
        wishlist.some(
          (wishlistItem) =>
            String(wishlistItem._id || wishlistItem.id) === String(id)
        )
      );
    } catch (error) {
      setIsWishlisted(false);
    }
  }

 
async function loadItem() {
  setLoading(true);
  setError("");

  try {
    const response = await fetch(
      `${API_URL}/api/clothes/${id}`
    );

    if (!response.ok) {
      throw new Error("Unable to load clothing item.");
    }

    const data = await response.json();

    const selectedItem =
      data.clothing ||
      data.item ||
      data;

    if (
      !selectedItem ||
      !(selectedItem._id || selectedItem.id)
    ) {
      setItem(null);
      setError("Clothing item not found.");
    } else {
      setItem(selectedItem);
    }

  } catch (err) {
    console.error("Item loading error:", err);

    setError(
      "Cannot connect to server. Make sure backend is running."
    );
  } finally {
    setLoading(false);
  }
}

 function addToWishlist() {
  if (!item) return;

  const itemId = item._id || item.id;
  if (!itemId) return;

  function getSmallWishlistItem(clothing) {
    const smallItem = {
      _id: String(clothing._id || clothing.id),
      title: clothing.title || clothing.name || "Clothing Item",
      name: clothing.name || clothing.title || "Clothing Item",
      category: clothing.category || "Fashion",
      brand: clothing.brand || "",
      size: clothing.size || "N/A",
      condition: clothing.condition || "Good",
      location: clothing.location || "",
      price: clothing.price || 0,
      value: clothing.value || 0,
      status: clothing.status || "Available",
      owner: clothing.owner || "",
      ownerEmail: clothing.ownerEmail || ""
    };

    // Base64 image localStorage માં save નહીં થાય
    if (
      clothing.image &&
      !String(clothing.image).startsWith("data:")
    ) {
      smallItem.image = clothing.image;
    }

    return smallItem;
  }

  try {
    let savedWishlist = JSON.parse(
      localStorage.getItem("clothSwapWishlist") || "[]"
    );

    if (!Array.isArray(savedWishlist)) {
      savedWishlist = [];
    }

    savedWishlist = savedWishlist
      .filter(function (savedItem) {
        return savedItem && (savedItem._id || savedItem.id);
      })
      .map(getSmallWishlistItem);

    const alreadySaved = savedWishlist.some(function (savedItem) {
      return String(savedItem._id || savedItem.id) === String(itemId);
    });

    if (!alreadySaved) {
      savedWishlist.push(getSmallWishlistItem(item));
    }

    localStorage.setItem(
      "clothSwapWishlist",
      JSON.stringify(savedWishlist)
    );

    setIsWishlisted(true);

    window.dispatchEvent(new Event("wishlistUpdated"));
  } catch (error) {
    console.error("Wishlist save error:", error);
  }
}

function removeFromWishlist() {
  if (!item) return;

  const itemId = item._id || item.id;

  try {
    let savedWishlist = JSON.parse(
      localStorage.getItem("clothSwapWishlist") || "[]"
    );

    if (!Array.isArray(savedWishlist)) {
      savedWishlist = [];
    }

    const updatedWishlist = savedWishlist.filter(function (savedItem) {
      return String(savedItem._id || savedItem.id) !== String(itemId);
    });

    localStorage.setItem(
      "clothSwapWishlist",
      JSON.stringify(updatedWishlist)
    );

    setIsWishlisted(false);

    window.dispatchEvent(new Event("wishlistUpdated"));
  } catch (error) {
    console.error("Wishlist remove error:", error);
  }
}
  function removeFromWishlist() {
    if (!item) return;

    try {
      const saved = localStorage.getItem("clothSwapWishlist");
      const wishlist = saved ? JSON.parse(saved) : [];
      const itemId = item._id || item.id;

      const updatedWishlist = wishlist.filter(
        (wishlistItem) =>
          String(wishlistItem._id || wishlistItem.id) !== String(itemId)
      );

      localStorage.setItem(
        "clothSwapWishlist",
        JSON.stringify(updatedWishlist)
      );

      setIsWishlisted(false);
      window.dispatchEvent(new Event("wishlistUpdated"));
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

  function showMessage(message, type) {
    setSwapMessageType(type);
    setSwapMessage(message);

    setTimeout(function () {
      setSwapMessage("");
    }, 3500);
  }

  /* REQUEST SWAP */

  async function requestSwap() {
    if (!item || swapSending) return;

    const token = localStorage.getItem("clothswapToken");

    if (!token || !localStorage.getItem("clothswapLoggedIn")) {
      navigate("/login");
      return;
    }

    const requester =
      localStorage.getItem("clothSwapUserName") ||
      localStorage.getItem("clothswapUserName") ||
      "ClothSwap User";

    const requesterEmail =
      localStorage.getItem("clothswapUserEmail") ||
      localStorage.getItem("clothswapEmail") ||
      "";

    const ownerEmail = item.ownerEmail || "";

    const isOwnClothing = ownerEmail
      ? ownerEmail.toLowerCase() === requesterEmail.toLowerCase()
      : String(item.owner || "").trim().toLowerCase() ===
        requester.trim().toLowerCase();

    if (isOwnClothing) {
      showMessage("You cannot request your own clothing.", "error");
      return;
    }

    const clothingId = item._id || item.id;

    if (!clothingId) {
      showMessage("Unable to send swap request.", "error");
      return;
    }

    setSwapSending(true);

    try {
      const response = await fetch(
        `${API_URL}/api/swap-requests`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({
            clothingId,
            requester,
            requesterEmail,
            message: "I would like to swap for this clothing item."
          })
        }
      );

      const data = await response.json();

      if (response.ok && data.success) {
        showMessage(
          "♻️ Swap Request Sent Successfully!",
          "success"
        );
      } else {
        showMessage(
          data.message || "Unable to send swap request.",
          "error"
        );
      }
    } catch (error) {
      console.error("Swap request error:", error);
      showMessage(
        "Something went wrong. Please make sure the backend is running.",
        "error"
      );
    } finally {
      setSwapSending(false);
    }
  }

  /* REPORT LISTING */
  async function handleReportClick() {
  const token = localStorage.getItem("clothswapToken");

  if (!token || !localStorage.getItem("clothswapLoggedIn")) {
    navigate("/login");
    return;
  }

  if (reportChecking) return;

  setReportChecking(true);

  try {
    const response = await fetch(
      `${API_URL}/api/clothes/${id}/report/check`,
      {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    );

    const data = await response.json();

    if (response.ok && data.success) {
      if (data.alreadyReported) {
        setShowReportForm(false);
        showMessage(
          "You have already reported this listing.",
          "error"
        );
        return;
      }

      setShowReportForm(true);
    } else {
      showMessage(
        data.message || "Unable to check report status.",
        "error"
      );
    }
  } catch (error) {
    console.error("Report check error:", error);
    showMessage("Unable to check report status.", "error");
  } finally {
    setReportChecking(false);
  }
}

  async function submitReport() {
    const token = localStorage.getItem("clothswapToken");

    if (!token || !localStorage.getItem("clothswapLoggedIn")) {
      navigate("/login");
      return;
    }

    if (!reportReason) {
      showMessage("Please select a reason for reporting.", "error");
      return;
    }

    if (reportSending) return;

    setReportSending(true);

    try {
      const response = await fetch(
        `${API_URL}/api/clothes/${id}/report`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({
            reason: reportReason,
            description: reportDescription
          })
        }
      );

      const data = await response.json();

      if (response.ok && data.success) {
        showMessage(
          data.message || "Report submitted successfully.",
          "success"
        );

        setReportReason("");
        setReportDescription("");
        setShowReportForm(false);
      } else {
        showMessage(
          data.message || "Unable to submit report.",
          "error"
        );
      }
    } catch (error) {
      console.error("Report listing error:", error);
      showMessage(
        "Something went wrong while submitting the report.",
        "error"
      );
    } finally {
      setReportSending(false);
    }
  }

  /* LOADING */

  if (loading) {
    return React.createElement(
      "div",
      { className: "container py-5 item-details-loading" },
      React.createElement(
        "div",
        { className: "text-center py-5" },
        React.createElement("div", {
          className: "spinner-border",
          role: "status"
        }),
        React.createElement(
          "p",
          { className: "mt-3" },
          "Loading item..."
        )
      )
    );
  }

  /* ERROR */

  if (error || !item) {
    return React.createElement(
      "div",
      { className: "container py-5 item-details-error" },
      React.createElement(
        "div",
        { className: "text-center py-5" },
        React.createElement(
          "div",
          { className: "item-error-icon" },
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
            className: "item-back-btn",
            onClick: () => navigate("/browse")
          },
          "← Back to Browse"
        )
      )
    );
  }

  const title = item.title || item.name || "Clothing Item";
  const image =
    item.image ||
    "https://via.placeholder.com/800x900?text=ClothSwap";
  const category = item.category || "Fashion";
  const size = item.size || "N/A";
  const condition = item.condition || "Good";
  const location = item.location || "Location not available";
  const owner = item.owner || "ClothSwap User";
  const price = item.price || item.value || 0;
  const description =
    item.description || "No description available for this item.";
  const status = item.status || "Available";

  return React.createElement(
    "div",
    { className: "item-details-page" },

    /* TOAST */

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
          { className: "swap-toast-icon" },
          swapMessageType === "success" ? "✓" : "!"
        ),
        React.createElement(
          "div",
          { className: "swap-toast-content" },
          React.createElement(
            "strong",
            null,
            swapMessageType === "success" ? "Success" : "Oops!"
          ),
          React.createElement("span", null, swapMessage)
        )
      ),

    React.createElement(
      "div",
      { className: "container py-5" },

      /* BACK */

      React.createElement(
        "button",
        {
          className: "item-back-link",
          onClick: () => navigate("/browse")
        },
        "← Back to Browse"
      ),

      React.createElement(
        "div",
        { className: "row g-5 align-items-start mt-2" },

        /* IMAGE */

        React.createElement(
          "div",
          { className: "col-lg-6" },
          React.createElement(
            "div",
            { className: "item-details-image-box" },
            React.createElement("img", {
              src: image,
              alt: title,
              className: "item-details-image",
              onError: (e) => {
                e.target.src =
                  "https://via.placeholder.com/800x900?text=ClothSwap";
              }
            }),
            React.createElement(
              "span",
              { className: "item-status-badge" },
              status
            )
          )
        ),

        /* DETAILS */

        React.createElement(
          "div",
          { className: "col-lg-6" },
          React.createElement(
            "div",
            { className: "item-details-content" },

            React.createElement(
              "div",
              { className: "item-details-label" },
              "♻️ CLOTHSWAP MARKETPLACE"
            ),

            React.createElement(
              "div",
              { className: "item-details-category" },
              category
            ),

            React.createElement("h1", null, title),

            React.createElement(
              "div",
              { className: "item-details-price" },
              "₹",
              price
            ),

            React.createElement(
              "p",
              { className: "item-details-description" },
              description
            ),

            /* INFO GRID */

            React.createElement(
              "div",
              { className: "item-details-info-grid" },

              React.createElement(
                "div",
                { className: "item-info-box" },
                React.createElement("span", null, "Category"),
                React.createElement("strong", null, category)
              ),

              React.createElement(
                "div",
                { className: "item-info-box" },
                React.createElement("span", null, "Size"),
                React.createElement("strong", null, size)
              ),

              React.createElement(
                "div",
                { className: "item-info-box" },
                React.createElement("span", null, "Condition"),
                React.createElement("strong", null, condition)
              ),

              React.createElement(
                "div",
                { className: "item-info-box" },
                React.createElement("span", null, "Location"),
                React.createElement(
                  "strong",
                  null,
                  "📍 ",
                  location
                )
              )
            ),

       /* SELLER PROFILE */

React.createElement(
  "div",
  {
    className: "item-owner-box",
    onClick: function () {
      navigate("/profile/" + (item._id || item.id));
    },
    style: {
      display: "flex",
      alignItems: "center",
      gap: "14px",
      padding: "14px 18px",
      borderRadius: "14px",
      cursor: "pointer",
      background: "#fff8fc",
      border: "1px solid #f0d9eb"
    }
  },

  sellerProfile && sellerProfile.profilePhoto
    ? React.createElement("img", {
        src: sellerProfile.profilePhoto,
        alt: "Seller",
        style: {
          width: "52px",
          height: "52px",
          borderRadius: "50%",
          objectFit: "cover"
        }
      })
    : React.createElement(
        "div",
        {
          className: "item-owner-icon",
          style: {
            width: "52px",
            height: "52px",
            borderRadius: "50%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center"
          }
        },
        "👤"
      ),

  React.createElement(
    "strong",
    {
      style: {
        fontSize: "16px",
        color: "#49334c"
      }
    },
    sellerProfile ? sellerProfile.name : owner
  )
),

            /* ACTION BUTTONS */

            React.createElement(
              "div",
              { className: "item-details-actions" },

              React.createElement(
                "button",
                {
                  className: isWishlisted
                    ? "wishlist-action-btn wishlisted"
                    : "wishlist-action-btn",
                  onClick: handleWishlist
                },
                React.createElement("i", {
                  className: isWishlisted
                    ? "bi bi-heart-fill"
                    : "bi bi-heart"
                }),
                isWishlisted
                  ? " Remove from Wishlist"
                  : " Add to Wishlist"
              ),

              React.createElement(
                "button",
                {
                  className: "swap-request-btn",
                  onClick: requestSwap,
                  disabled: swapSending
                },
                swapSending ? "⏳ Sending..." : "♻️ Request Swap"
              ),

              React.createElement(
                "button",
                {
                  className: "report-listing-btn",
                  type: "button",
                 onClick: handleReportClick,
disabled: reportChecking
                },
                "🚩 Report Listing"
              )
            ),

            /* REPORT FORM */

            showReportForm &&
              React.createElement(
                "div",
                { className: "report-listing-form" },

                React.createElement(
                  "h3",
                  null,
                  "🚩 Report this Listing"
                ),

                React.createElement(
                  "select",
                  {
                    className: "form-select mb-3",
                    value: reportReason,
                    onChange: (e) => setReportReason(e.target.value)
                  },
                  React.createElement(
                    "option",
                    { value: "" },
                    "Select a reason"
                  ),
                  React.createElement(
                    "option",
                    { value: "Inappropriate Content" },
                    "Inappropriate Content"
                  ),
                  React.createElement(
                    "option",
                    { value: "Fake Listing" },
                    "Fake Listing"
                  ),
                  React.createElement(
                    "option",
                    { value: "Misleading Information" },
                    "Misleading Information"
                  ),
                  React.createElement(
                    "option",
                    { value: "Prohibited Item" },
                    "Prohibited Item"
                  ),
                  React.createElement(
                    "option",
                    { value: "Other" },
                    "Other"
                  )
                ),

                React.createElement("textarea", {
                  className: "form-control mb-3",
                  placeholder: "Describe the issue (optional)...",
                  rows: 3,
                  value: reportDescription,
                  onChange: (e) =>
                    setReportDescription(e.target.value)
                }),

                React.createElement(
                  "button",
                  {
                    type: "button",
                    className: "btn btn-outline-danger",
                    onClick: submitReport,
                    disabled: reportSending
                  },
                  reportSending
                    ? "Submitting..."
                    : "🚩 Submit Report"
                )
              )
          )
        )
      )
    )
  );
}

export default ItemDetails;
