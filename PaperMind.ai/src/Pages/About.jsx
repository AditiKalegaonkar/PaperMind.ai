import React, { useEffect } from "react";
import "./About.css";
import { Typewriter } from "react-simple-typewriter";
import { Link } from 'react-router-dom';

// Import your components and assets
import Navbar from '../Components/Navbar'; 
import Footer from "../Components/Footer";
import MascotVideo from "../assets/video.mp4";
import legalIcon from "../assets/legaldocs.png";
import eduIcon from "../assets/edudoc.png";
import financeIcon from "../assets/financialdocs.png";
import enterpriseIcon from "../assets/other.png";

function About() {
  // useEffect to trigger scroll animations for elements
  useEffect(() => {
    const animatedElements = document.querySelectorAll(".persona-card, .metric-item, .mission-content");
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("visible");
          }
        });
      },
      { threshold: 0.2 }
    );
    animatedElements.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  const personas = [
    { icon: legalIcon, title: "Legal Professionals", desc: "Navigate complex contracts and regulations with ease. Identify compliance risks and summarize legal precedents in seconds."},
    { icon: financeIcon, title: "Financial Analysts", desc: "Extract key data from financial reports, audit documents, and insurance policies to accelerate due diligence and risk assessment." },
    { icon: eduIcon, title: "Common People", desc: "Quickly synthesize information from dense documents, guides, and articles to get clear and easy-to-understand insights."},
    { icon: enterpriseIcon, title: "Enterprise Teams", desc: "Empower your organization to understand internal policies, technical manuals, and project documentation effortlessly."},
  ];


  return (
      <div className="quicksand">
        <Navbar />
        <div className="main-head">
          <div className="hero-content">
            <video className="hero-animation-video" autoPlay loop muted playsInline>
              <source src={MascotVideo} type="video/mp4" />
              Your browser does not support the video tag.
            </video>
            <div className="description">
              <h1 className="headline">
                <Typewriter words={["PaperMind.ai"]} cursor cursorStyle="|" typeSpeed={120} deleteSpeed={70} delaySpeed={1200} />
              </h1>
              <p>Transform your most complex documents from dense legal contracts to intricate financial policies into clear, actionable knowledge. Stop drowning in endless pages of text and unlock the critical insights buried within your files.</p>
              <p>Our platform empowers you to <b>converse with your documents</b> as if you were talking to a subject-matter expert. <b>Ask questions in natural language</b> from simple queries to complex analytical prompts and receive <b>precise, citation-backed answers in seconds.</b> Powered by advanced AI that understands context, not just keywords, it helps you move <b>beyond tedious manual reviews and make smarter decisions, faster.</b></p>  
              <p>The result is a radical boost in efficiency and a dramatic reduction in risk. Instantly surface contractual obligations, identify compliance gaps, and validate information with pinpoint accuracy. Empower your team to focus on strategy, not searching, and gain a decisive competitive advantage.</p>
            </div>
          </div>
        </div>
        <div className="who-is-for">
          <h2>Who Benefits from PaperMind.ai?</h2>
          <p className="subtitle">We built our platform for professionals who need to make critical decisions based on complex information.</p>
          <div className="personas-grid">
            {personas.map((p, i) => (
              <div className="persona-card" key={i} style={{ animationDelay: `${i * 100}ms` }}>
                <img src={p.icon} alt={`${p.title} Icon`} className="persona-icon" />
                <h3 className="persona-title">{p.title}</h3>
                <p className="persona-desc">{p.desc}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="mission-section">
            <h2>Our Mission</h2>
            <div className="mission-content">
                <div className="mission-text">
                    <p className="mission-card">In a world saturated with information, clarity is the ultimate advantage. Our mission is to eliminate the friction between complex documents and human understanding.We are committed to building intelligent tools that empower professionals to find the answers they need instantly, turning hours of tedious work into moments of insight.</p>
                    <p className="mission-signature">— The PaperMind.ai Team</p>
                </div>
            </div>
        </div>

        <div className="cta-section">
            <h2>Ready to Transform Your Workflow?</h2>
            <p>Stop searching and start understanding. Get started with PaperMind.ai today and experience a smarter way to work with your documents.</p>
            <Link to='/login' className="cta-button">Get Started</Link>
        </div>
        <Footer />
      </div>
  );
}

export default About;