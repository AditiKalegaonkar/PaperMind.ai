// import { Link } from "react-router-dom"; // ERROR 3: Removed unused import
import "./Dashboard.css";
import Navbar from '../Components/Navbar';
import Footer from '../Components/Footer';
import React, { useState } from "react";
import { Link } from 'react-router-dom';

// --- Asset Imports ---
import SearchIcon from '../assets/search.svg';
import RobotIcon from '../assets/robot.svg';
import LinkIcon from '../assets/article.svg';
import LockIcon from '../assets/lock.svg';
import heroAnimation from "../assets/video.mp4";
import legalMascot from "../assets/legaldocs.png";
import eduMascot from "../assets/edudoc.png";
import financialMascot from "../assets/financialdocs.png";
import otherMascot from "../assets/other.png";


function Dashboard() {
  const [message, setMessage] = useState("");
  const [file, setFile] = useState(null);

  const handleSubmit = (e) => {
    e.preventDefault();
    window.location.href = "/login";
  };

  const agents = [
    { title: "Legal", description: "Get expert legal guidance and document support.", mascot: legalMascot },
    { title: "Education", description: "Educational insights and tutoring assistance.", mascot: eduMascot },
    { title: "Financial", description: "Financial advice, budgeting, and investment tips.", mascot: financialMascot },
    { title: "Other", description: "General-purpose support for all your needs.", mascot: otherMascot },
  ];

  const howItWorksSteps = [
    { number: "01", title: "Upload Your Document", description: "Securely upload any PDF, scanned text, or policy manual. Our system parses and prepares it for analysis." },
    { number: "02", title: "Ask a Question", description: "Interact with your document in natural language. Ask complex questions, request summaries, or check for compliance." },
    { number: "03", title: "Get Instant Insights", description: "Receive clear, actionable, and citation-backed answers from our specialized AI agents in real-time." }
  ];

  const features = [
    { icon: SearchIcon, title: "Semantic Search", description: "Go beyond keywords. Find concepts and contextually relevant information instantly." },
    { icon: RobotIcon, title: "Multi-Agent System", description: "Specialized agents for legal, financial, and educational domains provide expert-level insights." },
    { icon: LinkIcon, title: "RAG Technology", description: "Our Retrieval-Augmented Generation ensures answers are accurate and grounded in your document's text." },
    { icon: LockIcon, title: "Secure & Private", description: "Your data is encrypted and confidential. We prioritize the security of your sensitive information." }
  ];
  
  const testimonials = [
      { quote: "PaperMind.ai transformed our contract review process. What used to take days now takes minutes. A total game-changer!", author: "Alex Johnson", company: "Legal Lead, Innovate Corp" },
      { quote: "As a researcher, sifting through academic papers is my biggest challenge. This tool is like having a genius research assistant available 24/7.", author: "Dr. Emily Carter", company: "Academic Researcher" }
  ];


  return (
    <div className="Landing-Page quicksand">
      <Navbar />

      <div className="Hero">
        <div className="Mascot">
          <video 
            className="hero-animation" 
            autoPlay 
            loop 
            muted 
            playsInline
          >
            <source src={heroAnimation} type="video/mp4" />
            Your browser does not support the video tag.
          </video>
        </div>
        <div className="hero-text">
          <h1 className="hero-title">PaperMind.ai</h1>
          <p className="subtitle">From confusion to comprehension</p>
        </div>
      </div>

      <div className="container">
        <p className="intro-paragraph">
          Discover the future of productivity with <strong>PaperMind.ai</strong> – your intelligent assistant that turns ideas into actionable insights. Save time, stay organized, and make smarter decisions with cutting-edge AI designed to understand your needs. Experience innovation that works as hard as you do!
        </p>

        <div className="how-it-works-section">
            <h2 className="section-title">How It Works</h2>
            <div className="steps-container">
                {howItWorksSteps.map((step, index) => (
                    <div key={index} className="step-card">
                        <span className="step-number">{step.number}</span>
                        <h3>{step.title}</h3>
                        <p>{step.description}</p>
                    </div>
                ))}
            </div>
        </div>

        <h2 className="section-title">Our Agents</h2>
        <div className="agent-cards-wrapper">
          {agents.map((agent, index) => (
            <div key={index} className="agent-card">
              <div className="agent-card-inner">
                <div className="card-front">
                  <img src={agent.mascot} alt={`${agent.title} agent mascot`} className="card-mascot"/>
                  <h3>{agent.title}</h3>
                </div>
                <div className="card-back">
                  <p>{agent.description}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="features-section">
            <h2 className="section-title">Key Features</h2>
            <div className="features-grid">
                {features.map((feature, index) => (
                    <div key={index} className="feature-item">
                        {/* ERROR 1 & 2 FIX: Use an <img> tag and remove the tiny inline style */}
                        <div className="feature-icon">
                            <img src={feature.icon} alt={`${feature.title} icon`} />
                        </div>
                        <h3>{feature.title}</h3>
                        <p>{feature.description}</p>
                    </div>
                ))}
            </div>
        </div>

        <div className="testimonials-section">
            <h2 className="section-title">What Our Users Say</h2>
            <div className="testimonials-wrapper">
                {testimonials.map((testimonial, index) => (
                    <div key={index} className="testimonial-card">
                        <p className="quote">"{testimonial.quote}"</p>
                        <p className="author">- {testimonial.author}, <em>{testimonial.company}</em></p>
                    </div>
                ))}
            </div>
        </div>

        <div className="cta-section-d">
            <h2 className="section-title">Ready to Get Started?</h2>
            <p>Upload a document and ask your first question. Experience the power of PaperMind.ai now.</p>
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

      </div>
      <Footer />
    </div>
  );
}

export default Dashboard;