import { Routes, Route } from "react-router-dom";
import Dashboard from "./Pages/Dashboard.jsx";
import About from "./Pages/About.jsx";        
import Contacts from "./Pages/Contacts.jsx";  
import Login from "./Pages/Login.jsx"; 
import SignUp from "./Pages/SignUp.jsx";
import userDashboard from "./Pages/userDashboard.jsx";

function App() {
  return (
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/about" element={<About />} />
        <Route path="/contacts" element={<Contacts />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<SignUp />} />
        <Route path="/userDashboard" element={<userDashboard />} />
      </Routes>
  );
}

export default App;
