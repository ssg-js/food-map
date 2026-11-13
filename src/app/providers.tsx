"use client";

import { SessionGuard } from "@/features/auth/SessionGuard";
import { QueryClientProvider } from "@tanstack/react-query";
import { useState, type ReactNode } from "react";

import { createQueryClient } from "@/shared/lib/query-client";

export function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(() => createQueryClient());

  return (
    <QueryClientProvider client={queryClient}><SessionGuard/>{children}</QueryClientProvider>
  );
}
