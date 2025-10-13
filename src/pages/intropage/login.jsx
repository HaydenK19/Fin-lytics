import React, { useState, useEffect } from 'react';
import { useNavigate } from "react-router-dom";
import axios from "axios";
<<<<<<< HEAD
import { Box, Button, TextField, Typography, IconButton } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';

const LoginBlock = ({ toggleLoginBlock, isSigningUp: initialSigningUp, setIsAuthenticated }) => {
    const [isSigningUp, setIsSigningUp] = useState(true);
    const [step, setStep] = useState(1); // Step state for multi-page signup
    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");
    const [email, setEmail] = useState("");
    const [number, setNumber] = useState("");
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
=======
import './login.scss';

const LoginBlock = ({ toggleLoginBlock, isSigningUp: initialSigningUp, setIsAuthenticated }) => {
    const [isSigningUp, setIsSigningUp] = useState(true);
    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");
    const [email, setEmail] = useState("");
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [number, setNumber] = useState("");
>>>>>>> origin/budgeter
    const [confirmPassword, setConfirmPassword] = useState("");
    const navigate = useNavigate();

    useEffect(() => {
        setIsSigningUp(initialSigningUp);
    }, [initialSigningUp]);

    const handleSubmit = async (e) => {
        e.preventDefault();

<<<<<<< HEAD
        if (isSigningUp && password !== confirmPassword) {
=======
        if (isSigningUp && password != confirmPassword) {
>>>>>>> origin/budgeter
            alert("Passwords do not match!");
            return;
        }

        try {
            if (isSigningUp) {
                const response = await axios.post("http://localhost:8000/auth/", {
                    first_name: firstName,
                    last_name: lastName,
                    email: email,
<<<<<<< HEAD
                    phone_number: number,
                    username: username,
=======
                    username: username,
                    phone_number: number,
>>>>>>> origin/budgeter
                    password: password,
                });
                console.log("Sign-up successful:", response.data);
            }

<<<<<<< HEAD
=======
            
            // Login (either after signup or direct sign-in)
>>>>>>> origin/budgeter
            const loginResponse = await axios.post(
                "http://localhost:8000/auth/token",
                new URLSearchParams({
                    username: username,
                    password: password,
                }),
                { headers: { "Content-Type": "application/x-www-form-urlencoded" } }
            );

            console.log("Login successful:", loginResponse.data);
            localStorage.setItem("token", loginResponse.data.access_token);
            setIsAuthenticated(true);
            navigate("/dashboard");
        } catch (error) {
            console.error(
<<<<<<< HEAD
                "Authentication error:",
                error.response ? error.response.data : error.message
            );
            alert("Authentication failed. Please check your credentials and try again.");
        }
    };

    return (
        <Box
            sx={{
                position: 'fixed',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                width: 400,
                bgcolor: 'background.paper',
                boxShadow: 24,
                p: 4,
                borderRadius: 2,
            }}
        >
            <IconButton
                sx={{ position: 'absolute', top: 8, right: 8 }}
                onClick={toggleLoginBlock}
            >
                <CloseIcon />
            </IconButton>
            <Typography variant="h5" component="h2" gutterBottom>
                {isSigningUp ? (step === 1 ? 'Sign Up' : 'Make your Account') : 'Log In'}
            </Typography>
            <Box component="form" onSubmit={handleSubmit} sx={{ mt: 2 }}>
                {isSigningUp && step === 1 && (
                    <>
                        <TextField
                            fullWidth
                            label="First Name"
                            value={firstName}
                            onChange={(e) => setFirstName(e.target.value)}
                            margin="normal"
                            required
                        />
                        <TextField
                            fullWidth
                            label="Last Name"
                            value={lastName}
                            onChange={(e) => setLastName(e.target.value)}
                            margin="normal"
                            required
                        />
                        <TextField
                            fullWidth
                            label="Email"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            margin="normal"
                            required
                        />
                        <TextField
                            fullWidth
                            label="Phone Number"
                            value={number}
                            onChange={(e) => setNumber(e.target.value)}
                            margin="normal"
                            required
                        />
                        <Button
                            variant="contained"
                            color="primary"
                            fullWidth
                            sx={{ mt: 2 }}
                            onClick={() => setStep(2)}
                        >
                            Next
                        </Button>
                    </>
                )}
                {isSigningUp && step === 2 && (
                    <>
                        <TextField
                            fullWidth
                            label="Username"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            margin="normal"
                            required
                        />
                        <TextField
                            fullWidth
                            label="Password"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            margin="normal"
                            required
                        />
                        <TextField
                            fullWidth
                            label="Confirm Password"
                            type="password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            margin="normal"
                            required
                        />
                        <Button
                            variant="contained"
                            color="primary"
                            fullWidth
                            sx={{ mt: 2 }}
                            type="submit"
                        >
                            Submit
                        </Button>
                        <Button
                            variant="text"
                            color="secondary"
                            fullWidth
                            sx={{ mt: 1 }}
                            onClick={() => setStep(1)}
                        >
                            Back
                        </Button>
                    </>
                )}
                {!isSigningUp && (
                    <>
                        <TextField
                            fullWidth
                            label="Username"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            margin="normal"
                            required
                        />
                        <TextField
                            fullWidth
                            label="Password"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            margin="normal"
                            required
                        />
                        <Button
                            type="submit"
                            variant="contained"
                            color="primary"
                            fullWidth
                            sx={{ mt: 2 }}
                        >
                            Log In
                        </Button>
                    </>
                )}
            </Box>
            {isSigningUp && step === 1 && (
                <Typography
                    variant="body2"
                    sx={{ mt: 2, textAlign: 'center', cursor: 'pointer' }}
                    onClick={() => setIsSigningUp(false)}
                >
                    Already have an account? Log In
                </Typography>
            )}
        </Box>
=======
              "Authentication error:",
              error.response ? error.response.data : error.message
            );
            if (
              error.response &&
              error.response.status === 400 &&
              error.response.data.detail === "User with this email already exists"
            ) {
              alert(
                "User with this email already exists. Please log in or use a different email."
              );
            } else if (
              error.response &&
              error.response.status === 400 &&
              error.response.data.detail ===
                "User with this phone number already exists"
            ) {
              alert(
                "User with this phone number already exists. Please log in or use a different phone number."
              );
            } else {
              alert(
                "Authentication failed. Please check your credentials and try again."
              );
            }
          }
    };

    return (
        <div className='login-block'>
            <div className="login">
                <button className="close-btn" onClick={toggleLoginBlock}>x</button>
                <h2>{isSigningUp ? 'Sign Up' : 'Log In'}</h2>
                
                <div className={`login-container ${isSigningUp ? 'expanded' : 'collapsed'}`}>
                    <form onSubmit={handleSubmit}>

                        {!isSigningUp && (
                          <>
                          <input type="username" placeholder="Username" value={username} onChange={(e) => setUsername(e.target.value)} required />
                          </>
                        )}

                        {isSigningUp && (
                            <>
                            <input type="text" placeholder="First Name" value={firstName} onChange={(e) => setFirstName(e.target.value)} required />
                            <input type="text" placeholder="Last Name" value={lastName} onChange={(e) => setLastName(e.target.value)} required />
                            <input type="username" placeholder="Username" value={username} onChange={(e) => setUsername(e.target.value)} required />
                            <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required />
                            <input type="tel" placeholder="Phone Number" value={number} onChange={(e) => setNumber(e.target.value)} required />
                            </>
                        )}
                        <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} required />
                        {isSigningUp && (
                            <input type="password" placeholder="Confirm Password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required />
                        )}
                        <button type="submit" className='submit-btn'>{isSigningUp ? 'Sign Up' : 'Sign In'}</button>
                    </form>
                </div>

                <p onClick={() => setIsSigningUp(!isSigningUp)} className="toggle-text">
                    {isSigningUp ? "Already have an account? Log In" : "Don't have an account? Sign Up"}
                </p>
            </div>
        </div>
>>>>>>> origin/budgeter
    );
};

export default LoginBlock;
