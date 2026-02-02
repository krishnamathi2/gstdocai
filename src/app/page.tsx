"use client";

import { useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import UserMenu from "@/components/UserMenu";
import Link from "next/link";
import { generatePDF } from "@/lib/pdf";
import VoiceInput from "@/components/VoiceInput";
import SignaturePad from "@/components/SignaturePad";
import TextToSpeech from "@/components/TextToSpeech";

const COMPLIANCE_TYPES = [
  "GSTR-1 (Outward Supplies)",
  "GSTR-3B (Summary Return)",
  "GSTR-4 (Composition Scheme)",
  "GSTR-9 (Annual Return)",
  "GSTR-9C (Reconciliation Statement)",
  "ITC-04 (Job Work)",
  "GST Payment",
  "E-Way Bill Compliance",
];

const TONES = ["Polite", "Firm", "Urgent", "Friendly"];

const LANGUAGES = [
  "English",
  "Hindi",
  "Tamil",
  "Telugu",
  "Kannada",
  "Malayalam",
  "Marathi",
  "Gujarati",
  "Bengali",
  "Punjabi",
];

interface FormData {
  clientName: string;
  gstin: string;
  complianceType: string;
  period: string;
  dueDate: string;
  consequence: string;
  tone: string;
  language: string;
  // Letter header fields
  letterDate: string;
  place: string;
  // Signature fields
  signerName: string;
  designation: string;
  firmName: string;
  // Voice dictation
  additionalInstructions: string;
  // Digital signature
  digitalSignature: string;
}

export default function Home() {
  const { data: session, status, update } = useSession();
  const [formData, setFormData] = useState<FormData>({
    clientName: "",
    gstin: "",
    complianceType: "",
    period: "",
    dueDate: "",
    consequence: "",
    tone: "Polite",
    language: "English",
    // Letter header fields
    letterDate: "",
    place: "",
    // Signature fields
    signerName: "",
    designation: "",
    firmName: "",
    // Voice dictation
    additionalInstructions: "",
    // Digital signature
    digitalSignature: "",
  });

  const [generatedLetter, setGeneratedLetter] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>("");
  const [isEditing, setIsEditing] = useState(false);
  const [isDictating, setIsDictating] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Handle voice input for a specific field
  const handleVoiceInput = useCallback((fieldName: keyof FormData) => {
    return (text: string) => {
      setFormData((prev) => ({ ...prev, [fieldName]: text }));
    };
  }, []);

  // Handle voice dictation for letter instructions - appends to existing text
  const handleDictationInput = useCallback((text: string) => {
    setFormData((prev) => ({
      ...prev,
      additionalInstructions: prev.additionalInstructions
        ? `${prev.additionalInstructions} ${text}`
        : text,
    }));
  }, []);

  // Format date from YYYY-MM-DD to DD-MM-YYYY for display
  const formatDateForDisplay = (dateStr: string) => {
    if (!dateStr) return "";
    const [year, month, day] = dateStr.split("-");
    return `${day}-${month}-${year}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    setGeneratedLetter("");

    try {
      // Format dates before sending
      const formattedData = {
        ...formData,
        dueDate: formatDateForDisplay(formData.dueDate),
        letterDate: formatDateForDisplay(formData.letterDate),
      };

      const response = await fetch("/api/generate/gst-reminder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formattedData),
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.requiresAuth) {
          window.location.href = "/auth/signin";
          return;
        }
        if (data.requiresUpgrade) {
          setError("You've used all your credits! Upgrade to continue generating letters.");
          return;
        }
        throw new Error(data.error || "Failed to generate letter");
      }

      setGeneratedLetter(data.letter);
      // Refresh session to update credit count in UI
      await update();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(generatedLetter);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleSaveEdit = () => {
    setIsEditing(false);
  };

  const handleLetterChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setGeneratedLetter(e.target.value);
  };

  const handleSendEmail = () => {
    if (!generatedLetter) return;
    
    const subject = encodeURIComponent(`GST Compliance Reminder - ${formData.complianceType}`);
    const body = encodeURIComponent(generatedLetter);
    window.open(`mailto:?subject=${subject}&body=${body}`, '_blank');
  };

  const handleWhatsAppShare = () => {
    if (!generatedLetter) return;
    
    // Create a formatted message with header
    const header = `*GST Compliance Reminder - ${formData.complianceType}*\n\n`;
    const message = encodeURIComponent(header + generatedLetter);
    
    // Use WhatsApp Web/App URL scheme
    // wa.me works on both mobile and desktop
    window.open(`https://wa.me/?text=${message}`, '_blank');
  };

  const handlePrintPreview = () => {
    if (!generatedLetter) return;
    
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    
    // Format the letter content for proper display
    const formatLetterForPrint = (text: string) => {
      // Split into lines and process
      const lines = text.split('\n');
      let formattedHtml = '';
      let i = 0;
      
      // Check if first two lines are place and date
      const firstLine = lines[0]?.trim() || '';
      const secondLine = lines[1]?.trim() || '';
      
      // If we have place and date at the start
      if (firstLine && secondLine && /\d{2}-\d{2}-\d{4}/.test(secondLine)) {
        formattedHtml += `<div class="header-row"><span>${firstLine}</span><span>${secondLine}</span></div>`;
        i = 2;
      } else if (firstLine && /\d{2}-\d{2}-\d{4}/.test(firstLine)) {
        // Just date on first line
        formattedHtml += `<div class="header-row"><span></span><span>${firstLine}</span></div>`;
        i = 1;
      }
      
      // Process remaining lines
      let currentParagraph = '';
      let inSignature = false;
      
      for (; i < lines.length; i++) {
        const line = lines[i];
        const trimmedLine = line.trim();
        
        // Check for signature block start
        if (trimmedLine.toLowerCase().startsWith('thanking you') || 
            trimmedLine.toLowerCase().startsWith('yours faithfully') ||
            trimmedLine.toLowerCase().startsWith('yours sincerely')) {
          // Flush current paragraph
          if (currentParagraph.trim()) {
            formattedHtml += `<p>${currentParagraph.trim()}</p>`;
            currentParagraph = '';
          }
          inSignature = true;
          formattedHtml += '<div class="signature-block">';
        }
        
        if (trimmedLine === '') {
          // Empty line - flush paragraph
          if (currentParagraph.trim()) {
            if (inSignature) {
              formattedHtml += `<p class="sig-line">${currentParagraph.trim()}</p>`;
            } else {
              formattedHtml += `<p>${currentParagraph.trim()}</p>`;
            }
            currentParagraph = '';
          }
        } else {
          if (inSignature) {
            // In signature, each line is separate
            if (currentParagraph.trim()) {
              formattedHtml += `<p class="sig-line">${currentParagraph.trim()}</p>`;
              currentParagraph = '';
            }
            formattedHtml += `<p class="sig-line">${trimmedLine}</p>`;
          } else {
            // Regular content - join lines
            currentParagraph += (currentParagraph ? ' ' : '') + trimmedLine;
          }
        }
      }
      
      // Flush remaining content
      if (currentParagraph.trim()) {
        if (inSignature) {
          formattedHtml += `<p class="sig-line">${currentParagraph.trim()}</p>`;
        } else {
          formattedHtml += `<p>${currentParagraph.trim()}</p>`;
        }
      }
      
      if (inSignature) {
        formattedHtml += '</div>';
      }
      
      return formattedHtml;
    };
    
    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>GST Compliance Letter - ${formData.clientName}</title>
          <style>
            @media print {
              body { margin: 0; }
              @page { 
                margin: 2.5cm 2cm; 
                size: A4;
              }
              .no-print { display: none !important; }
            }
            * {
              box-sizing: border-box;
              margin: 0;
              padding: 0;
            }
            body {
              font-family: 'Times New Roman', Times, serif;
              font-size: 14px;
              line-height: 1.8;
              color: #000;
              max-width: 700px;
              margin: 0 auto;
              padding: 50px;
              background: #fff;
            }
            .header-row {
              display: flex;
              justify-content: space-between;
              margin-bottom: 30px;
            }
            p {
              margin-bottom: 16px;
              text-align: justify;
              text-indent: 0;
            }
            .signature-block {
              margin-top: 30px;
            }
            .signature-block p,
            .sig-line {
              margin-bottom: 2px;
              text-align: left;
            }
            .signature-image {
              max-width: 200px;
              height: 60px;
              object-fit: contain;
              margin: 10px 0;
            }
            .print-btn {
              position: fixed;
              top: 20px;
              right: 20px;
              padding: 12px 24px;
              background: linear-gradient(135deg, #10b981, #0d9488);
              color: white;
              border: none;
              border-radius: 8px;
              cursor: pointer;
              font-size: 14px;
              font-weight: 500;
              box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
              display: flex;
              align-items: center;
              gap: 8px;
            }
            .print-btn:hover {
              background: linear-gradient(135deg, #059669, #0f766e);
            }
          </style>
        </head>
        <body>
          <button class="print-btn no-print" onclick="window.print()">
            <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"/>
            </svg>
            Print
          </button>
          ${formatLetterForPrint(generatedLetter)}
          ${formData.digitalSignature ? `<div class="signature-image-container"><img src="${formData.digitalSignature}" alt="Digital Signature" class="signature-image" /></div>` : ''}
        </body>
      </html>
    `;
    
    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };

  const handleDownloadPDF = () => {
    if (!generatedLetter || !formData.clientName) return;
    
    generatePDF({
      clientName: formData.clientName,
      gstNumber: formData.gstin || undefined,
      content: generatedLetter,
      signature: formData.digitalSignature || undefined,
    });
  };

  const handleReset = () => {
    setFormData({
      clientName: "",
      gstin: "",
      complianceType: "",
      period: "",
      dueDate: "",
      consequence: "",
      tone: "Polite",
      language: "English",
      // Letter header fields
      letterDate: "",
      place: "",
      // Signature fields
      signerName: "",
      designation: "",
      firmName: "",
      // Voice dictation
      additionalInstructions: "",
      // Digital signature
      digitalSignature: "",
    });
    setGeneratedLetter("");
    setError("");
    setIsDictating(false);
  };

  // Handle digital signature
  const handleSignatureSave = useCallback((signatureDataUrl: string) => {
    setFormData((prev) => ({ ...prev, digitalSignature: signatureDataUrl }));
  }, []);

  const handleSignatureClear = useCallback(() => {
    setFormData((prev) => ({ ...prev, digitalSignature: "" }));
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
      <header className="relative z-50 border-b border-slate-700/50 bg-slate-900/50 backdrop-blur-sm">
        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600">
                <svg
                  className="h-6 w-6 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">GST Doc AI</h1>
                <p className="text-sm text-slate-400">
                  AI-Powered GST Compliance Reminder Generator
                </p>
              </div>
            </div>
            
            {/* User Menu / Auth */}
            <div className="flex items-center gap-4">
              {session && (
                <div className="hidden items-center gap-2 rounded-lg bg-slate-800 px-3 py-1.5 sm:flex">
                  <svg className="h-4 w-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  <span className="text-sm text-slate-300">
                    <span className="font-medium text-emerald-400">{session.user.credits ?? 0}</span> credits
                  </span>
                </div>
              )}
              <UserMenu />
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Auth prompt for non-logged in users */}
        {status === "unauthenticated" && (
          <div className="mb-6 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4">
            <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500/20">
                  <svg className="h-5 w-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <div>
                  <p className="font-medium text-emerald-300">Sign in to get 5 free letters!</p>
                  <p className="text-sm text-emerald-400/70">Track history, save drafts, and upgrade for unlimited access</p>
                </div>
              </div>
              <Link
                href="/auth/signin"
                className="rounded-lg bg-emerald-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-emerald-600"
              >
                Sign In Free
              </Link>
            </div>
          </div>
        )}

        <div className="grid gap-8 lg:grid-cols-2">
          {/* Form Section */}
          <div className="rounded-2xl border border-slate-700/50 bg-slate-800/50 p-6 backdrop-blur-sm">
            <h2 className="mb-6 text-lg font-semibold text-white">
              Client Details
            </h2>

            {/* suppressHydrationWarning: Browser extensions (password managers, autofill) 
                add attributes like fdprocessedid to form elements causing hydration mismatch */}
            <form onSubmit={handleSubmit} className="space-y-5" suppressHydrationWarning>
              {/* Client Name */}
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-300">
                  Client Name <span className="text-red-400">*</span>
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    name="clientName"
                    value={formData.clientName}
                    onChange={handleInputChange}
                    placeholder="Enter client name"
                    required
                    suppressHydrationWarning
                    className="flex-1 rounded-lg border border-slate-600 bg-slate-700/50 px-4 py-2.5 text-white placeholder-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                  <VoiceInput
                    onResult={handleVoiceInput("clientName")}
                    language={formData.language}
                    className="px-3 py-2.5"
                  />
                </div>
              </div>

              {/* GSTIN */}
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-300">
                  GSTIN
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    name="gstin"
                    value={formData.gstin}
                    onChange={handleInputChange}
                    placeholder="e.g., 33AABCU9603R1ZM"
                    maxLength={15}
                    suppressHydrationWarning
                    className="flex-1 rounded-lg border border-slate-600 bg-slate-700/50 px-4 py-2.5 font-mono text-white placeholder-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                  <VoiceInput
                    onResult={handleVoiceInput("gstin")}
                    language="English"
                    className="px-3 py-2.5"
                  />
                </div>
              </div>

              {/* Compliance Type */}
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-300">
                  Compliance Type <span className="text-red-400">*</span>
                </label>
                <select
                  name="complianceType"
                  value={formData.complianceType}
                  onChange={handleInputChange}
                  required
                  suppressHydrationWarning
                  className="w-full rounded-lg border border-slate-600 bg-slate-700/50 px-4 py-2.5 text-white focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                >
                  <option value="">Select compliance type</option>
                  {COMPLIANCE_TYPES.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </div>

              {/* Period */}
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-300">
                  Period <span className="text-red-400">*</span>
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    name="period"
                    value={formData.period}
                    onChange={handleInputChange}
                    placeholder="e.g., January 2026 or FY 2025-26"
                    required
                    suppressHydrationWarning
                    className="flex-1 rounded-lg border border-slate-600 bg-slate-700/50 px-4 py-2.5 text-white placeholder-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                  <VoiceInput
                    onResult={handleVoiceInput("period")}
                    language={formData.language}
                    className="px-3 py-2.5"
                  />
                </div>
              </div>

              {/* Due Date */}
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-300">
                  Due Date
                </label>
                <input
                  type="date"
                  name="dueDate"
                  value={formData.dueDate}
                  onChange={handleInputChange}
                  suppressHydrationWarning
                  className="w-full rounded-lg border border-slate-600 bg-slate-700/50 px-4 py-2.5 text-white focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              {/* Consequence */}
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-300">
                  Consequence (optional)
                </label>
                <div className="flex gap-2">
                  <textarea
                    name="consequence"
                    value={formData.consequence}
                    onChange={handleInputChange}
                    placeholder="e.g., Late fee of ₹50 per day"
                    rows={2}
                    suppressHydrationWarning
                    className="flex-1 resize-none rounded-lg border border-slate-600 bg-slate-700/50 px-4 py-2.5 text-white placeholder-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                  <VoiceInput
                    onResult={handleVoiceInput("consequence")}
                    language={formData.language}
                    className="px-3 py-2.5 self-start"
                  />
                </div>
              </div>

              {/* Letter Header Section */}
              <div className="border-t border-slate-700 pt-5">
                <h3 className="mb-4 text-sm font-semibold text-slate-200">Letter Header</h3>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-300">
                      Place
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        name="place"
                        value={formData.place}
                        onChange={handleInputChange}
                        placeholder="e.g., Chennai"
                        suppressHydrationWarning
                        className="flex-1 rounded-lg border border-slate-600 bg-slate-700/50 px-4 py-2.5 text-white placeholder-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                      />
                      <VoiceInput
                        onResult={handleVoiceInput("place")}
                        language={formData.language}
                        className="px-3 py-2.5"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-300">
                      Letter Date
                    </label>
                    <input
                      type="date"
                      name="letterDate"
                      value={formData.letterDate}
                      onChange={handleInputChange}
                      suppressHydrationWarning
                      className="w-full rounded-lg border border-slate-600 bg-slate-700/50 px-4 py-2.5 text-white focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    />
                  </div>
                </div>
              </div>

              {/* Signature Section */}
              <div className="border-t border-slate-700 pt-5">
                <h3 className="mb-4 text-sm font-semibold text-slate-200">Signature Details</h3>
                <div className="space-y-4">
                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-300">
                      Signer Name
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        name="signerName"
                        value={formData.signerName}
                        onChange={handleInputChange}
                        placeholder="e.g., CA John Smith"
                        suppressHydrationWarning
                        className="flex-1 rounded-lg border border-slate-600 bg-slate-700/50 px-4 py-2.5 text-white placeholder-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                      />
                      <VoiceInput
                        onResult={handleVoiceInput("signerName")}
                        language={formData.language}
                        className="px-3 py-2.5"
                      />
                    </div>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className="mb-2 block text-sm font-medium text-slate-300">
                        Designation
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          name="designation"
                          value={formData.designation}
                          onChange={handleInputChange}
                          placeholder="e.g., Partner"
                          suppressHydrationWarning
                          className="flex-1 rounded-lg border border-slate-600 bg-slate-700/50 px-4 py-2.5 text-white placeholder-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                        />
                        <VoiceInput
                          onResult={handleVoiceInput("designation")}
                          language={formData.language}
                          className="px-3 py-2.5"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="mb-2 block text-sm font-medium text-slate-300">
                        Firm Name
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          name="firmName"
                          value={formData.firmName}
                          onChange={handleInputChange}
                          placeholder="e.g., ABC & Associates"
                          suppressHydrationWarning
                          className="flex-1 rounded-lg border border-slate-600 bg-slate-700/50 px-4 py-2.5 text-white placeholder-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                        />
                        <VoiceInput
                          onResult={handleVoiceInput("firmName")}
                          language={formData.language}
                          className="px-3 py-2.5"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Digital Signature */}
                  <SignaturePad
                    onSave={handleSignatureSave}
                    onClear={handleSignatureClear}
                    savedSignature={formData.digitalSignature}
                  />
                </div>
              </div>

              {/* Tone and Language */}
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-300">
                    Tone
                  </label>
                  <select
                    name="tone"
                    value={formData.tone}
                    onChange={handleInputChange}
                    suppressHydrationWarning
                    className="w-full rounded-lg border border-slate-600 bg-slate-700/50 px-4 py-2.5 text-white focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  >
                    {TONES.map((tone) => (
                      <option key={tone} value={tone}>
                        {tone}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-300">
                    Language
                  </label>
                  <select
                    name="language"
                    value={formData.language}
                    onChange={handleInputChange}
                    suppressHydrationWarning
                    className="w-full rounded-lg border border-slate-600 bg-slate-700/50 px-4 py-2.5 text-white focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  >
                    {LANGUAGES.map((lang) => (
                      <option key={lang} value={lang}>
                        {lang}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Voice Dictation Section */}
              <div className="border-t border-slate-700 pt-5">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
                    <svg className="h-4 w-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                    </svg>
                    Voice Dictation
                  </h3>
                  <span className="text-xs text-slate-500">Optional</span>
                </div>
                <p className="text-xs text-slate-400 mb-3">
                  Speak additional instructions or specific content you want in the letter
                </p>
                <div className="flex gap-2">
                  <textarea
                    name="additionalInstructions"
                    value={formData.additionalInstructions}
                    onChange={handleInputChange}
                    placeholder="Click the microphone and dictate: e.g., 'Please mention that this is a second reminder' or 'Add a note about penalty waiver request'"
                    rows={3}
                    suppressHydrationWarning
                    className="flex-1 resize-none rounded-lg border border-slate-600 bg-slate-700/50 px-4 py-2.5 text-white placeholder-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 text-sm"
                  />
                  <div className="flex flex-col gap-2">
                    <VoiceInput
                      onResult={handleDictationInput}
                      language={formData.language}
                      className="px-4 py-4 flex-1"
                    />
                    {formData.additionalInstructions && (
                      <button
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, additionalInstructions: "" }))}
                        className="px-2 py-1 text-xs text-slate-400 hover:text-red-400 transition-colors"
                        title="Clear dictation"
                      >
                        Clear
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Buttons */}
              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  disabled={isLoading}
                  suppressHydrationWarning
                  className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-emerald-500 to-teal-600 px-6 py-3 font-medium text-white transition-all hover:from-emerald-600 hover:to-teal-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isLoading ? (
                    <>
                      <svg
                        className="h-5 w-5 animate-spin"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        />
                      </svg>
                      Generating...
                    </>
                  ) : (
                    <>
                      <svg
                        className="h-5 w-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M13 10V3L4 14h7v7l9-11h-7z"
                        />
                      </svg>
                      Generate Letter
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={handleReset}
                  suppressHydrationWarning
                  className="rounded-lg border border-slate-600 px-4 py-3 font-medium text-slate-300 transition-colors hover:bg-slate-700"
                >
                  Reset
                </button>
              </div>
            </form>
          </div>

          {/* Output Section */}
          <div className="rounded-2xl border border-slate-700/50 bg-slate-800/50 p-6 backdrop-blur-sm">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <h2 className="text-lg font-semibold text-white">
                  Generated Letter
                </h2>
                {generatedLetter && (
                  <TextToSpeech text={generatedLetter} language={formData.language} />
                )}
              </div>
            </div>
            {generatedLetter && (
              <div className="mb-4 flex flex-wrap items-center gap-2">
                {isEditing ? (
                    <button
                      onClick={handleSaveEdit}
                      className="flex items-center gap-2 rounded-lg bg-emerald-600 px-3 py-1.5 text-sm text-white transition-colors hover:bg-emerald-700"
                    >
                      <svg
                        className="h-4 w-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                      Save
                    </button>
                  ) : (
                    <button
                      onClick={handleEdit}
                      className="flex items-center gap-2 rounded-lg border border-slate-600 px-3 py-1.5 text-sm text-slate-300 transition-colors hover:bg-slate-700"
                    >
                      <svg
                        className="h-4 w-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                        />
                      </svg>
                      Edit
                    </button>
                  )}
                  <button
                    onClick={handleCopy}
                    className={`flex items-center gap-2 rounded-lg border px-3 py-1.5 text-sm transition-all ${
                      copied
                        ? 'border-emerald-500 bg-emerald-600 text-white'
                        : 'border-slate-600 text-slate-300 hover:bg-slate-700'
                    }`}
                  >
                    {copied ? (
                      <svg
                        className="h-4 w-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                    ) : (
                      <svg
                        className="h-4 w-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                        />
                      </svg>
                    )}
                    {copied ? 'Copied!' : 'Copy'}
                  </button>
                  <button
                    onClick={handleSendEmail}
                    className="flex items-center gap-2 rounded-lg border border-slate-600 px-3 py-1.5 text-sm text-slate-300 transition-colors hover:bg-slate-700"
                  >
                    <svg
                      className="h-4 w-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                      />
                    </svg>
                    Email
                  </button>
                  <button
                    onClick={handleWhatsAppShare}
                    className="flex items-center gap-2 rounded-lg border border-green-600 bg-green-600 px-3 py-1.5 text-sm text-white transition-colors hover:bg-green-700"
                  >
                    <svg
                      className="h-4 w-4"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"
                      />
                    </svg>
                    WhatsApp
                  </button>
                  <button
                    onClick={handlePrintPreview}
                    className="flex items-center gap-2 rounded-lg border border-slate-600 px-3 py-1.5 text-sm text-slate-300 transition-colors hover:bg-slate-700"
                  >
                    <svg
                      className="h-4 w-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"
                      />
                    </svg>
                    Print
                  </button>
                  <button
                    onClick={handleDownloadPDF}
                    className="flex items-center gap-2 rounded-lg bg-emerald-600 px-3 py-1.5 text-sm text-white transition-colors hover:bg-emerald-700"
                  >
                    <svg
                      className="h-4 w-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                      />
                    </svg>
                    Download PDF
                  </button>
              </div>
            )}

            {error && (
              <div className="mb-4 rounded-lg border border-red-500/50 bg-red-500/10 p-4">
                <div className="flex items-start gap-3">
                  <svg
                    className="h-5 w-5 mt-0.5 text-red-400 flex-shrink-0"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <div className="flex-1">
                    <p className="text-red-400">{error}</p>
                    {error.includes("credits") && (
                      <Link
                        href="/pricing"
                        className="mt-2 inline-flex items-center gap-1 text-sm font-medium text-emerald-400 hover:text-emerald-300"
                      >
                        Upgrade your plan →
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            )}

            {generatedLetter ? (
              <div className="min-h-[500px] max-h-[calc(100vh-200px)] overflow-y-auto rounded-lg border border-slate-600 bg-slate-900/50 p-5">
                {isEditing ? (
                  <textarea
                    value={generatedLetter}
                    onChange={handleLetterChange}
                    className="w-full h-full min-h-[480px] bg-transparent text-sm leading-relaxed text-slate-200 resize-none focus:outline-none font-sans"
                  />
                ) : (
                  <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed text-slate-200">
                    {generatedLetter}
                  </pre>
                )}
              </div>
            ) : (
              <div className="flex min-h-[500px] flex-col items-center justify-center rounded-lg border border-dashed border-slate-600 bg-slate-900/30">
                <svg
                  className="mb-4 h-16 w-16 text-slate-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
                <p className="text-slate-500">
                  Fill in the details and click Generate Letter
                </p>
                <p className="mt-1 text-sm text-slate-600">
                  Your AI-generated reminder will appear here
                </p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
