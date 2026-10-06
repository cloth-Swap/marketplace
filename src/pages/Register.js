import React, {
  useEffect,
  useRef,
  useState
} from "react";

import {
  Link,
  useNavigate
} from "react-router-dom";


function Register() {

  const navigate = useNavigate();

  const [name, setName] =
    useState("");

  const [email, setEmail] =
    useState("");

  const [location, setLocation] =
    useState("");

  const [password, setPassword] =
    useState("");

  const [confirmPassword, setConfirmPassword] =
    useState("");

  const [showPassword, setShowPassword] =
    useState(false);

  const [error, setError] =
    useState("");

  const googleButtonRef =
    useRef(null);


  /* =====================================================
     GOOGLE LOGIN
  ===================================================== */

  const handleGoogleResponse =
    async function (response) {

      try {

        setError("");

        if (
          !response ||
          !response.credential
        ) {

          setError(
            "Google sign in failed. Please try again."
          );

          return;
        }


        const result =
          await fetch(
            "http://localhost:5000/api/auth/google",
            {
              method: "POST",

              headers: {
                "Content-Type":
                  "application/json"
              },

              body: JSON.stringify({
                credential:
                  response.credential
              })
            }
          );


        const data =
          await result.json();


        if (
          !result.ok ||
          !data.success ||
          !data.user
        ) {

          setError(
            data.message ||
              "Google sign in failed. Please try again."
          );

          return;
        }


        const googleUser =
          data.user;


        const googleName =
          String(
            googleUser.name ||
              "Google User"
          ).trim();


        const googleEmail =
          String(
            googleUser.email ||
              ""
          )
            .trim()
            .toLowerCase();


        const adminEmail =
          "kuhu2109@gmail.com";


        localStorage.removeItem("clothswapLoggedIn");


        localStorage.setItem(
          "clothswapIsAdmin",
          googleEmail ===
            adminEmail.toLowerCase()
            ? "true"
            : "false"
        );


       /* ==============================
   REGISTRATION COMPLETE
   ============================== */

localStorage.removeItem("clothswapLoggedIn");

localStorage.setItem(
  "clothswapRegisteredEmail",
  email.trim().toLowerCase()
);

localStorage.setItem(
  "clothswapRegisteredName",
  name.trim()
);

localStorage.setItem(
  "clothswapRegisteredLocation",
  location.trim()
);

navigate("/login");
      } catch (error) {

        console.error(
          "Google sign in error:",
          error
        );

        setError(
          "Unable to connect to Google sign in. Please try again."
        );
      }
    };


  /* =====================================================
     GOOGLE SCRIPT
  ===================================================== */

  useEffect(
    function () {

      const initializeGoogle =
        function () {

          if (
            !window.google ||
            !window.google.accounts ||
            !googleButtonRef.current
          ) {
            return;
          }


          const clientId =
            import.meta.env
              .VITE_GOOGLE_CLIENT_ID;


          if (!clientId) {

            setError(
              "Google Client ID is missing. Please check the frontend .env file."
            );

            return;
          }


          googleButtonRef.current.innerHTML =
            "";


          window.google.accounts.id.initialize(
            {
              client_id:
                clientId,

              callback:
                handleGoogleResponse,

              auto_select:
                false
            }
          );


          window.google.accounts.id.renderButton(
            googleButtonRef.current,
            {
              theme:
                "outline",

              size:
                "large",

              width:
                360,

              text:
                "continue_with",

              shape:
                "pill"
            }
          );
        };


      if (
        window.google &&
        window.google.accounts
      ) {

        initializeGoogle();

        return;
      }


      const existingScript =
        document.querySelector(
          'script[src="https://accounts.google.com/gsi/client"]'
        );


      if (existingScript) {

        existingScript.addEventListener(
          "load",
          initializeGoogle
        );

        return;
      }


      const script =
        document.createElement(
          "script"
        );


      script.src =
        "https://accounts.google.com/gsi/client";

      script.async =
        true;

      script.defer =
        true;

      script.onload =
        initializeGoogle;


      document.head.appendChild(
        script
      );

    },
    []
  );


  /* =====================================================
     NORMAL REGISTER
  ===================================================== */

  const handleRegister =
    async function (event) {

      event.preventDefault();

      setError("");


      if (
        !name ||
        !email ||
        !location ||
        !password ||
        !confirmPassword
      ) {

        setError(
          "Please fill in all fields."
        );

        return;
      }
if (!email.trim().toLowerCase().endsWith("@gmail.com")) {
  setError("Please enter a valid Gmail address ending with @gmail.com.");
  return;
}

      if (
        password.length < 6
      ) {

        setError(
          "Password must contain at least 6 characters."
        );

        return;
      }


      if (
        password !==
        confirmPassword
      ) {

        setError(
          "Passwords do not match."
        );

        return;
      }


      try {

        const response =
          await fetch(
            "http://localhost:5000/api/users",
            {
              method: "POST",

              headers: {
                "Content-Type":
                  "application/json"
              },

              body: JSON.stringify({
  name: name,
  email: email,
  location: location,
  password: password
})
            }
          );


        const data =
          await response.json();


        if (!response.ok) {

          setError(
            data.message ||
              "Unable to register user."
          );

          return;
        }

      } catch (error) {

        console.error(
          "User registration error:",
          error
        );

        setError(
          "Unable to connect to the server."
        );

        return;
      }


      localStorage.setItem(
        "clothswapUserName",
        name
      );


      localStorage.setItem(
        "clothswapUserEmail",
        email
      );


      localStorage.setItem(
        "clothswapUserLocation",
        location
      );


      localStorage.setItem(
        "clothswapLoggedIn",
        "true"
      );


      
navigate("/login");
    };


  /* =====================================================
     PAGE
  ===================================================== */

  return React.createElement(

    "div",

    {
      className:
        "register-page-new"
    },


    React.createElement(

      "div",

      {
        className:
          "register-main-card"
      },


      /* IMAGE SIDE */

      React.createElement(

        "div",

        {
          className:
            "register-visual"
        },


        React.createElement(
          "img",
          {
            src:
              "https://images.unsplash.com/photo-1525507119028-ed4c629a60a3?auto=format&fit=crop&w=1200&q=90",

            alt:
              "Clothing collection"
          }
        ),


        React.createElement(

          "div",

          {
            className:
              "register-visual-overlay"
          },


          React.createElement(

            "span",

            {
              className:
                "register-visual-tag"
            },

            "CLOTHSWAP"
          ),


          React.createElement(

            "div",

            {
              className:
                "register-visual-content"
            },


            React.createElement(
              "p",
              null,
              "SWAP • SHARE • SUSTAIN"
            ),


            React.createElement(

              "h2",

              null,

              "Your wardrobe",

              React.createElement(
                "br"
              ),

              "has more stories."
            ),


            React.createElement(
              "span",
              null,
              "Give your clothes a new journey."
            )
          )
        )
      ),


      /* FORM SIDE */

      React.createElement(

        "div",

        {
          className:
            "register-form-side"
        },


        React.createElement(

          "div",

          {
            className:
              "register-form-inner"
          },


          React.createElement(

            "div",

            {
              className:
                "register-heading"
            },


            React.createElement(

              "span",

              {
                className:
                  "register-eyebrow"
              },

              "JOIN CLOTHSWAP"
            ),


            React.createElement(
              "h1",
              null,
              "Create your account"
            ),


            React.createElement(

              "p",

              null,

              "Start swapping clothes and building a more sustainable wardrobe."
            )
          ),


          error
            ? React.createElement(

                "div",

                {
                  className:
                    "register-error"
                },

                error
              )

            : null,


          /* REGISTER FORM */

          React.createElement(

            "form",

            {
              onSubmit:
                handleRegister,
                autoComplete: "off",
            },


            React.createElement(

              "div",

              {
                className:
                  "register-field-row"
              },


              React.createElement(

                "div",

                {
                  className:
                    "register-field"
                },


                React.createElement(
                  "label",
                  null,
                  "Full name"
                ),


                React.createElement(

                  "input",

                  {
                    type:
                      "text",
                      autoComplete:
                            "off",

                    placeholder:
                      "Your name",

                    value:
                      name,

                    onChange:
                      function (event) {

                        setName(
                          event.target.value
                        );

                      }
                  }
                )
              ),


              React.createElement(

                "div",

                {
                  className:
                    "register-field"
                },


                React.createElement(
                  "label",
                  null,
                  "Location"
                ),


                React.createElement(

                  "input",

                  {
                    type:
                      "text",

                    placeholder:
                      "Ahmedabad",

                    value:
                      location,

                    onChange:
                      function (event) {

                        setLocation(
                          event.target.value
                        );

                      }
                  }
                )
              )
            ),


            React.createElement(

              "div",

              {
                className:
                  "register-field"
              },


              React.createElement(
                "label",
                null,
                "Email address"
              ),


              React.createElement(

                "input",

                {
                  type:
                    "email",
                    autoComplete: "new-email",

                  placeholder:
                    "you@example.com",

                  value:
                    email,

                  onChange:
                    function (event) {

                      setEmail(
                        event.target.value
                      );

                    }
                }
              )
            ),


            React.createElement(

              "div",

              {
                className:
                  "register-field"
              },


              React.createElement(
                "label",
                null,
                "Password"
              ),


              React.createElement(

                "div",

                {
                  className:
                    "register-password"
                },


                React.createElement(

                  "input",

                  {
                    type:
                      showPassword
                        ? "text"
                        : "password",
                        autoComplete: "new-password",

                    placeholder:
                      "Minimum 6 characters",

                    value:
                      password,

                    onChange:
                      function (event) {

                        setPassword(
                          event.target.value
                        );

                      }
                  }
                ),


                React.createElement(

                  "button",

                  {
                    type:
                      "button",

                    onClick:
                      function () {

                        setShowPassword(
                          !showPassword
                        );

                      }
                  },


                  React.createElement(

                    "i",

                    {
                      className:
                        showPassword
                          ? "bi bi-eye-slash"
                          : "bi bi-eye"
                    }
                  )
                )
              )
            ),


            React.createElement(

              "div",

              {
                className:
                  "register-field"
              },


              React.createElement(
                "label",
                null,
                "Confirm password"
              ),


              React.createElement(

                "input",

                {
                  type:
                    "password",

                  placeholder:
                    "Re-enter your password",

                  value:
                    confirmPassword,

                  onChange:
                    function (event) {

                      setConfirmPassword(
                        event.target.value
                      );

                    }
                }
              )
            ),


            React.createElement(

              "button",

              {
                type:
                  "submit",

                className:
                  "register-submit"
              },


              React.createElement(
                "span",
                null,
                "Create Account"
              ),


              React.createElement(

                "i",

                {
                  className:
                    "bi bi-arrow-up-right"
                }
              )
            )
          ),


          /* GOOGLE OR */

          React.createElement(

            "div",

            {
              className:
                "register-google-divider"
            },


            React.createElement(
              "span",
              null
            ),


            React.createElement(
              "small",
              null,
              "OR"
            ),


            React.createElement(
              "span",
              null
            )
          ),


          /* GOOGLE BUTTON */

          React.createElement(

            "div",

            {
              className:
                "register-google-area",

              ref:
                googleButtonRef
            }
          ),


          /* LOGIN LINK */

          React.createElement(

            "p",

            {
              className:
                "register-login-text"
            },

            "Already have an account? ",


            React.createElement(

              Link,

              {
                to:
                  "/login"
              },

              "Sign in"
            )
          )
        )
      )
    )
  );
}


export default Register;