import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { ThemeProvider } from "@/components/theme-provider";

export const metadata: Metadata = {
  metadataBase: new URL("https://urbanslice.pk"),
  title: {
    default: "Urban Slice — Kabirwala | Pizza, Burgers, Wraps & More",
    template: "%s | Urban Slice",
  },
  description:
    "Urban Slice in Kabirwala — hand-tossed pizzas, crispy burgers, fresh wraps, broast, pasta & drinks. Free Home Delivery. Order on WhatsApp: 0305-2806919. New Lari Adda, Near Bank Al Habib, Jhang Road, Kabirwala.",
  keywords: [
    "Urban Slice",
    "Urban Slice Pizza",
    "pizza Kabirwala",
    "Kabirwala restaurant",
    "pizza delivery Kabirwala",
    "burgers Kabirwala",
    "broast Kabirwala",
    "wraps Kabirwala",
    "free home delivery Kabirwala",
    "best pizza Kabirwala",
  ],
  authors: [{ name: "Urban Slice" }],
  openGraph: {
    title: "Urban Slice — Kabirwala | Slice Into Happiness",
    description:
      "Hand-tossed pizzas, crispy burgers, fresh wraps & broast in Kabirwala. Free Home Delivery. Order on WhatsApp in seconds.",
    siteName: "Urban Slice",
    type: "website",
    locale: "en_PK",
  },
  twitter: {
    card: "summary_large_image",
    title: "Urban Slice — Kabirwala",
    description: "Pizza, burgers, wraps & broast in Kabirwala. Free home delivery. Order on WhatsApp.",
  },
  robots: { index: true, follow: true },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className="font-sans antialiased bg-background text-foreground"
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem={false}
          disableTransitionOnChange
        >
          {children}
          <Toaster />
          <Sonner />
        </ThemeProvider>
      </body>
    </html>
  );
}
