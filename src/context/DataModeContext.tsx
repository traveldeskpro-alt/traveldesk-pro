"use client";

// DataModeContext — controls which storage backend the data hooks use.
//
// Default (production): useLocalStorage = false → hooks use Supabase.
// Demo route tree:      useLocalStorage = true  → hooks use localStorage.
//
// The DataModeProvider is mounted exclusively inside src/app/demo/layout.tsx.
// Because React resolves context to the nearest ancestor provider, production
// pages rendered outside /demo/* always see the default (Supabase) value.

import React, { createContext, useContext } from "react";

// Maximum bookings a demo session may create. Enforced inside
// useDataStore.useBookings.create when useLocalStorage is true.
export const DEMO_BOOKING_LIMIT = 3;

interface DataModeContextType {
  useLocalStorage: boolean;
}

const DataModeContext = createContext<DataModeContextType>({
  useLocalStorage: false,
});

export function DataModeProvider({ children }: { children: React.ReactNode }) {
  return (
    <DataModeContext.Provider value={{ useLocalStorage: true }}>
      {children}
    </DataModeContext.Provider>
  );
}

export function useDataMode(): DataModeContextType {
  return useContext(DataModeContext);
}
