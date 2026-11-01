"use client";

import { createContext, useContext } from "react";

export const DashboardHeaderActionsContext = createContext<HTMLDivElement | null>(null);

export function useDashboardHeaderActionsTarget() {
  return useContext(DashboardHeaderActionsContext);
}
