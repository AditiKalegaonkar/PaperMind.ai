import "./Dashboard.css";
import Navbar from "./Navbar.jsx"; 

function Dashboard() {
  return (
    <div className="Landing-Page">
      <Navbar />
      <section className="Hero quicksand">
        <h1 className="hero-title">Welcome to PaperMind.ai</h1>
      </section>
    </div>
  );
}

export default Dashboard;