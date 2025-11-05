import { NextRequest, NextResponse } from "next/server";
import { initializeApp, getApps, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

interface FeedbackRequest {
  restaurantId: string;
  restaurantName: string;
  userEmail: string;
  userName: string;
  feedbackType: "menu" | "contact-info";
  feedbackContent: string;
}

// Initialize Firebase Admin
let db: any;

try {
  if (getApps().length === 0) {
    const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
    
    initializeApp({
      projectId,
      // Firebase Admin SDK will use application default credentials
      // Or you can provide a service account key path
    });
  }
  db = getFirestore();
} catch (error) {
  console.error("Firebase initialization error:", error);
}

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

    // Check if Firestore is initialized
    if (!db) {
      console.error("Firestore not initialized");
      return NextResponse.json(
        { error: "Database service not available" },
        { status: 500 }
      );
    }

    // Store feedback in Firestore
    const feedbackData = {
      restaurantId,
      restaurantName,
      userEmail,
      userName,
      feedbackType,
      feedbackContent,
      createdAt: new Date().toISOString(),
      timestamp: Math.floor(Date.now() / 1000),
    };

    console.log("Storing feedback in Firestore...", feedbackData);

    const docRef = await db.collection("feedback").add(feedbackData);

    console.log("Feedback stored successfully with ID:", docRef.id);

    return NextResponse.json(
      { 
        success: true, 
        message: "Feedback submitted successfully",
        feedbackId: docRef.id
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Feedback submission error:", error);
    return NextResponse.json(
      { 
        error: "Failed to submit feedback", 
        details: error instanceof Error ? error.message : String(error) 
      },
      { status: 500 }
    );
  }
}
