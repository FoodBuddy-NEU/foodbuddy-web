import "./globals.css";
import type { Metadata } from "next";
import { AuthProvider } from "@/lib/AuthProvider";
import { ThemeProvider } from "@/lib/ThemeProvider";
import Header from "@/components/Header";

export const metadata: Metadata = {
  title: "FoodBuddy",
  description: "Find restaurants, deals, and more",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <ThemeProvider>
          <AuthProvider>
            <Header />
            {/* Page content */}
            {children}
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}