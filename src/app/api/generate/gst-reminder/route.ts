import { NextResponse } from "next/server";
import { perplexity } from "@/lib/openai";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// Force dynamic rendering
export const dynamic = "force-dynamic";

const SYSTEM_PROMPT = `
You are an AI drafting assistant for Indian Chartered Accountants and consultants.

Your task is to draft a GST compliance reminder / explanation letter for clients.

STRICT RULES:
1. Follow the exact document structure provided. Do not change the order.
2. Use professional Indian CA language appropriate to the specified tone.
3. Do NOT use legal sections, rule numbers, or threatening language.
4. Do NOT repeat sentences or ideas.
5. The letter must be client-readable and non-technical.
6. You may add ONLY ONE short supportive sentence, if appropriate.
7. Ensure clean formatting with proper line breaks.
8. Output must be in the selected language (English or Tamil).
9. Do NOT use any markdown formatting (no **, no *, no #, no _). Output plain text only.
10. Use ALL dates, periods, and values EXACTLY as provided. Do NOT reformat dates.

TONE GUIDELINES - Adapt your writing style based on the tone:
- Polite: Use soft, courteous language. Words like "kindly", "request", "at your convenience". Gentle reminders.
- Firm: Use direct, assertive language. Clear expectations without being harsh. Words like "must", "required", "expect".
- Urgent: Emphasize time sensitivity. Use phrases like "immediate attention required", "at the earliest", "time-sensitive matter".
- Friendly: Warm, conversational tone. Use "we hope", "looking forward", "happy to assist". Maintain professionalism while being approachable.

COMPLIANCE TYPE CONTEXT - Adapt letter content based on compliance type:
- GSTR-1 (Outward Supplies): Monthly/quarterly return for outward supplies. Mention sales invoices, credit/debit notes reporting.
- GSTR-3B (Summary Return): Monthly summary return with tax payment. Mention ITC claims, tax liability settlement.
- GSTR-4 (Composition Scheme): Quarterly return for composition dealers. Mention turnover details, fixed rate tax.
- GSTR-9 (Annual Return): Yearly consolidated return. Mention annual reconciliation, detailed summary of transactions.
- GSTR-9C (Reconciliation Statement): Audit reconciliation statement. Mention reconciliation between books and returns, CA certification.
- ITC-04 (Job Work): Input sent to job workers. Mention goods movement, job work tracking.
- GST Payment: Tax payment obligation. Mention challan, cash/credit ledger balance, payment deadlines.
- E-Way Bill Compliance: Transport documentation. Mention goods movement above threshold, validity period.

LANGUAGE INSTRUCTIONS - CRITICAL:
- Write the ENTIRE letter in the specified language.
- For non-English languages, use native script (Devanagari for Hindi/Marathi, Tamil script for Tamil, etc.).
- Keep GST terms like "GSTR-1", "GSTIN", "ITC" in English as they are official terms.
- Maintain professional tone appropriate for that language's business culture.
- Dates, names, and firm details should remain as provided.

Your goal is to help the consultant draft a clean, mistake-free document
without worrying about wording or formatting errors.
`;

// Reset credits monthly
async function checkAndResetCredits(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { credits: true, creditsResetAt: true, plan: true },
  });

  if (!user) return null;

  const now = new Date();
  const resetDate = new Date(user.creditsResetAt);
  const monthsSinceReset =
    (now.getFullYear() - resetDate.getFullYear()) * 12 +
    (now.getMonth() - resetDate.getMonth());

  // Reset credits monthly
  if (monthsSinceReset >= 1) {
    const defaultCredits = user.plan === "free" ? 5 : user.plan === "pro" ? 100 : 500;
    await prisma.user.update({
      where: { id: userId },
      data: { credits: defaultCredits, creditsResetAt: now },
    });
    return defaultCredits;
  }

  return user.credits;
}

