import "./app.scss";
import React, { useState, useEffect, createContext } from "react";
import axios from "axios";
import api from "./api";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { muiTheme } from './theme/theme'; 

import Intropage from "./pages/intropage/Intropage";
import Dashboard from "./pages/Dashboard";
import NoPage from "./pages/NoPage";
import About from "./pages/about/About";

import IntroNavbar from "./components/intro/IntroNavbar";

const theme = createTheme(muiTheme);

// create context to share across app
export const UserContext = createContext(null);

const App = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [settings, setSettings] = useState(null);
  const [userInfo, setUserInfo] = useState(null);
  const [loading, setLoading] = useState(true);

  // Debug wrapper for setIsAuthenticated
  const debugSetIsAuthenticated = (value) => {
    console.log(`🔥 setIsAuthenticated called with: ${value}`, new Error().stack);
    setIsAuthenticated(value);
  };

  useEffect(() => {
    const init = async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        console.log("🔑 No token found in localStorage");
        setLoading(false);
        debugSetIsAuthenticated(false);
        return;
      }
      console.log("🔑 Token found, attempting authentication");

      try {
        // Try to load user settings and info, but don't fail authentication if they fail
        console.log("✅ Token valid, setting authenticated to true");
        debugSetIsAuthenticated(true);
        
        try {
          const [settingsRes, userInfoRes] = await Promise.all([
            api.get("/api/user_settings/"),
            api.get("/api/user_info/"),
          ]);

          setSettings(settingsRes.data);
          setUserInfo(userInfoRes.data);
        } catch (settingsError) {
          console.error(
            "Error loading user settings/info:",
            settingsError.response ? settingsError.response.data : settingsError
          );
          // Set default values so the app doesn't get stuck
          setSettings({ email_notifications: false, push_notifications: false });
          setUserInfo({ first_name: "User", last_name: "", username: "user", id: null });
          console.log("🔧 Set default user settings due to API error");
        }
      } catch (error) {
        console.error(
          "🚨 Error during token validation:",
          error.response ? error.response.data : error
        );
        debugSetIsAuthenticated(false);
      } finally {
        setLoading(false);
      }
    };

    init();
  }, [isAuthenticated]); // refetch whenever auth status changes

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  // guard: don’t render dashboard routes until settings are loaded
  if (isAuthenticated && (!settings || !userInfo)) {
    return <div className="loading">Loading user settings...</div>;
  }

  return (
    <ThemeProvider theme={theme}>
      <BrowserRouter>
        <UserContext.Provider value={{ settings, setSettings, userInfo, setUserInfo }}>
          {isAuthenticated ? (
            <Routes>
              <Route
                path="/*"
                element={<Dashboard isAuthenticated={isAuthenticated} setIsAuthenticated={debugSetIsAuthenticated}/>}
              />
            </Routes>
          ) : (
            <>
              <IntroNavbar />
              <Routes>
                <Route path="/" element={<Intropage setIsAuthenticated={debugSetIsAuthenticated} />} />
                <Route path="/about" element={<About />} />
                <Route path="/login" element={<Intropage setIsAuthenticated={debugSetIsAuthenticated} />} />
                <Route path="*" element={<NoPage />} />
              </Routes>
            </>
          )}
        </UserContext.Provider>
      </BrowserRouter>
    </ThemeProvider>
  );
};

export default App;
