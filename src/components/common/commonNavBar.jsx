import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  AppBar,
  Toolbar,
  Menu,
  MenuItem,
  Avatar,
  Button,
  Box,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Typography,
} from "@mui/material";
import finLogo from "../../assets/finLogo.png";
import SettingsBlock from "./modal/settings/settings";

const DbNavbar = ({ isAuthenticated, setIsAuthenticated }) => {
  const [user, setUser] = useState(null);
  const [anchorEl, setAnchorEl] = useState(null);
  const [logoutConfirmOpen, setLogoutConfirmOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [hasSubscription, setHasSubscription] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();

  const handleMenuOpen = (event) => setAnchorEl(event.currentTarget);
  const handleMenuClose = () => setAnchorEl(null);

  const handleLogout = () => {
    localStorage.removeItem("token");
    setIsAuthenticated(false);
    navigate("/");
  };

  // NEW — Instant Stripe Checkout
  const startCheckout = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return navigate("/login");

      const res = await fetch(
        "/stripe/create-checkout-session",
        {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      const data = await res.json();

      if (!res.ok) {
        console.error("Stripe checkout error:", data);
        alert(data.detail || "Failed to start checkout.");
        return;
      }

      window.location.href = data.checkout_url; // 🔥 Straight to Stripe
    } catch (err) {
      console.error("Checkout failed:", err);
      alert("Could not start checkout. Try again.");
    }
  };

  // Fetch user + subscription status on login
  useEffect(() => {
    const fetchUserAndSubscription = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          navigate("/login");
          return;
        }

        // --- Fetch User Info ---
        try {
          const res = await api.get("/api/user_info/");
          const userData = res.data;
          setUser(userData);
        } catch (userError) {
          console.error("Failed to fetch user info:", userError);
          // Don't fail authentication just because user info failed to load
        }

        // --- Fetch Subscription Status ---
        try {
          const subRes = await api.get("/stripe/subscription/status");
          const subData = subRes.data;
          setHasSubscription(subData.has_subscription === true);
        } catch (subError) {
          console.error("Failed to fetch subscription status:", subError);
          // Default to no subscription if the call fails
          setHasSubscription(false);
        }
      } catch (err) {
        console.error("Auth/Subscription fetch error:", err);
      }
    };

    if (isAuthenticated) {
      fetchUserAndSubscription();
    }
  }, [isAuthenticated, navigate]);

  return (
    <AppBar position="fixed" sx={{ 
      backgroundColor: "white", 
      color: "black", 
      height: "64px",
      boxShadow: "none",
      border: "1px solid rgba(0, 0, 0, 0.1)",
      borderBottom: "2px solid rgba(0, 0, 0, 0.15)",
      zIndex: 1300
    }}>
      <Toolbar>
        <Box sx={{ flexGrow: 1 }}>
          <img
            src={finLogo}
            alt="Finlytics Logo"
            style={{ height: "40px", cursor: "pointer" }}
            onClick={() => navigate("/")}
          />
        </Box>

        {isAuthenticated ? (
          <>
            <Avatar
              alt={user?.name || "User"}
              src={user?.avatar}
              onClick={handleMenuOpen}
              sx={{ cursor: "pointer" }}
            />

            <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleMenuClose}>
              {/* Hide Membership if subscribed */}
              {!hasSubscription && (
                <MenuItem
                  onClick={() => {
                    handleMenuClose();
                    startCheckout(); // redirect to Stripe Checkout
                  }}
                >
                  Membership
                </MenuItem>
              )}

              <MenuItem
                onClick={() => {
                  handleMenuClose();
                  setSettingsOpen(true);
                }}
              >
                Settings
              </MenuItem>

              <MenuItem
                onClick={() => {
                  handleMenuClose();
                  setLogoutConfirmOpen(true);
                }}
              >
                Logout
              </MenuItem>
            </Menu>

            {/* Logout Confirmation Modal */}
            <Dialog
              open={logoutConfirmOpen}
              onClose={() => setLogoutConfirmOpen(false)}
            >
              <DialogTitle>Confirm Logout</DialogTitle>
              <DialogContent>
                <Typography>Are you sure you want to log out?</Typography>
              </DialogContent>
              <DialogActions>
                <Button onClick={() => setLogoutConfirmOpen(false)}>Cancel</Button>
                <Button onClick={handleLogout}>Logout</Button>
              </DialogActions>
            </Dialog>

            {/* Settings Modal */}
            <Dialog
              open={settingsOpen}
              onClose={() => setSettingsOpen(false)}
              fullWidth
              maxWidth="sm"
            >
              <DialogTitle>Settings</DialogTitle>
              <DialogContent>
                <SettingsBlock />
              </DialogContent>
              <DialogActions>
                <Button onClick={() => setSettingsOpen(false)}>Close</Button>
              </DialogActions>
            </Dialog>
          </>
        ) : (
          <Button color="inherit" onClick={() => navigate("/login")}>
            Login
          </Button>
        )}
      </Toolbar>
    </AppBar>
  );
};

export default DbNavbar;