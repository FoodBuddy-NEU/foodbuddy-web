import { NextRequest, NextResponse } from "next/server";
import nodemailer from "nodemailer";

interface FeedbackRequest {
  restaurantId: string;
  restaurantName: string;
  userEmail: string;
  userName: string;
  feedbackType: "menu" | "contact-info";
  feedbackContent: string;
}

// Configure nodemailer transporter
// For production, use environment variables for credentials
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER?.trim(),
    pass: process.env.EMAIL_PASSWORD?.trim(),
  },
});

export async function POST(request: NextRequest) {
  try {
    const body: FeedbackRequest = await request.json();

    const {
      restaurantId,
      restaurantName,
      userEmail,
      userName,
      feedbackType,
      feedbackContent,
    } = body;

    // Validate required fields
    if (
      !restaurantId ||
      !restaurantName ||
      !userEmail ||
      !userName ||
      !feedbackType ||
      !feedbackContent
    ) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Check if email credentials are configured
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
      console.error("Email credentials not configured in environment variables");
      return NextResponse.json(
        { error: "Email service not configured" },
        { status: 500 }
      );
    }

    // Prepare email content
    const subject = `FoodBuddy Feedback - ${feedbackType === "menu" ? "Menu" : "Contact Info"} for ${restaurantName}`;

    const emailContent = `
      <h2>New Feedback Received</h2>
      <p><strong>Feedback Type:</strong> ${feedbackType === "menu" ? "Menu" : "Contact Info"}</p>
      <p><strong>Restaurant:</strong> ${restaurantName} (ID: ${restaurantId})</p>
      <p><strong>User Name:</strong> ${userName}</p>
      <p><strong>User Email:</strong> ${userEmail}</p>
      <hr />
      <h3>Feedback Content:</h3>
      <p>${feedbackContent.replace(/\n/g, "<br />")}</p>
      <hr />
      <p><em>Submitted from FoodBuddy Application</em></p>
    `;

    console.log("Attempting to send feedback email...");
    console.log(`From: ${process.env.EMAIL_USER}`);
    console.log(`To: chen.yu25@northeastern.edu`);
    console.log(`Subject: ${subject}`);

    // Send email
    const result = await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: "chen.yu25@northeastern.edu",
      subject,
      html: emailContent,
      replyTo: userEmail,
    });

    console.log("Email sent successfully:", result);

    return NextResponse.json(
      { success: true, message: "Feedback submitted successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Feedback submission error:", error);
    return NextResponse.json(
      { error: "Failed to submit feedback", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
