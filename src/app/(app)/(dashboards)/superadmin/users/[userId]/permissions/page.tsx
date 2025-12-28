// src/app/(app)/(dashboards)/superadmin/users/[userId]/permissions/page.tsx
"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Save, Shield, User, AlertCircle } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { PermissionCategoryCard } from "@/components/permissions/permission-category-card";
import { toast } from "sonner";
import { type PermissionCategory } from "@/lib/utils/permission-filter";

interface Permission {
  id: string;
  name: string;
  label: string;
  category: string | null;
  description?: string | null;
  allowed: boolean;
  source: "role" | "user";
  isOverridden: boolean;
}

interface UserData {
  id: string;
  uid: string;
  fullName: string;
  email: string;
  role: string;
}

interface PermissionsData {
  user: UserData;
  permissions: Permission[];
  groupedPermissions: Record<string, Permission[]>;
  summary: {
    total: number;
    allowed: number;
    denied: number;
    overridden: number;
  };
}

export default function UserPermissionsPage({
  params,
}: {
  params: Promise<{ userId: string }>;
}) {
  const router = useRouter();
  const { userId } = use(params);
  const [data, setData] = useState<PermissionsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [changedPermissions, setChangedPermissions] = useState<
    Map<string, boolean>
  >(new Map());

  useEffect(() => {
    fetchPermissions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  const fetchPermissions = async () => {
    try {
      const response = await fetch(`/api/v1/users/${userId}/permissions`);
      const result = await response.json();

      if (result.success) {
        setData(result.data);
      } else {
        toast.error("Failed to load permissions", {
          description: result.message,
        });
      }
    } catch (error) {
      console.error("Error fetching permissions:", error);
      toast.error("Error loading permissions");
    } finally {
      setIsLoading(false);
    }
  };

  const handlePermissionToggle = (permissionId: string, allowed: boolean) => {
    if (!data) return;

    // Update local state
    const updatedPermissions = data.permissions.map((p) =>
      p.id === permissionId ? { ...p, allowed, isOverridden: true } : p
    );

    const updatedGrouped = Object.entries(data.groupedPermissions).reduce(
      (acc, [category, perms]) => {
        acc[category] = perms.map((p) =>
          p.id === permissionId ? { ...p, allowed, isOverridden: true } : p
        );
        return acc;
      },
      {} as Record<string, Permission[]>
    );

    setData({
      ...data,
      permissions: updatedPermissions,
      groupedPermissions: updatedGrouped,
    });

    // Track changes
    setChangedPermissions(
      new Map(changedPermissions.set(permissionId, allowed))
    );
  };

  const handleSave = async () => {
    if (changedPermissions.size === 0) {
      toast.info("No changes to save");
      return;
    }

    setIsSaving(true);
    try {
      const updates = Array.from(changedPermissions.entries()).map(
        ([permissionId, allowed]) => ({
          permissionId,
          allowed,
        })
      );

      const response = await fetch(`/api/v1/users/${userId}/permissions`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ permissions: updates }),
      });

      const result = await response.json();

      if (result.success) {
        toast.success("Permissions updated successfully");
        setChangedPermissions(new Map());
        fetchPermissions(); // Refresh data
      } else {
        toast.error("Failed to update permissions", {
          description: result.message,
        });
      }
    } catch (error) {
      console.error("Error saving permissions:", error);
      toast.error("Error saving permissions");
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = () => {
    fetchPermissions();
    setChangedPermissions(new Map());
    toast.info("Changes discarded");
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Shield className="h-12 w-12 mx-auto mb-4 opacity-50 animate-pulse" />
          <p className="text-muted-foreground">Loading permissions...</p>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="space-y-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Failed to load user permissions. Please try again.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <PageHeader
          title={`Permissions for ${data.user.fullName}`}
          description={`Manage permissions for ${data.user.email} (${data.user.role})`}
        >
          <div className="flex gap-2">
            {changedPermissions.size > 0 && (
              <>
                <Button
                  variant="outline"
                  onClick={handleReset}
                  disabled={isSaving}
                >
                  Discard Changes
                </Button>
                <Button onClick={handleSave} disabled={isSaving}>
                  <Save className="mr-2 h-4 w-4" />
                  Save {changedPermissions.size} Change
                  {changedPermissions.size !== 1 ? "s" : ""}
                </Button>
              </>
            )}
          </div>
        </PageHeader>
      </div>

      {/* User Info Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <User className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle>{data.user.fullName}</CardTitle>
                <CardDescription>{data.user.email}</CardDescription>
              </div>
            </div>
            <Badge variant="outline" className="text-sm">
              {data.user.role}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-3 border rounded-lg">
              <div className="text-2xl font-bold">{data.summary.total}</div>
              <div className="text-sm text-muted-foreground">Total</div>
            </div>
            <div className="text-center p-3 border rounded-lg bg-green-50 dark:bg-green-950">
              <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                {data.summary.allowed}
              </div>
              <div className="text-sm text-muted-foreground">Allowed</div>
            </div>
            <div className="text-center p-3 border rounded-lg bg-red-50 dark:bg-red-950">
              <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                {data.summary.denied}
              </div>
              <div className="text-sm text-muted-foreground">Denied</div>
            </div>
            <div className="text-center p-3 border rounded-lg bg-blue-50 dark:bg-blue-950">
              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                {data.summary.overridden}
              </div>
              <div className="text-sm text-muted-foreground">Custom</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Permission Categories */}
      <div className="space-y-4">
        {Object.entries(data.groupedPermissions).map(
          ([category, permissions]) => (
            <PermissionCategoryCard
              key={category}
              category={category as PermissionCategory}
              permissions={permissions}
              onPermissionToggle={handlePermissionToggle}
              isLoading={isSaving}
            />
          )
        )}
      </div>

      {/* Sticky Save Bar */}
      {changedPermissions.size > 0 && (
        <div className="fixed bottom-0 left-0 right-0 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 p-4 z-50">
          <div className="container flex items-center justify-between max-w-5xl mx-auto">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-orange-500" />
              <span className="font-medium">
                You have {changedPermissions.size} unsaved change
                {changedPermissions.size !== 1 ? "s" : ""}
              </span>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={handleReset}
                disabled={isSaving}
              >
                Discard
              </Button>
              <Button onClick={handleSave} disabled={isSaving}>
                <Save className="mr-2 h-4 w-4" />
                Save Changes
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
