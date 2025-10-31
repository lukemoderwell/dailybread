import { headers } from "next/headers";
import { NextResponse } from "next/server";
import Stripe from "stripe";
import { stripe } from "@/lib/stripe/client";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function POST(req: Request) {
  const body = await req.text();
  const headersList = await headers();
  const signature = headersList.get("stripe-signature");

  if (!signature) {
    return NextResponse.json(
      { error: "No signature provided" },
      { status: 400 }
    );
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err: any) {
    console.error("Webhook signature verification failed:", err.message);
    return NextResponse.json(
      { error: "Webhook signature verification failed" },
      { status: 400 }
    );
  }

  const supabase = await createSupabaseServerClient();

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        console.log("Checkout session completed:", session.id);
        break;
      }

      case "customer.subscription.created":
      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;

        const priceId =
          typeof subscription.items.data[0].price === "string"
            ? subscription.items.data[0].price
            : subscription.items.data[0].price.id;

        const subData: any = subscription;

        await supabase.from("subscriptions").upsert({
          id: subscription.id,
          user_id: subscription.metadata.user_id || "",
          status: subscription.status,
          price_id: priceId,
          quantity: subscription.items.data[0].quantity ?? 1,
          cancel_at_period_end: subscription.cancel_at_period_end ?? false,
          current_period_start: subData.current_period_start
            ? new Date(subData.current_period_start * 1000).toISOString()
            : new Date().toISOString(),
          current_period_end: subData.current_period_end
            ? new Date(subData.current_period_end * 1000).toISOString()
            : new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });

        console.log("Subscription upserted:", subscription.id);
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;

        await supabase
          .from("subscriptions")
          .update({
            status: "canceled",
            updated_at: new Date().toISOString(),
          })
          .eq("id", subscription.id);

        console.log("Subscription deleted:", subscription.id);
        break;
      }

      case "payment_intent.succeeded": {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;

        if (paymentIntent.metadata.user_id) {
          await supabase.from("payments").insert({
            id: paymentIntent.id,
            user_id: paymentIntent.metadata.user_id,
            amount: paymentIntent.amount,
            currency: paymentIntent.currency,
            status: paymentIntent.status,
            description: paymentIntent.description,
          });

          console.log("Payment recorded:", paymentIntent.id);
        }
        break;
      }

      case "payment_intent.payment_failed": {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        console.log("Payment failed:", paymentIntent.id);
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error("Webhook handler error:", error);
    return NextResponse.json(
      { error: "Webhook handler failed" },
      { status: 500 }
    );
  }
}
