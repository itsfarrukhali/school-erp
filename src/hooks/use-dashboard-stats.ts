// src/hooks/use-dashboard-stats.ts
"use client";

import { useQuery } from "@tanstack/react-query";
import { useCurrentUser } from "./use-auth";

export function useDashboardStats() {
  const user = useCurrentUser();

  return useQuery({
    queryKey: ["dashboard-stats", user?.id],
    queryFn: async () => {
      // This would be an actual API call in production
      return {
        totalUsers: 150,
        activeStudents: 120,
        totalTeachers: 25,
        pendingApprovals: 5,
      };
    },
    enabled: !!user,
  });
}
