import "./Contacts.css";
import Navbar from './Components/Navbar.jsx';
import React, { useState } from "react";

export default function Contacts() {
  const [form, setForm] = useState({ name: "", email: "", query: "" });
  const [status, setStatus] = useState("");

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.query) {
      setStatus("Please fill all fields.");
      return;
    }
    setStatus("Your query has been submitted. We will get back to you soon!");
    setForm({ name: "", email: "", query: "" });
  };

  return (
    <div className="quicksand contacts-page">
      <Navbar />
      <div className="container">
        <h1>Contact Us</h1>
        <div className="owners-flex">
          <div className="owner-card">
            <h2>Aditi Sutar</h2>
            <p><a href="tel:+911234567890">+91 12345 67890</a></p>
            <p><a href="https://linkedin.com/in/aditilolsutar-83098125a" target="_blank" rel="noreferrer">LinkedIn</a></p>
          </div>
          <div className="owner-card">
            <h2>Aditi Kalegaonkar</h2>
            <p><a href="tel:+911234567890">+91 12345 67890</a></p>
            <p><a href="https://linkedin.com/in/aditikalegoankar" target="_blank" rel="noreferrer">LinkedIn</a></p>
          </div>
          <div className="owner-card">
            <h2>Madhura Shirshikar</h2>
            <p><a href="tel:+911234567890">+91 12345 67890</a></p>
            <p><a href="https://linkedin.com/in/madhurashirshikar" target="_blank" rel="noreferrer">LinkedIn</a></p>
          </div>
        </div>
      </div>
      <div className="faqs">
        <h2>Frequently Asked Questions</h2>
        <div>
          <h4>What is this project about?</h4>
          <p>We are building an Agentic AI system that provides assistance in legal, educational, financial, and general domains.</p>
        </div>
        <div>
          <h4>How can I collaborate with you?</h4>
          <p>You can reach out using the contact form below.</p>
        </div>
        <div>
          <h4>Is my data kept private?</h4>
          <p>Yes, we value confidentiality and ensure your queries are handled securely.</p>
        </div>
      </div>
      <div className="query-form">
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "20px" }}>
          <h2>
            Send us your query
          </h2>
          <form onSubmit={handleSubmit}>
            <label>
              Your Name:
              <input type="text" name="name" value={form.name} onChange={handleChange} />
            </label>
            <label>
              Your Email:
              <input type="email" name="email" value={form.email} onChange={handleChange} />
            </label>
            <label>
              Your Query:
              <textarea name="query" value={form.query} onChange={handleChange} />
            </label>
            <button type="submit">Submit</button>
          </form>
        </div>
        {status && <p className="status">{status}</p>}
      </div>
    </div>
  );
}
