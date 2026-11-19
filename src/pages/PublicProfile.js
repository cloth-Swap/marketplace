
import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import API_URL from "../api";
import "./PublicProfile.css";
let publicProfileCache = {};

function ProfileIcon({ type, size = 24 }) {
  const paths = {
    back: "M19 12H5 M12 19l-7-7 7-7",
    pin: "M20 10c0 5-8 12-8 12S4 15 4 10a8 8 0 1 1 16 0Z M12 10h.01",
    calendar: "M8 2v4 M16 2v4 M3 10h18 M5 4h14a2 2 0 0 1 2 2v14H3V6a2 2 0 0 1 2-2Z M8 14h2 M14 14h2 M8 18h2",
    swap: "M17 3l4 4-4 4 M3 7h18 M7 21l-4-4 4-4 M21 17H3",
    hanger: "M12 3a3 3 0 0 0-3 3 M12 3a3 3 0 0 1 3 3c0 2-3 2-3 4 M12 10 3 17a2 2 0 0 0 1 3h16a2 2 0 0 0 1-3l-9-7Z",
    heart: "M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8l1.1 1.1L12 21l7.8-7.5 1.1-1.1a5.5 5.5 0 0 0-.1-7.8Z",
    shirt: "M16 4l4 2 2 5-4 2-2-3v10H8V10l-2 3-4-2 2-5 4-2a4 4 0 0 0 8 0Z",
    star: "m12 3 2.8 5.7 6.2.9-4.5 4.4 1.1 6.2-5.6-3-5.6 3 1.1-6.2L3 9.6l6.2-.9L12 3Z",
    check: "m5 12 4 4L19 6"
  };

  return React.createElement(
    "svg",
    {
      width: size,
      height: size,
      viewBox: "0 0 24 24",
      fill: "none",
      stroke: "currentColor",
      strokeWidth: 2,
      strokeLinecap: "round",
      strokeLinejoin: "round",
      className: "profile-icon"
    },
    React.createElement("path", { d: paths[type] || paths.heart })
  );
}

