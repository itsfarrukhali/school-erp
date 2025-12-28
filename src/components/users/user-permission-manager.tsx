// src/components/users/user-permission-manager.tsx
"use client";

import { useState, useEffect } from "react";
import { Loader2, Shield, Check, X, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { usersApi, type Permission } from "@/lib/api/users";
import { cn } from "@/lib/utils";

interface UserPermissionManagerProps {
  userId: string;
  onClose?: () => void;
}

interface PermissionChange {
  permissionId: string;
  allowed: boolean;
}

export function UserPermissionManager({
  userId,
  onClose,
}: UserPermissionManagerProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [userData, setUserData] = useState<{
    id: string;
    uid: string;
    fullName: string;
    email: string;
    role: string;
  } | null>(null);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [groupedPermissions, setGroupedPermissions] = useState<
    Record<string, Permission[]>
  >({});
  const [changes, setChanges] = useState<Map<string, boolean>>(new Map());
  const [summary, setSummary] = useState({
    total: 0,
    allowed: 0,
    denied: 0,
    overridden: 0,
  });

  // Fetch user permissions
  useEffect(() => {
    const fetchPermissions = async () => {
      try {
        const response = await usersApi.getUserPermissions(userId);
        if (response.success && response.data) {
          setUserData(response.data.user);
          setPermissions(response.data.permissions);
          setGroupedPermissions(response.data.groupedPermissions);
          setSummary(response.data.summary);
        }
      } catch (error) {
        console.error("Error fetching permissions:", error);
        toast.error("Failed to load permissions");
      } finally {
        setIsLoading(false);
      }
    };
    fetchPermissions();
  }, [userId]);

  const handleTogglePermission = (
    permissionId: string,
    currentAllowed: boolean
  ) => {
    const newAllowed = !currentAllowed;

    // Track the change
    setChanges((prev) => {
      const updated = new Map(prev);
      const originalPerm = permissions.find((p) => p.id === permissionId);

      // If toggling back to original state, remove from changes
      if (originalPerm && originalPerm.allowed === newAllowed) {
        updated.delete(permissionId);
      } else {
        updated.set(permissionId, newAllowed);
      }
      return updated;
    });

    // Update local state for immediate UI feedback
    setPermissions((prev) =>
      prev.map((p) =>
        p.id === permissionId
          ? { ...p, allowed: newAllowed, isOverridden: true }
          : p
      )
    );

    // Update grouped permissions
    setGroupedPermissions((prev) => {
      const updated = { ...prev };
      for (const category of Object.keys(updated)) {
        updated[category] = updated[category].map((p) =>
          p.id === permissionId
            ? { ...p, allowed: newAllowed, isOverridden: true }
            : p
        );
      }
      return updated;
    });
  };

  const handleSaveChanges = async () => {
    if (changes.size === 0) {
      toast.info("No changes to save");
      return;
    }

    setIsSaving(true);
    try {
      // Build the full permission list with changes applied
      const permissionUpdates: PermissionChange[] = permissions.map((p) => ({
        permissionId: p.id,
        allowed: changes.has(p.id) ? changes.get(p.id)! : p.allowed,
      }));

      await usersApi.updateUserPermissions(userId, {
        userId,
        permissions: permissionUpdates,
      });

      toast.success("Permissions Updated", {
        description: `${changes.size} permission(s) updated successfully.`,
      });
      setChanges(new Map());
      onClose?.();
    } catch (error) {
      toast.error("Failed to update permissions", {
        description:
          error instanceof Error ? error.message : "Please try again",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleResetChanges = () => {
    setChanges(new Map());
    // Re-fetch to reset all changes
    setIsLoading(true);
    usersApi.getUserPermissions(userId).then((response) => {
      if (response.success && response.data) {
        setPermissions(response.data.permissions);
        setGroupedPermissions(response.data.groupedPermissions);
        setSummary(response.data.summary);
      }
      setIsLoading(false);
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader className="space-y-1">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-primary/10">
              <Shield className="h-6 w-6 text-primary" />
            </div>
            <div>
              <CardTitle className="text-xl">Manage Permissions</CardTitle>
              <CardDescription>
                {userData?.fullName} ({userData?.role})
              </CardDescription>
            </div>
          </div>
          {changes.size > 0 && (
            <Badge variant="secondary" className="text-sm">
              {changes.size} unsaved change{changes.size > 1 ? "s" : ""}
            </Badge>
          )}
        </div>

        {/* Summary Stats */}
        <div className="flex gap-4 pt-4">
          <div className="flex items-center gap-1.5 text-sm">
            <div className="h-2 w-2 rounded-full bg-green-500" />
            <span className="text-muted-foreground">
              Allowed: <strong>{summary.allowed}</strong>
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-sm">
            <div className="h-2 w-2 rounded-full bg-red-500" />
            <span className="text-muted-foreground">
              Denied: <strong>{summary.denied}</strong>
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-sm">
            <div className="h-2 w-2 rounded-full bg-blue-500" />
            <span className="text-muted-foreground">
              Custom: <strong>{summary.overridden}</strong>
            </span>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <Accordion type="multiple" className="w-full">
          {Object.entries(groupedPermissions).map(([category, perms]) => (
            <AccordionItem key={category} value={category}>
              <AccordionTrigger className="hover:no-underline">
                <div className="flex items-center gap-2">
                  <span className="font-semibold">{category}</span>
                  <Badge variant="outline" className="text-xs">
                    {perms.filter((p) => p.allowed).length}/{perms.length}
                  </Badge>
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <div className="space-y-3 pl-2">
                  {perms.map((permission) => {
                    const hasChange = changes.has(permission.id);
                    return (
                      <div
                        key={permission.id}
                        className={cn(
                          "flex items-center justify-between p-3 rounded-lg border transition-colors",
                          hasChange
                            ? "bg-yellow-50 border-yellow-200 dark:bg-yellow-950/20 dark:border-yellow-900"
                            : "bg-muted/30"
                        )}
                      >
                        <div className="flex-1 space-y-1">
                          <div className="flex items-center gap-2">
                            <Label
                              htmlFor={permission.id}
                              className="font-medium cursor-pointer"
                            >
                              {permission.label}
                            </Label>
                            {permission.isOverridden && (
                              <Badge
                                variant="secondary"
                                className="text-xs bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300"
                              >
                                Custom
                              </Badge>
                            )}
                            {permission.source === "role" &&
                              !permission.isOverridden && (
                                <Badge
                                  variant="secondary"
                                  className="text-xs bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400"
                                >
                                  Role Default
                                </Badge>
                              )}
                            {hasChange && (
                              <Badge
                                variant="secondary"
                                className="text-xs bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300"
                              >
                                Modified
                              </Badge>
                            )}
                          </div>
                          {permission.description && (
                            <p className="text-xs text-muted-foreground">
                              {permission.description}
                            </p>
                          )}
                        </div>
                        <div className="flex items-center gap-3">
                          {permission.allowed ? (
                            <Check className="h-4 w-4 text-green-500" />
                          ) : (
                            <X className="h-4 w-4 text-red-500" />
                          )}
                          <Switch
                            id={permission.id}
                            checked={permission.allowed}
                            onCheckedChange={() =>
                              handleTogglePermission(
                                permission.id,
                                permission.allowed
                              )
                            }
                            disabled={isSaving}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>

        {/* Action Buttons */}
        <div className="flex justify-between items-center pt-4 border-t">
          <Button
            variant="outline"
            onClick={handleResetChanges}
            disabled={changes.size === 0 || isSaving}
          >
            <RotateCcw className="mr-2 h-4 w-4" />
            Reset Changes
          </Button>
          <div className="flex gap-2">
            {onClose && (
              <Button variant="outline" onClick={onClose} disabled={isSaving}>
                Cancel
              </Button>
            )}
            <Button
              onClick={handleSaveChanges}
              disabled={changes.size === 0 || isSaving}
            >
              {isSaving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Shield className="mr-2 h-4 w-4" />
                  Save Permissions
                </>
              )}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
