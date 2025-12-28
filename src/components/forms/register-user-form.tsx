// src/components/forms/register-user-form.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { usersApi } from "@/lib/api/users";
import { schoolsApi, type School } from "@/lib/api/schools";
import { Role } from "@prisma/client";

// Define form types
type UserType =
  | "principal"
  | "schooladmin"
  | "accountant"
  | "admissionofficer"
  | "campushead"
  | "operator"
  | "teacher";

interface RegisterUserFormProps {
  userType: UserType;
  defaultSchoolId?: string;
  defaultCampusId?: string;
  onSuccess?: () => void;
}

const roleLabels: Record<UserType, string> = {
  principal: "Principal",
  schooladmin: "School Admin",
  accountant: "Accountant",
  admissionofficer: "Admission Officer",
  campushead: "Campus Head",
  operator: "Computer Operator",
  teacher: "Teacher",
};

const roleEnumMap: Record<UserType, Role> = {
  principal: "PRINCIPAL",
  schooladmin: "SCHOOLADMIN",
  accountant: "ACCOUNTANT",
  admissionofficer: "ADMISSIONOFFICER",
  campushead: "CAMPUSHEAD",
  operator: "COMPUTEROPERATOR",
  teacher: "TEACHER",
};

// Base schema for all user types
const baseUserSchema = z.object({
  firstName: z.string().min(2, "First name must be at least 2 characters"),
  lastName: z.string().min(2, "Last name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  username: z
    .string()
    .min(3, "Username must be at least 3 characters")
    .max(20, "Username must be at most 20 characters")
    .regex(
      /^[a-zA-Z0-9_]+$/,
      "Username can only contain letters, numbers, and underscores"
    ),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      "Password must contain at least one uppercase letter, one lowercase letter, and one number"
    ),
  phoneNo: z.string().optional(),
  gender: z.enum(["MALE", "FEMALE", "OTHERS"]),
  schoolId: z.string().min(1, "Please select a school"),
  campusId: z.string().optional(),
});

// Extended schema for teacher
const teacherSchema = baseUserSchema.extend({
  qualifications: z.string().optional(),
  joiningDate: z.string().min(1, "Joining date is required"),
  salary: z.string().optional(),
});

type TeacherFormData = z.infer<typeof teacherSchema>;
type UserFormData = TeacherFormData; // Use the extended type for all cases

