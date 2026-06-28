import React, { useState } from "react";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import axios from "axios";
import "./Login.css";
import Googlelogo from "../assets/google-logo.png";
import { Link, useNavigate } from "react-router-dom";

const API_URL = import.meta.env.VITE_API_URL;
if (!API_URL) {
    console.error("VITE_API_URL is not set — check your .env file.");
  }

const Login = () => {
  const navigate = useNavigate();
  const [show, setShow] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleNormalLogin = async (e) => {
    e.preventDefault();
    setError("");

    try {
      const res = await axios.post(
        `${API_URL}/auth/login`,
        { email, password },
        { withCredentials: true }
      );
      
      if (res.data.user || res.data.success) {
        navigate("/userDashboard", { replace: true });
      } else if (res.data.error) {
        setError(res.data.error);
      }
    } catch (err) {
      console.error("Login error:", err);
      setError(err.response?.data?.error || "Login failed");
    }
  };

  return (
    <div className="page" style={{ display: "flex" }}>
      <div className="main">
        <div className="Login-card">
          <h2 style={{ fontWeight: "bold", margin: "0px", padding: "0px" }}>
            Login
          </h2>
          <p className="small-text" style={{ color: "black" }}>
            Enter your email and password for log in
          </p>
          <form onSubmit={handleNormalLogin}>
            <input
              type="email"
              placeholder="Email"
              className="input"
              value={email}
              style={{ color: "black" }}
              onChange={(e) => setEmail(e.target.value)}
              required
            />

            <div className="password">
              <input
                type={show ? "text" : "password"}
                placeholder="Password"
                style={{ color: "black" }}
                className="input"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <span onClick={() => setShow(!show)}>
                {show ? <FaEyeSlash /> : <FaEye />}
              </span>
            </div>

            <div className="login-options">
              <div className="remember-me small-text">
                <input
                  type="checkbox"
                  id="remember"
                  style={{ height: "11px", width: "11px" }}
                />
                <label htmlFor="remember" style={{ color: "black" }}>
                  Remember me
                </label>
              </div>
              <a href="#" style={{ color: "#f86f03" }}>
                Forgot password?
              </a>
            </div>
            <button type="submit" className="login-button">
              Log In
            </button>
          </form>


          {error && (
            <p style={{ color: "red", fontSize: "12px" }}>{error}</p>
          )}

          <div className="login-divider">
            <hr style={{ backgroundColor: "black", width: "80px" }} />
            <span style={{ fontSize: "11px", color: "black" }}>
              Or login with
            </span>
            <hr style={{ backgroundColor: "black", width: "80px" }} />
          </div>

          <div className="sso-buttons">
            <button
              className="sso"
              onClick={() =>
                (window.location.href = `${API_URL}/auth/google`)
              }
            >
              <img
                src={Googlelogo}
                alt="Google logo"
                style={{ height: "20px", width: "20px" }}
              />
            </button>
          </div>

          <div
            style={{
              display: "flex",
              justifyContent: "center",
              fontSize: "11px",
              marginTop: "10px",
            }}
          >
            <span style={{ marginRight: "4px", color: "black" }}>
              Don't have an account?
            </span>
            <Link
              style={{
                color: "#f86f03",
                cursor: "pointer",
                textDecoration: "none",
              }}
              to="/signup"
            >
              SignUp
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
