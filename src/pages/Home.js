  import React from "react";
  import { Link } from "react-router-dom";
  import FlowerEffect from "./FlowerEffect";

  function Home() {
    const featuredClothes = [
      {
        title: "Floral Dress",
        category: "Dresses",
        condition: "Like New",
        image:
          "https://images.unsplash.com/photo-1496747611176-843222e1e57c?auto=format&fit=crop&w=900&q=85"
      },
      {
        title: "Classic Denim",
        category: "Jeans",
        condition: "Excellent",
        image:
          "https://images.unsplash.com/photo-1542272604-787c3835535d?auto=format&fit=crop&w=900&q=85"
      },
      {
        title: "Everyday Jacket",
        category: "Jackets",
        condition: "Very Good",
        image:
          "https://images.unsplash.com/photo-1551028719-00167b16eac5?auto=format&fit=crop&w=900&q=85"
      },
      {
        title: "Casual Top",
        category: "Tops",
        condition: "Like New",
        image:
          "https://images.unsplash.com/photo-1529139574466-a303027c1d8b?auto=format&fit=crop&w=900&q=85"
      }
    ];

    const categories = [
      {
        name: "Dresses",
        image:
          "https://images.unsplash.com/photo-1595777457583-95e059d581b8?auto=format&fit=crop&w=700&q=85"
      },
      {
        name: "Tops",
        image:
          "https://images.unsplash.com/photo-1551488831-00ddcb6c6bd3?auto=format&fit=crop&w=700&q=85"
      },
      {
        name: "Jeans",
        image:
          "https://images.unsplash.com/photo-1541099649105-f69ad21f3246?auto=format&fit=crop&w=700&q=85"
      },
      {
        name: "Jackets",
        image:
          "https://images.unsplash.com/photo-1521223890158-f9f7c3d5d504?auto=format&fit=crop&w=700&q=85"
      }
    ];

    const steps = [
      {
        number: "01",
        title: "List",
        text: "Add clothes from your wardrobe that you no longer wear."
      },
      {
        number: "02",
        title: "Discover",
        text: "Browse clothing shared by other people in the community."
      },
      {
        number: "03",
        title: "Request",
        text: "Send a swap request for something you'd love to exchange."
      },
      {
        number: "04",
        title: "Swap",
        text: "Agree on the exchange and complete your clothing swap."
      }
    ];

    const quickActions = [
      {
        number: "01",
        icon: "👗",
        title: "List Your Clothes",
        text:
          "Have something you no longer wear? Put it up for a swap.",
        button: "Start listing",
        path: "/list-clothes"
      },
      {
        number: "02",
        icon: "✦",
        title: "Browse Clothes",
        text:
          "Explore clothes listed by people in the ClothSwap community.",
        button: "Explore clothes",
        path: "/browse"
      },
      {
        number: "03",
        icon: "↔",
        title: "Swap Requests",
        text:
          "Check the requests you've sent or received from other users.",
        button: "View requests",
        path: "/swap-requests"
      },
      {
        number: "04",
        icon: "⌖",
        title: "Nearby Swaps",
        text:
          "Discover clothing swaps happening around your location.",
        button: "Explore nearby",
        path: "/location-matching"
      }
    ];

    return React.createElement(
      "div",
      {
        className: "home-page home-new-page"
      },

      React.createElement(
        "section",
        {
          className: "home-new-hero"
        },

        React.createElement(FlowerEffect),

        React.createElement(
          "div",
          {
            className: "home-new-hero-content"
          },

          /* HERO TEXT */

          React.createElement(
            "div",
            {
              className: "home-new-hero-copy"
            },

            React.createElement(
              "div",
              {
                className: "home-new-hero-label"
              },
              "CLOTHSWAP MARKETPLACE"
            ),

            React.createElement(
              "h1",
              null,
              "SWAP SOMETHING.",
              React.createElement("br"),
              React.createElement(
                "span",
                null,
                "FIND SOMETHING BETTER."
              )
            ),

            React.createElement(
              "p",
              null,
              "A smarter way to refresh your wardrobe. ",
              "Exchange clothes you no longer wear for pieces you'll actually love."
            ),

            React.createElement(
              "div",
              {
                className: "home-new-hero-actions"
              },

              React.createElement(
                Link,
                {
                  to: "/browse",
                  className: "home-new-primary-btn"
                },
                "BROWSE CLOTHES",
                React.createElement(
                  "span",
                  null,
                  "→"
                )
              ),

              React.createElement(
                Link,
                {
                  to: "/list-clothes",
                  className: "home-new-secondary-btn"
                },
                "LIST YOUR CLOTHES"
              )
            )
          ),

          /* HERO IMAGE */

          React.createElement(
            "div",
            {
              className: "home-new-hero-visual"
            },

            React.createElement("img", {
              src:
                "https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=1400&q=90",
              alt: "Fashion clothing"
            }),

            /* ORIGINAL STYLE BOX 1 */

            React.createElement(
              "div",
              {
                className:
                  "home-new-fashion-box home-new-fashion-box-one"
              },

              React.createElement(
                "span",
                {
                  className: "home-new-box-icon"
                },
                "↻"
              ),

              React.createElement(
                "div",
                null,

                React.createElement(
                  "strong",
                  null,
                  "Give Fashion",
                  React.createElement("br"),
                  "Another Life"
                ),

                React.createElement(
                  "small",
                  null,
                  "Swap • Rewear • Repeat"
                )
              )
            ),

          React.createElement(
            "div",
            {
              className:
                "home-new-fashion-box home-new-fashion-box-two"
            },

            React.createElement(
              "span",
              {
                className: "home-new-box-icon"
              },
              "⇄"
            ),

            React.createElement(
              "div",
              null,

              React.createElement(
                "strong",
                null,
                "Swap It"
              ),

              React.createElement(
                "small",
                null,
                "Find your next favourite"
              )
            )
          )
        )
      )
    ),

    React.createElement(
      "section",
      {
        className:
          "home-new-section home-new-featured-section"
      },

      React.createElement(
        "div",
        {
          className: "home-new-section-top"
        },

        React.createElement(
          "div",
          null,

          React.createElement(
            "span",
            {
              className: "home-new-section-label"
            },
            "FRESH ON CLOTHSWAP"
          ),

          React.createElement(
            "h2",
            null,
            "Pieces worth swapping for."
          )
        ),

        React.createElement(
          Link,
          {
            to: "/browse",
            className: "home-new-large-link"
          },
          "VIEW ALL CLOTHES →"
        )
      ),

      React.createElement(
        "div",
        {
          className: "home-new-featured-grid"
        },

        featuredClothes.map(function (item, index) {
          return React.createElement(
            Link,
            {
              to: "/browse",
              className: "home-new-clothing-card",
              key: index
            },

            React.createElement(
              "div",
              {
                className: "home-new-clothing-image"
              },

              React.createElement("img", {
                src: item.image,
                alt: item.title
              }),

              React.createElement(
                "span",
                {
                  className: "home-new-condition"
                },
                item.condition
              )
            ),

            React.createElement(
              "div",
              {
                className: "home-new-clothing-info"
              },

              React.createElement(
                "span",
                null,
                item.category
              ),

              React.createElement(
                "h3",
                null,
                item.title
              ),

              React.createElement(
                "span",
                {
                  className: "home-new-card-arrow"
                },
                "View item →"
              )
            )
          );
        })
      )
    ),

    React.createElement(
      "section",
      {
        className: "home-new-swap-strip"
      },

      React.createElement(
        "div",
        {
          className: "home-new-swap-strip-inner"
        },

        React.createElement(
          "span",
          {
            className: "home-new-swap-item"
          },
          "LIST"
        ),

        React.createElement(
          "span",
          {
            className: "home-new-swap-arrow"
          },
          "→"
        ),

        React.createElement(
          "span",
          {
            className: "home-new-swap-item"
          },
          "DISCOVER"
        ),

        React.createElement(
          "span",
          {
            className: "home-new-swap-arrow"
          },
          "→"
        ),

        React.createElement(
          "span",
          {
            className: "home-new-swap-item"
          },
          "SWAP"
        ),

        React.createElement(
          "span",
          {
            className: "home-new-swap-arrow"
          },
          "→"
        ),

        React.createElement(
          "span",
          {
            className: "home-new-swap-item"
          },
          "REPEAT"
        )
      )
    ),

    React.createElement(
      "section",
      {
        className: "home-new-statement"
      },

      React.createElement(
        "div",
        {
          className: "home-new-statement-inner"
        },

        React.createElement(
          "span",
          {
            className: "home-new-section-label"
          },
          "THE IDEA"
        ),

        React.createElement(
          "h2",
          null,
          "Your clothes still have value."
        ),

        React.createElement(
          "p",
          null,
          "Instead of letting good clothes sit unused, ",
          "ClothSwap helps you exchange them with people who are looking for exactly what you have."
        ),

        React.createElement(
          Link,
          {
            to: "/list-clothes",
            className: "home-new-outline-btn"
          },
          "LIST SOMETHING YOU DON'T WEAR →"
        )
      )
    ),

    React.createElement(
      "section",
      {
        className:
          "home-new-section home-new-category-section"
      },

      React.createElement(
        "div",
        {
          className: "home-new-section-top"
        },

        React.createElement(
          "div",
          null,

          React.createElement(
            "span",
            {
              className: "home-new-section-label"
            },
            "EXPLORE"
          ),

          React.createElement(
            "h2",
            null,
            "Shop by category."
          )
        ),

        React.createElement(
          Link,
          {
            to: "/browse",
            className: "home-new-large-link"
          },
          "BROWSE MARKETPLACE →"
        )
      ),

      React.createElement(
        "div",
        {
          className: "home-new-category-grid"
        },

        categories.map(function (category, index) {
          return React.createElement(
            Link,
            {
              to: "/browse",
              className: "home-new-category-card",
              key: index
            },

            React.createElement("img", {
              src: category.image,
              alt: category.name
            }),

            React.createElement(
              "div",
              {
                className: "home-new-category-overlay"
              },

              React.createElement(
                "h3",
                null,
                category.name
              ),

              React.createElement(
                "span",
                null,
                "Explore →"
              )
            )
          );
        })
      )
    ),

    React.createElement(
      "section",
      {
        className: "home-new-how-section"
      },

      React.createElement(
        "div",
        {
          className: "home-new-how-heading"
        },

        React.createElement(
          "span",
          {
            className: "home-new-section-label"
          },
          "HOW IT WORKS"
        ),

        React.createElement(
          "h2",
          null,
          "One wardrobe. More possibilities."
        )
      ),

      React.createElement(
        "div",
        {
          className: "home-new-steps-grid"
        },

        steps.map(function (step, index) {
          return React.createElement(
            "div",
            {
              className: "home-new-step",
              key: index
            },

            React.createElement(
              "span",
              {
                className: "home-new-step-number"
              },
              step.number
            ),

            React.createElement(
              "h3",
              null,
              step.title
            ),

            React.createElement(
              "p",
              null,
              step.text
            )
          );
        })
      )
    ),

    React.createElement(
      "section",
      {
        className: "home-new-actions-section"
      },

      React.createElement(
        "div",
        {
          className: "home-new-actions-heading"
        },

        React.createElement(
          "div",
          null,

          React.createElement(
            "span",
            {
              className: "home-new-section-label"
            },
            "START SWAPPING"
          ),

          React.createElement(
            "h2",
            null,
            "What do you want to do?"
          ),

          React.createElement(
            "p",
            null,
            "Everything you need to start your next swap is right here."
          )
        )
      ),

      React.createElement(
        "div",
        {
          className: "home-new-actions-grid"
        },

        quickActions.map(function (action, index) {
          return React.createElement(
            Link,
            {
              to: action.path,
              className: "home-new-action-card",
              key: index
            },

            React.createElement(
              "div",
              {
                className: "home-new-action-top"
              },

              React.createElement(
                "span",
                {
                  className: "home-new-action-number"
                },
                action.number
              ),

              React.createElement(
                "span",
                {
                  className: "home-new-action-icon"
                },
                action.icon
              )
            ),

            React.createElement(
              "div",
              {
                className: "home-new-action-content"
              },

              React.createElement(
                "h3",
                null,
                action.title
              ),

              React.createElement(
                "p",
                null,
                action.text
              )
            ),

            React.createElement(
              "div",
              {
                className: "home-new-action-bottom"
              },

              React.createElement(
                "span",
                null,
                action.button
              ),

              React.createElement(
                "strong",
                null,
                "→"
              )
            )
          );
        })
      )
    ),

    React.createElement(
      "section",
      {
        className: "home-new-nearby-section"
      },

      React.createElement(
        "div",
        {
          className: "home-new-nearby-image"
        },

        React.createElement("img", {
          src:
            "https://images.unsplash.com/photo-1529139574466-a303027c1d8b?auto=format&fit=crop&w=1200&q=90",
          alt: "Fashion community"
        })
      ),

      React.createElement(
        "div",
        {
          className: "home-new-nearby-content"
        },

        React.createElement(
          "span",
          {
            className: "home-new-section-label"
          },
          "SWAP NEAR YOU"
        ),

        React.createElement(
          "h2",
          null,
          "Find people swapping around you."
        ),

        React.createElement(
          "p",
          null,
          "Discover clothing exchanges based on location and make swapping easier, faster and more local."
        ),

        React.createElement(
          Link,
          {
            to: "/location-matching",
            className: "home-new-primary-btn"
          },
          "EXPLORE NEARBY SWAPS",

          React.createElement(
            "span",
            null,
            "→"
          )
        )
      )
    ),

    React.createElement(
      "section",
      {
        className: "home-new-sustainability"
      },

      React.createElement(
        "div",
        null,

        React.createElement(
          "span",
          {
            className: "home-new-section-label"
          },
          "WHY CLOTHSWAP"
        ),

        React.createElement(
          "h2",
          null,
          "Wear more. Waste less."
        )
      ),

      React.createElement(
        "p",
        null,
        "Every successful swap keeps a wearable piece in circulation for longer — and gives someone else a reason to wear it again."
      )
    ),

    React.createElement(
      "section",
      {
        className: "home-new-final-cta"
      },

      React.createElement(
        "div",
        null,

        React.createElement(
          "span",
          {
            className: "home-new-section-label"
          },
          "READY TO SWAP?"
        ),

        React.createElement(
          "h2",
          null,
          "Your next favourite could already be here."
        ),

        React.createElement(
          "p",
          null,
          "Browse the marketplace or list something from your wardrobe."
        ),

        React.createElement(
          "div",
          {
            className: "home-new-final-actions"
          },

          React.createElement(
            Link,
            {
              to: "/browse",
              className: "home-new-primary-btn"
            },
            "START EXPLORING",

            React.createElement(
              "span",
              null,
              "→"
            )
          ),

          React.createElement(
            Link,
            {
              to: "/list-clothes",
              className: "home-new-secondary-btn"
            },
            "LIST YOUR CLOTHES"
          )
        )
      )
    )
  );
}

export default Home;