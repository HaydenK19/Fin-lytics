// src/services/subscriptionService.js
import axios from "axios";

const API_BASE_URL = "http://127.0.0.1:8000"; // change here if your backend URL/port changes

function getAuthHeaders() {
  const token = localStorage.getItem("token");
  if (!token) {
    throw new Error("Not authenticated – JWT token not found");
  }

  return {
    Authorization: `Bearer ${token}`,
  };
}

export async function createCheckoutSession() {
  const res = await axios.post(
    `${API_BASE_URL}/stripe/create-checkout-session`,
    {},
    {
      headers: {
        ...getAuthHeaders(),
        "Content-Type": "application/json",
      },
    }
  );

  return res.data; // { checkout_url, session_id }
}

export async function verifyCheckoutSession(sessionId) {
  const res = await axios.post(
    `${API_BASE_URL}/stripe/verify-session`,
    { session_id: sessionId },
    {
      headers: {
        ...getAuthHeaders(),
        "Content-Type": "application/json",
      },
    }
  );

  return res.data;
}

export async function getSubscriptionStatus() {
  const res = await axios.get(`${API_BASE_URL}/stripe/subscription/status`, {
    headers: getAuthHeaders(),
  });

  return res.data;
}

export async function createPortalSession() {
  const res = await axios.post(
    `${API_BASE_URL}/stripe/create-portal-session`,
    {},
    {
      headers: {
        ...getAuthHeaders(),
        "Content-Type": "application/json",
      },
    }
  );

  return res.data; // { portal_url }
}