export async function POST(req: Request) {
  try {
    const session = await auth();
    
    // Check authentication
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Please sign in to generate letters", requiresAuth: true },
        { status: 401 }
      );
    }

    // Check and potentially reset credits
    const credits = await checkAndResetCredits(session.user.id);
    
    if (credits === null) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    if (credits <= 0) {
      return NextResponse.json(
        { 
          error: "You've used all your credits. Upgrade your plan for more!", 
          requiresUpgrade: true,
          credits: 0 
        },
        { status: 403 }
      );
    }

    const body = await req.json();

    const {
      clientName,
      gstin,
      complianceType,
      period,
      dueDate,
      consequence,
      tone,
      language,
      // Letter header fields
      letterDate,
      place,
      // Signature fields
      signerName,
      designation,
      firmName,
      // Voice dictation
      additionalInstructions,
    } = body;

    if (!clientName || !complianceType || !period) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const USER_PROMPT = `
Draft a GST compliance reminder / explanation letter using the following details:

Client Name: ${clientName}
GSTIN: ${gstin ?? "Not provided"}
Compliance Type: ${complianceType}
Period: ${period}
Due Date: ${dueDate ?? "Applicable due date"}
Consequence: ${consequence ?? "Late fee / interest"}
Tone: ${tone ?? "Polite"} (IMPORTANT: Adjust your writing style to match this tone as per the tone guidelines)
Language: ${language ?? "English"} (CRITICAL: Write the ENTIRE letter in ${language ?? "English"}. Use native script for the language.)

IMPORTANT: 
1. The compliance type is "${complianceType}". Use the compliance type context guidelines to include relevant details.
2. LANGUAGE IS CRITICAL: The letter MUST be written entirely in ${language ?? "English"} using its native script.

Use the following fixed structure:

1. Place and Date (top right):
Place: ${place || "[Place]"}
Date: ${letterDate || "[Date]"}

2. Greeting:
Dear ${clientName},
Greetings from our office.

3. Context (adjust wording based on the ${tone ?? "Polite"} tone, include compliance-specific context for ${complianceType}):
Explain what "${complianceType}" involves and why it's pending for the specified period.

4. Compliance Requirement (adjust wording based on the ${tone ?? "Polite"} tone):
Specify what action the client needs to take for "${complianceType}" and by when.

5. Consequence (adjust wording based on the ${tone ?? "Polite"} tone):
Mention consequences specific to "${complianceType}" non-compliance (late fees, interest, penalties as applicable).

6. Closing and Signature:
Thanking you,
Yours faithfully,

${signerName || "[Name]"}
${designation || "[Designation]"}
${firmName || "[Firm Name]"}

IMPORTANT: 
- Use dates EXACTLY as provided (e.g., if due date is "${dueDate}", write it exactly as "${dueDate}", do not reformat).
- Use the place, date, name, designation, and firm name exactly as provided above.
- The tone "${tone ?? "Polite"}" must be reflected throughout the letter's language and word choice.
- Include specific details relevant to "${complianceType}" as per the compliance type context guidelines.
${additionalInstructions ? `\nADDITIONAL USER INSTRUCTIONS (incorporate these into the letter naturally):\n${additionalInstructions}` : ""}
`;

    const completion = await perplexity.chat.completions.create({
      model: "sonar",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: USER_PROMPT },
      ],
      temperature: 0.3,
    }) as { choices: Array<{ message: { content: string | null } }> };

    const letterContent = completion.choices[0]?.message?.content || "";

    // Decrement credits and save letter in a transaction
    const [updatedUser, savedLetter] = await prisma.$transaction([
      prisma.user.update({
        where: { id: session.user.id },
        data: { credits: { decrement: 1 } },
        select: { credits: true },
      }),
      prisma.letter.create({
        data: {
          userId: session.user.id,
          clientName,
          gstin,
          complianceType,
          period,
          dueDate,
          consequence,
          tone: tone ?? "Polite",
          language: language ?? "English",
          content: letterContent,
        },
      }),
    ]);

    return NextResponse.json({
      success: true,
      letter: letterContent,
      credits: updatedUser.credits,
      letterId: savedLetter.id,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to generate letter" },
      { status: 500 }
    );
  }
}
