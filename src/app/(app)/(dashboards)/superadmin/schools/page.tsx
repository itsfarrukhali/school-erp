// src/app/(app)/(dashboards)/superadmin/schools/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Building2, Plus, Search, Edit, Trash2, School as SchoolIcon } from "lucide-react";
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { schoolsApi, type School } from "@/lib/api/schools";
import { toast } from "sonner";
import Link from "next/link";
import { useDebounce } from "@/hooks/use-debounce";

export default function SchoolsListPage() {
  const router = useRouter();
  const [schools, setSchools] = useState<School[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearch = useDebounce(searchQuery, 500);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  });
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleteName, setDeleteName] = useState<string>("");

  const fetchSchools = async (page = 1, search = "") => {
    setIsLoading(true);
    try {
      const response = await schoolsApi.getSchools({
        page,
        limit: pagination.limit,
        search,
      });

      if (response.success && response.data) {
        setSchools(response.data.data);
        setPagination(response.data.pagination);
      } else {
        toast.error("Failed to load schools", {
          description: response.message || "Please try again",
        });
      }
    } catch (error) {
      console.error("Error fetching schools:", error);
      toast.error("Error loading schools");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSchools(1, debouncedSearch);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch]);

  const handleDeleteClick = (schoolId: string, schoolName: string) => {
    setDeleteId(schoolId);
    setDeleteName(schoolName);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteId) return;

    try {
      const response = await schoolsApi.deleteSchool(deleteId);
      if (response.success) {
        toast.success("School deleted successfully");
        fetchSchools(pagination.page, searchQuery);
      } else {
        toast.error("Failed to delete school", {
          description: response.message,
        });
      }
    } catch (error) {
      console.error("Error deleting school:", error);
      toast.error("Error deleting school");
    } finally {
      setDeleteId(null);
      setDeleteName("");
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Schools Management"
        description="View and manage all schools in the system"
      />

      <Card>
        <CardHeader>
          <CardTitle>All Schools</CardTitle>
          <CardDescription>
            Total {pagination.total} school{pagination.total !== 1 ? "s" : ""}{" "}
            registered
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Search */}
          <div className="flex gap-2 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search schools by name, code, or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Link href="/superadmin/schools/create">
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Create School
              </Button>
            </Link>
          </div>

          {/* Table */}
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">
              Loading schools...
            </div>
          ) : schools.length === 0 ? (
            <div className="text-center py-8">
              <Building2 className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p className="text-muted-foreground">No schools found</p>
              <Link href="/superadmin/schools/create">
                <Button variant="link" className="mt-2">
                  Create your first school
                </Button>
              </Link>
            </div>
          ) : (
            <>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>School Name</TableHead>
                      <TableHead>Code</TableHead>
                      <TableHead>Location</TableHead>
                      <TableHead>Contact</TableHead>
                      <TableHead>Stats</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {schools.map((school) => (
                      <TableRow key={school.id}>
                        <TableCell className="font-medium">
                          <div>
                            <div>{school.name}</div>
                            <div className="text-xs text-muted-foreground">
                              {school.sid}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{school.code}</Badge>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            {typeof school.address === "object" &&
                            school.address !== null
                              ? `${
                                  (school.address as { city?: string }).city ||
                                  ""
                                }, ${
                                  (school.address as { country?: string })
                                    .country || ""
                                }`
                              : "N/A"}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            {school.phone && <div>{school.phone}</div>}
                            {school.email && (
                              <div className="text-xs text-muted-foreground">
                                {school.email}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-xs space-y-1">
                            {school._count && (
                              <>
                                <div>
                                  Campuses: {school._count.campuses || 0}
                                </div>
                                <div>
                                  Students: {school._count.students || 0}
                                </div>
                                <div>
                                  Teachers: {school._count.teachers || 0}
                                </div>
                              </>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() =>
                                router.push(`/superadmin/schools/${school.id}/edit`)
                              }
                              title="Edit School"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() =>
                                router.push(`/superadmin/schools/${school.id}/campuses/create`)
                              }
                              title="Add Campus"
                            >
                              <SchoolIcon className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() =>
                                handleDeleteClick(school.id, school.name)
                              }
                              className="text-destructive hover:text-destructive"
                              title="Delete School"
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
                  {Math.min(
                    pagination.page * pagination.limit,
                    pagination.total
                  )}{" "}
                  of {pagination.total} schools
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={pagination.page === 1}
                    onClick={() =>
                      fetchSchools(pagination.page - 1, searchQuery)
                    }
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={pagination.page === pagination.totalPages}
                    onClick={() =>
                      fetchSchools(pagination.page + 1, searchQuery)
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

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete{" "}
              <span className="font-bold">{deleteName}</span> and all associated
              data including campuses, students, and staff.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
