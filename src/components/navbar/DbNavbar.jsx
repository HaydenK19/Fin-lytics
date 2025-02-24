import { useEffect } from "react";
import { Link } from "react-router-dom";
import "./navbar.scss";
import logo from "../../assets/finLogo.png";

const user = { name: "Lilly" }; // Set user name

const DbNavbar = () => {
    useEffect(() => {
        const profileButton = document.getElementById("drop-button");
        const profileDropdown = document.querySelector(".profile-content");

        const toggleDropdown = (event) => {
            event.stopPropagation();
            profileDropdown.classList.toggle("show");
        };

        const closeDropdown = (event) => {
            if (!profileButton.contains(event.target) && !profileDropdown.contains(event.target)) {
                profileDropdown.classList.remove("show");
            }
        };

        profileButton.addEventListener("click", toggleDropdown);
        document.addEventListener("click", closeDropdown);

        return () => {
            profileButton.removeEventListener("click", toggleDropdown);
            document.removeEventListener("click", closeDropdown);
        };
    }, []);

    return (
        <div className="navbar">
            <div className="nav-left">
                <Link to="/"><img src={logo} alt="Logo" className="logo" /></Link>
            </div>
            <div className="nav-mid">
                <ul>
                    <li><Link to="/">Home</Link></li>
                    <li><Link to="/jobtrack">Job Tracker</Link></li>
                </ul>
            </div>
            <div className="nav-right">
                <div className="profile-drop">
                    <a id="drop-button" className="drop-button">Profile</a>
                    <div className="profile-content">
                        <ul>
                            <li className="greeting">Signed in as: {user.name}</li>
                            <li>Notifications</li>
                            <li>Settings</li>
                            <li className="logout">Log Out</li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DbNavbar;
