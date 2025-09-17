import React, { useState } from 'react';
import PhoneInput from 'react-phone-input-2';
import 'react-phone-input-2/lib/style.css';
import './SignUp.css';
import { useNavigate } from "react-router-dom";

const EyeIcon = ({ visible }) =>
  visible ? (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" stroke="#888" strokeWidth="2" viewBox="0 0 24 24" width="18" height="18">
      <path strokeLinecap="round" strokeLinejoin="round" d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7z" />
      <circle cx="12" cy="12" r="3" stroke="#888" strokeWidth="2" />
    </svg>
  ) : (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" stroke="#888" strokeWidth="2" viewBox="0 0 24 24" width="18" height="18">
      <path strokeLinecap="round" strokeLinejoin="round" d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7z" />
      <line x1="3" y1="3" x2="21" y2="21" stroke="#888" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );

const SignUp = () => {
  const navigate = useNavigate();
  const [phone, setPhone] = useState('');
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    phone: ''
  });
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const togglePasswordVisibility = () => setShowPassword(prev => !prev);

  // Register user
  const handleRegister = async (e) => {
    e.preventDefault();
    const { firstName, lastName, email, password } = formData;

    const payload = { firstName, lastName, email, password, phone };

    try {
      const res = await fetch("http://localhost:5000/auth/register", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (data.error) {
        alert(data.error);
      } else {
        alert(data.message);
        navigate("/login");
      }
    } catch (err) {
      console.error("Register error:", err);
    }
  };

  return (
    <div className="page">
      <div className="main">
        <div className="signup-box">
          <h2 className="signup-heading">Sign Up</h2>
          <p className="small-text">Create an account to continue!</p>

          <form className="allips" onSubmit={handleRegister}>
            <input type="text" name="firstName" placeholder="First Name" className="signup-input" onChange={handleChange} required />
            <input type="text" name="lastName" placeholder="Last Name" className="signup-input" onChange={handleChange} required />
            <input type="email" name="email" placeholder="Email" className="signup-input" onChange={handleChange} required />
            <PhoneInput country={'in'} value={phone} onChange={setPhone} inputClass="signup-input phone-input" required />
            <div style={{ position: 'relative', width: '100%' }}>
              <input type={showPassword ? 'text' : 'password'} name="password" placeholder="Password" className="signup-input password-input" onChange={handleChange} required />
              <span className="toggle-password" onClick={togglePasswordVisibility}><EyeIcon visible={showPassword} /></span>
            </div>
            <button type="submit" className="signup-button">Register</button>
          </form>

          <p className="signup-login">
            Already have an account? <Link className="signup-link" to="/login">Login</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default SignUp;