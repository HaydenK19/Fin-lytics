import { Link, useNavigate } from "react-router-dom";
import "./navbar.scss";
import logo from "../../assets/logo.png";

const DbNavbar = ({ setIsAuthenticated }) => {
  const navigate = useNavigate(); // Initialize navigate

  // Handle logout
  const handleLogout = () => {
    localStorage.removeItem("token"); // Remove token from localStorage
    setIsAuthenticated(false); // Update authentication state
    navigate("/"); // Redirect to login or homepage
  };

  return (
    <div className="navbar">
      <div className="nav-left">
        <Link to="/">
          <img src={logo} alt="Logo" className="logo" />
        </Link>
      </div>
      <div className="nav-mid">
        <ul>
          <li><Link to="/">Home</Link></li>
          <li><Link to="/jobtrack">Job Tracker</Link></li>
        </ul>
      </div>
      <div className="nav-right">
        <Link to="/about">About</Link>
        <Link to="/">Profile</Link>
        <button onClick={handleLogout}>Log Out</button> {/* Logout button */}
      </div>
    </div>
  );
};

export default DbNavbar;
