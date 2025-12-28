// src/app/(app)/(dashboards)/superadmin/users/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Users as UsersIcon, Search, Shield, Edit, Trash2, Plus } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { usersApi, type User } from "@/lib/api/users";
import { toast } from "sonner";
import Link from "next/link";
import { Role } from "@prisma/client";
import { useDebounce } from "@/hooks/use-debounce";

const roleColors: Record<string, string> = {
  SUPERADMIN: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
  ADMIN: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  SCHOOLADMIN: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200",
  PRINCIPAL: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  TEACHER: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
  ACCOUNTANT: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
  ADMISSIONOFFICER: "bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200",
  COMPUTEROPERATOR: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200",
};

const roleLabels: Record<string, string> = {
  SUPERADMIN: "Super Admin",
  ADMIN: "Admin",
  SCHOOLADMIN: "School Admin",
  PRINCIPAL: "Principal",
  CAMPUSHEAD: "Campus Head",
  TEACHER: "Teacher",
  ACCOUNTANT: "Accountant",
  ADMISSIONOFFICER: "Admission Officer",
  COMPUTEROPERATOR: "Computer Operator",
};

export default function UsersListPage() {
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearch = useDebounce(searchQuery, 500);
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  });

  const fetchUsers = async (page = 1, search = "", role = "all") => {
    setIsLoading(true);
    try {
      const params: {
        page: number;
        limit: number;
        search?: string;
        role?: Role;
      } = {
        page,
        limit: pagination.limit,
      };

      if (search) params.search = search;
      if (role !== "all") params.role = role as Role;

      const response = await usersApi.getUsers(params);

      if (response.success && response.data) {
        setUsers(response.data.data);
        setPagination(response.data.pagination);
      } else {
        toast.error("Failed to load users", {
          description: response.message || "Please try again",
        });
      }
    } catch (error) {
      console.error("Error fetching users:", error);
      toast.error("Error loading users");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers(1, debouncedSearch, roleFilter);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch, roleFilter]);

  const handleRoleFilter = (role: string) => {
    setRoleFilter(role);
    // Effect will handle fetch
  };

  const handlePageChange = (newPage: number) => {
    setPagination((prev) => ({ ...prev, page: newPage }));
    fetchUsers(newPage, debouncedSearch, roleFilter);
  };

  const handleDelete = async (userId: string, userName: string) => {
    if (!confirm(`Are you sure you want to delete ${userName}?`)) {
      return;
    }

    try {
      const response = await usersApi.deleteUser(userId);
      if (response.success) {
        toast.success("User deleted successfully");
        fetchUsers(pagination.page, debouncedSearch, roleFilter);
      } else {
        toast.error("Failed to delete user", {
          description: response.message,
        });
      }
    } catch (error) {
      console.error("Error deleting user:", error);
      toast.error("Error deleting user");
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Users Management"
        description="View and manage all users in the system"
      >
        <Link href="/superadmin/users/register-principal">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Register User
          </Button>
        </Link>
      </PageHeader>

      <Card>
        <CardHeader>
          <CardTitle>All Users</CardTitle>
          <CardDescription>
            Total {pagination.total} user{pagination.total !== 1 ? "s" : ""}{" "}
            registered
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="flex flex-col md:flex-row gap-4 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name, email, or username..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={roleFilter} onValueChange={handleRoleFilter}>
              <SelectTrigger className="w-full md:w-[200px]">
                <SelectValue placeholder="Filter by role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Roles</SelectItem>
                <SelectItem value="SUPERADMIN">Super Admin</SelectItem>
                <SelectItem value="ADMIN">Admin</SelectItem>
                <SelectItem value="SCHOOLADMIN">School Admin</SelectItem>
                <SelectItem value="PRINCIPAL">Principal</SelectItem>
                <SelectItem value="TEACHER">Teacher</SelectItem>
                <SelectItem value="ACCOUNTANT">Accountant</SelectItem>
                <SelectItem value="ADMISSIONOFFICER">Admission Officer</SelectItem>
                <SelectItem value="COMPUTEROPERATOR">Computer Operator</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Table */}
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">
              Loading users...
            </div>
          ) : users.length === 0 ? (
            <div className="text-center py-8">
              <UsersIcon className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p className="text-muted-foreground">No users found</p>
              <Link href="/superadmin/users/register-principal">
                <Button variant="link" className="mt-2">
                  Register your first user
                </Button>
              </Link>
            </div>
          ) : (
            <>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Contact</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{user.fullName}</div>
                            <div className="text-xs text-muted-foreground">
                              @{user.username} • {user.uid}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={roleColors[user.role] || ""}
                          >
                            {roleLabels[user.role] || user.role}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            {user.email && <div>{user.email}</div>}
                            {user.phoneNo && (
                              <div className="text-xs text-muted-foreground">
                                {user.phoneNo}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={user.status === "ACTIVE" ? "default" : "secondary"}
                          >
                            {user.status === "ACTIVE" ? "Active" : "Inactive"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() =>
                                router.push(
                                  `/superadmin/users/${user.id}/permissions`
                                )
                              }
                              title="Manage Permissions"
                            >
                              <Shield className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() =>
                                router.push(`/superadmin/users/${user.id}`)
                              }
                              title="Edit User"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() =>
                                handleDelete(user.id, user.fullName)
                              }
                              className="text-destructive hover:text-destructive"
                              title="Delete User"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              <div className="flex items-center justify-between mt-4">
                <div className="text-sm text-muted-foreground">
                  Showing {(pagination.page - 1) * pagination.limit + 1} to{" "}
                  {Math.min(pagination.page * pagination.limit, pagination.total)}{" "}
                  of {pagination.total} users
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={pagination.page === 1}
                    onClick={() =>
                      handlePageChange(pagination.page - 1)
                    }
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={pagination.page === pagination.totalPages}
                    onClick={() =>
                      handlePageChange(pagination.page + 1)
                    }
                  >
                    Next
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
