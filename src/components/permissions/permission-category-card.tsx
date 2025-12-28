// src/components/permissions/permission-category-card.tsx
"use client";

import { Shield, Info } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { categoryLabels, categoryDescriptions, type PermissionCategory } from "@/lib/utils/permission-filter";

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

interface PermissionCategoryCardProps {
  category: PermissionCategory;
  permissions: Permission[];
  onPermissionToggle: (permissionId: string, allowed: boolean) => void;
  isLoading?: boolean;
  readOnly?: boolean;
}

export function PermissionCategoryCard({
  category,
  permissions,
  onPermissionToggle,
  isLoading = false,
  readOnly = false,
}: PermissionCategoryCardProps) {
  const allowedCount = permissions.filter((p) => p.allowed).length;
  const overriddenCount = permissions.filter((p) => p.isOverridden).length;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Shield className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg">
                {categoryLabels[category]}
              </CardTitle>
              <CardDescription>
                {categoryDescriptions[category]}
              </CardDescription>
            </div>
          </div>
          <div className="flex gap-2">
            <Badge variant="outline">
              {allowedCount}/{permissions.length} Allowed
            </Badge>
            {overriddenCount > 0 && (
              <Badge variant="secondary">{overriddenCount} Custom</Badge>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {permissions.map((permission) => (
            <div
              key={permission.id}
              className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent/50 transition-colors"
            >
              <div className="flex-1 space-y-1">
                <div className="flex items-center gap-2">
                  <Label
                    htmlFor={`permission-${permission.id}`}
                    className="font-medium cursor-pointer"
                  >
                    {permission.label}
                  </Label>
                  {permission.isOverridden && (
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger>
                          <Badge variant="secondary" className="text-xs">
                            Custom
                          </Badge>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>This permission has been customized for this user</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  )}
                </div>
                {permission.description && (
                  <p className="text-sm text-muted-foreground flex items-center gap-1">
                    <Info className="h-3 w-3" />
                    {permission.description}
                  </p>
                )}
                <p className="text-xs text-muted-foreground">
                  Source: {permission.source === "role" ? "Role Default" : "User Override"}
                </p>
              </div>
              <Switch
                id={`permission-${permission.id}`}
                checked={permission.allowed}
                onCheckedChange={(checked) =>
                  onPermissionToggle(permission.id, checked)
                }
                disabled={isLoading || readOnly}
              />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
