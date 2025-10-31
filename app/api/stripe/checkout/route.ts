import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe/client";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function POST(req: Request) {
  try {
    const { priceId, mode = "subscription" } = await req.json();

    if (!priceId) {
      return NextResponse.json(
        { error: "Price ID is required" },
        { status: 400 }
      );
    }

    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get or create Stripe customer
    let { data: customer } = await supabase
      .from("customers")
      .select("stripe_customer_id")
      .eq("id", user.id)
      .single();

    if (!customer) {
      const stripeCustomer = await stripe.customers.create({
        email: user.email,
        metadata: {
          supabase_user_id: user.id,
        },
      });

      await supabase.from("customers").insert({
        id: user.id,
        stripe_customer_id: stripeCustomer.id,
      });

      customer = { stripe_customer_id: stripeCustomer.id };
    }

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      customer: customer.stripe_customer_id,
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: mode as "subscription" | "payment",
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?success=true`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/pricing?canceled=true`,
      metadata: {
        user_id: user.id,
      },
    });

    return NextResponse.json({ url: session.url, sessionId: session.id });
  } catch (error) {
    console.error("Checkout error:", error);
    const errorMessage = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
