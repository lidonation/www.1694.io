"use client";
import { CardanoProvider } from "./walletContext";
import { DRepProvider } from "./drepContext";
import QueryProvider from "./queryClientProvider";

export function AppContextProvider({ children }) {
  return (
    <QueryProvider>
      <DRepProvider>
        <CardanoProvider>{children}</CardanoProvider>
      </DRepProvider>
    </QueryProvider>
  );
}
