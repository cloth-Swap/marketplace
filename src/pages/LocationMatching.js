import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import API_URL from "../api";

function LocationMatching() {
  const [clothes, setClothes] = useState([]);
  const [location, setLocation] = useState("All");
  const [category, setCategory] = useState("All");
  const [loading, setLoading] = useState(true);

  useEffect(function () {
    loadClothes();
  }, []);

  function loadClothes() {
    fetch(`${API_URL}/api/clothes`)
      .then(function (response) {
        return response.json();
      })
      .then(function (data) {
        const items = data.clothes || data || [];
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

    React.createElement(
      "div",
      { className: "location-matching-container" },

      React.createElement(
        "div",
        { className: "location-matching-header" },

        React.createElement(
          "div",
          { className: "location-matching-label" },
          "📍 CLOTHSWAP"
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

                    React.createElement("img", {
                      src: itemImage,
                      alt: itemName,
                      className: "location-clothing-image"
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