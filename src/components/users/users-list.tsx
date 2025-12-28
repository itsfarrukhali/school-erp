// src/components/users/users-list.tsx
"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Loader2,
  Search,
  MoreHorizontal,
  Shield,
  UserCog,
  Power,
  Eye,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "sonner";
import { usersApi, type User } from "@/lib/api/users";
import { UserPermissionManager } from "./user-permission-manager";
import { cn } from "@/lib/utils";
import { Role, Status } from "@prisma/client";

interface UsersListProps {
  schoolId?: string;
  campusId?: string;
  filterRole?: Role;
  showPermissionManager?: boolean;
}

const roleColors: Record<Role, string> = {
  SUPERADMIN:
    "bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300",
  ADMIN:
    "bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-300",
  PRINCIPAL: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300",
  SCHOOLADMIN: "bg-cyan-100 text-cyan-700 dark:bg-cyan-900 dark:text-cyan-300",
  CAMPUSHEAD: "bg-teal-100 text-teal-700 dark:bg-teal-900 dark:text-teal-300",
  ACCOUNTANT:
    "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300",
  ADMISSIONOFFICER:
    "bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300",
  COMPUTEROPERATOR:
    "bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300",
  TEACHER:
    "bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300",
  PARENT: "bg-pink-100 text-pink-700 dark:bg-pink-900 dark:text-pink-300",
  STUDENT: "bg-rose-100 text-rose-700 dark:bg-rose-900 dark:text-rose-300",
};

const statusColors: Record<Status, string> = {
  ACTIVE: "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300",
  INACTIVE: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
  SUSPENDED: "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300",
  DELETED: "bg-red-200 text-red-800 dark:bg-red-950 dark:text-red-300",
};

const roleLabels: Record<Role, string> = {
  SUPERADMIN: "Super Admin",
  ADMIN: "Admin",
  PRINCIPAL: "Principal",
  SCHOOLADMIN: "School Admin",
  CAMPUSHEAD: "Campus Head",
  ACCOUNTANT: "Accountant",
  ADMISSIONOFFICER: "Admission Officer",
  COMPUTEROPERATOR: "Operator",
  TEACHER: "Teacher",
  PARENT: "Parent",
  STUDENT: "Student",
};

export function UsersList({
  schoolId,
  campusId,
  filterRole,
  showPermissionManager = true,
}: UsersListProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [users, setUsers] = useState<User[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<Role | "">("");
  const [statusFilter, setStatusFilter] = useState<Status | "">("");
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [showPermissions, setShowPermissions] = useState(false);

  const fetchUsers = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await usersApi.getUsers({
        page,
        limit: 10,
        search,
        role: filterRole || (roleFilter as Role) || undefined,
        schoolId,
        campusId,
        status: (statusFilter as Status) || undefined,
      });

      if (response.success && response.data) {
        setUsers(response.data.data);
        setTotalPages(response.data.pagination.totalPages);
        setTotal(response.data.pagination.total);
      } else {
        setUsers([]);
        setTotalPages(1);
        setTotal(0);
      }
    } catch (error) {
      console.error("Error fetching users:", error);
      toast.error("Failed to load users");
      setUsers([]);
      setTotalPages(1);
      setTotal(0);
    } finally {
      setIsLoading(false);
    }
  }, [page, search, roleFilter, statusFilter, schoolId, campusId, filterRole]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // Debounced search - reset to page 1 when search changes
  useEffect(() => {
    const timer = setTimeout(() => {
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]); // Only trigger on search change, not page change

  const handleStatusChange = async (userId: string, newStatus: Status) => {
    try {
      await usersApi.updateUserStatus(userId, newStatus);
      toast.success("Status Updated", {
        description: `User status changed to ${newStatus}`,
      });
      fetchUsers();
    } catch (error) {
      toast.error("Failed to update status", {
        description:
          error instanceof Error ? error.message : "Please try again",
      });
    }
  };

  const openPermissions = (userId: string) => {
    setSelectedUserId(userId);
    setShowPermissions(true);
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name, email, or username..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        {!filterRole && (
          <Select
            value={roleFilter}
            onValueChange={(value) => {
              setRoleFilter(value === "all" ? "" : (value as Role | ""));
              setPage(1);
            }}
          >
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Filter by role" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Roles</SelectItem>
              {Object.entries(roleLabels).map(([role, label]) => (
                <SelectItem key={role} value={role}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
        <Select
          value={statusFilter}
          onValueChange={(value) => {
            setStatusFilter(value === "all" ? "" : (value as Status | ""));
            setPage(1);
          }}
        >
          <SelectTrigger className="w-full sm:w-[150px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="ACTIVE">Active</SelectItem>
            <SelectItem value="INACTIVE">Inactive</SelectItem>
            <SelectItem value="SUSPENDED">Suspended</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Results count */}
      <div className="text-sm text-muted-foreground">
        Showing {users.length} of {total} users
      </div>

      {/* Table */}
      <div className="rounded-lg border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>School</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Last Login</TableHead>
              <TableHead className="w-[60px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6} className="h-32 text-center">
                  <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                </TableCell>
              </TableRow>
            ) : users.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-32 text-center">
                  <p className="text-muted-foreground">No users found</p>
                </TableCell>
              </TableRow>
            ) : (
              users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-9 w-9">
                        <AvatarImage src={user.avatarUrl} />
                        <AvatarFallback className="bg-primary/10 text-primary text-xs">
                          {getInitials(user.fullName)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">{user.fullName}</p>
                        <p className="text-xs text-muted-foreground">
                          {user.email}
                        </p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className={cn("font-normal", roleColors[user.role])}>
                      {roleLabels[user.role]}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {user.schools.length > 0 ? (
                      <span className="text-sm">
                        {user.schools[0].school.name}
                        {user.schools.length > 1 && (
                          <span className="text-muted-foreground">
                            {" "}
                            +{user.schools.length - 1}
                          </span>
                        )}
                      </span>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge
                      className={cn("font-normal", statusColors[user.status])}
                    >
                      {user.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {user.lastLogin ? (
                      <span className="text-sm text-muted-foreground">
                        {new Date(user.lastLogin).toLocaleDateString()}
                      </span>
                    ) : (
                      <span className="text-muted-foreground">Never</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0"
                        >
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem>
                          <Eye className="mr-2 h-4 w-4" />
                          View Profile
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <UserCog className="mr-2 h-4 w-4" />
                          Edit User
                        </DropdownMenuItem>
                        {showPermissionManager && (
                          <DropdownMenuItem
                            onClick={() => openPermissions(user.id)}
                          >
                            <Shield className="mr-2 h-4 w-4" />
                            Manage Permissions
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuSeparator />
                        {user.status === "ACTIVE" ? (
                          <DropdownMenuItem
                            onClick={() =>
                              handleStatusChange(user.id, "INACTIVE")
                            }
                            className="text-orange-600"
                          >
                            <Power className="mr-2 h-4 w-4" />
                            Deactivate
                          </DropdownMenuItem>
                        ) : (
                          <DropdownMenuItem
                            onClick={() =>
                              handleStatusChange(user.id, "ACTIVE")
                            }
                            className="text-green-600"
                          >
                            <Power className="mr-2 h-4 w-4" />
                            Activate
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Page {page} of {totalPages}
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Permission Manager Dialog */}
      <Dialog open={showPermissions} onOpenChange={setShowPermissions}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>User Permissions</DialogTitle>
          </DialogHeader>
          {selectedUserId && (
            <UserPermissionManager
              userId={selectedUserId}
              onClose={() => setShowPermissions(false)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
