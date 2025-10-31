"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check } from "lucide-react";
import Link from "next/link";

const plans = [
  {
    name: "Starter",
    description: "Perfect for getting started",
    price: "$9",
    priceId: "price_starter", // Replace with your Stripe price ID
    features: [
      "Up to 1,000 requests/month",
      "Basic AI features",
      "Email support",
      "1 user",
    ],
  },
  {
    name: "Pro",
    description: "For growing businesses",
    price: "$29",
    priceId: "price_pro", // Replace with your Stripe price ID
    popular: true,
    features: [
      "Up to 10,000 requests/month",
      "Advanced AI features",
      "Priority support",
      "5 users",
      "Custom integrations",
    ],
  },
  {
    name: "Enterprise",
    description: "For large organizations",
    price: "$99",
    priceId: "price_enterprise", // Replace with your Stripe price ID
    features: [
      "Unlimited requests",
      "All AI features",
      "24/7 support",
      "Unlimited users",
      "Custom integrations",
      "SLA guarantee",
    ],
  },
];

export default function PricingPage() {
  const handleCheckout = async (priceId: string) => {
    try {
      const response = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ priceId, mode: "subscription" }),
      });

      const { url } = await response.json();
      if (url) {
        window.location.assign(url);
      }
    } catch (error) {
      console.error("Checkout error:", error);
    }
  };

  return (
    <div className="container mx-auto px-4 py-24">
      <div className="mb-16 text-center">
        <h1 className="text-4xl font-bold">Simple, Transparent Pricing</h1>
        <p className="mt-4 text-lg text-muted-foreground">
          Choose the plan that&apos;s right for you
        </p>
      </div>

      <div className="grid gap-8 md:grid-cols-3">
        {plans.map((plan) => (
          <Card
            key={plan.name}
            className={plan.popular ? "border-accent shadow-lg" : ""}
          >
            <CardHeader>
              {plan.popular && (
                <Badge className="mb-2 w-fit">Most Popular</Badge>
              )}
              <CardTitle>{plan.name}</CardTitle>
              <CardDescription>{plan.description}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <span className="text-4xl font-bold">{plan.price}</span>
                <span className="text-muted-foreground">/month</span>
              </div>

              <ul className="space-y-3">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2">
                    <Check className="mt-0.5 h-5 w-5 shrink-0 text-accent" />
                    <span className="text-sm">{feature}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
            <CardFooter>
              <Button
                className="w-full"
                variant={plan.popular ? "default" : "outline"}
                onClick={() => handleCheckout(plan.priceId)}
              >
                Get Started
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>

      <div className="mt-16 text-center">
        <p className="text-muted-foreground">
          Not sure which plan is right for you?{" "}
          <Link href="/login" className="text-accent hover:underline">
            Start with a free trial
          </Link>
        </p>
      </div>
    </div>
  );
}
