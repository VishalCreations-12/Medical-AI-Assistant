"use client";

import { ThemeProvider } from "next-themes";
import { Toaster } from "sonner";
import type { ReactNode } from "react";
import { SessionProvider } from "@/hooks/session";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <SessionProvider>
        {children}
        <Toaster richColors closeButton position="top-center" />
      </SessionProvider>
    </ThemeProvider>
  );
}
