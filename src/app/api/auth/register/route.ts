import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { sendVerificationEmail } from "@/lib/email";
import crypto from "crypto";

// Force dynamic rendering - prevents build-time errors
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const { name, email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      // If user exists but email not verified, allow resending verification
      if (!existingUser.emailVerified) {
        // Generate new verification token
        const token = crypto.randomBytes(32).toString('hex');
        const expires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

        // Delete old tokens and create new one
        await prisma.emailVerificationToken.deleteMany({
          where: { email },
        });

        await prisma.emailVerificationToken.create({
          data: {
            email,
            token,
            expires,
          },
        });

        // Send verification email
        await sendVerificationEmail(email, token);

        return NextResponse.json({
          success: true,
          message: "Verification email resent. Please check your inbox.",
          requiresVerification: true,
        });
      }

      return NextResponse.json(
        { error: "User already exists" },
        { status: 400 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create user with free tier (5 credits) - email NOT verified
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        plan: "free",
        credits: 5,
        creditsResetAt: new Date(),
        emailVerified: null, // Not verified yet
      },
    });

    // Generate verification token
    const token = crypto.randomBytes(32).toString('hex');
    const expires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    await prisma.emailVerificationToken.create({
      data: {
        email,
        token,
        expires,
      },
    });

    // Send verification email
    const emailSent = await sendVerificationEmail(email, token);

    if (!emailSent) {
      console.error("Failed to send verification email to:", email);
    }

    return NextResponse.json({
      success: true,
      message: "Account created! Please check your email to verify your account.",
      requiresVerification: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
      },
    });
  } catch (error) {
    console.error("Registration error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: "Failed to create account", details: errorMessage },
      { status: 500 }
    );
  }
}
