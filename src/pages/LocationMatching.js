import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import API_URL from "../api";
let locationMatchingCache = null;

try {
  const savedCache = localStorage.getItem(
    "clothswapNearbyCache"
  );

  locationMatchingCache = savedCache
    ? JSON.parse(savedCache)
    : null;

  if (!Array.isArray(locationMatchingCache)) {
    locationMatchingCache = null;
  }
} catch (error) {
  locationMatchingCache = null;
}

function LocationMatching() {
  const [location, setLocation] = useState("All");
  const [category, setCategory] = useState("All");
  const [wishlist, setWishlist] = useState([]);
  const [swapMessage, setSwapMessage] = useState("");

  const [clothes, setClothes] = useState(
    Array.isArray(locationMatchingCache)
      ? locationMatchingCache
      : []
  );

     const [loading, setLoading] = useState(
    !Array.isArray(locationMatchingCache)
  );
useEffect(function () {
  try {
    const savedWishlist = JSON.parse(
      localStorage.getItem("clothSwapWishlist") || "[]"
    );
  
    setWishlist(
      Array.isArray(savedWishlist) ? savedWishlist : []
    );
  } catch (error) {
    console.log("Wishlist load error:", error);
    setWishlist([]);
  }
}, []);

 useEffect(function () {
  if (Array.isArray(locationMatchingCache)) {
    setClothes(locationMatchingCache);
    setLoading(false);
  }

  loadClothes();
}, []);

  function loadClothes() {
    fetch(`${API_URL}/api/clothes`)
      .then(function (response) {
        return response.json();
      })
     .then(function (data) {
  const items = Array.isArray(data.clothes)
    ? data.clothes
    : Array.isArray(data)
    ? data
    : [];

  locationMatchingCache = items;

  try {
    const cacheForStorage = items.map(function (item) {
      const cachedItem = { ...item };

      if (
        cachedItem.image &&
        String(cachedItem.image).startsWith("data:")
      ) {
        delete cachedItem.image;
      }

      return cachedItem;
    });

    localStorage.setItem(
      "clothswapNearbyCache",
      JSON.stringify(cacheForStorage)
    );
  } catch (error) {
    console.log("Nearby cache save error:", error);
  }

  setClothes(items);
  setLoading(false);
})
      .catch(function (error) {
        console.error("Location matching error:", error);
        setLoading(false);
      });
  }

  const locations = [
    "All",
    ...new Set(
      clothes
        .map(function (item) {
          return item.location;
        })
        .filter(Boolean)
    )
  ];

  const categories = [
    "All",
    ...new Set(
      clothes
        .map(function (item) {
          return item.category;
        })
        .filter(Boolean)
    )
  ];
function isInWishlist(itemId) {
  return wishlist.some(function (item) {
    return String(item._id || item.id) === String(itemId);
  });
}
function toggleWishlist(item) {
  const isLoggedIn =
    localStorage.getItem("clothswapLoggedIn") === "true";

  if (!isLoggedIn) {
    setSwapMessage("Please login to add clothes to your wishlist.");

    setTimeout(function () {
      window.location.href = "/login";
    }, 900);

    return;
  }

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

    if (
      clothing.image &&
      !String(clothing.image).startsWith("data:")
    ) {
      smallItem.image = clothing.image;
    }

    return smallItem;
  }

  let savedWishlist = [];

  try {
    savedWishlist = JSON.parse(
      localStorage.getItem("clothSwapWishlist") || "[]"
    );

    if (!Array.isArray(savedWishlist)) {
      savedWishlist = [];
    }
  } catch (error) {
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

  let updatedWishlist;

  if (alreadySaved) {
    updatedWishlist = savedWishlist.filter(function (savedItem) {
      return String(savedItem._id || savedItem.id) !== String(itemId);
    });

    setSwapMessage("Removed from your wishlist.");
  } else {
    updatedWishlist = savedWishlist.concat([
      getSmallWishlistItem(item)
    ]);

    setSwapMessage("Added to your wishlist ❤️");
  }

  try {
    localStorage.setItem(
      "clothSwapWishlist",
      JSON.stringify(updatedWishlist)
    );

    setWishlist(updatedWishlist);
    window.dispatchEvent(new Event("wishlistUpdated"));
  } catch (error) {
    console.error("Wishlist save error:", error);
    setSwapMessage("Unable to save wishlist. Please try again.");
  }

  setTimeout(function () {
    setSwapMessage("");
  }, 2500);
}
  const filteredClothes = clothes.filter(function (item) {
    const locationMatch =
      location === "All" ||
      String(item.location || "").toLowerCase() ===
        String(location).toLowerCase();

    const categoryMatch =
      category === "All" ||
      String(item.category || "").toLowerCase() ===
        String(category).toLowerCase();

    return locationMatch && categoryMatch;
  });

  return React.createElement(
    "div",
    { className: "location-matching-page" },
    swapMessage &&
  React.createElement(
    "div",
    {
      className: "swap-toast swap-toast-success"
    },

    React.createElement(
      "div",
      { className: "swap-toast-icon" },
      "✓"
    ),

    React.createElement(
      "div",
      { className: "swap-toast-content" },

      React.createElement("strong", null, "Success"),

      React.createElement("span", null, swapMessage)
    ),

    React.createElement(
      "button",
      {
        className: "swap-toast-close",
        type: "button",
        onClick: function () {
          setSwapMessage("");
        }
      },
      "×"
    )
  ),
    React.createElement(
      "div",
      { className: "location-matching-container" },

      React.createElement(
        "div",
        { className: "location-matching-header" },

      React.createElement(
  "span",
  { className: "clothswap-brand-label" },
  "♻️ CLOTHSWAP MARKETPLACE"
),
        React.createElement(
          "h1",
          null,
          "Find Swaps ",
          React.createElement(
            "em",
            null,
            "Near You"
          )
        ),

        React.createElement(
          "p",
          null,
          "Discover clothing exchange opportunities in your area."
        )
      ),


      React.createElement(
        "div",
        { className: "location-filter-card" },

        React.createElement(
          "div",
          { className: "location-filter-title" },

          React.createElement(
            "h2",
            null,
            "Find Nearby Clothing"
          ),

          React.createElement(
            "p",
            null,
            "Choose a location and category to find available swap opportunities."
          )
        ),

        React.createElement(
          "div",
          { className: "location-filter-grid" },


          React.createElement(
            "div",
            { className: "location-filter-field" },

            React.createElement(
              "label",
              null,
              "📍 Location"
            ),

            React.createElement(
              "select",
              {
                value: location,
                onChange: function (e) {
                  setLocation(e.target.value);
                }
              },

              locations.map(function (item) {
                return React.createElement(
                  "option",
                  {
                    key: item,
                    value: item
                  },
                  item
                );
              })
            )
          ),


          React.createElement(
            "div",
            { className: "location-filter-field" },

            React.createElement(
              "label",
              null,
              "👕 Category"
            ),

            React.createElement(
              "select",
              {
                value: category,
                onChange: function (e) {
                  setCategory(e.target.value);
                }
              },

              categories.map(function (item) {
                return React.createElement(
                  "option",
                  {
                    key: item,
                    value: item
                  },
                  item
                );
              })
            )
          )
        )
      ),


      React.createElement(
        "div",
        { className: "location-results-header" },

        React.createElement(
          "h2",
          null,
          "Nearby Swap Opportunities"
        ),

        React.createElement(
          "span",
          null,
          filteredClothes.length,
          " items found"
        )
      ),

      loading
        ? React.createElement(
            "div",
            {
              className: "location-loading"
            },
            "Finding clothing near you..."
          )
        : filteredClothes.length === 0
        ? React.createElement(
            "div",
            {
              className: "location-empty"
            },

            React.createElement(
              "div",
              {
                className: "location-empty-icon"
              },
              "📍"
            ),

            React.createElement(
              "h3",
              null,
              "No clothing found"
            ),

            React.createElement(
              "p",
              null,
              "Try selecting another location or category."
            )
          )
        : React.createElement(
            "div",
            {
              className: "location-clothing-grid"
            },

            filteredClothes.map(function (item) {
              const itemId = item._id || item.id;

              const itemName =
                item.title ||
                item.name ||
                "Clothing Item";

              const itemImage = item.image || "";

              return React.createElement(
                "div",
                {
                  className: "location-clothing-card",
                  key: itemId
                },

                itemImage &&
                  React.createElement(
                    "div",
                    {
                      className: "location-image-wrapper"
                    },
React.createElement(
  "button",
  {
    type: "button",
    className:
      "browse-wishlist-btn " +
      (isInWishlist(itemId)
        ? "browse-wishlist-active"
        : ""),
    onClick: function () {
      toggleWishlist(item);
    },
    title: isInWishlist(itemId)
      ? "Remove from wishlist"
      : "Add to wishlist"
  },
  isInWishlist(itemId) ? "♥" : "♡"
),
                   React.createElement("img", {
  src: itemImage,
  alt: itemName,
  className: "location-clothing-image",
  loading: "lazy",
  decoding: "async"
                   })
                ),
                React.createElement(
                  "div",
                  {
                    className: "location-clothing-info"
                  },

                  React.createElement(
                    "span",
                    {
                      className: "location-category"
                    },
                    item.category || "Clothing"
                  ),

                  React.createElement(
                    "h3",
                    null,
                    itemName
                  ),

                  React.createElement(
                    "p",
                    {
                      className: "location-brand"
                    },
                    item.brand || "Brand not specified"
                  ),

                  React.createElement(
                    "div",
                    {
                      className: "location-details"
                    },

                    React.createElement(
                      "span",
                      null,
                      "Size: ",
                      item.size || "N/A"
                    ),

                    React.createElement(
                      "span",
                      null,
                      item.condition || "Good"
                    )
                  ),

                  React.createElement(
                    "div",
                    {
                      className: "location-place"
                    },
                    "📍 ",
                    item.location || "Location not specified"
                  ),

                  React.createElement(
                    Link,
                    {
                      to: "/item/" + itemId,
                      className: "location-view-button"
                    },
                    "View Item"
                  )
                )
              );
            })
          )
    )
  );
}

export default LocationMatching;
