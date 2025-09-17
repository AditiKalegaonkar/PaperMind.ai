import { Link } from "react-router-dom";
import "./Dashboard.css";
import Navbar from '../Components/Navbar';
import React, { useState } from "react";

function Dashboard() {
  const [message, setMessage] = useState("");
  const [file, setFile] = useState(null);

  const handleSubmit = (e) => {
    e.preventDefault();
    window.location.href = "/login";
  };

  const agents = [
    { title: "Legal", description: "Get expert legal guidance and document support.", mascot: "/src/assets/legaldocs.png" },
    { title: "Education", description: "Educational insights and tutoring assistance.", mascot: "/src/assets/edudoc.png" },
    { title: "Financial", description: "Financial advice, budgeting, and investment tips.", mascot: "/src/assets/financialdocs.png" },
    { title: "Other", description: "General-purpose support for all your needs.", mascot: "/src/assets/financialdocs.png" },
  ];

  return (
    <div className="Landing-Page quicksand">
      <Navbar />

      <div className="Hero">
        <div className="Mascot">
          <img src="/src/assets/turtle-4.png" alt="Papermind AI Mascot" className="hero-mascot"/>
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

        <div className="agent-cards-wrapper">
          {agents.map((agent, index) => (
            <div key={index} className="agent-card">
              <div className="agent-card-inner">
                <div className="card-front">
                  <img src={agent.mascot} alt={agent.title} className="card-mascot"/>
                  <h3>{agent.title}</h3>
                </div>
                <div className="card-back">
                  <p>{agent.description}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

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
    </div>
  );
}

export default Dashboard;