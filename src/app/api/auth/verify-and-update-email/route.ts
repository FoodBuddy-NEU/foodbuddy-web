import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/firebaseAdmin';
import { verificationCodes } from '@/lib/verificationStore';

export async function POST(request: NextRequest) {
  try {
    const { userId, newEmail, verificationCode } = await request.json();

    if (!userId || !newEmail || !verificationCode) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Check if verification code exists and is valid
    const stored = verificationCodes.get(newEmail);

    console.log('📧 Email verification attempt:', {
      newEmail,
      providedCode: verificationCode,
      storedCode: stored?.code,
      hasStored: !!stored,
      allCodes: Array.from(verificationCodes.keys()),
    });

    if (!stored) {
      return NextResponse.json(
        { error: 'No verification code found. Please request a new one.' },
        { status: 400 }
      );
    }

    // Check if code has expired (10 minutes)
    const tenMinutesAgo = Date.now() - 10 * 60 * 1000;
    if (stored.timestamp < tenMinutesAgo) {
      verificationCodes.delete(newEmail);
      return NextResponse.json(
        { error: 'Verification code has expired. Please request a new one.' },
        { status: 400 }
      );
    }

    // Verify the code (convert both to strings for comparison)
    if (stored.code !== String(verificationCode).trim()) {
      console.log('❌ Code mismatch:', {
        stored: stored.code,
        provided: String(verificationCode).trim(),
        storedType: typeof stored.code,
        providedType: typeof verificationCode,
      });
      return NextResponse.json({ error: 'Invalid verification code' }, { status: 400 });
    }

    // Code is valid, update user email in Firebase Auth
    try {
      await auth.updateUser(userId, {
        email: newEmail,
      });
    } catch (error) {
      console.error('Error updating Firebase Auth email:', error);
      return NextResponse.json(
        { error: 'Failed to update email in authentication system' },
        { status: 500 }
      );
    }

    // Clean up used verification code
    verificationCodes.delete(newEmail);

    return NextResponse.json({
      success: true,
      message: 'Email updated successfully',
    });
  } catch (error) {
    console.error('Error verifying and updating email:', error);
    return NextResponse.json({ error: 'Failed to update email' }, { status: 500 });
  }
}
