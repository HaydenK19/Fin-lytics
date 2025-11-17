import React, { useState } from 'react';
import "../../styles/pages/intro/intropage.scss";
import LoginBlock from './login';
import { Box, Typography } from '@mui/material';

const Intropage = ({setIsAuthenticated}) => {
    const [isSigningUp, setIsSigningUp] = useState(false);

    return (
        <div className="intropage">
            <div className="visual-left">
                <Box className="visual-content">
                    <Typography variant="h2" className="brand-title">
                        Finlytics
                    </Typography>
                    <Typography variant="h5" className="brand-subtitle">
                        The Future of Finance, Engineered by Students
                    </Typography>
                    <Typography variant="body1" className="brand-description">
                        Your first step to mastering your finances. Invest, save, and grow wealth using AI-driven insights.
                    </Typography>
                </Box>
            </div>
            <div className="login-right">
                <LoginBlock isSigningUp={isSigningUp} setIsAuthenticated={setIsAuthenticated}/>                    
            </div>
        </div>
    );
}

export default Intropage;
