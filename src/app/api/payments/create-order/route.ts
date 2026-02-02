import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// Force dynamic rendering
export const dynamic = "force-dynamic";

// Set to true to use mock payments (for testing without Razorpay)
const USE_MOCK_PAYMENTS = true;

const PLAN_PRICES: Record<string, number> = {
  pro: 49900, // ₹499 in paise
  firm: 149900, // ₹1499 in paise
};

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

    const { planId } = await req.json();

    if (!planId || !PLAN_PRICES[planId]) {
      return NextResponse.json({ error: "Invalid plan" }, { status: 400 });
    }

    const amount = PLAN_PRICES[planId];

    // Mock payment mode for testing
    if (USE_MOCK_PAYMENTS) {
      const mockOrderId = `mock_order_${Date.now()}`;
      
      // Save mock order to database
      await prisma.payment.create({
        data: {
          userId: session.user.id,
          razorpayPaymentId: `pending_${mockOrderId}`,
          razorpayOrderId: mockOrderId,
          amount: amount,
          currency: "INR",
          status: "pending",
          plan: planId,
        },
      });

      return NextResponse.json({
        orderId: mockOrderId,
        amount,
        currency: "INR",
        keyId: "mock_key",
        mockMode: true, // Flag for frontend to handle mock payment
      });
    }

    // Real Razorpay payment (when USE_MOCK_PAYMENTS is false)
    const keyId = process.env.RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;

    if (!keyId || !keySecret) {
      console.error("Razorpay keys not configured");
      return NextResponse.json(
        { error: "Payment gateway not configured" },
        { status: 500 }
      );
    }

    const Razorpay = (await import("razorpay")).default;
    const razorpay = new Razorpay({
      key_id: keyId,
      key_secret: keySecret,
    });

    const order = await razorpay.orders.create({
      amount,
      currency: "INR",
      receipt: `order_${session.user.id}_${Date.now()}`,
      notes: {
        userId: session.user.id,
        planId,
        credits: PLAN_CREDITS[planId].toString(),
      },
    });

    // Save order to database
    await prisma.payment.create({
      data: {
        userId: session.user.id,
        razorpayPaymentId: `pending_${order.id}`,
        razorpayOrderId: order.id,
        amount: amount,
        currency: "INR",
        status: "pending",
        plan: planId,
      },
    });

    return NextResponse.json({
      orderId: order.id,
      amount,
      currency: "INR",
      keyId,
    });
  } catch (error: unknown) {
    console.error("Create order error:", error);
    let errorMessage = "Unknown error";
    
    if (error instanceof Error) {
      errorMessage = error.message;
      if ('error' in error && typeof (error as { error: { description?: string } }).error === 'object') {
        const razorpayError = (error as { error: { description?: string } }).error;
        if (razorpayError?.description) {
          errorMessage = razorpayError.description;
        }
      }
    }
    
    return NextResponse.json(
      { error: "Failed to create order: " + errorMessage },
      { status: 500 }
    );
  }
}