export function RegisterUserForm({
  userType,
  defaultSchoolId,
  defaultCampusId,
  onSuccess,
}: RegisterUserFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [schools, setSchools] = useState<School[]>([]);
  const [loadingSchools, setLoadingSchools] = useState(true);

  const isTeacher = userType === "teacher";
  const schema = isTeacher ? teacherSchema : baseUserSchema;

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch,
  } = useForm<UserFormData>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(schema) as any,
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      username: "",
      password: "",
      phoneNo: "",
      gender: "MALE",
      schoolId: defaultSchoolId || "",
      campusId: defaultCampusId || "",
      qualifications: "",
      joiningDate: new Date().toISOString().split("T")[0],
      salary: "",
    },
  });

  const selectedSchoolId = watch("schoolId");

  // Fetch schools
  useEffect(() => {
    const fetchSchools = async () => {
      try {
        const response = await schoolsApi.getSchools({ limit: 100 });
        if (response.success && response.data) {
          setSchools(response.data.data);
        } else {
          console.error("Failed to fetch schools:", response.message);
          toast.error("Failed to load schools", {
            description: response.message || "You may not have permission to view schools",
          });
        }
      } catch (error) {
        console.error("Error fetching schools:", error);
        toast.error("Error loading schools", {
          description: "Please contact your administrator if this persists",
        });
      } finally {
        setLoadingSchools(false);
      }
    };
    fetchSchools();
  }, []);

  const onSubmit = async (data: UserFormData) => {
    setIsLoading(true);

    try {
      let result;
      const role = roleEnumMap[userType];

      if (userType === "principal" || userType === "schooladmin") {
        result = await usersApi.registerPrincipal({
          ...data,
          role: role as "PRINCIPAL" | "SCHOOLADMIN",
        });
      } else if (userType === "teacher") {
        result = await usersApi.registerTeacher({
          ...data,
          salary: data.salary ? parseFloat(data.salary) : undefined,
        });
      } else {
        result = await usersApi.registerStaff({
          ...data,
          role: role as
            | "ACCOUNTANT"
            | "ADMISSIONOFFICER"
            | "CAMPUSHEAD"
            | "COMPUTEROPERATOR",
        });
      }

      if (result.success && result.data) {
        toast.success(`${roleLabels[userType]} Registered`, {
          description: result.message || `${data.firstName} ${data.lastName} has been successfully registered.`,
        });
        reset();
        onSuccess?.();
        router.refresh();
      } else {
        toast.error("Registration Failed", {
          description: result.message || "Failed to register user",
        });
      }
    } catch (error) {
      toast.error("Registration Failed", {
        description:
          error instanceof Error ? error.message : "Failed to register user",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader className="space-y-1">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-primary/10">
            <UserPlus className="h-6 w-6 text-primary" />
          </div>
          <div>
            <CardTitle className="text-2xl">
              Register {roleLabels[userType]}
            </CardTitle>
            <CardDescription>
              Add a new {roleLabels[userType].toLowerCase()} to the system
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* School Selection */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold border-b pb-2">
              School Assignment
            </h3>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="schoolId">School *</Label>
                <Select
                  disabled={isLoading || loadingSchools}
                  value={selectedSchoolId}
                  onValueChange={(value) => setValue("schoolId", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={loadingSchools ? "Loading schools..." : "Select a school"} />
                  </SelectTrigger>
                  <SelectContent>
                    {schools.length === 0 ? (
                      <SelectItem value="no-schools" disabled>
                        No schools available
                      </SelectItem>
                    ) : (
                      schools.map((school) => (
                        <SelectItem key={school.id} value={school.id}>
                          {school.name} ({school.code})
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
                {errors.schoolId && (
                  <p className="text-sm text-destructive">
                    {errors.schoolId.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="campusId">Campus (Optional)</Label>
                <Select
                  disabled={isLoading || !selectedSchoolId}
                  onValueChange={(value) => setValue("campusId", value === "none" ? "" : value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a campus" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No specific campus</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Personal Info */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold border-b pb-2">
              Personal Information
            </h3>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="firstName">First Name *</Label>
                <Input
                  id="firstName"
                  placeholder="Enter first name"
                  {...register("firstName")}
                  disabled={isLoading}
                />
                {errors.firstName && (
                  <p className="text-sm text-destructive">
                    {errors.firstName.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name *</Label>
                <Input
                  id="lastName"
                  placeholder="Enter last name"
                  {...register("lastName")}
                  disabled={isLoading}
                />
                {errors.lastName && (
                  <p className="text-sm text-destructive">
                    {errors.lastName.message}
                  </p>
                )}
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="email">Email Address *</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="email@example.com"
                  {...register("email")}
                  disabled={isLoading}
                />
                {errors.email && (
                  <p className="text-sm text-destructive">
                    {errors.email.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="phoneNo">Phone Number</Label>
                <Input
                  id="phoneNo"
                  placeholder="+92-300-1234567"
                  {...register("phoneNo")}
                  disabled={isLoading}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="gender">Gender *</Label>
              <Select
                disabled={isLoading}
                defaultValue="MALE"
                onValueChange={(value) =>
                  setValue("gender", value as "MALE" | "FEMALE" | "OTHERS")
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select gender" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="MALE">Male</SelectItem>
                  <SelectItem value="FEMALE">Female</SelectItem>
                  <SelectItem value="OTHERS">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Account Info */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold border-b pb-2">
              Account Credentials
            </h3>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="username">Username *</Label>
                <Input
                  id="username"
                  placeholder="username123"
                  {...register("username")}
                  disabled={isLoading}
                />
                {errors.username && (
                  <p className="text-sm text-destructive">
                    {errors.username.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password *</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  {...register("password")}
                  disabled={isLoading}
                />
                {errors.password && (
                  <p className="text-sm text-destructive">
                    {errors.password.message}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Teacher-specific fields */}
          {isTeacher && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold border-b pb-2">
                Teacher Information
              </h3>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="joiningDate">Joining Date *</Label>
                  <Input
                    id="joiningDate"
                    type="date"
                    {...register("joiningDate")}
                    disabled={isLoading}
                  />
                  {errors.joiningDate && (
                    <p className="text-sm text-destructive">
                      {errors.joiningDate.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="salary">Monthly Salary</Label>
                  <Input
                    id="salary"
                    type="number"
                    placeholder="e.g., 50000"
                    {...register("salary")}
                    disabled={isLoading}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="qualifications">Qualifications</Label>
                <Input
                  id="qualifications"
                  placeholder="e.g., M.Ed, B.Sc"
                  {...register("qualifications")}
                  disabled={isLoading}
                />
              </div>
            </div>
          )}

          <div className="flex gap-4">
            <Button type="submit" className="flex-1" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Registering...
                </>
              ) : (
                <>
                  <UserPlus className="mr-2 h-4 w-4" />
                  Register {roleLabels[userType]}
                </>
              )}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => reset()}
              disabled={isLoading}
            >
              Reset
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
