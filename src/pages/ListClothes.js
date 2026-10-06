
import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

function ListClothes() {
  const navigate = useNavigate();

  const videoRef = useRef(null);
  const streamRef = useRef(null);

  const [formData, setFormData] = useState({
    title: "",
    category: "",
    size: "",
    condition: "",
    location: "",
    price: "",
    owner: "",
    description: "",
    image: ""
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

  /* ================= CHOOSE PHOTO ================= */

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
      const response = await fetch(
        "http://localhost:5000/api/clothes",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
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

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message || "Failed to list clothing."
        );
      }

      setMessage(
        "🎉 Your clothing has been listed successfully!"
      );

      setFormData({
        title: "",
        category: "",
        size: "",
        condition: "",
        location: "",
        price: "",
        owner: "",
        description: "",
        image: ""
      });
    } catch (submitError) {
      console.log(
        "Clothing upload error:",
        submitError
      );

      setError(
        "❌ Cannot connect to server. Make sure backend is running."
      );
    } finally {
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
          background:
            "linear-gradient(135deg, #1f1635, #4b286d, #8e44ad)",
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
            boxShadow:
              "0 25px 70px rgba(0,0,0,0.35)"
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
                background:
                  "linear-gradient(135deg,#ff6b9d,#c44569)",
                color: "white",
                fontSize: "16px",
                fontWeight: "700",
                cursor: "pointer",
                boxShadow:
                  "0 8px 25px rgba(196,69,105,0.4)"
              }
            },
            cameraReady
              ? "📸 Capture Photo"
              : "Opening Camera..."
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

  /* ================= MAIN PAGE ================= */

  return React.createElement(
    "div",
    {
      style: {
        minHeight: "100vh",
        background:
          "linear-gradient(135deg,#fff7fb 0%,#f4efff 50%,#eef8ff 100%)",
        padding: "55px 15px"
      }
    },

    React.createElement(
      "div",
      {
        style: {
          maxWidth: "850px",
          margin: "0 auto"
        }
      },

      /* HEADER */

      React.createElement(
        "div",
        {
          style: {
            textAlign: "center",
            marginBottom: "35px"
          }
        },

        React.createElement(
          "div",
          {
            style: {
              display: "inline-block",
              padding: "9px 20px",
              borderRadius: "50px",
              background:
                "linear-gradient(135deg,#ff6b9d,#8e44ad)",
              color: "white",
              fontSize: "13px",
              fontWeight: "700",
              letterSpacing: "1px",
              marginBottom: "15px",
              boxShadow:
                "0 8px 25px rgba(142,68,173,0.25)"
            }
          },
          "♻️ CLOTHSWAP MARKETPLACE"
        ),

        React.createElement(
          "h1",
          {
            style: {
              fontSize: "42px",
              fontWeight: "800",
              margin: "0",
              background:
                "linear-gradient(135deg,#c44569,#6c3483)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent"
            }
          },
          "List Your Clothes"
        ),

        React.createElement(
          "p",
          {
            style: {
              color: "#6c6c7a",
              fontSize: "17px",
              marginTop: "10px"
            }
          },
          "Give your pre-loved clothes a beautiful new home."
        )
      ),

      /* FORM CARD */

      React.createElement(
        "form",
        {
          onSubmit: handleSubmit,
          style: {
            background: "rgba(255,255,255,0.9)",
            borderRadius: "30px",
            padding: "38px",
            boxShadow:
              "0 20px 60px rgba(80,50,100,0.12)",
            border:
              "1px solid rgba(255,255,255,0.8)"
          }
        },

        /* NAME */

        React.createElement(
          "div",
          { style: { marginBottom: "22px" } },

          React.createElement(
            "label",
            {
              style: {
                fontWeight: "700",
                color: "#3d3150",
                marginBottom: "8px",
                display: "block"
              }
            },
            " Clothing Name *"
          ),

          React.createElement("input", {
            type: "text",
            name: "title",
            value: formData.title,
            onChange: handleChange,
            placeholder: "e.g. Floral Summer Dress",
            style: inputStyle
          })
        ),

        /* TWO COLUMNS */

        React.createElement(
          "div",
          {
            style: {
              display: "grid",
              gridTemplateColumns:
                "repeat(auto-fit,minmax(220px,1fr))",
              gap: "20px"
            }
          },

          /* CATEGORY */

          React.createElement(
            "div",
            null,

            React.createElement(
              "label",
              { style: labelStyle },
              " Category *"
            ),

            React.createElement(
              "select",
              {
                name: "category",
                value: formData.category,
                onChange: handleChange,
                style: inputStyle
              },

              React.createElement(
                "option",
                { value: "" },
                "Select Category"
              ),
              React.createElement(
                "option",
                { value: "Dresses" },
                "Dresses"
              ),
              React.createElement(
                "option",
                { value: "Shirts" },
                "Shirts"
              ),
              React.createElement(
                "option",
                { value: "Jeans" },
                "Jeans"
              ),
              React.createElement(
                "option",
                { value: "Jackets" },
                "Jackets"
              ),
              React.createElement(
                "option",
                { value: "Hoodies" },
                "Hoodies"
              )
            )
          ),

          /* SIZE */

          React.createElement(
            "div",
            null,

            React.createElement(
              "label",
              { style: labelStyle },
              " Size *"
            ),

            React.createElement(
              "select",
              {
                name: "size",
                value: formData.size,
                onChange: handleChange,
                style: inputStyle
              },

              React.createElement(
                "option",
                { value: "" },
                "Select Size"
              ),
              React.createElement(
                "option",
                { value: "S" },
                "S"
              ),
              React.createElement(
                "option",
                { value: "M" },
                "M"
              ),
              React.createElement(
                "option",
                { value: "L" },
                "L"
              ),
              React.createElement(
                "option",
                { value: "XL" },
                "XL"
              ),
              React.createElement(
                "option",
                { value: "XXL" },
                "XXL"
              )
            )
          ),

          /* CONDITION */

          React.createElement(
            "div",
            null,

            React.createElement(
              "label",
              { style: labelStyle },
              " Condition *"
            ),

            React.createElement(
              "select",
              {
                name: "condition",
                value: formData.condition,
                onChange: handleChange,
                style: inputStyle
              },

              React.createElement(
                "option",
                { value: "" },
                "Select Condition"
              ),
              React.createElement(
                "option",
                { value: "Like New" },
                "Like New"
              ),
              React.createElement(
                "option",
                { value: "Excellent" },
                "Excellent"
              ),
              React.createElement(
                "option",
                { value: "Good" },
                "Good"
              )
            )
          ),

          /* LOCATION */

          React.createElement(
            "div",
            null,

            React.createElement(
              "label",
              { style: labelStyle },
              " Location"
            ),

            React.createElement(
              "select",
              {
                name: "location",
                value: formData.location,
                onChange: handleChange,
                style: inputStyle
              },

              React.createElement(
                "option",
                { value: "" },
                "Select Location"
              ),
              React.createElement(
                "option",
                { value: "Ahmedabad" },
                "Ahmedabad"
              ),
              React.createElement(
                "option",
                { value: "Mumbai" },
                "Mumbai"
              ),
              React.createElement(
                "option",
                { value: "Vadodara" },
                "Vadodara"
              ),
              React.createElement(
                "option",
                { value: "Surat" },
                "Surat"
              ),
              React.createElement(
                "option",
                { value: "Rajkot" },
                "Rajkot"
              )
            )
          ),

          /* PRICE */

          React.createElement(
            "div",
            null,

            React.createElement(
              "label",
              { style: labelStyle },
              " Price (₹)"
            ),

            React.createElement("input", {
              type: "number",
              name: "price",
              value: formData.price,
              onChange: handleChange,
              placeholder: "Enter price",
              style: inputStyle
            })
          ),

          /* OWNER */

          React.createElement(
            "div",
            null,

            React.createElement(
              "label",
              { style: labelStyle },
              " Your Name"
            ),

            React.createElement("input", {
              type: "text",
              name: "owner",
              value: formData.owner,
              onChange: handleChange,
              placeholder: "Enter your name",
              style: inputStyle
            })
          )
        ),

        /* DESCRIPTION */

        React.createElement(
          "div",
          {
            style: {
              marginTop: "22px",
              marginBottom: "25px"
            }
          },

          React.createElement(
            "label",
            { style: labelStyle },
            "Description"
          ),

          React.createElement(
            "textarea",
            {
              name: "description",
              rows: 5,
              value: formData.description,
              onChange: handleChange,
              placeholder:
                "Tell people something about your clothing...",
              style: {
                ...inputStyle,
                resize: "vertical"
              }
            }
          )
        ),

        /* IMAGE */

        React.createElement(
          "div",
          {
            style: {
              marginBottom: "28px",
              padding: "25px",
              borderRadius: "22px",
              background:
                "linear-gradient(135deg,#fff1f6,#f5efff)",
              border:
                "1px dashed rgba(142,68,173,0.35)"
            }
          },

          React.createElement(
            "label",
            { style: labelStyle },
            "📸 Clothing Photo *"
          ),

          React.createElement(
            "p",
            {
              style: {
                color: "#777",
                fontSize: "14px",
                marginBottom: "18px"
              }
            },
            "Choose a photo from your device or take a new photo."
          ),

          React.createElement(
            "div",
            {
              style: {
                display: "flex",
                gap: "12px",
                flexWrap: "wrap"
              }
            },

            /* CHOOSE */

            React.createElement(
              "label",
              {
                style: {
                  padding: "13px 22px",
                  borderRadius: "50px",
                  background: "white",
                  color: "#6c3483",
                  border:
                    "1px solid rgba(108,52,131,0.25)",
                  fontWeight: "700",
                  cursor: "pointer"
                }
              },

              "📁 Choose Photo",

              React.createElement("input", {
                type: "file",
                accept: "image/*",
                onChange: handleFileChange,
                style: {
                  display: "none"
                }
              })
            ),

            /* CAMERA */

            React.createElement(
              "button",
              {
                type: "button",
                onClick: openCamera,
                style: {
                  padding: "13px 22px",
                  borderRadius: "50px",
                  border: "none",
                  background:
                    "linear-gradient(135deg,#ff6b9d,#8e44ad)",
                  color: "white",
                  fontWeight: "700",
                  cursor: "pointer",
                  boxShadow:
                    "0 7px 20px rgba(142,68,173,0.25)"
                }
              },
              "📷 Take Photo"
            )
          ),

          /* PREVIEW */

          formData.image &&
            React.createElement(
              "div",
              {
                style: {
                  marginTop: "25px"
                }
              },

              React.createElement(
                "p",
                {
                  style: {
                    fontWeight: "700",
                    color: "#4b3869"
                  }
                },
                "✨ Photo Preview"
              ),

              React.createElement("img", {
                src: formData.image,
                alt: "Clothing Preview",
                style: {
                  width: "220px",
                  height: "260px",
                  objectFit: "cover",
                  borderRadius: "18px",
                  display: "block",
                  boxShadow:
                    "0 12px 30px rgba(80,50,100,0.18)"
                }
              })
            )
        ),

        /* MESSAGE */

        message &&
          React.createElement(
            "div",
            {
              style: {
                padding: "15px",
                borderRadius: "14px",
                background: "#e9fff3",
                color: "#18794e",
                fontWeight: "600",
                marginBottom: "18px"
              }
            },
            message
          ),

        error &&
          React.createElement(
            "div",
            {
              style: {
                padding: "15px",
                borderRadius: "14px",
                background: "#fff0f0",
                color: "#c0392b",
                fontWeight: "600",
                marginBottom: "18px"
              }
            },
            error
          ),

        /* SUBMIT */

        React.createElement(
          "button",
          {
            type: "submit",
            disabled: loading,
            style: {
              width: "100%",
              padding: "17px",
              border: "none",
              borderRadius: "50px",
              background:
                "linear-gradient(135deg,#c44569,#8e44ad)",
              color: "white",
              fontSize: "17px",
              fontWeight: "800",
              cursor: loading
                ? "not-allowed"
                : "pointer",
              boxShadow:
                "0 12px 30px rgba(142,68,173,0.3)"
            }
          },
          loading
            ? "⏳ Listing..."
            : "✨ List My Clothes"
        ),

        /* BROWSE */

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
                borderRadius: "50px",
                background: "white",
                color: "#6c3483",
                border:
                  "1px solid rgba(108,52,131,0.3)",
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

/* ================= STYLES ================= */

const inputStyle = {
  width: "100%",
  padding: "13px 16px",
  borderRadius: "14px",
  border: "1px solid #e1d8ea",
  background: "#fff",
  color: "#393142",
  fontSize: "15px",
  outline: "none",
  boxSizing: "border-box"
};
  
const labelStyle = {
  display: "block",
  fontWeight: "700",
  color: "#3d3150",
  marginBottom: "8px"
};

export default ListClothes;

