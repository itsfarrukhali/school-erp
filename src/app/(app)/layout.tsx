"use client"
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { AppSidebar } from "@/components/dashboard/app-sidebar";
import { DashboardHeader } from "@/components/dashboard/header";
import { useAuth } from "@/hooks/use-auth";
import { LoadingSpinner } from "@/components/shared/loading-spinner";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/login");
    }
  }, [isAuthenticated, isLoading, router]);

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <DashboardHeader />
        <div className="flex-1 overflow-y-auto p-6">{children}</div>
      </SidebarInset>
    </SidebarProvider>
  );
}
