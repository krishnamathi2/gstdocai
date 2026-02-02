import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";

// Set to true to use mock payments (for testing without Razorpay)
const USE_MOCK_PAYMENTS = true;

const PLAN_CREDITS: Record<string, number> = {
  pro: 100,
  firm: 500,
};

export async function POST(req: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { razorpay_payment_id, razorpay_order_id, razorpay_signature, planId, mockMode } =
      await req.json();

    // Handle mock payments
    if (USE_MOCK_PAYMENTS && mockMode) {
      // Update payment status for mock payment
      await prisma.payment.updateMany({
        where: {
          razorpayOrderId: razorpay_order_id,
          userId: session.user.id,
        },
        data: {
          razorpayPaymentId: razorpay_payment_id,
          razorpaySignature: "mock_signature",
          status: "completed",
        },
      });

      // Update user plan and credits
      const credits = PLAN_CREDITS[planId] || 100;
      const now = new Date();
      const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, now.getDate());

      await prisma.user.update({
        where: { id: session.user.id },
        data: {
          plan: planId,
          credits,
          creditsResetAt: nextMonth,
        },
      });

      return NextResponse.json({ success: true });
    }

    // Real Razorpay verification
    if (!razorpay_payment_id || !razorpay_order_id || !razorpay_signature) {
      return NextResponse.json(
        { error: "Missing payment details" },
        { status: 400 }
      );
    }

    const keySecret = process.env.RAZORPAY_KEY_SECRET;

    if (!keySecret) {
      return NextResponse.json(
        { error: "Payment gateway not configured" },
        { status: 500 }
      );
    }

    // Verify signature
    const generatedSignature = crypto
      .createHmac("sha256", keySecret)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex");

    if (generatedSignature !== razorpay_signature) {
      return NextResponse.json(
        { error: "Invalid payment signature" },
        { status: 400 }
      );
    }

    // Update payment status
    await prisma.payment.updateMany({
      where: {
        razorpayOrderId: razorpay_order_id,
        userId: session.user.id,
      },
      data: {
        razorpayPaymentId: razorpay_payment_id,
        razorpaySignature: razorpay_signature,
        status: "completed",
      },
    });

    // Get plan from payment record if not provided
    let plan = planId;
    if (!plan) {
      const payment = await prisma.payment.findFirst({
        where: {
          razorpayOrderId: razorpay_order_id,
          userId: session.user.id,
        },
      });
      plan = payment?.plan || "pro";
    }

    // Update user plan and credits
    const credits = PLAN_CREDITS[plan] || 100;
    const now = new Date();
    const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, now.getDate());

    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        plan: plan,
        credits,
        creditsResetAt: nextMonth,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Payment verification error:", error);
    return NextResponse.json(
      { error: "Payment verification failed" },
      { status: 500 }
    );
  }
}
