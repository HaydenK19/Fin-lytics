import React, { useState } from 'react';
<<<<<<< HEAD
import "../../styles/pages/intro/intropage.scss";
import LoginBlock from './login';
import Button from '@mui/material/Button';
import { styled } from '@mui/material/styles';

// const styledButton = styled(Button)({
//     fontFamily: 'Quicksand, sans-serif',
//     fontWeight: 'bold',
//     fontSize: '15px',
// });

=======
import "./intropage.scss";
import LoginBlock from './login';
// import DemoBlock from "./demo";

>>>>>>> origin/budgeter
const Intropage = ({setIsAuthenticated}) => {
    const [showLogin, setShowLogin] = useState(false);
    const [isSigningUp, setIsSigningUp] = useState(false);

    // Function to toggle visibility of the login block
    const toggleLoginBlock = (signingUp = true) => {
        setIsSigningUp(signingUp);
        setShowLogin(true);
    };

    return (
        <div className="intropage">
            <section className="hero-section">
                <h1 className="intro-text">
                    Finlytics - The Future of Finance, Engineered by Students.
                </h1>
                <p className="description-text">
                    Your first step to mastering your finances. Invest, save, and grow wealth using AI-driven insights.
                </p>
<<<<<<< HEAD
                <Button 
                    variant="contained" 
                    color="primary" 
                    className="signup-button" 
                    onClick={() => toggleLoginBlock(true)}
                >
                    Sign Up for Free
                </Button>
                <Button 
                    variant="text" 
                    color="contrast" 
                    className="signin-button" 
                    onClick={() => toggleLoginBlock(false)}
                >
                    Already have an account? Sign in here.
                </Button>
=======
                <button className="signup-button" onClick={() => toggleLoginBlock(true)}>
                    Sign Up for Free
                </button>
                <a href="#" className="signin-button" onClick={() => toggleLoginBlock(false)}>
                    Already have an account? Sign in here.
                </a>
>>>>>>> origin/budgeter
            </section>

            {showLogin && (
                <div className="overlay">
                    <div className="login-overlay">
                        <LoginBlock toggleLoginBlock={() => setShowLogin(false)} isSigningUp={isSigningUp} setIsAuthenticated={setIsAuthenticated}/>                    
<<<<<<< HEAD
=======
                        {/* <LoginBlock setIsAuthenticated={setIsAuthenticated} /> */}
>>>>>>> origin/budgeter
                    </div>
                </div>
            )}
        </div>
    );
}

export default Intropage;
