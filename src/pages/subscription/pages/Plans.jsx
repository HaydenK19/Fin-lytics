// src/pages/Plans.jsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import Slider from "react-slick";
import { Box, Typography, Alert } from "@mui/material";
import PlanCard from "../components/PlanCard";
import { createCheckoutSession } from "../subscriptionService";

import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";

const Plans = () => {
  const navigate = useNavigate();
  const [loadingPlanTitle, setLoadingPlanTitle] = useState(null);
  const [error, setError] = useState("");

  // You said one plan is fine for now, but we can still keep the UI flexible.
  const plans = [
    {
      title: "Premium",
      price: "$19.99/mo",
      features: ["Advanced analytics", "Priority support", "Custom alerts"],
    },
    {
      title: "Plus",
      price: "$9.99/mo",
      features: ["Basic analytics", "Portfolio tracking", "Email alerts"],
    },
    {
      title: "Stock Legend",
      price: "$49.99/mo",
      features: ["All Premium features", "Real-time data", "AI-based predictions"],
    },
  ];

  const handleSelect = async (plan) => {
    try {
      setError("");
      setLoadingPlanTitle(plan.title);

      // Backend already knows which Stripe price to use (via STRIPE_PRICE_ID)
      const data = await createCheckoutSession();

      if (!data || !data.checkout_url) {
        throw new Error("Missing checkout_url from backend");
      }

      // Hard redirect to Stripe Checkout
      window.location.href = data.checkout_url;
    } catch (err) {
      console.error("Error creating checkout session:", err);
      setError(
        "Failed to start checkout. Make sure you are logged in and Stripe is configured, then try again."
      );
      setLoadingPlanTitle(null);
    }
  };

  const settings = {
    dots: true,
    arrows: true,
    infinite: true,
    speed: 600,
    slidesToShow: 3,
    slidesToScroll: 1,
    centerMode: true,
    centerPadding: "40px",
    responsive: [
      {
        breakpoint: 1200,
        settings: { slidesToShow: 2 },
      },
      {
        breakpoint: 768,
        settings: { slidesToShow: 1 },
      },
    ],
  };

  return (
    <Box sx={{ textAlign: "center", mt: 8 }}>
      <Typography variant="h4" fontWeight="bold" gutterBottom>
        Choose Your Plan!
      </Typography>

      <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
        Upgrade your Fin-lytics experience with more data, insights, and smarter analytics.
      </Typography>

      {error && (
        <Box sx={{ width: "60%", maxWidth: 600, mx: "auto", mb: 3 }}>
          <Alert severity="error">{error}</Alert>
        </Box>
      )}

      <Box
        sx={{
          width: "85%",
          maxWidth: "1200px",
          margin: "0 auto",
          ".slick-slide": {
            display: "flex !important",
            justifyContent: "center",
            alignItems: "center",
          },
          ".slick-slide > div": {
            width: "300px",
          },
        }}
      >
        <Slider {...settings}>
          {plans.map((plan) => (
            <PlanCard
              key={plan.title}
              title={plan.title}
              price={plan.price}
              features={plan.features}
              onSelect={() => handleSelect(plan)}
              loading={loadingPlanTitle === plan.title}
              disabled={!!loadingPlanTitle}
            />
          ))}
        </Slider>
      </Box>
    </Box>
  );
};

export default Plans;