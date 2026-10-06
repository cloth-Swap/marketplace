import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

function Wishlist() {
  const navigate = useNavigate();

  const [wishlist, setWishlist] = useState([]);

  useEffect(() => {
    loadWishlist();

    const handleWishlistUpdate = () => {
      loadWishlist();
    };

    window.addEventListener(
      "wishlistUpdated",
      handleWishlistUpdate
    );

    return () => {
      window.removeEventListener(
        "wishlistUpdated",
        handleWishlistUpdate
      );
    };
  }, []);

  function loadWishlist() {
    const saved = localStorage.getItem(
      "clothSwapWishlist"
    );

    if (!saved) {
      setWishlist([]);
      return;
    }

    try {
      const data = JSON.parse(saved);

      if (Array.isArray(data)) {
        setWishlist(data);
      } else {
        setWishlist([]);
      }
    } catch (error) {
      console.error(
        "Wishlist loading error:",
        error
      );

      setWishlist([]);
    }
  }

  function removeFromWishlist(id) {
    const updatedWishlist = wishlist.filter(
      (item) =>
        String(item._id || item.id) !== String(id)
    );

    setWishlist(updatedWishlist);

    localStorage.setItem(
      "clothSwapWishlist",
      JSON.stringify(updatedWishlist)
    );

    window.dispatchEvent(
      new Event("wishlistUpdated")
    );
  }

  function clearWishlist() {
    localStorage.removeItem(
      "clothSwapWishlist"
    );

    setWishlist([]);

    window.dispatchEvent(
      new Event("wishlistUpdated")
    );
  }

  return React.createElement(
    "div",
    {
      className: "wishlist-page"
    },

    React.createElement(
      "div",
      {
        className: "container py-5"
      },

      /* =========================
         HEADING
      ========================= */

      React.createElement(
        "div",
        {
          className:
            "wishlist-heading text-center mb-5"
        },

        React.createElement(
          "div",
          {
            className: "wishlist-label"
          },
          "♡ YOUR SAVED STYLE"
        ),

        React.createElement(
          "h1",
          null,
          "My ",
          React.createElement(
            "em",
            null,
            "Wishlist"
          )
        ),

        React.createElement(
          "p",
          null,
          "Your favourite clothes, saved in one place."
        )
      ),

      /* =========================
         EMPTY WISHLIST
      ========================= */

      wishlist.length === 0
        ? React.createElement(
            "div",
            {
              className:
                "wishlist-empty text-center"
            },

            React.createElement(
              "div",
              {
                className:
                  "wishlist-empty-icon"
              },
              "♡"
            ),

            React.createElement(
              "h3",
              null,
              "Your wishlist is empty"
            ),

            React.createElement(
              "p",
              null,
              "Save clothes you love and find them here anytime."
            ),

            React.createElement(
              "button",
              {
                className:
                  "wishlist-browse-btn",

                onClick: () =>
                  navigate("/browse")
              },
              "Browse Clothes →"
            )
          )

        : React.createElement(
            React.Fragment,
            null,

            /* =========================
               TOP BAR
            ========================= */

            React.createElement(
              "div",
              {
                className:
                  "wishlist-top d-flex justify-content-between align-items-center mb-4"
              },

              React.createElement(
                "span",
                {
                  className:
                    "wishlist-count-text"
                },
                wishlist.length,
                wishlist.length === 1
                  ? " item saved"
                  : " items saved"
              ),

              React.createElement(
                "button",
                {
                  className:
                    "wishlist-clear-btn",

                  onClick: clearWishlist
                },
                "Clear Wishlist"
              )
            ),

            /* =========================
               WISHLIST CARDS
            ========================= */

            React.createElement(
              "div",
              {
                className: "row g-4"
              },

              wishlist.map((item) => {
                const id =
                  item._id || item.id;

                const title =
                  item.title ||
                  item.name ||
                  "Clothing Item";

                const image =
                  item.image ||
                  "https://via.placeholder.com/600x700?text=ClothSwap";

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

                const price =
                  item.price ||
                  item.value ||
                  0;

                return React.createElement(
                  "div",
                  {
                    className:
                      "col-lg-4 col-md-6",
                    key: id
                  },

                  React.createElement(
                    "div",
                    {
                      className:
                        "wishlist-card"
                    },

                    /* IMAGE */

                    React.createElement(
                      "div",
                      {
                        className:
                          "wishlist-image-wrapper"
                      },

                      React.createElement(
                        "img",
                        {
                          src: image,
                          alt: title,

                          className:
                            "wishlist-image",

                          onError: (e) => {
                            e.target.src =
                              "https://via.placeholder.com/600x700?text=ClothSwap";
                          }
                        }
                      ),

                      React.createElement(
                        "button",
                        {
                          className:
                            "wishlist-remove-btn",

                          onClick: () =>
                            removeFromWishlist(id),

                          title:
                            "Remove from wishlist"
                        },
                        "♥"
                      )
                    ),

                    /* INFORMATION */

                    React.createElement(
                      "div",
                      {
                        className:
                          "wishlist-card-info"
                      },

                      React.createElement(
                        "div",
                        {
                          className:
                            "wishlist-card-category"
                        },
                        category
                      ),

                      React.createElement(
                        "h3",
                        null,
                        title
                      ),

                      React.createElement(
                        "div",
                        {
                          className:
                            "wishlist-details"
                        },
                        "Size: ",
                        size,
                        " • ",
                        condition
                      ),

                      React.createElement(
                        "div",
                        {
                          className:
                            "wishlist-location"
                        },
                        "📍 ",
                        location
                      ),

                      React.createElement(
                        "div",
                        {
                          className:
                            "wishlist-card-bottom d-flex justify-content-between align-items-center"
                        },

                        React.createElement(
                          "strong",
                          null,
                          "₹",
                          price
                        ),

                        React.createElement(
                          "button",
                          {
                            className:
                              "wishlist-view-btn",

                            onClick: () =>
                              navigate(
                                "/item/" + id
                              )
                          },
                          "View Item →"
                        )
                      )
                    )
                  )
                );
              })
            )
          )
    )
  );
}

export default Wishlist;