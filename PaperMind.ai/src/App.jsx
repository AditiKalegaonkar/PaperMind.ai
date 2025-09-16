import { Routes, Route } from "react-router-dom";
import Dashboard from "./Pages/Dashboard.jsx";
import About from "./Pages/About.jsx";        
import Contacts from "./Pages/Contacts.jsx";  
import Login from "./Pages/Login.jsx"; 
import Navbar from './Components/Navbar.jsx';
function App() {
  return (
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/about" element={<About />} />
        <Route path="/contacts" element={<Contacts />} />
        <Route path="/login" element={<Login />} />
      </Routes>
  );
}

export default App;
