import './Navbar.css';
import { Link } from 'react-router-dom';
import Logo from '../assets/Logo.png';
function Navbar() {
  return (
    <nav className='quicksand'>
      <div className='Home'>
        {/* Use a correct relative path to the logo asset */}
        <img src={Logo}  alt="App Logo" style={{height: "40px", width: "40px", borderRadius : "4px"}} />
        <p style={{fontSize:"20px"}}>PaperMind.ai</p>
      </div>
      <div className='Pages'>
        <Link to="/" style={{fontWeight:"500"}}>Home</Link>
        <Link to="/about">About</Link>
        <Link to="/contacts">Contacts</Link>
        {/* Use a proper Link instead of nesting a button inside a Link */}
        <Link to="/login" className="Login">Login/SignUp</Link>
      </div>
    </nav>
  );
}

export default Navbar;
