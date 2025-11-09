import { NextRequest, NextResponse } from "next/server";
import { initializeApp, getApps, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import * as fs from "fs";
import * as path from "path";

interface FeedbackRequest {
  restaurantId: string;
  restaurantName: string;
  userEmail: string;
  userName: string;
  feedbackType: "menu" | "contact-info";
  feedbackContent: string;
}

// Initialize Firebase Admin
let db: ReturnType<typeof getFirestore> | null = null;

try {
  if (getApps().length === 0) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let serviceAccountKey: any = null;

    // Try to get service account from environment variable first
    if (process.env.FIREBASE_SERVICE_ACCOUNT) {
      try {
        serviceAccountKey = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
        console.log("Using FIREBASE_SERVICE_ACCOUNT from environment variable");
      } catch (e) {
        console.error("Failed to parse FIREBASE_SERVICE_ACCOUNT:", e);
      }
    }

    // Fall back to local file if env var not available
    if (!serviceAccountKey) {
      try {
        const keyPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
        if (keyPath) {
          // If it's a file path, read the file
          if (keyPath.startsWith("./") || keyPath.startsWith("/")) {
            const resolvedPath = keyPath.startsWith("/")
              ? keyPath
              : path.join(process.cwd(), keyPath);
            const keyFile = fs.readFileSync(resolvedPath, "utf8");
            serviceAccountKey = JSON.parse(keyFile);
            console.log("Using GOOGLE_APPLICATION_CREDENTIALS from file");
          } else {
            // Assume it's a JSON string
            serviceAccountKey = JSON.parse(keyPath);
            console.log("Using GOOGLE_APPLICATION_CREDENTIALS as JSON string");
          }
        }
      } catch (e) {
        console.error("Failed to load service account key:", e);
      }
    }

    if (serviceAccountKey) {
      initializeApp({
        credential: cert(serviceAccountKey),
      });
      console.log("Firebase Admin SDK initialized successfully");
    } else {
      console.error(
        "No Firebase service account credentials found. Set FIREBASE_SERVICE_ACCOUNT or GOOGLE_APPLICATION_CREDENTIALS."
      );
    }
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
