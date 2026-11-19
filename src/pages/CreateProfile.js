
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import API_URL, { apiFetch } from "../api";

function CreateProfile() {
  const navigate = useNavigate();

  const [name, setName] = useState(
    localStorage.getItem("clothSwapUserName") ||
    localStorage.getItem("clothswapUserName") ||
    ""
  );

  const [location, setLocation] = useState(
    localStorage.getItem("clothswapUserLocation") || ""
  );

  const [bio, setBio] = useState("");
  const [profilePhoto, setProfilePhoto] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(function () {
    loadProfile();
  }, []);

  async function loadProfile() {
    try {
      const response = await apiFetch(
        `${API_URL}/api/user/profile`
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Failed to load profile"
        );
      }

      const profile = data.profile;

      if (profile.profileCompleted) {
        navigate("/dashboard", { replace: true });
        return;
      }

      setName(profile.name || "");
      setLocation(profile.location || "");
      setBio(profile.bio || "");
      setProfilePhoto(profile.profilePhoto || "");

    } catch (err) {
      setError(err.message || "Unable to load profile");
    } finally {
      setLoading(false);
    }
  }

  function handlePhotoChange(event) {
    const file = event.target.files[0];

    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("Please select a valid image.");
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      setError("Profile photo must be smaller than 2 MB.");
      event.target.value = "";
      return;
    }

    const reader = new FileReader();

    reader.onload = function () {
      setProfilePhoto(reader.result);
      setError("");
    };

    reader.onerror = function () {
      setError("Unable to read selected photo.");
    };

    reader.readAsDataURL(file);
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");

    if (!name.trim()) {
      setError("Full name is required.");
      return;
    }

    if (!location.trim()) {
      setError("Location is required.");
      return;
    }

    if (bio.length > 250) {
      setError("Bio cannot exceed 250 characters.");
      return;
    }

    try {
      setSaving(true);

      const response = await apiFetch(
        `${API_URL}/api/user/profile`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            name: name.trim(),
            location: location.trim(),
            bio: bio.trim(),
            profilePhoto: profilePhoto
          })
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Profile could not be saved."
        );
      }

      localStorage.setItem(
        "clothSwapUserName",
        data.profile.name
      );

      localStorage.setItem(
        "clothswapUserName",
        data.profile.name
      );

      localStorage.setItem(
        "clothswapUserLocation",
        data.profile.location
      );

      navigate("/dashboard", { replace: true });

    } catch (err) {
      setError(err.message || "Something went wrong.");
    } finally {
      setSaving(false);
    }
  }

  const inputStyle = {
    width: "100%",
    padding: "13px 15px",
    border: "1px solid #e7dce9",
    borderRadius: "12px",
    outline: "none",
    fontSize: "15px",
    background: "#ffffff"
  };

  if (loading) {
    return React.createElement(
      "div",
      {
        style: {
          minHeight: "70vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center"
        }
      },
      "Loading profile..."
    );
  }

  return React.createElement(
    "div",
    {
      style: {
        minHeight: "85vh",
        padding: "40px 15px",
        background: "linear-gradient(135deg, #fff5fa, #f7f0ff)"
      }
    },

    React.createElement(
      "div",
      {
        style: {
          maxWidth: "620px",
          margin: "0 auto",
          padding: "30px",
          borderRadius: "22px",
          background: "rgba(255,255,255,0.92)",
          boxShadow: "0 10px 35px rgba(120,70,130,0.10)"
        }
      },

      React.createElement(
        "h2",
        {
          style: {
            textAlign: "center",
            color: "#a34c9e",
            marginBottom: "8px"
          }
        },
        "Create Your Profile"
      ),

      React.createElement(
        "p",
        {
          style: {
            textAlign: "center",
            color: "#777",
            marginBottom: "25px"
          }
        },
        "Introduce yourself to the ClothSwap community."
      ),

      error
        ? React.createElement(
            "div",
            {
              style: {
                color: "#c62828",
                background: "#fff0f0",
                padding: "11px",
                borderRadius: "9px",
                marginBottom: "15px"
              }
            },
            error
          )
        : null,

      React.createElement(
        "form",
        { onSubmit: handleSubmit },

        React.createElement(
          "div",
          {
            style: {
              textAlign: "center",
              marginBottom: "25px"
            }
          },

          React.createElement(
            "div",
            {
              style: {
                width: "115px",
                height: "115px",
                borderRadius: "50%",
                margin: "0 auto 12px",
                overflow: "hidden",
                background: "#f5e5f4",
                border: "3px solid #e7b5df",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "40px",
                color: "#a34c9e"
              }
            },

            profilePhoto
              ? React.createElement("img", {
                  src: profilePhoto,
                  alt: "Profile",
                  style: {
                    width: "100%",
                    height: "100%",
                    objectFit: "cover"
                  }
                })
              : "👤"
          ),

          React.createElement(
            "label",
            {
              htmlFor: "profile-photo",
              style: {
                color: "#a34c9e",
                fontWeight: "600",
                cursor: "pointer"
              }
            },
            "Upload Profile Photo"
          ),

          React.createElement("input", {
            id: "profile-photo",
            type: "file",
            accept: "image/*",
            onChange: handlePhotoChange,
            style: { display: "none" }
          }),

          React.createElement(
            "p",
            {
              style: {
                fontSize: "12px",
                color: "#888",
                marginTop: "5px"
              }
            },
            "Maximum image size: 2 MB"
          )
        ),

        React.createElement(
          "label",
          { style: { fontWeight: "600" } },
          "Full Name"
        ),

        React.createElement("input", {
          type: "text",
          value: name,
          onChange: function (e) {
            setName(e.target.value);
          },
          placeholder: "Enter your full name",
          maxLength: 100,
          style: { ...inputStyle, margin: "8px 0 18px" }
        }),

        React.createElement(
          "label",
          { style: { fontWeight: "600" } },
          "Location"
        ),

        React.createElement("input", {
          type: "text",
          value: location,
          onChange: function (e) {
            setLocation(e.target.value);
          },
          placeholder: "Enter your city or location",
          style: { ...inputStyle, margin: "8px 0 18px" }
        }),

        React.createElement(
          "label",
          { style: { fontWeight: "600" } },
          "Short Bio"
        ),

        React.createElement("textarea", {
          value: bio,
          onChange: function (e) {
            setBio(e.target.value);
          },
          placeholder: "Tell something about yourself...",
          maxLength: 250,
          rows: 4,
          style: {
            ...inputStyle,
            margin: "8px 0 5px",
            resize: "vertical"
          }
        }),

        React.createElement(
          "div",
          {
            style: {
              textAlign: "right",
              fontSize: "12px",
              color: "#888",
              marginBottom: "22px"
            }
          },
          bio.length + "/250 characters"
        ),

        React.createElement(
          "button",
          {
            type: "submit",
            disabled: saving,
            style: {
              width: "100%",
              padding: "14px",
              border: "none",
              borderRadius: "12px",
              background: "linear-gradient(135deg, #e85d9e, #a85bc7)",
              color: "#fff",
              fontSize: "16px",
              fontWeight: "600",
              cursor: saving ? "not-allowed" : "pointer",
              opacity: saving ? 0.7 : 1
            }
          },
          saving ? "Saving..." : "Save Profile"
        )
      )
    )
  );
}

export default CreateProfile;
