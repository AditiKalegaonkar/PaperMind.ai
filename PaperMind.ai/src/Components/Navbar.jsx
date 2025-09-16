import './Navbar.css';
import { Link } from 'react-router-dom';
function Navbar() {
    return (
        <nav className='quicksand'>
            <div className='Home'>
                <img src="src/assets/Logo.png"  alt="App Logo" style={{height: "40px", width: "40px", borderRadius : "4px"}} />
                <p style={{fontSize:"20px"}}>PaperMind.ai</p>
            </div>
            <div className='Pages'>
                <Link to="/" style={{fontWeight:"500"}}>Home</Link>
                <Link to="/about">About</Link>
                <Link to="/contacts">Contacts</Link>
                <Link to="/login">
                    <button to="/login" className='Login'>Login/SignUp</button>
                </Link>
            </div>
        </nav>
    );
}

export default Navbar;