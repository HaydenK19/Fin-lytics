// src/pages/Success.jsx
import React, { useEffect, useState } from "react";
import { Box, Typography, Button, CircularProgress, Alert } from "@mui/material";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutline";
import { useNavigate, useLocation } from "react-router-dom";
import {
  verifyCheckoutSession,
  getSubscriptionStatus,
  createPortalSession,
} from "../subscriptionService";

const Success = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const [loading, setLoading] = useState(true);
  const [verifying, setVerifying] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [subscriptionInfo, setSubscriptionInfo] = useState(null);

  const searchParams = new URLSearchParams(location.search);
  const sessionId = searchParams.get("session_id");
  const canceled = searchParams.get("canceled") === "true";

  useEffect(() => {
    let isMounted = true;

    const run = async () => {
      try {
        if (canceled) {
          // User bailed out of checkout
          if (!isMounted) return;
          setMessage("Your payment was canceled. No charges were made.");
          setLoading(false);
          setVerifying(false);
          return;
        }

        if (!sessionId) {
          if (!isMounted) return;
          setError("Missing Stripe session. Unable to verify subscription.");
          setLoading(false);
          setVerifying(false);
          return;
        }

        // 1) Verify the checkout session with backend
        const verifyResult = await verifyCheckoutSession(sessionId);
        if (!isMounted) return;

        if (!verifyResult.success) {
          setError(verifyResult.message || "Failed to verify subscription.");
        } else {
          setMessage(verifyResult.message || "Subscription activated successfully.");
        }

        setVerifying(false);

        // 2) Fetch fresh subscription status to display details
        try {
          const status = await getSubscriptionStatus();
          if (!isMounted) return;
          setSubscriptionInfo(status);
        } catch (statusErr) {
          console.error("Failed to fetch subscription status:", statusErr);
          // Not fatal, we just won't show details
        }

        setLoading(false);
      } catch (err) {
        console.error("Error in success flow:", err);
        if (!isMounted) return;
        setError("Something went wrong while verifying your subscription.");
        setLoading(false);
        setVerifying(false);
      }
    };

    run();

    return () => {
      isMounted = false;
    };
  }, [sessionId, canceled]);

  const handleReturn = () => navigate("/dashboard");

  const handleManageBilling = async () => {
    try {
      const data = await createPortalSession();
      if (!data || !data.portal_url) {
        throw new Error("Missing portal_url");
      }
      window.location.href = data.portal_url;
    } catch (err) {
      console.error("Failed to create portal session:", err);
      setError("Unable to open billing portal. Try again later.");
    }
  };

  const isSuccessful = !canceled && !error && !verifying;

  return (
    <Box
      sx={{
        textAlign: "center",
        mt: 10,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        px: 2,
      }}
    >
      {loading ? (
        <>
          <CircularProgress sx={{ mb: 2 }} />
          <Typography variant="h5" fontWeight="bold">
            Finalizing your subscription…
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Hang tight while we confirm your payment with Stripe.
          </Typography>
        </>
      ) : (
        <>
          {isSuccessful ? (
            <>
              <CheckCircleOutlineIcon
                color="success"
                sx={{ fontSize: 100, mb: 2, animation: "pop 0.4s ease" }}
              />

              <Typography variant="h4" fontWeight="bold" gutterBottom>
                Subscription Active!
              </Typography>

              <Typography
                variant="body1"
                color="text.secondary"
                sx={{ mb: 3, maxWidth: 480 }}
              >
                {message ||
                  "Your Fin-lytics subscription is now active. You’re all set to dive into your analytics."}
              </Typography>

              {subscriptionInfo && (
                <Box
                  sx={{
                    mb: 3,
                    p: 2,
                    borderRadius: 2,
                    border: "1px solid",
                    borderColor: "divider",
                    maxWidth: 480,
                    textAlign: "left",
                  }}
                >
                  <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 1 }}>
                    Subscription Details
                  </Typography>
                  <Typography variant="body2">
                    Status:{" "}
                    <strong>{subscriptionInfo.subscription_status || "unknown"}</strong>
                  </Typography>
                  {subscriptionInfo.next_billing_date && (
                    <Typography variant="body2">
                      Next billing date:{" "}
                      {new Date(subscriptionInfo.next_billing_date).toLocaleString()}
                    </Typography>
                  )}
                  {subscriptionInfo.cancel_at && (
                    <Typography variant="body2">
                      Scheduled to cancel:{" "}
                      {new Date(subscriptionInfo.cancel_at).toLocaleString()}
                    </Typography>
                  )}
                </Box>
              )}

              <Box sx={{ display: "flex", gap: 2 }}>
                <Button
                  variant="contained"
                  color="primary"
                  size="large"
                  sx={{ borderRadius: "20px", px: 5 }}
                  onClick={handleReturn}
                >
                  Return to Dashboard
                </Button>
                <Button
                  variant="outlined"
                  color="primary"
                  size="large"
                  sx={{ borderRadius: "20px", px: 5 }}
                  onClick={handleManageBilling}
                >
                  Manage Billing
                </Button>
              </Box>
            </>
          ) : (
            <>
              <ErrorOutlineIcon
                color="error"
                sx={{ fontSize: 100, mb: 2, animation: "pop 0.4s ease" }}
              />
              <Typography variant="h4" fontWeight="bold" gutterBottom>
                {canceled ? "Payment Canceled" : "Something Went Wrong"}
              </Typography>

              <Typography
                variant="body1"
                color="text.secondary"
                sx={{ mb: 3, maxWidth: 480 }}
              >
                {canceled
                  ? "You canceled the Stripe checkout. No charges were made."
                  : error ||
                    "We couldn’t verify your subscription. If you were charged, please contact support."}
              </Typography>

              {error && (
                <Box sx={{ maxWidth: 480, mb: 2 }}>
                  <Alert severity="error">{error}</Alert>
                </Box>
              )}

              <Button
                variant="contained"
                color="primary"
                size="large"
                sx={{ borderRadius: "20px", px: 5 }}
                onClick={handleReturn}
              >
                Return to Dashboard
              </Button>
            </>
          )}
        </>
      )}

      <style>{`
        @keyframes pop {
          0% { transform: scale(0.5); opacity: 0; }
          100% { transform: scale(1); opacity: 1; }
        }
      `}</style>
    </Box>
  );
};

export default Success;
