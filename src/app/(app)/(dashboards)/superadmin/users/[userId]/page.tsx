"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { usersApi, type User } from "@/lib/api/users";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { 
  ArrowLeft, 
  Mail, 
  Phone, 
  Calendar, 
  Shield, 
  School, 
  Building,
  User as UserIcon,
  CheckCircle2,
  XCircle
} from "lucide-react";
import { format } from "date-fns";

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

export default function UserDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const userId = params.userId as string;
  
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      if (!userId) return;
      
      try {
        setIsLoading(true);
        const response = await usersApi.getUser(userId);
        
        if (response.success && response.data) {
          setUser(response.data);
        } else {
          toast.error("Failed to load user details", {
            description: response.message || "Please try again",
          });
        }
      } catch (error) {
        console.error("Error fetching user:", error);
        toast.error("Error loading user details");
      } finally {
        setIsLoading(false);
      }
    };

    fetchUser();
  }, [userId]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <p className="text-muted-foreground">User not found</p>
        <Button variant="outline" onClick={() => router.back()}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Go Back
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="User Details"
        description={`View details for ${user.fullName}`}
      >
        <Button variant="outline" onClick={() => router.back()}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Users
        </Button>
      </PageHeader>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Main Profile Card */}
        <Card className="md:col-span-1">
          <CardContent className="pt-6 flex flex-col items-center text-center">
            <div className="h-24 w-24 rounded-full bg-primary/10 flex items-center justify-center mb-4">
              <span className="text-3xl font-bold text-primary">
                {user.firstName[0]}{user.lastName[0]}
              </span>
            </div>
            <h2 className="text-xl font-bold">{user.fullName}</h2>
            <p className="text-sm text-muted-foreground mb-2">@{user.username}</p>
            <Badge className={`mb-4 ${roleColors[user.role] || ""}`}>
              {user.role}
            </Badge>
            
            <div className="w-full space-y-2 text-left mt-4">
              <div className="flex items-center justify-between text-sm p-2 bg-muted/50 rounded-md">
                <span className="text-muted-foreground">Status</span>
                <Badge variant={user.status === "ACTIVE" ? "default" : "secondary"}>
                  {user.status}
                </Badge>
              </div>
              <div className="flex items-center justify-between text-sm p-2 bg-muted/50 rounded-md">
                <span className="text-muted-foreground">Verified</span>
                {user.isEmailVerified ? (
                  <span className="flex items-center text-green-600 text-xs font-medium">
                    <CheckCircle2 className="h-3 w-3 mr-1" /> Yes
                  </span>
                ) : (
                  <span className="flex items-center text-yellow-600 text-xs font-medium">
                    <XCircle className="h-3 w-3 mr-1" /> No
                  </span>
                )}
              </div>
              <div className="flex items-center justify-between text-sm p-2 bg-muted/50 rounded-md">
                <span className="text-muted-foreground">UID</span>
                <span className="font-mono text-xs">{user.uid}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Details Tabs/Sections */}
        <div className="md:col-span-2 space-y-6">
          {/* Contact Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <UserIcon className="h-5 w-5 text-muted-foreground" />
                Personal & Contact Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <span className="text-xs text-muted-foreground">Email Address</span>
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span>{user.email}</span>
                  </div>
                </div>
                <div className="space-y-1">
                  <span className="text-xs text-muted-foreground">Phone Number</span>
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span>{user.phoneNo || "N/A"}</span>
                  </div>
                </div>
                <div className="space-y-1">
                  <span className="text-xs text-muted-foreground">Gender</span>
                  <div>{user.gender}</div>
                </div>
                <div className="space-y-1">
                  <span className="text-xs text-muted-foreground">Designation</span>
                  <div>{user.designation || "N/A"}</div>
                </div>
                <div className="space-y-1">
                  <span className="text-xs text-muted-foreground">Joined Date</span>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span>{format(new Date(user.createdAt), "PPP")}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Associated Schools/Campuses */}
          {(user.schools.length > 0 || user.campuses.length > 0) && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Building className="h-5 w-5 text-muted-foreground" />
                  Associations
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {user.schools.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
                      <School className="h-4 w-4" /> Schools
                    </h4>
                    <div className="grid gap-2">
                      {user.schools.map((s) => (
                        <div key={s.schoolId} className="p-3 border rounded-md bg-muted/20">
                          <div className="font-medium">{s.school.name}</div>
                          <div className="text-xs text-muted-foreground">Code: {s.school.code}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {user.schools.length > 0 && user.campuses.length > 0 && <Separator />}

                {user.campuses.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
                      <Building className="h-4 w-4" /> Campuses
                    </h4>
                    <div className="grid gap-2">
                      {user.campuses.map((c) => (
                        <div key={c.campusId} className="p-3 border rounded-md bg-muted/20">
                          <div className="font-medium">{c.campus.name}</div>
                          <div className="text-xs text-muted-foreground">Code: {c.campus.campusCode}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Actions */}
          <div className="flex gap-3">
             <Button onClick={() => router.push(`/superadmin/users/${user.id}/permissions`)}>
               <Shield className="mr-2 h-4 w-4" />
               Manage Permissions
             </Button>
          </div>
        </div>
      </div>
    </div>
  );
}