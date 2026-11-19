
import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import API_URL from "../api";

function SwapCalculator() {
  const categoryValues = {
    Dresses: 350,
    Shirts: 250,
    "T-Shirts": 200,
    Tops: 220,
    Jeans: 400,
    Trousers: 350,
    Shorts: 250,
    Skirts: 300,
    Jackets: 500,
    Hoodies: 400,
    Sweaters: 350,
    Coats: 600,
    Blazers: 550,
    Kurtis: 300,
    Sarees: 600,
    Lehengas: 800,
    Leggings: 180,
    Jumpsuits: 450,
    Other: 200
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
  const [myListings, setMyListings] = useState([]);
const [allListings, setAllListings] = useState([]);
const [selectedMyItem, setSelectedMyItem] = useState("");
const [loadingMatches, setLoadingMatches] = useState(true);
const [matchingError, setMatchingError] = useState("");
const [sendingRequestId, setSendingRequestId] = useState("");
const [toast, setToast] = useState(null);
const [sentSwapRequests, setSentSwapRequests] = useState([]);

useEffect(function () {
  async function loadClothes() {
    try {
      const token = localStorage.getItem("clothswapToken");

      const [myResponse, allResponse] = await Promise.all([
        fetch(API_URL + "/api/my-listings", {
          headers: {
            Authorization: "Bearer " + token
          }
        }),
        fetch(API_URL + "/api/clothes")
      ]);

      if (!myResponse.ok || !allResponse.ok) {
        throw new Error("Unable to load clothing listings");
      }

      const myData = await myResponse.json();
      const allData = await allResponse.json();

const myItems = (myData.listings || []).filter(function (item) {
  return (
    item.status === "Available" &&
    item.isDeleted !== true &&
    (item.listingStatus === "Available" ||
      item.listingStatus === undefined)
  );
});
const allItems = Array.isArray(allData)
  ? allData
  : allData.clothes || allData.listings || allData.data || [];
      setMyListings(myItems);
      setAllListings(allItems);

      if (myItems.length > 0) {
        setSelectedMyItem(myItems[0]._id);
      }
    } catch (error) {
      setMatchingError(error.message);
    } finally {
      setLoadingMatches(false);
    }
  }

  loadClothes();
}, []);
useEffect(function () {
  const userEmail =
    localStorage.getItem("clothswapUserEmail") ||
    localStorage.getItem("clothswapEmail") ||
    "";

  if (!userEmail) {
    setSentSwapRequests([]);
    return;
  }

  fetch(
    API_URL + "/api/swap-requests?userEmail=" +
    encodeURIComponent(userEmail)
  )
    .then(function (response) {
      if (!response.ok) {
        throw new Error("Unable to load swap requests");
      }
      return response.json();
    })
    .then(function (data) {
      const requests = Array.isArray(data) ? data : [];

      setSentSwapRequests(
        requests.filter(function (request) {
          return String(request.requesterEmail || "").toLowerCase() ===
            String(userEmail).toLowerCase();
        })
      );
    })
    .catch(function (error) {
      console.log("Swap requests load error:", error);
    });
}, []);

  function calculateItemValue(category, brand, condition) {
    const baseValue = categoryValues[category] || 200;
    const brandFactor = brandMultiplier[brand] || 0.9;
    const conditionFactor = conditionMultiplier[condition] || 0.65;
    

    return Math.round(baseValue * brandFactor * conditionFactor);
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
      yourValue,
      otherValue,
      difference,
      status,
      statusClass
    });
  }
    function showToast(type, message) {
    setToast({
      type: type,
      message: message
    });

    setTimeout(function () {
      setToast(null);
    }, 3500);
  }
async function sendSwapRequest(clothingId) {
  try {
   
    setSendingRequestId(clothingId);

    const response = await fetch(
      API_URL + "/api/swap-requests",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization:
            "Bearer " + localStorage.getItem("clothswapToken")
        },
        body: JSON.stringify({
          clothingId: clothingId,
          message: "I found your clothing through Automatic Matching."
        })
      }
    );

    const data = await response.json();

    if (!response.ok) {
  showToast(
    "error",
    data.message || "Unable to send swap request."
  );
  return;
}

