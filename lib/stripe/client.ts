import Stripe from "stripe";

export const stripe = new Stripe(
  process.env.STRIPE_SECRET_KEY || "sk_test_placeholder",
  {
    apiVersion: "2025-10-29.clover",
    typescript: true,
  }
);
