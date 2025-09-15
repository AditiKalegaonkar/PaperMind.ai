import { Routes, Route } from "react-router-dom";
import Dashboard from "./Dashboard.jsx";
import About from "./About.jsx";        
import Contacts from "./Contacts.jsx";  
import Login from "./Login.jsx"; 

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
