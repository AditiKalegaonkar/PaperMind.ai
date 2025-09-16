import { Link } from "react-router-dom";
import "./Dashboard.css";
import Navbar from '../Components/Navbar';
import React, { useState } from "react";

function Dashboard() {
  const [message, setMessage] = useState("");
  const [file, setFile] = useState(null);

  const handleSubmit = (e) => {
    e.preventDefault();
    // Redirect after submitting
    window.location.href = "/login";
  };

  return (
    <div className="Landing-Page">
      <Navbar />
      <div className="Hero quicksand">
        <div className="Mascot">
          <img 
            src="/src/assets/turtle-4.png" 
            alt="Papermind AI Mascot" />
          <p className="speech">Hey! I'm Tory — your smart guide to mastering any document!</p>
        </div>
        <div className="hero-text">
          <h1 className="hero-title">PaperMind.ai</h1>
          <p className="subtitle">From confusion to comprehension</p>
        </div>
      </div>

      <div className="container">
        <p>
          Discover the future of productivity with <strong>PaperMind.ai</strong> – your intelligent assistant that turns ideas into actionable insights. Save time, stay organized, and make smarter decisions with cutting-edge AI designed to understand your needs. Experience innovation that works as hard as you do!
        </p>

        {/* Chat Container below the information text */}
        <div className="chat-wrapper">
          <div className="chat-container">
            <input
              type="text"
              placeholder="Type your message..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
            />
            <label htmlFor="file-upload" className="file-button">+</label>
            <input
              id="file-upload"
              type="file"
              style={{ display: "none" }}
              onChange={(e) => setFile(e.target.files[0])}
            />
          </div>
          <button className="submit-button" onClick={handleSubmit}>
            Submit
          </button>
        </div>
      </div>

      <footer className="footer">
        <p>© 2025 PaperMind.ai</p>
        <ul>
          <li><Link to="/">Home</Link></li>
          <li><Link to="/contacts">FAQs</Link></li>
          <li><Link to="/about">About</Link></li>
        </ul>
      </footer>
import "./Dashboard.css";
import Navbar from "./Navbar.jsx"; 

function Dashboard() {
  return (
    <div>
        <Navbar />
    </div>
  );
}

export default Dashboard;