function PublicProfile() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [seller, setSeller] = useState(null);
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
useEffect(() => {
  let cancelled = false;
  const cachedProfile = publicProfileCache[id];

  if (cachedProfile) {
    setSeller(cachedProfile.seller);
    setListings(cachedProfile.listings || []);
    setLoading(false);
    setError("");
  } else {
    setLoading(true);
    setError("");
    setSeller(null);
    setListings([]);
  }

  async function loadPublicProfile() {
    try {
      const response = await fetch(
        `${API_URL}/api/clothes/${id}/seller-profile`
      );
      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Unable to load seller profile.");
      }

      if (!cancelled) {
        const profileData = {
          seller: data.seller,
          listings: data.listings || []
        };

        publicProfileCache[id] = profileData;
        setSeller(profileData.seller);
        setListings(profileData.listings);
        setError("");
      }
    } catch (err) {
      console.error("Public profile error:", err);

      if (!cancelled && !cachedProfile) {
        setError(err.message || "Unable to load seller profile.");
      }
    } finally {
      if (!cancelled) {
        setLoading(false);
      }
    }
  }

  loadPublicProfile();

  return () => {
    cancelled = true;
  };
}, [id]);

  if (loading) {
    return React.createElement(
      "div",
      { className: "public-profile-page" },
      React.createElement("div", { className: "profile-loading" }, "Loading seller profile...")
    );
  }

  if (error || !seller) {
    return React.createElement(
      "div",
      { className: "public-profile-page" },
      React.createElement(
        "div",
        { className: "profile-error" },
        React.createElement("h3", null, error || "Seller profile not found."),
        React.createElement(
          "button",
          {
            className: "public-profile-back",
            onClick: function () { navigate(-1); }
          },
          React.createElement(ProfileIcon, { type: "back", size: 20 }),
          " Back"
        )
      )
    );
  }

  const memberDate = seller.memberSince
    ? new Date(seller.memberSince).toLocaleDateString("en-GB")
    : "N/A";

  return React.createElement(
    "div",
    { className: "public-profile-page" },

    React.createElement("div", { className: "profile-bg-shape profile-bg-one" }),
    React.createElement("div", { className: "profile-bg-shape profile-bg-two" }),

    React.createElement(
      "div",
      { className: "public-profile-container" },

      React.createElement(
        "button",
        {
          className: "public-profile-back",
          onClick: function () { navigate(-1); }
        },
        React.createElement(ProfileIcon, { type: "back", size: 22 }),
        " Back"
      ),

      React.createElement(
        "section",
        { className: "public-profile-card" },

        React.createElement("div", { className: "profile-decoration profile-decoration-left" }),
        React.createElement("div", { className: "profile-decoration profile-decoration-right" }),

        React.createElement(
          "div",
          { className: "profile-photo-wrap" },

          seller.profilePhoto
            ? React.createElement("img", {
                src: seller.profilePhoto,
                alt: "Seller Profile",
                className: "public-profile-photo"
              })
            : React.createElement(
                "div",
                { className: "public-profile-photo profile-photo-placeholder" },
                "👤"
              ),

          React.createElement(
            "span",
            { className: "profile-check-badge" },
            React.createElement(ProfileIcon, { type: "check", size: 22 })
          )
        ),

        React.createElement("h1", { className: "public-profile-name" }, seller.name),

        React.createElement(
          "p",
          { className: "public-profile-location" },
          React.createElement(ProfileIcon, { type: "pin", size: 19 }),
          seller.location || "Location not specified"
        ),

        React.createElement(
          "p",
          { className: "public-profile-bio" },
          seller.bio || "No bio added yet."
        ),

        React.createElement(
          "div",
          { className: "public-profile-stats" },

          React.createElement(
            "div",
            { className: "public-profile-stat" },
            React.createElement(
              "span",
              { className: "profile-stat-icon calendar-icon" },
              React.createElement(ProfileIcon, { type: "calendar", size: 32 })
            ),
            React.createElement(
              "div",
              { className: "profile-stat-content" },
              React.createElement("span", null, "Member Since"),
              React.createElement("strong", null, memberDate)
            )
          ),

          React.createElement(
            "div",
            { className: "public-profile-stat" },
            React.createElement(
              "span",
              { className: "profile-stat-icon swap-icon" },
              React.createElement(ProfileIcon, { type: "swap", size: 34 })
            ),
            React.createElement(
              "div",
              { className: "profile-stat-content" },
              React.createElement("span", null, "Completed Swaps"),
              React.createElement("strong", null, seller.completedSwaps || 0)
            )
          )
        )
      ),

      React.createElement(
        "div",
        { className: "profile-listings-heading" },
        React.createElement(ProfileIcon, { type: "hanger", size: 43 }),
        React.createElement("h2", { className: "public-profile-listings-title" }, "Other Available Listings"),
        React.createElement("div", { className: "profile-heading-line" }),
        React.createElement(ProfileIcon, { type: "heart", size: 30 })
      ),

      listings.length === 0
        ? React.createElement(
            "p",
            { className: "public-profile-empty" },
            "No other available listings."
          )

        : React.createElement(
            "div",
            { className: "public-profile-listings" },

            listings.map(function (listing) {
              return React.createElement(
                "div",
                {
                  key: listing._id,
                  className: "public-profile-listing-card",
                  onClick: function () {
                    navigate("/item/" + listing._id);
                  }
                },

                React.createElement(
                  "div",
                  { className: "profile-listing-image-wrap" },

                  listing.image
                    ? React.createElement("img", {
                        src: listing.image,
                        alt: listing.title || "Clothing",
                        className: "public-profile-listing-image"
                      })
                    : React.createElement(
                        "div",
                        { className: "public-profile-listing-image profile-listing-no-image" },
                        "No Image"
                      ),

                  React.createElement(
                    "span",
                    { className: "profile-listing-heart" },
                    React.createElement(ProfileIcon, { type: "heart", size: 27 })
                  )
                ),

                React.createElement(
                  "div",
                  { className: "profile-listing-details" },

                  React.createElement("h3", null, listing.title || "Untitled"),

                  React.createElement(
                    "span",
                    { className: "profile-listing-category" },
                    listing.category || "Clothing"
                  ),

                  React.createElement(
                    "div",
                    { className: "profile-listing-meta" },

                    React.createElement(
                      "span",
                      null,
                      React.createElement(ProfileIcon, { type: "shirt", size: 23 }),
                      " Size: ",
                      listing.size || "N/A"
                    ),

                    React.createElement(
                      "span",
                      { className: "profile-listing-condition" },
                      React.createElement(ProfileIcon, { type: "star", size: 23 }),
                      listing.condition || "N/A"
                    )
                  )
                )
              );
            })
          )
    )
  );
}

export default PublicProfile;
