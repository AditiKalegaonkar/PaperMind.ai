import "./Contacts.css";
import Navbar from '../Components/Navbar';
import Footer from '../Components/Footer'; 
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
        <p className="subtitle">We'd love to hear from you. Reach out to our team or fill out the contact form below.</p>
        <div className="owners-flex">
          <div className="owner-card">
            <h2>Aditi Sutar</h2>
            <p><a href="tel:+911234567890">+91 12345 67890</a></p>
            <p><a href="https://www.linkedin.com/in/aditilolsutar-83098125a/" target="_blank" rel="noreferrer">LinkedIn</a></p>
          </div>
          <div className="owner-card">
            <h2>Aditi Kalegaonkar</h2>
            <p><a href="tel:+911234567890">+91 12345 67890</a></p>
            <p><a href="https://www.linkedin.com/in/aditi-kalegaonkar-6016a0302/" target="_blank" rel="noreferrer">LinkedIn</a></p>
          </div>
          <div className="owner-card">
            <h2>Madhura Shirsikar</h2>
            <p><a href="tel:+911234567890">+91 12345 67890</a></p>
            <p><a href="https://www.linkedin.com/in/madhura-shirsikar-2aa91a24a/" target="_blank" rel="noreferrer">LinkedIn</a></p>
          </div>
        </div>
      </div>

      <div className="business-hours">
        <h2>Business Hours</h2>
        <p>Our team is available to assist you during the following hours:</p>
        <div className="hours-details">
          <p><strong>Monday - Friday:</strong> 9:00 AM - 6:00 PM (IST)</p>
          <p><strong>Saturday:</strong> 10:00 AM - 2:00 PM (IST)</p>
          <p><strong>Sunday & Public Holidays:</strong> Closed</p>
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
          <p>You can reach out using the contact form below or connect with our team members on LinkedIn.</p>
        </div>
        <div>
          <h4>Is my data kept private?</h4>
          <p>Yes, we value confidentiality and ensure your queries are handled securely. We are fully compliant with data protection regulations.</p>
        </div>
        <div>
          <h4>What technologies are you using?</h4>
          <p>Our stack includes React for the frontend and Python with advanced agent development kits for our AI backend.</p>
        </div>
         <div>
          <h4>Are you hiring?</h4>
          <p>We are always looking for talented individuals. Please check our careers page or send your resume through the contact form.</p>
        </div>
      </div>

      <div className="location-section">
        <h2>Our Location</h2>
        <p>Pune Institute of Computer Technology</p>
        <div className="map-container">
          <iframe
            src="https://www.google.com/maps/place/Pune+Institute+of+Computer+Technology/@18.4975,73.8555,17z"
            width="600"
            height="450"
            style={{ border: 0 }}
            allowFullScreen=""
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            title="Office Location"
          ></iframe>
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
              <input type="text" name="name" value={form.name} onChange={handleChange} required />
            </label>
            <label>
              Your Email:
              <input type="email" name="email" value={form.email} onChange={handleChange} required />
            </label>
            <label>
              Your Query:
              <textarea name="query" value={form.query} onChange={handleChange} required />
            </label>
            <button type="submit">Submit</button>
          </form>
        </div>
        {status && <p className="status">{status}</p>}
      </div>
      <Footer /> 
    </div>
  );
}