import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCircleUser, faAngleLeft, faAngleRight } from "@fortawesome/free-solid-svg-icons";
import miniLogo from "../../assets/miniLogo.png";
import "./sidebar.scss";

const user = { name: "Lilly" }; // set user name

const DbNavbar = () => {
    const [isExpanded, setIsExpanded] = useState(false);

    const toggleSidebar = () => {
        setIsExpanded((prev) => !prev);
    };

    return (
        <>
        <div className={`sidebar ${isExpanded ? "expanded" : "collapsed"}`}>
            <div className="sidebar-content">
                <div className="side-logo">
                    <Link to="/"><img src={miniLogo} alt="MiniLogo" /></Link>
                </div>

                <HamburgerContent isExpanded={isExpanded} toggleSidebar={toggleSidebar}/>

                <MenuContainer isExpanded={isExpanded} toggleSidebar={toggleSidebar}/>

            </div>

            <ProfileDropdown user={user} isExpanded={isExpanded} toggleSidebar={toggleSidebar}/>

        </div>

        <CollapseButton isExpanded={isExpanded} toggleSidebar={toggleSidebar}/> 
        {/* will hover outside of the bar when it is expanded, less conflict with dashboard contents */}
   
        </>
    );
};

// hamburger button
const HamburgerContent = ({ isExpanded, toggleSidebar }) => (
    <button 
        className={`hamburger ${isExpanded ? "active" : ""}`} 
        onClick={toggleSidebar}
        aria-label="Toggle Sidebar"
    >
        <div className={`bun1 ${isExpanded ? "active" : ""}`}></div>
        <div className={`bun2 ${isExpanded ? "active" : ""}`}></div>
        <div className={`bun3 ${isExpanded ? "active" : ""}`}></div>
    </button>
);

// menu content
const MenuContainer = ({ isExpanded, toggleSidebar}) => (
    <div className={`menu-container ${isExpanded ? "expanded" : "collapsed"}`}>
        <ul>
            <li><Link to="/">Dashboard</Link></li>
            <li><Link to="/jobtrack">AI Portfolio</Link></li>
        </ul>
    </div>
);

//the profile icon button logic
const ProfileDropdown = ({ user, isExpanded, toggleSidebar }) => {
    const [isOpen, setIsOpen] = useState(false);

    // close profile content when sidebar is collapsed
    useEffect(() => {
        //console.log("Sidebar isExpanded:", isExpanded); //debug
        if (!isExpanded) {
            setIsOpen(false);
        }
    }, [isExpanded]);

    const handleProfileClick = () => {
        //console.log("Profile icon clicked. isExpanded:", isExpanded, "isOpen:", isOpen); //debug
        if (!isExpanded) {
            toggleSidebar(); // expand sidebar
            setIsOpen(true); // open profile content
        } else {
            setIsOpen((prev) => !prev); // toggle profile content
        }
    };

    return (
        <div className="side-bot">
            <div className="profile-drop">
                <button 
                    className="profile-button" 
                    onClick={handleProfileClick}
                    aria-label="Open Profile Menu"
                >
                    <FontAwesomeIcon icon={faCircleUser} size="2xl" />
                    {isExpanded && <span className="profile-icon-text">{user.name}</span>}
                </button>
                {isOpen && <ProfileContent user={user} isExpanded={isExpanded} />}
            </div>
        </div>
    );
};

//note: i removed isOpen from the profileContent so it closes upon sidebar collapse

// profile content inside the button, this is now a function rather than component
const ProfileContent = ({ user, isExpanded /*, isOpen*/ }) => {
    if(!isExpanded /*|| !isOpen*/) return null;

    return(
        <div className="profile-content">
            <ul>
                {/* <li className="greeting">{user.name}</li> */}
                {/* temp location */}
                <li><Link to="/">Notifications</Link></li> 
                <li><Link to="/">Settings</Link></li>
                <li className="logout"><Link to="/">Log Out</Link></li>
            </ul>
        </div>
    );
   
};


//button to close sidebar
const CollapseButton = ({isExpanded, toggleSidebar}) => (
    <button 
        className={`collapse-button ${isExpanded ? "visible" : "hidden"}`} 
        onClick={toggleSidebar}
        aria-label="Toggle Sidebar via closeBar"
    >
        <FontAwesomeIcon icon={isExpanded ? faAngleLeft : faAngleRight}/>
     </button>
);

export default DbNavbar;
