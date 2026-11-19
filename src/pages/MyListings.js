
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import API_URL from "../api";
let myListingsCache = null;

const myListingsCacheKey =
  "clothswapMyListingsCache_" +
  (
    localStorage.getItem("clothswapUserEmail") ||
    localStorage.getItem("clothswapEmail") ||
    ""
  ).trim().toLowerCase();

try {
  const savedCache = localStorage.getItem(
    myListingsCacheKey
  );

  myListingsCache = savedCache
    ? JSON.parse(savedCache)
    : null;

  if (!Array.isArray(myListingsCache)) {
    myListingsCache = null;
  }
} catch (error) {
  myListingsCache = null;
}
function MyListings() {
  const navigate = useNavigate();

  const [listings, setListings] = useState(
  Array.isArray(myListingsCache)
    ? myListingsCache
    : []
);

const [loading, setLoading] = useState(
  !Array.isArray(myListingsCache)
);
const [hasLoadedListings, setHasLoadedListings] = useState(
  Array.isArray(myListingsCache)
);
  const [error, setError] = useState("");
  const [expandedRequests, setExpandedRequests] = useState({});
useEffect(function () {
  if (!hasLoadedListings) return;

  try {
    const cacheForStorage = listings.map(function (item) {
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
      myListingsCacheKey,
      JSON.stringify(cacheForStorage)
    );

    myListingsCache = cacheForStorage;
  } catch (error) {
    console.log("My Listings cache save error:", error);
  }
}, [listings, hasLoadedListings]);

 async function loadListings() {
  setError("");

    try {
      const token = localStorage.getItem("clothswapToken");

      const response = await fetch(`${API_URL}/api/my-listings`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Unable to load your listings.");
      }

      setListings(data.listings || []);
      setHasLoadedListings(true);
   } catch (err) {
  setError(err.message || "Something went wrong.");
  console.error("Failed to load My Listings:", err);
} finally {
      setLoading(false);
    }
  }

  useEffect(function () {
    loadListings();
  }, []);

  async function deleteListing(item) {
    const confirmed = window.confirm(
      `Are you sure you want to delete "${item.title}"?`
    );

    if (!confirmed) return;

    try {
      const token = localStorage.getItem("clothswapToken");

      const response = await fetch(
        `${API_URL}/api/clothes/${item._id}`,
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
          }
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Unable to delete listing.");
      }

      setListings(function (previous) {
        return previous.map(function (listing) {
          return listing._id === item._id
            ? {
                ...listing,
                availabilityStatus: "Removed",
                status: "Removed",
                isDeleted: true
              }
            : listing;
        });
      });

      window.alert("Listing removed successfully.");
    } catch (err) {
      window.alert(err.message || "Unable to delete listing.");
    }
  }

  function toggleRequests(id) {
    setExpandedRequests(function (previous) {
      return {
        ...previous,
        [id]: !previous[id]
      };
    });
  }

  function getStatusColor(status) {
    if (status === "Available") return "#168653";
    if (status === "Pending Request") return "#b7791f";
    if (status === "Swapped") return "#7650a8";
    return "#c0394b";
  }

  const styles = {
    page: {
      minHeight: "100vh",
      padding: "35px 18px",
      background: "linear-gradient(135deg,#fff7fb,#f4efff,#eef8ff)"
    },
    container: {
      maxWidth: "1150px",
      margin: "0 auto"
    },
    heading: {
      color: "#69436f",
      fontSize: "clamp(27px,4vw,38px)",
      fontWeight: "800",
      margin: "0 0 8px"
    },
    description: {
      color: "#81738a",
      marginBottom: "25px"
    },
    card: {
      background: "rgba(255,255,255,0.96)",
      border: "1px solid #f0e5f2",
      borderRadius: "20px",
      padding: "18px",
      display: "grid",
      gridTemplateColumns: "150px minmax(0,1fr)",
      gap: "20px",
      marginBottom: "18px",
      boxShadow: "0 8px 25px rgba(105,65,120,0.08)"
    },
    image: {
      width: "100%",
      height: "165px",
      objectFit: "cover",
      borderRadius: "14px",
      background: "#f5edf6"
    },
    button: {
      padding: "10px 17px",
      borderRadius: "25px",
      border: "none",
      fontWeight: "700",
      cursor: "pointer"
    }
  };

  if (loading) {
    return React.createElement(
      "div",
      { style: { padding: "60px 20px", textAlign: "center", color: "#80518f" } },
      "⏳ Loading your listings..."
    );
  }

  return React.createElement(
    "div",
    { style: styles.page },
    React.createElement(
      "div",
      { style: styles.container },

      React.createElement("h1", { style: styles.heading }, "👕 My Listings"),

      React.createElement(
        "p",
        { style: styles.description },
        "Manage your clothing listings and track swap requests."
      ),

      React.createElement(
        "button",
        {
          type: "button",
          onClick: function () {
            navigate("/list-clothes");
          },
          style: {
            ...styles.button,
            background: "linear-gradient(135deg,#d85d98,#8954b5)",
            color: "white",
            marginBottom: "25px"
          }
        },
        "+ List New Clothing"
      ),

   error && React.createElement(
  "div",
        {
          style: {
            padding: "15px",
            background: "#fff0f0",
            color: "#c0392b",
            borderRadius: "12px",
            marginBottom: "20px"
          }
        },
        error
      ),

      !error && listings.length === 0
        ? React.createElement(
            "div",
            {
              style: {
                background: "white",
                padding: "40px 20px",
                borderRadius: "20px",
                textAlign: "center",
                color: "#76527d"
              }
            },
            React.createElement("h3", null, "You haven't listed any clothes yet."),
            React.createElement("p", null, "Your clothing listings will appear here."),
            React.createElement(
              "button",
              {
                onClick: function () {
                  navigate("/list-clothes");
                },
                style: {
                  ...styles.button,
                  background: "#d85d98",
                  color: "white"
                }
              },
              "List Your First Clothing"
            )
          )
        : listings.map(function (item) {
            const status = item.availabilityStatus || "Available";
            const requests = item.requests || [];

            return React.createElement(
              "div",
              {
                key: item._id,
                style: {
                  ...styles.card,
                  gridTemplateColumns: window.innerWidth < 600
                    ? "1fr"
                    : "150px minmax(0,1fr)"
                }
              },

              React.createElement("img", {
                src: item.image || "",
                alt: item.title || "Clothing",
                style: styles.image
              }),

              React.createElement(
                "div",
                null,

                React.createElement(
                  "div",
                  {
                    style: {
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      gap: "10px",
                      flexWrap: "wrap"
                    }
                  },

                  React.createElement(
                    "h3",
                    {
                      style: {
                        color: "#573d60",
                        margin: "0",
                        fontSize: "19px"
                      }
                    },
                    item.title
                  ),

                  React.createElement(
                    "span",
                    {
                      style: {
                        background: getStatusColor(status) + "18",
                        color: getStatusColor(status),
                        padding: "7px 12px",
                        borderRadius: "20px",
                        fontSize: "12px",
                        fontWeight: "800"
                      }
                    },
                    status
                  )
                ),

                React.createElement(
                  "p",
                  { style: { color: "#85768c", margin: "10px 0 5px" } },
                  `${item.brand || ""} • ${item.category || ""} • ${item.size || ""}`
                ),

                React.createElement(
                  "p",
                  { style: { color: "#76527d", margin: "5px 0" } },
                  `📍 ${item.location || "Location not specified"}`
                ),

                React.createElement(
                  "p",
                  { style: { color: "#76527d", margin: "5px 0" } },
                  `💰 ₹${item.price || 0}`
                ),

                React.createElement(
                  "div",
                  {
                    style: {
                      display: "flex",
                      gap: "10px",
                      flexWrap: "wrap",
                      marginTop: "15px"
                    }
                  },

                  React.createElement(
                    "button",
                    {
                      onClick: function () {
                        toggleRequests(item._id);
                      },
                      style: {
                        ...styles.button,
                        background: "#f1e8f7",
                        color: "#80518f"
                      }
                    },
                    `View Requests (${requests.length})`
                  ),

status !== "Removed" &&
status !== "Swapped" &&
React.createElement(
  "button",
  {
    onClick: function () {
      navigate("/list-clothes", {
        state: {
          editListing: item
        }
      });
    },
    style: {
      ...styles.button,
      background: "#f1e8f7",
      color: "#80518f"
    }
  },
  "✏️ Edit"
),


                  status !== "Removed" && status !== "Swapped" &&
                    React.createElement(
                      "button",
                      {
                        onClick: function () {
                          deleteListing(item);
                        },
                        style: {
                          ...styles.button,
                          background: "#fff0f0",
                          color: "#c0394b"
                        }
                      },
                      "Delete"
                    )
                ),

                expandedRequests[item._id] &&
                  React.createElement(
                    "div",
                    {
                      style: {
                        marginTop: "15px",
                        padding: "15px",
                        borderRadius: "13px",
                        background: "#faf6fc"
                      }
                    },

                    React.createElement(
                      "h4",
                      { style: { color: "#69436f", marginTop: "0" } },
                      "Swap Requests"
                    ),

                    requests.length === 0
                      ? React.createElement("p", null, "No swap requests yet.")
                      : requests.map(function (request) {
                          return React.createElement(
                            "div",
                            {
                              key: request._id,
                              style: {
                                padding: "10px",
                                background: "white",
                                borderRadius: "10px",
                                marginBottom: "8px"
                              }
                            },
                            React.createElement(
                              "strong",
                              { style: { color: "#573d60" } },
                              request.requester || "User"
                            ),
                            React.createElement(
                              "p",
                              {
                                style: {
                                  margin: "5px 0",
                                  color: "#80518f",
                                  fontSize: "13px"
                                }
                              },
                              `Status: ${request.status || "Pending"}`
                            ),
                            request.message &&
                              React.createElement(
                                "p",
                                { style: { margin: "5px 0", color: "#81738a" } },
                                request.message
                              )
                          );
                        })
                  )
              )
            );
          })
    )
  );
}

export default MyListings;