showToast("success", "Swap request sent successfully!");
setSentSwapRequests(function (previousRequests) {
  return previousRequests.concat({
    clothingId: clothingId
  });
});
  } catch (error) {
  showToast("error", "Something went wrong while sending the request.");
}
finally {
    setSendingRequestId("");
  }
}
  function SelectField(label, value, onChange, options) {
    return React.createElement(
      "div",
      { className: "comparison-field" },

      React.createElement("label", null, label),

      React.createElement(
        "select",
        {
          value,
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
  const selectedItem = myListings.find(function (item) {
    return item._id === selectedMyItem;
  });

  const matchingListings = selectedItem
    ? allListings
        .filter(function (item) {
          const isMyOwnListing = myListings.some(function (myItem) {
            return myItem._id === item._id;
          });

          return !isMyOwnListing && Number(item.price) > 0;
        })
        .map(function (item) {
          const difference = Math.abs(
            Number(selectedItem.price) - Number(item.price)
          );

          return {
            ...item,
            difference: difference
          };
        })
        .filter(function (item) {
  return Number(selectedItem.price) > 0 &&
    item.difference <= Number(selectedItem.price) * 0.20;
})
        .sort(function (a, b) {
          return a.difference - b.difference;
        })
    : [];
  const categories = [
    "Dresses",
    "Shirts",
    "T-Shirts",
    "Tops",
    "Jeans",
    "Trousers",
    "Shorts",
    "Skirts",
    "Jackets",
    "Hoodies",
    "Sweaters",
    "Coats",
    "Blazers",
    "Kurtis",
    "Sarees",
    "Lehengas",
    "Leggings",
    "Jumpsuits",
    "Other"
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
    toast &&
      React.createElement(
        "div",
        {
          className: "swap-toast " + toast.type
        },

        React.createElement(
          "span",
          { className: "swap-toast-icon" },
          toast.type === "success" ? "✓" : "!"
        ),

        React.createElement(
          "span",
          { className: "swap-toast-message" },
          toast.message
        ),

        React.createElement(
          "button",
          {
            type: "button",
            onClick: function () {
              setToast(null);
            }
          },
          "×"
        )
      ),
    React.createElement(
      "div",
      { className: "swap-calculator-container" },

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
          React.createElement("em", null, "Value Calculator")
        ),

        React.createElement(
          "p",
          null,
          "Compare clothing values and find a fair swap."
        )
      ),
      React.createElement(
        "div",
        { className: "comparison-card automatic-matching-card" },

        React.createElement("h2", null, "🔍 Find Matching Clothes"),

        React.createElement(
          "p",
          null,
          "Select your listed clothing item to find similar value matches."
        ),

        loadingMatches
          ? React.createElement("p", null, "Loading your listings...")
          : matchingError
          ? React.createElement("p", null, matchingError)
          : myListings.length === 0
          ? React.createElement(
              "p",
              null,
              "You have not listed any clothes yet. Add a listing first."
            )
          : React.createElement(
              "div",
              { className: "comparison-field" },

              React.createElement("label", null, "Select Your Item"),

              React.createElement(
                "select",
                {
                  value: selectedMyItem,
                  onChange: function (e) {
                    setSelectedMyItem(e.target.value);
                  }
                },

                myListings.map(function (item) {
                  return React.createElement(
                    "option",
                    {
                      key: item._id,
                      value: item._id
                    },
                    item.title + " - ₹" + item.price
                  );
                })
              )
            ),

        !loadingMatches && !matchingError && selectedItem
          ? React.createElement(
              "div",
              { className: "matching-results" },

              React.createElement(
                "h3",
                null,
                "Available Value Matches"
              ),

              matchingListings.length === 0
                ? React.createElement(
                    "p",
                    null,
                    "No close value matches found for this item."
                  )
                : matchingListings.map(function (item) {

    const requestAlreadySent = sentSwapRequests.some(function (request) {
      return String(request.clothingId) === String(item._id);
    });

    return React.createElement(
                      "div",
                      {
                        key: item._id,
                        className: "matching-item"
                      },


                      React.createElement("h4", null, item.title),
                      React.createElement(
  "p",
  null,
  "Owner: " + (item.owner || "Unknown User")
),

                      React.createElement(
                        "p",
                        null,
                        "Category: " + item.category
                      ),

                      React.createElement(
                        "p",
                        null,
                        "Brand: " + item.brand
                      ),

                      React.createElement(
                        "p",
                        null,
                        "Swap Value: ₹" + item.price
                      ),

                      React.createElement(
                        "p",
                        null,
                        "Value Difference: ₹" + item.difference
                      ),
                      React.createElement(
  "button",
  {
    type: "button",
    disabled: sendingRequestId === item._id || requestAlreadySent,
    onClick: function () {
      sendSwapRequest(item._id);
    }
  },
  sendingRequestId === item._id
  ? "Sending..."
  : requestAlreadySent
    ? "✓ Request Sent"
    : "Send Swap Request")
                    );
                  })
            )
          : null
      ),
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
              React.createElement("h3", null, "Your Item")
            ),

            SelectField(
              "Category",
              yourCategory,
              setYourCategory,
              categories
            ),

            SelectField(
              "Company / Brand",
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
              React.createElement("h3", null, "Other Item")
            ),

            SelectField(
              "Category",
              otherCategory,
              setOtherCategory,
              categories
            ),

            SelectField(
              "Company / Brand",
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

        React.createElement(
          "button",
          {
            type: "button",
            className: "compare-button",
            onClick: compareValues
          },
          "⚖️ Compare Values"
        ),

        comparison &&
          React.createElement(
            "div",
            {
              className:
                "comparison-result " + comparison.statusClass
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

                React.createElement("span", null, "Your Item"),

                React.createElement(
                  "strong",
                  null,
                  "₹",
                  comparison.yourValue
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

                React.createElement("span", null, "Other Item"),

                React.createElement(
                  "strong",
                  null,
                  "₹",
                  comparison.otherValue
                )
              )
            ),

            React.createElement(
              "div",
              { className: "difference-text" },
              "Value Difference: ₹",
              comparison.difference
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
