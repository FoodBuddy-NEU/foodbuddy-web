import { NextResponse } from "next/server";
import cloudinary from "@/lib/cloudinary";

export async function GET() {
  try {
    // Try to get Cloudinary configuration
    const config = cloudinary.config();
    
    // Test connection by listing first few resources
    const result = await cloudinary.api.resources({
      type: "upload",
      max_results: 1,
    });

    return NextResponse.json({
      success: true,
      config: {
        cloud_name: config.cloud_name,
        api_key: config.api_key ? "present" : "missing",
        api_secret: config.api_secret ? "present" : "missing",
      },
      resources: result.resources,
    });
  } catch (err) {
    console.error("Cloudinary test failed:", err);
    return NextResponse.json({
      success: false,
      error: String(err),
      config: cloudinary.config(),
    }, { status: 500 });
  }
}