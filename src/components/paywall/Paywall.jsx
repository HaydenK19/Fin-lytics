import React, { useState, useEffect } from "react";
import {
  Box,
  Container,
  Typography,
  Button,
  Paper,
  Card,
  CardContent,
  CircularProgress,
  Alert,
} from "@mui/material";
import { Lock as LockIcon } from "@mui/icons-material";
import api from "../../api";

function Paywall({ onSubscribeSuccess }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [checkingStatus, setCheckingStatus] = useState(true);
  const [hasSubscription, setHasSubscription] = useState(false);

  useEffect(() => {
    checkSubscriptionStatus();
  }, []);

  const checkSubscriptionStatus = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        setCheckingStatus(false);
        return;
      }

      const response = await api.get("/stripe/subscription/status", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setHasSubscription(response.data.has_subscription);
      if (response.data.has_subscription && onSubscribeSuccess) {
        onSubscribeSuccess();
      }
    } catch (err) {
      console.error("Error checking subscription status:", err);
    } finally {
      setCheckingStatus(false);
    }
  };

  const handleSubscribe = async () => {
    try {
      setLoading(true);
      setError(null);

      const token = localStorage.getItem("token");
      const response = await api.post(
        "/stripe/create-checkout-session",
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      // Redirect to Stripe checkout
      if (response.data.checkout_url) {
        window.location.href = response.data.checkout_url;
      }
    } catch (err) {
      console.error("Error creating checkout session:", err);
      setError(
        err.response?.data?.detail ||
          "Failed to create checkout session. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleManageSubscription = async () => {
    try {
      setLoading(true);
      setError(null);

      const token = localStorage.getItem("token");
      const response = await api.post(
        "/stripe/create-portal-session",
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      // Redirect to Stripe customer portal
      if (response.data.portal_url) {
        window.location.href = response.data.portal_url;
      }
    } catch (err) {
      console.error("Error creating portal session:", err);
      setError(
        err.response?.data?.detail ||
          "Failed to access subscription management. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  if (checkingStatus) {
    return (
      <Container maxWidth="md" sx={{ mt: 8, textAlign: "center" }}>
        <CircularProgress />
      </Container>
    );
  }

  if (hasSubscription) {
    return null; // Don't show paywall if user has subscription
  }

  return (
    <Container maxWidth="md" sx={{ mt: 8, mb: 8 }}>
      <Paper
        elevation={3}
        sx={{
          p: 4,
          textAlign: "center",
          background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
          color: "white",
          borderRadius: 3,
        }}
      >
        <LockIcon sx={{ fontSize: 64, mb: 2, opacity: 0.9 }} />
        <Typography variant="h4" fontWeight={700} gutterBottom>
          Premium Subscription Required
        </Typography>
        <Typography variant="h6" sx={{ mb: 4, opacity: 0.9 }}>
          Unlock AI-Powered Stock Predictions
        </Typography>

        <Card sx={{ mt: 3, mb: 3, textAlign: "left", color: "text.primary" }}>
          <CardContent>
            <Typography variant="h6" gutterBottom fontWeight={600}>
              What you'll get:
            </Typography>
            <Box component="ul" sx={{ pl: 3, mt: 2 }}>
              <Typography component="li" variant="body1" sx={{ mb: 1 }}>
                Real-time AI stock predictions using Chronos models
              </Typography>
              <Typography component="li" variant="body1" sx={{ mb: 1 }}>
                Multi-interval predictions (5min, 15min, 1hr, 1day)
              </Typography>
              <Typography component="li" variant="body1" sx={{ mb: 1 }}>
                Confidence ranges and price forecasts
              </Typography>
              <Typography component="li" variant="body1" sx={{ mb: 1 }}>
                Access to prediction history and analytics
              </Typography>
              <Typography component="li" variant="body1">
                Priority support and updates
              </Typography>
            </Box>
          </CardContent>
        </Card>

        {error && (
          <Alert severity="error" sx={{ mb: 3, textAlign: "left" }}>
            {error}
          </Alert>
        )}

        <Button
          variant="contained"
          size="large"
          onClick={handleSubscribe}
          disabled={loading}
          sx={{
            mt: 2,
            px: 4,
            py: 1.5,
            fontSize: "1.1rem",
            fontWeight: 600,
            backgroundColor: "white",
            color: "#667eea",
            "&:hover": {
              backgroundColor: "#f5f5f5",
            },
          }}
        >
          {loading ? <CircularProgress size={24} /> : "Subscribe Now"}
        </Button>

        <Typography variant="body2" sx={{ mt: 3, opacity: 0.8 }}>
          Secure payment powered by Stripe
        </Typography>
      </Paper>
    </Container>
  );
}

export default Paywall;



