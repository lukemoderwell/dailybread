import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe/client";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function POST() {
  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: customer } = await supabase
      .from("customers")
      .select("stripe_customer_id")
      .eq("id", user.id)
      .single();

    if (!customer) {
      return NextResponse.json(
        { error: "No customer found" },
        { status: 404 }
      );
    }

    const session = await stripe.billingPortal.sessions.create({
      customer: customer.stripe_customer_id,
      return_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard`,
    });

    return NextResponse.json({ url: session.url });
  } catch (error: any) {
    console.error("Portal error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
