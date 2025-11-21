import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';
import { verificationCodes } from '@/lib/verificationStore';

const resend = new Resend(process.env.RESEND_API_KEY);

// WHY: Generate a 6-digit verification code
function generateCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// WHY: Send verification code via email using Resend
async function sendEmailWithCode(email: string, code: string): Promise<boolean> {
  try {
    // Use verified domain email or fallback to resend.dev in development
    const fromEmail = process.env.RESEND_FROM_EMAIL || 'FoodBuddy <onboarding@resend.dev>';
    
    const result = await resend.emails.send({
      from: fromEmail,
      to: email,
      subject: 'FoodBuddy - Email Verification Code',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #333; border-bottom: 2px solid #4F46E5; padding-bottom: 10px;">
            Email Verification
          </h2>
          <p style="color: #666; font-size: 16px; line-height: 1.5;">
            Thank you for using FoodBuddy! Please use the verification code below to verify your email address:
          </p>
          <div style="background-color: #F3F4F6; border-radius: 8px; padding: 20px; text-align: center; margin: 30px 0;">
            <h1 style="color: #4F46E5; font-size: 36px; letter-spacing: 8px; margin: 0;">
              ${code}
            </h1>
          </div>
          <p style="color: #666; font-size: 14px; line-height: 1.5;">
            This code will expire in <strong>10 minutes</strong>.
          </p>
          <p style="color: #666; font-size: 14px; line-height: 1.5;">
            If you didn't request this code, you can safely ignore this email.
          </p>
          <hr style="border: none; border-top: 1px solid #E5E7EB; margin: 30px 0;">
          <p style="color: #999; font-size: 12px; text-align: center;">
            FoodBuddy - Your Restaurant Discovery Platform
          </p>
        </div>
      `,
    });
    
    console.log(`✅ Verification code sent to ${email}`, result);
    return true;
  } catch (error) {
    console.error('❌ Error sending email with Resend:', error);
    // Log detailed error information
    if (error instanceof Error) {
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
    }
    return false;
  }
}

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email || !email.includes('@')) {
      return NextResponse.json(
        { error: 'Invalid email address' },
        { status: 400 }
      );
    }

    // Generate 6-digit code
    const code = generateCode();
    
    // Store code with 10-minute expiration
    verificationCodes.set(email, {
      code,
      timestamp: Date.now(),
    });

    // Send email (placeholder)
    const sent = await sendEmailWithCode(email, code);

    if (!sent) {
      return NextResponse.json(
        { error: 'Failed to send verification code' },
        { status: 500 }
      );
    }

    // Clean up expired codes (older than 10 minutes)
    const tenMinutesAgo = Date.now() - 10 * 60 * 1000;
    for (const [key, value] of verificationCodes.entries()) {
      if (value.timestamp < tenMinutesAgo) {
        verificationCodes.delete(key);
      }
    }

    return NextResponse.json({ 
      success: true,
      message: 'Verification code sent',
      // Show code in development for testing
      ...(process.env.NODE_ENV === 'development' && { code })
    });
  } catch (error) {
    console.error('Error sending verification code:', error);
    return NextResponse.json(
      { error: 'Failed to send verification code' },
      { status: 500 }
    );
  }
}
