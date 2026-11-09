
import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import API_URL from "../api";
function BrowseClothes() {
  const navigate = useNavigate();

  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [size, setSize] = useState("All");
  const [condition, setCondition] = useState("All");
  const [location, setLocation] = useState("All");
  const [sortBy, setSortBy] = useState("recommended");

  const [clothes, setClothes] = useState([]);
  const [loading, setLoading] = useState(true);

  const [wishlist, setWishlist] = useState([]);
  const [swapMessage, setSwapMessage] = useState("");
  const [swapMessageType, setSwapMessageType] = useState("success");
  const [swapSendingId, setSwapSendingId] = useState("");
  const [deleteSendingId, setDeleteSendingId] = useState("");


  const currentUser =
    localStorage.getItem("clothSwapUserName") ||
    localStorage.getItem("clothswapUserName") ||
    "";

  const isLoggedIn =
    localStorage.getItem("clothswapLoggedIn") === "true";


  useEffect(function () {
    try {
      const savedWishlist =
        JSON.parse(
          localStorage.getItem("clothSwapWishlist") || "[]"
        );

      setWishlist(Array.isArray(savedWishlist) ? savedWishlist : []);
    } catch (error) {
      console.log("Wishlist load error:", error);
      setWishlist([]);
    }
  }, []);


  useEffect(function () {
    fetch(`${API_URL}/api/clothes`)
      .then(function (response) {
        return response.json();
      })
      .then(function (data) {
        if (data.success && Array.isArray(data.clothes)) {
          setClothes(data.clothes);
        } else if (Array.isArray(data)) {
          setClothes(data);
        } else {
          setClothes([]);
        }
      })
      .catch(function (error) {
        console.log("Failed to load clothes:", error);
      })
      .finally(function () {
        setLoading(false);
      });
  }, []);


  function showMessage(type, message) {
    setSwapMessageType(type);
    setSwapMessage(message);

    setTimeout(function () {
      setSwapMessage("");
    }, 3500);
  }


  const filteredClothes = clothes.filter(function (item) {
    const itemName =
      item.title ||
      item.name ||
      "";

    const itemBrand =
      item.brand ||
      item.owner ||
      "";

    const itemCategory =
      item.category ||
      "";

    const itemSize =
      item.size ||
      "";

    const itemCondition =
      item.condition ||
      "";

    const itemLocation =
      item.location ||
      "";

    const searchText =
      search.toLowerCase().trim();

    const matchesSearch =
      itemName.toLowerCase().includes(searchText) ||
      itemBrand.toLowerCase().includes(searchText) ||
      itemCategory.toLowerCase().includes(searchText);

    const matchesCategory =
      category === "All" ||
      itemCategory === category;

    const matchesSize =
      size === "All" ||
      itemSize === size;

    const matchesCondition =
      condition === "All" ||
      itemCondition === condition;

    const matchesLocation =
      location === "All" ||
      itemLocation === location;

    return (
      matchesSearch &&
      matchesCategory &&
      matchesSize &&
      matchesCondition &&
      matchesLocation
    );
  });
/* ================= SORT ================= */

const sortedClothes = [...filteredClothes].sort(function (a, b) {
  const priceA = Number(a.price || a.value || 0);
  const priceB = Number(b.price || b.value || 0);

  const nameA = String(a.title || a.name || "").toLowerCase();
  const nameB = String(b.title || b.name || "").toLowerCase();

  if (sortBy === "priceLow") {
    return priceA - priceB;
  }

  if (sortBy === "priceHigh") {
    return priceB - priceA;
  }

  if (sortBy === "nameAZ") {
    return nameA.localeCompare(nameB);
  }

  if (sortBy === "newest") {
    const dateA = new Date(
      a.createdAt || a.created_at || 0
    ).getTime();

    const dateB = new Date(
      b.createdAt || b.created_at || 0
    ).getTime();

    return dateB - dateA;
  }

  return 0;
});
  function clearFilters() {
  setSearch("");
  setCategory("All");
  setSize("All");
  setCondition("All");
  setLocation("All");
  setSortBy("recommended");
}

  function isInWishlist(itemId) {
    return wishlist.some(function (item) {
      return String(item._id || item.id) === String(itemId);
    });
  }

  function toggleWishlist(item) {
    if (!isLoggedIn) {
      showMessage(
        "error",
        "Please login to add clothes to your wishlist."
      );

      setTimeout(function () {
        navigate("/login");
      }, 900);

      return;
    }

    const itemId = item._id || item.id;

    if (!itemId) {
      return;
    }

    let updatedWishlist = [];

    if (isInWishlist(itemId)) {
      updatedWishlist = wishlist.filter(function (savedItem) {
        return String(savedItem._id || savedItem.id) !==
          String(itemId);
      });

      showMessage(
        "success",
        "Removed from your wishlist."
      );
    } else {
      updatedWishlist = wishlist.concat([
        item
      ]);

      showMessage(
        "success",
        "Added to your wishlist ❤️"
      );
    }

    setWishlist(updatedWishlist);

    localStorage.setItem(
      "clothSwapWishlist",
      JSON.stringify(updatedWishlist)
    );

    window.dispatchEvent(
      new Event("wishlistUpdated")
    );
  }



  
function requestSwap(item) {
  if (!isLoggedIn || !currentUser) {
    showMessage(
      "error",
      "Please login before requesting a swap."
    );

    setTimeout(function () {
      navigate("/login");
    }, 900);

    return;
  }

  const token =
    localStorage.getItem("clothswapToken") ||
    localStorage.getItem("clothSwapToken");

  if (!token) {
    showMessage(
      "error",
      "Your login session has expired. Please login again."
    );

    setTimeout(function () {
      navigate("/login");
    }, 900);

    return;
  }

  const requester = currentUser;
  const clothingId = item._id || item.id;

  if (!clothingId) {
    showMessage(
      "error",
      "Unable to send swap request."
    );
    return;
  }

  if (
    String(item.owner || "").toLowerCase() ===
    String(requester).toLowerCase()
  ) {
    showMessage(
      "error",
      "You cannot request your own clothing."
    );
    return;
  }

  setSwapSendingId(String(clothingId));

  fetch(`${API_URL}/api/swap-requests`, {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      "Authorization": "Bearer " + token
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
  })
    .then(function (response) {
      return response.json();
    })
    .then(function (data) {
      if (data.success) {
        showMessage(
          "success",
          "Your request has been sent to the clothing owner."
        );
      } else {
        showMessage(
          "error",
          data.message ||
            "Unable to send swap request."
        );
      }
    })
    .catch(function (error) {
      console.log("Swap request error:", error);

      showMessage(
        "error",
        "Something went wrong. Please make sure the backend is running."
      );
    })
    .finally(function () {
      setSwapSendingId("");
    });
}



  function deleteClothing(item) {
    if (!isLoggedIn || !currentUser) {
      showMessage(
        "error",
        "Please login to manage your clothing."
      );

      setTimeout(function () {
        navigate("/login");
      }, 900);

      return;
    }

    const itemId = item._id || item.id;

    if (!itemId) {
      showMessage(
        "error",
        "Unable to delete this clothing."
      );

      return;
    }

    const owner =
      String(item.owner || "").toLowerCase();

    const user =
      String(currentUser || "").toLowerCase();

    if (owner !== user) {
      showMessage(
        "error",
        "You can delete only your own clothing."
      );

      return;
    }

    const confirmed = window.confirm(
      "Are you sure you want to remove this clothing item?"
    );

    if (!confirmed) {
      return;
    }

    setDeleteSendingId(String(itemId));

    fetch(
  `${API_URL}/api/clothes/` +
    itemId,
      {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          user: currentUser
        })
      }
    )
      .then(function (response) {
        return response.json();
      })
      .then(function (data) {
        if (data.success) {
          setClothes(function (previousClothes) {
            return previousClothes.filter(function (clothing) {
              return String(
                clothing._id || clothing.id
              ) !== String(itemId);
            });
          });

          setWishlist(function (previousWishlist) {
            const updated =
              previousWishlist.filter(function (savedItem) {
                return String(
                  savedItem._id || savedItem.id
                ) !== String(itemId);
              });

            localStorage.setItem(
              "clothSwapWishlist",
              JSON.stringify(updated)
            );

            window.dispatchEvent(
              new Event("wishlistUpdated")
            );

            return updated;
          });

          showMessage(
            "success",
            "Clothing removed successfully."
          );
        } else {
          showMessage(
            "error",
            data.message ||
              "Unable to delete clothing."
          );
        }
      })
      .catch(function (error) {
        console.log(
          "Delete clothing error:",
          error
        );

        showMessage(
          "error",
          "Something went wrong while deleting."
        );
      })
      .finally(function () {
        setDeleteSendingId("");
      });
  }

  /* ================= RETURN ================= */

  return React.createElement(
    "div",
    { className: "browse-page" },

    /* ================= TOAST ================= */

    swapMessage &&
      React.createElement(
        "div",
        {
          className:
            "swap-toast " +
            (swapMessageType === "success"
              ? "swap-toast-success"
              : "swap-toast-error")
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
              : "Action Failed"
          ),

          React.createElement(
            "span",
            null,
            swapMessage
          )
        ),

        React.createElement(
          "button",
          {
            className:
              "swap-toast-close",
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
      {
        className:
          "container py-5"
      },

      /* ================= HEADER ================= */

      React.createElement(
        "div",
        {
          className:
            "browse-heading text-center mb-5"
        },

        React.createElement(
          "span",
          {
            className:
              "browse-label"
          },
          "♻️ CLOTHSWAP MARKETPLACE"
        ),

        React.createElement(
          "h1",
          null,
          "Find your next ",
          React.createElement(
            "em",
            null,
            "favorite piece."
          )
        ),

        React.createElement(
          "p",
          null,
          "Discover pre-loved clothing from people in your community."
        )
      ),

      /* ================= FILTER BOX ================= */

      React.createElement(
        "div",
        {
          className:
            "filter-box mb-5"
        },

        React.createElement(
          "div",
          {
            className:
              "row g-3"
          },

          /* SEARCH */

          React.createElement(
            "div",
            {
              className:
                "col-12 col-lg-4"
            },

            React.createElement(
              "label",
              {
                className:
                  "filter-label"
              },
              "🔎 Search"
            ),

            React.createElement(
              "input",
              {
                type: "text",
                className:
                  "form-control filter-input",
                placeholder:
                  "Search clothes, brands or categories...",
                value: search,
                onChange: function (e) {
                  setSearch(e.target.value);
                }
              }
            )
          ),

          /* CATEGORY */

          React.createElement(
            "div",
            {
              className:
                "col-6 col-lg-2"
            },

            React.createElement(
              "label",
              {
                className:
                  "filter-label"
              },
              "Category"
            ),

            React.createElement(
              "select",
              {
                className:
                  "form-select filter-input",
                value: category,
                onChange: function (e) {
                  setCategory(e.target.value);
                }
              },

              React.createElement(
                "option",
                null,
                "All"
              ),
              React.createElement(
                "option",
                null,
                "Dresses"
              ),
              React.createElement(
                "option",
                null,
                "Shirts"
              ),
              React.createElement(
                "option",
                null,
                "Jeans"
              ),
              React.createElement(
                "option",
                null,
                "Jackets"
              ),
              React.createElement(
                "option",
                null,
                "Hoodies"
              ),
              React.createElement(
                "option",
                null,
                "T-Shirts"
              ),
              React.createElement(
                "option",
                null,
                "Tops"
              ),
              React.createElement(
                "option",
                null,
                "Skirts"
              )
            )
          ),

          /* SIZE */

          React.createElement(
            "div",
            {
              className:
                "col-6 col-lg-2"
            },

            React.createElement(
              "label",
              {
                className:
                  "filter-label"
              },
              "Size"
            ),

            React.createElement(
              "select",
              {
                className:
                  "form-select filter-input",
                value: size,
                onChange: function (e) {
                  setSize(e.target.value);
                }
              },

              React.createElement(
                "option",
                null,
                "All"
              ),
              React.createElement(
                "option",
                null,
                "XS"
              ),
              React.createElement(
                "option",
                null,
                "S"
              ),
              React.createElement(
                "option",
                null,
                "M"
              ),
              React.createElement(
                "option",
                null,
                "L"
              ),
              React.createElement(
                "option",
                null,
                "XL"
              ),
              React.createElement(
                "option",
                null,
                "XXL"
              )
            )
          ),

          /* CONDITION */

          React.createElement(
            "div",
            {
              className:
                "col-6 col-lg-2"
            },

            React.createElement(
              "label",
              {
                className:
                  "filter-label"
              },
              "Condition"
            ),

            React.createElement(
              "select",
              {
                className:
                  "form-select filter-input",
                value: condition,
                onChange: function (e) {
                  setCondition(e.target.value);
                }
              },

              React.createElement(
                "option",
                null,
                "All"
              ),
              React.createElement(
                "option",
                null,
                "Like New"
              ),
              React.createElement(
                "option",
                null,
                "Excellent"
              ),
              React.createElement(
                "option",
                null,
                "Good"
              ),
              React.createElement(
                "option",
                null,
                "Fair"
              )
            )
          ),

          /* LOCATION */

          React.createElement(
            "div",
            {
              className:
                "col-6 col-lg-2"
            },

            React.createElement(
              "label",
              {
                className:
                  "filter-label"
              },
              "Location"
            ),

            React.createElement(
              "select",
              {
                className:
                  "form-select filter-input",
                value: location,
                onChange: function (e) {
                  setLocation(e.target.value);
                }
              },

              React.createElement(
                "option",
                null,
                "All"
              ),
              React.createElement(
                "option",
                null,
                "Ahmedabad"
              ),
              React.createElement(
                "option",
                null,
                "Mumbai"
              ),
              React.createElement(
                "option",
                null,
                "Vadodara"
              ),
              React.createElement(
                "option",
                null,
                "Surat"
              ),
              React.createElement(
                "option",
                null,
                "Rajkot"
              )
            )
          )
        ),

        /* ================= FILTER BOTTOM ================= */

        React.createElement(
          "div",
          {
            className:
              "filter-bottom d-flex justify-content-between align-items-center mt-4"
          },

          React.createElement(
            "span",
            {
              className:
                "result-count"
            },
            loading
              ? "Loading clothes..."
              : filteredClothes.length +
                " items available"
          ),
          React.createElement(
  "div",
  {
    className: "browse-sort-box"
  },

  React.createElement(
  "select",
  {
    className: "form-select browse-sort-select",
    value: sortBy,
    onChange: function (e) {
      setSortBy(e.target.value);
    }
  },

    React.createElement(
      "option", 
      { value: "recommended" }, 
      "Sort By"
    ),

    React.createElement(
      "option",
      { value: "newest" },
      "Newest"
    ),

    React.createElement(
      "option",
      { value: "priceLow" },
      "Price: Low to High"
    ),

    React.createElement(
      "option",
      { value: "priceHigh" },
      "Price: High to Low"
    ),

    React.createElement(
      "option",
      { value: "nameAZ" },
      "Name: A to Z"
    )
  )
),

          React.createElement(
            "button",
            {
              type: "button",
              className:
                "clear-btn",
              onClick:
                clearFilters
            },
            "Clear filters"
          )
        )
      ),

      /* ================= LOADING ================= */

      loading &&
        React.createElement(
          "div",
          {
            className:
              "browse-loading"
          },

          React.createElement(
            "div",
            {
              className:
                "browse-loading-spinner"
            }
          ),

          React.createElement(
            "p",
            null,
            "Loading clothes..."
          )
        ),

      /* ================= CLOTHING GRID ================= */

      !loading &&
        filteredClothes.length > 0 &&
        React.createElement(
          "div",
          {
            className:
              "row g-4"
          },

          sortedClothes.map(
            function (item) {
              const itemId =
                item._id || item.id;

              const itemName =
                item.title ||
                item.name ||
                "Clothing Item";

              const itemImage =
                item.image ||
                "https://via.placeholder.com/800x800?text=No+Image";

              const itemPrice =
                item.price ||
                item.value ||
                0;

              const itemOwner =
                item.owner ||
                "ClothSwap User";

              const itemCategory =
                item.category ||
                "Fashion";

              const itemCondition =
                item.condition ||
                "Good";

              const itemLocation =
                item.location ||
                "Not specified";

              const itemSize =
                item.size ||
                "N/A";

              const ownerOfItem =
                String(itemOwner).toLowerCase() ===
                String(currentUser).toLowerCase();

              const saved =
                isInWishlist(itemId);

              const isSending =
                swapSendingId ===
                String(itemId);

              const isDeleting =
                deleteSendingId ===
                String(itemId);

              return React.createElement(
                "div",
                {
                  className:
                    "col-12 col-sm-6 col-lg-3",
                  key: itemId
                },

                React.createElement(
                  "div",
                  {
                    className:
                      "clothing-card h-100"
                  },

                  /* ================= IMAGE ================= */

                  React.createElement(
                    "div",
                    {
                      className:
                        "clothing-image-wrapper"
                    },

                    React.createElement(
                      Link,
                      {
                        to:
                          "/item/" +
                          itemId,
                        className:
                          "clothing-image-link"
                      },

                      React.createElement(
                        "img",
                        {
                          src:
                            itemImage,
                          alt:
                            itemName,
                          className:
                            "clothing-image",
                          onError:
                            function (e) {
                              e.target.src =
                                "https://via.placeholder.com/800x800?text=No+Image";
                            }
                        }
                      )
                    ),

                    /* AVAILABLE BADGE */

                    React.createElement(
                      "span",
                      {
                        className:
                          "available-badge"
                      },
                      item.status ||
                        "Available"
                    ),

                    /* WISHLIST */

                    React.createElement(
                      "button",
                      {
                        type: "button",
                        className:
                          "browse-wishlist-btn " +
                          (saved
                            ? "browse-wishlist-active"
                            : ""),
                        onClick:
                          function (e) {
                            e.preventDefault();
                            e.stopPropagation();
                            toggleWishlist(item);
                          },
                        title:
                          saved
                            ? "Remove from wishlist"
                            : "Add to wishlist"
                      },
                      saved
                        ? "♥"
                        : "♡"
                    )
                  ),

                  /* ================= INFO ================= */

                  React.createElement(
                    "div",
                    {
                      className:
                        "clothing-info"
                    },

                   React.createElement(
  "div",
  {
    className: "clothing-top-row"
  },

  React.createElement(
    "span",
    {
      className: "clothing-category"
    },
    itemName
  ),

  React.createElement(
    "span",
    {
      className: "clothing-size-badge"
    },
    "Size: ",
    itemSize
  )
),
// BRAND NAME
React.createElement(
  "p",
  {
    className: "clothing-brand"
  },
  "🏷️ ",
  item.brand || "Unbranded"
),

// OWNER NAME
React.createElement(
  "p",
  {
    className:
      "clothing-brand"
  },
  "👤 ",
  itemOwner
),

                    React.createElement(
  "div",
  {
    className: "clothing-condition"
  },

  React.createElement(
    "span",
    {
      className:
        "clothing-condition-label"
    },
    "Condition"
  ),

  React.createElement(
    "strong",
    {
      className:
        "clothing-condition-value"
    },
    itemCondition
  )
),

React.createElement(
  "div",
  {
    className: "clothing-price-box"
  },

  React.createElement(
    "span",
    {
      className:
        "clothing-price-label"
    },
    "Estimated Swap Value"
  ),

  React.createElement(
    "strong",
    {
      className:
        "clothing-price-value"
    },
    "₹",
    itemPrice
  )
),

                    React.createElement(
                      "div",
                      {
                        className:
                          "clothing-location"
                      },
                      "📍 ",
                      itemLocation
                    )
                  ),

                  /* ================= ACTIONS ================= */

                  React.createElement(
                    "div",
                    {
                      className:
                        "clothing-actions"
                    },

                    React.createElement(
                      Link,
                      {
                        to:
                          "/item/" +
                          itemId,
                        className:
                          "view-item-btn"
                      },
                      "View Item →"
                    ),

                    !ownerOfItem &&
                      React.createElement(
                        "button",
                        {
                          type: "button",
                          className:
                            "request-swap-btn",
                          disabled:
                            isSending,
                          onClick:
                            function () {
                              requestSwap(item);
                            }
                        },
                        isSending
                          ? "Sending..."
                          : "♻️ Request Swap"
                      ),

                    ownerOfItem &&
                      React.createElement(
                        "button",
                        {
                          type: "button",
                          className:
                            "delete-clothing-btn",
                          disabled:
                            isDeleting,
                          onClick:
                            function () {
                              deleteClothing(item);
                            },
                          title:
                            "Delete this clothing"
                        },
                        isDeleting
                          ? "Deleting..."
                          : "🗑️"
                      )
                  )
                )
              );
            }
          )
        ),

      /* ================= NO RESULTS ================= */

      !loading &&
        filteredClothes.length === 0 &&
        React.createElement(
          "div",
          {
            className:
              "empty-results text-center py-5"
          },

          React.createElement(
            "div",
            {
              className:
                "empty-results-icon"
            },
            "👗"
          ),

          React.createElement(
            "h3",
            null,
            "No clothes found"
          ),

          React.createElement(
            "p",
            null,
            "Try changing your search or filters."
          ),

          React.createElement(
            "button",
            {
              type: "button",
              className:
                "btn btn-dark",
              onClick:
                clearFilters
            },
            "Reset Filters"
          )
        )
    )
  );
}

export default BrowseClothes;

