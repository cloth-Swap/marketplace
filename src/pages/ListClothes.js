
  import React, { useEffect, useRef, useState } from "react";
  import { useNavigate, useLocation } from "react-router-dom";
  import API_URL from "../api";
  import { State, City } from "country-state-city";

  const inputStyle = {
    width: "100%",
    padding: "14px 16px",
    borderRadius: "13px",
    border: "1px solid #e7dce9",
    background: "#fff",
    color: "#393142",
    fontSize: "15px",
    outline: "none",
    boxSizing: "border-box"
  };

  const labelStyle = {
    display: "block",
    fontWeight: "700",
    color: "#493653",
    marginBottom: "9px",
    fontSize: "14px"
  };

  const sectionHeadingStyle = {
    color: "#69436f",
    fontSize: "19px",
    fontWeight: "800",
    margin: "0 0 7px"
  };

  const sectionDescriptionStyle = {
    color: "#928397",
    fontSize: "13px",
    margin: "0 0 20px"
  };

  function ListClothes() {
  const navigate = useNavigate();
  const routeLocation = useLocation();
  const editListing = routeLocation.state?.editListing || null;
  const isEditMode = Boolean(editListing);

    const videoRef = useRef(null);
    const streamRef = useRef(null);

    const [formData, setFormData] = useState({
      title: "",
      brand: "",
      category: "",
      size: "",
      condition: "",
      location: "",
      price: "",
      owner: "",
      description: "",
      image: ""
    });

    const [selectedStateCode, setSelectedStateCode] = useState("");
    const [selectedCity, setSelectedCity] = useState("");

    // NEW EDIT MODE useEffect — અહીં paste કરવો
useEffect(function () {
  if (!editListing) return;

  const savedLocation = editListing.location || "";
  const parts = savedLocation.split(",").map(function (item) {
    return item.trim();
  });

  const savedCity = parts[0] || "";
  const savedState = parts[1] || "";

  const state = State.getStatesOfCountry("IN").find(
    function (item) {
      return item.name.toLowerCase() === savedState.toLowerCase();
    }
  );

  setFormData({
    title: editListing.title || "",
    brand: editListing.brand || "",
    category: editListing.category || "",
    size: editListing.size || "",
    condition: editListing.condition || "",
    location: savedLocation,
    price: editListing.price != null ? String(editListing.price) : "",
    owner: editListing.owner || "",
    description: editListing.description || "",
    image: editListing.image || ""
  });

  if (state) {
    setSelectedStateCode(state.isoCode);
    setSelectedCity(savedCity);
  }
}, [editListing]);

    useEffect(function () {
    const savedLocation =
      localStorage.getItem("clothswapUserLocation") || "";

    if (editListing || !savedLocation) return;

    const parts = savedLocation.split(",").map(function (item) {
      return item.trim();
    });

    const savedCity = parts[0];
    const savedState = parts[1];

    const state = State.getStatesOfCountry("IN").find(
      function (item) {
        return item.name.toLowerCase() ===
          (savedState || "").toLowerCase();
      }
    );

    if (state) {
      setSelectedStateCode(state.isoCode);
      setSelectedCity(savedCity);

      setFormData(function (previous) {
        return {
          ...previous,
          location: savedLocation
        };
      });
    }
  }, []);
    const [citySearch, setCitySearch] = useState("");
    const [cityDropdownOpen, setCityDropdownOpen] = useState(false);
    const indiaStates = State.getStatesOfCountry("IN");
    const indiaCities = selectedStateCode
      ? City.getCitiesOfState("IN", selectedStateCode)
      : [];
    const filteredIndiaCities = indiaCities.filter(function (city) {
      return city.name.toLowerCase().includes(citySearch.toLowerCase());
    });

    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");
    const [showCamera, setShowCamera] = useState(false);
    const [cameraReady, setCameraReady] = useState(false);

    /* ================= INPUT ================= */

    function handleChange(event) {
      const name = event.target.name;
      const value = event.target.value;

      setFormData(function (previous) {
        return {
          ...previous,
          [name]: value
        };
      });
    }

    /* ================= IMAGE PROCESSING ================= */

    function processImage(file) {
      if (!file) return;

      setError("");
      setMessage("");

      if (!file.type.startsWith("image/")) {
        setError("Please select a valid image.");
        return;
      }

      const reader = new FileReader();

      reader.onload = function (event) {
        const image = new Image();

        image.onload = function () {
          const canvas = document.createElement("canvas");

          const maxWidth = 1200;
          const maxHeight = 1200;

          let width = image.width;
          let height = image.height;

          if (width > maxWidth) {
            height = height * (maxWidth / width);
            width = maxWidth;
          }

          if (height > maxHeight) {
            width = width * (maxHeight / height);
            height = maxHeight;
          }

          canvas.width = Math.round(width);
          canvas.height = Math.round(height);

          const context = canvas.getContext("2d");

          context.drawImage(
            image,
            0,
            0,
            canvas.width,
            canvas.height
          );

          const compressedImage = canvas.toDataURL(
            "image/jpeg",
            0.75
          );

          setFormData(function (previous) {
            return {
              ...previous,
              image: compressedImage
            };
          });
        };

        image.onerror = function () {
          setError("Unable to read this image.");
        };

        image.src = event.target.result;
      };

      reader.onerror = function () {
        setError("Unable to read the selected image.");
      };

      reader.readAsDataURL(file);
    }

    function handleFileChange(event) {
      const file = event.target.files[0];

      if (file) {
        processImage(file);
      }

      event.target.value = "";
    }

    /* ================= CAMERA ================= */

    async function openCamera() {
      setError("");
      setMessage("");

      try {
        if (
          !navigator.mediaDevices ||
          !navigator.mediaDevices.getUserMedia
        ) {
          setError("Camera is not supported by this browser.");
          return;
        }

        const stream =
          await navigator.mediaDevices.getUserMedia({
            video: {
              facingMode: {
                ideal: "environment"
              },
              width: {
                ideal: 1280
              },
              height: {
                ideal: 720
              }
            },
            audio: false
          });

        streamRef.current = stream;

        setShowCamera(true);
        setCameraReady(false);

        setTimeout(function () {
          if (videoRef.current) {
            videoRef.current.srcObject = stream;

            videoRef.current
              .play()
              .then(function () {
                setCameraReady(true);
              })
              .catch(function () {
                setCameraReady(true);
              });
          }
        }, 100);
      } catch (cameraError) {
        console.log("Camera error:", cameraError);

        setError(
          "Camera permission was denied or camera is unavailable."
        );

        setShowCamera(false);
      }
    }

    /* ================= CAPTURE ================= */

    function capturePhoto() {
      if (!videoRef.current) return;

      const video = videoRef.current;

      const canvas = document.createElement("canvas");

      let width = video.videoWidth;
      let height = video.videoHeight;

      const maxWidth = 1200;
      const maxHeight = 1200;

      if (width > maxWidth) {
        height = height * (maxWidth / width);
        width = maxWidth;
      }

      if (height > maxHeight) {
        width = width * (maxHeight / height);
        height = maxHeight;
      }

      canvas.width = Math.round(width);
      canvas.height = Math.round(height);

      const context = canvas.getContext("2d");

      context.drawImage(
        video,
        0,
        0,
        canvas.width,
        canvas.height
      );

      const image = canvas.toDataURL(
        "image/jpeg",
        0.75
      );

      setFormData(function (previous) {
        return {
          ...previous,
          image: image
        };
      });

      closeCamera();
    }

    /* ================= CLOSE CAMERA ================= */

    function closeCamera() {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(function (track) {
          track.stop();
        });

        streamRef.current = null;
      }

      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }

      setShowCamera(false);
      setCameraReady(false);
    }

    /* ================= CLEAN CAMERA ================= */

    useEffect(function () {
      return function () {
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(function (track) {
            track.stop();
          });
        }
      };
    }, []);

    /* ================= SUBMIT ================= */

    async function handleSubmit(event) {
      event.preventDefault();

      setMessage("");
      setError("");

      if (!formData.title.trim()) {
        setError("Please enter clothing name.");
        return;
      }

      if (!formData.brand.trim()) {
        setError("Please enter brand name.");
        return;
      }

      if (!formData.price || Number(formData.price) <= 0) {
        setError("Please enter a valid price.");
        return;
      }

      if (!formData.location) {
        setError("Please select your location.");
        return;
      }

      if (!formData.owner.trim()) {
        setError("Please enter your name.");
        return;
      }

      if (!formData.category) {
        setError("Please select a category.");
        return;
      }

      if (!formData.size) {
        setError("Please select a size.");
        return;
      }

      if (!formData.condition) {
        setError("Please select condition.");
        return;
      }

      if (!formData.image) {
        setError("Please choose a photo or take a photo.");
        return;
      }

      setLoading(true);

      try {
        console.log("BRAND BEING SENT:", formData.brand);

        const response = await fetch(
   `${API_URL}/api/clothes${isEditMode ? "/" + editListing._id : ""}`,
{
  method: isEditMode ? "PUT" : "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("clothswapToken")}`
      },
            body: JSON.stringify({
              ...formData,
              ownerEmail:
                localStorage.getItem("clothswapUserEmail") ||
                localStorage.getItem("clothswapEmail") ||
                ""
            })
          }
        );

  const responseText = await response.text();
  

  let data;

  try {
    data = JSON.parse(responseText);
  } catch (parseError) {
    console.error("Non-JSON server response:", responseText);

    throw new Error(
      "Server returned HTML instead of JSON. Check the clothing API route."
    );
  }
        if (!response.ok || !data.success) {
          throw new Error(
            data.message || "Failed to list clothing."
          );
        }
if (isEditMode) {
  navigate("/my-listings");
  return;
}
        setMessage(
          "🎉 Your clothing has been listed successfully!"
        );

        setFormData({
          title: "",
          brand: "",
          category: "",
          size: "",
          condition: "",
          location: "",
          price: "",
          owner: "",
          description: "",
          image: ""
        });

        setSelectedStateCode("");
        setSelectedCity("");
        setCitySearch("");

      }  catch (submitError) {
    console.error("Clothing upload error:", submitError);

    setError(
      submitError.message || "Something went wrong while listing clothing."
    );
  }
  finally {
        setLoading(false);
      }
    }

    /* ================= CAMERA SCREEN ================= */

    if (showCamera) {
      return React.createElement(
        "div",
        {
          style: {
            minHeight: "100vh",
            background: "linear-gradient(135deg,#1f1635,#4b286d,#8e44ad)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "25px"
          }
        },

        React.createElement(
          "div",
          {
            style: {
              width: "100%",
              maxWidth: "760px",
              background: "rgba(255,255,255,0.12)",
              backdropFilter: "blur(20px)",
              borderRadius: "28px",
              padding: "25px",
              boxShadow: "0 25px 70px rgba(0,0,0,0.35)"
            }
          },

          React.createElement(
            "h2",
            {
              style: {
                color: "white",
                textAlign: "center",
                marginBottom: "20px",
                fontWeight: "700"
              }
            },
            "📷 Take a Photo"
          ),

          React.createElement("video", {
            ref: videoRef,
            autoPlay: true,
            playsInline: true,
            muted: true,
            style: {
              width: "100%",
              maxHeight: "65vh",
              objectFit: "cover",
              borderRadius: "20px",
              background: "#111",
              display: "block"
            }
          }),

          React.createElement(
            "div",
            {
              style: {
                display: "flex",
                justifyContent: "center",
                gap: "15px",
                marginTop: "22px",
                flexWrap: "wrap"
              }
            },

            React.createElement(
              "button",
              {
                type: "button",
                onClick: capturePhoto,
                disabled: !cameraReady,
                style: {
                  padding: "14px 30px",
                  borderRadius: "50px",
                  border: "none",
                  background: "linear-gradient(135deg,#ff6b9d,#c44569)",
                  color: "white",
                  fontSize: "16px",
                  fontWeight: "700",
                  cursor: "pointer",
                  boxShadow: "0 8px 25px rgba(196,69,105,0.4)"
                }
              },
              cameraReady ? "📸 Capture Photo" : "Opening Camera..."
            ),

            React.createElement(
              "button",
              {
                type: "button",
                onClick: closeCamera,
                style: {
                  padding: "14px 30px",
                  borderRadius: "50px",
                  border: "1px solid rgba(255,255,255,0.6)",
                  background: "rgba(255,255,255,0.1)",
                  color: "white",
                  fontSize: "16px",
                  fontWeight: "600",
                  cursor: "pointer"
                }
              },
              "✕ Cancel"
            )
          )
        )
      );
    }

    /* ================= MAIN FORM ================= */

    return React.createElement(
      "div",
      {
        style: {
          minHeight: "100vh",
          background: "linear-gradient(135deg,#fff7fb 0%,#f4efff 50%,#eef8ff 100%)",
          padding: "45px 15px"
        }
      },

      React.createElement(
        "div",
        {
          style: {
            maxWidth: "900px",
            margin: "0 auto"
          }
        },

        /* HEADER */

        React.createElement(
          "div",
          {
            style: {
              textAlign: "center",
              marginBottom: "32px"
            }
          },

          React.createElement(
            "div",
            {
              style: {
                display: "inline-block",
                padding: "9px 20px",
                borderRadius: "50px",
                background: "linear-gradient(135deg,#ff6b9d,#8e44ad)",
                color: "white",
                fontSize: "12px",
                fontWeight: "800",
                letterSpacing: "1px",
                marginBottom: "15px"
              }
            },
            "♻️ CLOTHSWAP MARKETPLACE"
          ),

          React.createElement(
            "h1",
            {
              style: {
                fontSize: "clamp(30px,5vw,43px)",
                fontWeight: "800",
                margin: "0",
                color: "#69436f"
              }
            },
            isEditMode ? "Edit Your Clothing" : "List Your Clothing"
          ),

          React.createElement(
            "p",
            {
              style: {
                color: "#81738a",
                fontSize: "15px",
                marginTop: "10px"
              }
            },
            "Give your pre-loved fashion a beautiful new home ♡"
          )
        ),

        /* FORM */

        React.createElement(
          "form",
          {
            onSubmit: handleSubmit,
            style: {
              background: "rgba(255,255,255,0.96)",
              borderRadius: "25px",
              padding: "clamp(18px,4vw,38px)",
              boxShadow: "0 18px 55px rgba(105,65,120,0.12)",
              border: "1px solid #f0e5f2"
            }
          },
        React.createElement(
            "div",
            { style: { marginBottom: "28px" } },

            React.createElement("h3", { style: sectionHeadingStyle }, " Basic Information"),

            React.createElement("p", { style: sectionDescriptionStyle }, "Tell us what you want to exchange."),

            React.createElement(
              "div",
              { style: { marginBottom: "20px" } },

              React.createElement("label", { style: labelStyle }, "Clothing Name *"),

              React.createElement("input", {
                type: "text",
                name: "title",
                value: formData.title,
                onChange: handleChange,
                placeholder: "e.g. Floral Summer Dress",
                style: inputStyle
              })
            ),

            React.createElement(
              "div",
              { style: { marginBottom: "20px" } },

              React.createElement("label", { style: labelStyle }, "Brand *"),

              React.createElement("input", {
                type: "text",
                name: "brand",
                value: formData.brand,
                onChange: handleChange,
                placeholder: "e.g. Zara, H&M, Zudio, Nike",
                style: inputStyle
              })
            ),

            React.createElement(
              "div",
              null,

              React.createElement("label", { style: labelStyle }, "Category *"),

              React.createElement(
                "select",
                {
                  name: "category",
                  value: formData.category,
                  onChange: handleChange,
                  style: inputStyle
                },

               ...[
  "",
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
].map(function (item) {
  return React.createElement(
    "option",
    { key: item, value: item },
    item || "Select Category"
  );
})
              )
            )
          ),
          React.createElement(
            "div",
            {
              style: {
                borderTop: "1px solid #f0e7f2",
                paddingTop: "25px",
                marginBottom: "28px"
              }
            },

            React.createElement("h3", { style: sectionHeadingStyle }, "  Clothing Details"),

            React.createElement("p", { style: sectionDescriptionStyle }, "Add size and condition details."),

            React.createElement(
              "div",
              {
                style: {
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))",
                  gap: "20px"
                }
              },

              React.createElement(
                "div",
                null,

                React.createElement("label", { style: labelStyle }, "Size *"),

                React.createElement(
                  "select",
                  {
                    name: "size",
                    value: formData.size,
                    onChange: handleChange,
                    style: inputStyle
                  },

                  ...["", "S", "M", "L", "XL", "XXL"].map(function (item) {
                    return React.createElement(
                      "option",
                      { key: item, value: item },
                      item || "Select Size"
                    );
                  })
                )
              ),

              React.createElement(
                "div",
                null,

                React.createElement("label", { style: labelStyle }, "Condition *"),

                React.createElement(
                  "select",
                  {
                    name: "condition",
                    value: formData.condition,
                    onChange: handleChange,
                    style: inputStyle
                  },

                  ...["", "Like New", "Excellent", "Good"].map(function (item) {
                    return React.createElement(
                      "option",
                      { key: item, value: item },
                      item || "Select Condition"
                    );
                  })
                )
              )
            )
          ),
          React.createElement(
            "div",
            {
              style: {
                borderTop: "1px solid #f0e7f2",
                paddingTop: "25px",
                marginBottom: "28px"
              }
            },

            React.createElement("h3", { style: sectionHeadingStyle }, "  Location & Pricing"),

            React.createElement("p", { style: sectionDescriptionStyle }, "Where are you listing your clothing from?"),

            React.createElement(
              "div",
              {
                style: {
                  background: "#fcf7fc",
                  border: "1px solid #f0e4f1",
                  borderRadius: "16px",
                  padding: "17px",
                  marginBottom: "20px"
                }
              },

              React.createElement("label", { style: labelStyle }, "Country"),

              React.createElement(
                "div",
                {
                  style: {
                    ...inputStyle,
                    background: "#f4edf6",
                    color: "#765a7e"
                  }
                },
                "🇮🇳  India"
              ),

              React.createElement(
                "div",
                { style: { marginTop: "16px" } },

                React.createElement("label", { style: labelStyle }, "State *"),

                React.createElement(
                  "select",
                  {
                    value: selectedStateCode,
                    onChange: function (event) {
                      setSelectedStateCode(event.target.value);
                      setSelectedCity("");
                      setCitySearch("");

                      setFormData(function (previous) {
                        return {
                          ...previous,
                          location: ""
                        };
                      });
                    },
                    style: inputStyle
                  },

                  React.createElement("option", { value: "" }, "Select State"),

                  ...indiaStates.map(function (state) {
                    return React.createElement(
                      "option",
                      {
                        key: state.isoCode,
                        value: state.isoCode
                      },
                      state.name
                    );
                  })
                )
              ),

              React.createElement(
    "div",
    { style: { marginTop: "16px" } },

    React.createElement(
      "label",
      { style: labelStyle },
      "City *"
    ),

    React.createElement(
      "select",
      {
        value: selectedCity,
        disabled: !selectedStateCode,
        required: true,
        style: inputStyle,
        onChange: function (event) {
          const city = event.target.value;

          setSelectedCity(city);

          const stateName = indiaStates.find(function (state) {
            return state.isoCode === selectedStateCode;
          })?.name || "";

          setFormData(function (prev) {
            return {
              ...prev,
              location: city
                ? city + ", " + stateName + ", India"
                : ""
            };
          });
        }
      },

      React.createElement(
        "option",
        { value: "" },
        "Select City"
      ),

          indiaCities.map(function (city) {
        return React.createElement(
          "option",
          { key: city.name, value: city.name },
          city.name
        );
      })
    )
  )
            ),

            React.createElement(
              "div",
              {
                style: {
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))",
                  gap: "20px"
                }
              },
              React.createElement(
                "div",
                null,

                React.createElement("label", { style: labelStyle }, "Price (₹) *"),

                React.createElement("input", {
                  type: "number",
                  name: "price",
                  value: formData.price,
                  onChange: handleChange,
                  placeholder: "Enter price",
                  min: "1",
                  style: inputStyle
                })
              ),

              React.createElement(
                "div",
                null,

                React.createElement("label", { style: labelStyle }, "Your Name *"),

                React.createElement("input", {
                  type: "text",
                  name: "owner",
                  value: formData.owner,
                  onChange: handleChange,
                  placeholder: "Enter your name",
                  style: inputStyle
                })
              )
            )
          ),
          React.createElement(
            "div",
            {
              style: {
                borderTop: "1px solid #f0e7f2",
                paddingTop: "25px",
                marginBottom: "28px"
              }
            },

            React.createElement("h3", { style: sectionHeadingStyle }, "  About Your Clothing"),

            React.createElement("p", { style: sectionDescriptionStyle }, "Share a few details about your item."),

            React.createElement("textarea", {
              name: "description",
              rows: 4,
              value: formData.description,
              onChange: handleChange,
              placeholder: "Describe the fabric, style, colour and other details...",
              style: {
                ...inputStyle,
                resize: "vertical",
                minHeight: "110px"
              }
            })
          ),
          React.createElement(
            "div",
            {
              style: {
                borderTop: "1px solid #f0e7f2",
                paddingTop: "25px",
                marginBottom: "25px"
              }
            },

            React.createElement("h3", { style: sectionHeadingStyle }, " Clothing Photos"),

            React.createElement("p", { style: sectionDescriptionStyle }, "Add a clear photo to help others see your clothing."),

            React.createElement(
              "div",
              {
                style: {
                  background: "linear-gradient(135deg,#fff4f8,#f5efff)",
                  border: "2px dashed #d9b8d9",
                  borderRadius: "20px",
                  padding: "25px",
                  textAlign: "center"
                }
              },

              React.createElement(
                "div",
                { style: { fontSize: "38px", marginBottom: "8px" } },
                "📸"
              ),

              React.createElement(
                "p",
                {
                  style: {
                    color: "#76527d",
                    fontWeight: "700",
                    margin: "0 0 18px"
                  }
                },
                "Upload your clothing photo"
              ),

              React.createElement(
                "div",
                {
                  style: {
                    display: "flex",
                    justifyContent: "center",
                    gap: "12px",
                    flexWrap: "wrap"
                  }
                },

                React.createElement(
                  "label",
                  {
                    style: {
                      padding: "12px 22px",
                      borderRadius: "30px",
                      background: "white",
                      color: "#854c83",
                      border: "1px solid #e4cce3",
                      fontWeight: "700",
                      cursor: "pointer"
                    }
                  },

                  "📁 Choose Photo",

                  React.createElement("input", {
                    type: "file",
                    accept: "image/*",
                    onChange: handleFileChange,
                    style: { display: "none" }
                  })
                ),

                React.createElement(
                  "button",
                  {
                    type: "button",
                    onClick: openCamera,
                    style: {
                      padding: "12px 22px",
                      borderRadius: "30px",
                      border: "none",
                      background: "linear-gradient(135deg,#e76aa5,#9161bd)",
                      color: "white",
                      fontWeight: "700",
                      cursor: "pointer"
                    }
                  },
                  "📷 Take Photo"
                )
              ),

              formData.image &&
                React.createElement(
                  "div",
                  { style: { marginTop: "22px" } },

                  React.createElement(
                    "p",
                    {
                      style: {
                        fontWeight: "700",
                        color: "#69466f"
                      }
                    },
                    "✨ Photo Preview"
                  ),

                  React.createElement("img", {
                    src: formData.image,
                    alt: "Clothing Preview",
                    style: {
                      width: "100%",
                      maxWidth: "230px",
                      height: "250px",
                      objectFit: "cover",
                      borderRadius: "16px",
                      boxShadow: "0 8px 25px rgba(80,50,100,0.15)"
                    }
                  }),

                  React.createElement(
                    "button",
                    {
                      type: "button",
                      onClick: function () {
                        setFormData(function (previous) {
                          return {
                            ...previous,
                            image: ""
                          };
                        });
                      },
                      style: {
                        display: "block",
                        margin: "12px auto 0",
                        border: "none",
                        background: "transparent",
                        color: "#c44569",
                        fontWeight: "700",
                        cursor: "pointer"
                      }
                    },
                    "✕ Remove Photo"
                  )
                )
            )
          ),

          /* SUCCESS MESSAGE */

          message &&
            React.createElement(
              "div",
              {
                style: {
                  padding: "15px",
                  borderRadius: "13px",
                  background: "#e9fff3",
                  color: "#18794e",
                  fontWeight: "600",
                  marginBottom: "18px"
                }
              },
              message
            ),

          /* ERROR MESSAGE */

          error &&
            React.createElement(
              "div",
              {
                style: {
                  padding: "15px",
                  borderRadius: "13px",
                  background: "#fff0f0",
                  color: "#c0392b",
                  fontWeight: "600",
                  marginBottom: "18px"
                }
              },
              error
            ),

          /* SUBMIT BUTTON */

          React.createElement(
            "button",
            {
              type: "submit",
              disabled: loading,
              style: {
                width: "100%",
                padding: "17px",
                border: "none",
                borderRadius: "40px",
                background: "linear-gradient(135deg,#d85d98,#8954b5)",
                color: "white",
                fontSize: "17px",
                fontWeight: "800",
                cursor: loading ? "not-allowed" : "pointer",
                boxShadow: "0 10px 25px rgba(142,68,173,0.25)"
              }
            },
            loading
  ? (isEditMode ? "⏳ Saving Changes..." : "⏳ Listing...")
  : (isEditMode ? "💾 Save Changes" : "✨ List My Clothing")
          ),

          /* BROWSE BUTTON */

          message &&
            React.createElement(
              "button",
              {
                type: "button",
                onClick: function () {
                  navigate("/browse");
                },
                style: {
                  width: "100%",
                  marginTop: "12px",
                  padding: "14px",
                  borderRadius: "40px",
                  background: "white",
                  color: "#80518f",
                  border: "1px solid #dfcce6",
                  fontWeight: "700",
                  cursor: "pointer"
                }
              },
              "👀 Go to Browse Clothes"
            )
        )
      )
    );
  }

  export default ListClothes;
