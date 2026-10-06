import React, { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";

function LoginRequired() {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(function () {
    const isLoggedIn =
      localStorage.getItem("clothswapLoggedIn") === "true";

    const publicPages = ["/", "/login", "/register"];

    if (!isLoggedIn && !publicPages.includes(location.pathname)) {
      window.alert(
        "Please login first to use ClothSwap."
      );

      navigate("/login", { replace: true });
    }
  }, [location.pathname, navigate]);

  return null;
}

export default LoginRequired;