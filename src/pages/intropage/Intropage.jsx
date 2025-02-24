import React, { useState } from 'react';
import "./intropage.scss";
import LoginBlock from './login';
import DemoBlock from "./demo";

const Intropage = () => {
    const [isLoginVisible, setLoginVisible] = useState(false);

    // Function to toggle visibility of the login block
    const toggleLoginBlock = () => {
        setLoginVisible(!isLoginVisible);
    };

    return (
        <div className="intropage">
            <section className="hero-section">
                <h1 className="intro-text">
                    Finlytics- The Future of Finance, Engineered by Students.
                </h1>
                <p className="description-text">
                    Your first step to mastering your finances. Invest, save, and grow wealth using AI-driven insights.
                </p>
                <button className="signup-button" onClick={toggleLoginBlock}>
                    Sign Up for Free
                </button>
                <a href="#" className="signin-button" onClick={toggleLoginBlock}>
                    Already have an account? Sign-in here.
                </a>
                
            </section>
            {isLoginVisible && (
                    <div className="overlay">
                        <div className="login-overlay">
                            <LoginBlock />
                            <button className="close-btn" onClick={toggleLoginBlock}>X</button>
                        </div>
                    </div>
                )}
        </div>
    );
}

export default Intropage;
