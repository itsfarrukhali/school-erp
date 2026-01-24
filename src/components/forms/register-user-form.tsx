// src/components/forms/register-user-form.tsx
"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { 
  Loader2, 
  UserPlus, 
  Eye, 
  EyeOff, 
  Upload, 
  CheckCircle2, 
  AlertCircle 
} from "lucide-react";
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
import { campusesApi, type Campus } from "@/lib/api/campuses";
import { Role } from "@prisma/client";
import { useDebounce } from "@/hooks/use-debounce";
import Image from "next/image";

// Define form types
type UserType =
  | "admin"
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
  admin: "Admin",
  principal: "Principal",
  schooladmin: "School Admin",
  accountant: "Accountant",
  admissionofficer: "Admission Officer",
  campushead: "Campus Head",
  operator: "Computer Operator",
  teacher: "Teacher",
};

const roleEnumMap: Record<UserType, Role> = {
  admin: "ADMIN",
  principal: "PRINCIPAL",
  schooladmin: "SCHOOLADMIN",
  accountant: "ACCOUNTANT",
  admissionofficer: "ADMISSIONOFFICER",
  campushead: "CAMPUSHEAD",
  operator: "COMPUTEROPERATOR",
  teacher: "TEACHER",
};

// Base schema for all user types
const baseSchemaFields = {
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
  avatarUrl: z.string().optional(),
};

// Schema for users associated with a school
const schoolUserSchema = z.object({
  ...baseSchemaFields,
  schoolId: z.string().min(1, "Please select a school"),
  campusId: z.string().optional(),
});

// Schema for Admin (no school required)
const adminSchema = z.object({
  ...baseSchemaFields,
  designation: z.string().optional(),
});

// Extended schema for teacher
const teacherSchema = schoolUserSchema.extend({
  qualifications: z.string().optional(),
  joiningDate: z.string().min(1, "Joining date is required"),
  salary: z.string().optional(),
});

type UserFormData = z.infer<typeof adminSchema> & {
  schoolId?: string;
  campusId?: string;
  qualifications?: string;
  joiningDate?: string;
  salary?: string;
};

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
  const [campuses, setCampuses] = useState<Campus[]>([]);
  const [loadingCampuses, setLoadingCampuses] = useState(false);
  
  // New states
  const [showPassword, setShowPassword] = useState(false);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null);
  const [isCheckingUsername, setIsCheckingUsername] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isTeacher = userType === "teacher";
  const isAdmin = userType === "admin";
  
  // Determine schema based on user type
  const getSchema = () => {
    if (isAdmin) return adminSchema;
    if (isTeacher) return teacherSchema;
    return schoolUserSchema;
  };

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch,
  } = useForm<UserFormData>({
    resolver: zodResolver(getSchema()) ,
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
      designation: "",
    },
  });

  const selectedSchoolId = watch("schoolId");
  const usernameValue = watch("username");
  const debouncedUsername = useDebounce(usernameValue, 500);

  // Check username availability
  useEffect(() => {
    const checkUsername = async () => {
      if (!debouncedUsername || debouncedUsername.length < 3) {
        setUsernameAvailable(null);
        return;
      }

      // Don't check if there are regex errors
      const isValidFormat = /^[a-zA-Z0-9_]+$/.test(debouncedUsername);
      if (!isValidFormat) return;

      setIsCheckingUsername(true);
      try {
        const response = await fetch(`/api/v1/users/check-username?username=${debouncedUsername}`);
        const data = await response.json();
        setUsernameAvailable(data.available);
      } catch (error) {
        console.error("Error checking username:", error);
      } finally {
        setIsCheckingUsername(false);
      }
    };

    checkUsername();
  }, [debouncedUsername]);

  // Fetch schools (only if not admin)
  useEffect(() => {
    if (isAdmin) {
      setLoadingSchools(false);
      return;
    }

    const fetchSchools = async () => {
      try {
        const response = await schoolsApi.getSchools({ limit: 100 });
        if (response.success && response.data) {
          setSchools(response.data.data);
        } else {
          console.error("Failed to fetch schools:", response.message);
          toast.error("Failed to load schools");
        }
      } catch (error) {
        console.error("Error fetching schools:", error);
        toast.error("Error loading schools");
      } finally {
        setLoadingSchools(false);
      }
    };
    fetchSchools();
  }, [isAdmin]);

  // Fetch campuses when school changes
  useEffect(() => {
    if (isAdmin) return;

    const fetchCampuses = async () => {
      if (!selectedSchoolId || selectedSchoolId === "no-schools") {
        setCampuses([]);
        return;
      }

      setLoadingCampuses(true);
      try {
        const response = await campusesApi.getCampuses({ schoolId: selectedSchoolId });
        if (response.success && response.data) {
          const campusData = Array.isArray(response.data)
            ? response.data
            : (response.data as any).data || [];
          setCampuses(campusData);
        } else {
          setCampuses([]);
        }
      } catch (error) {
        console.error("Error fetching campuses:", error);
        toast.error("Failed to load campuses");
      } finally {
        setLoadingCampuses(false);
      }
    };

    fetchCampuses();
  }, [selectedSchoolId, isAdmin]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error("File size must be less than 5MB");
        return;
      }
      setAvatarFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const uploadAvatar = async (): Promise<string | undefined> => {
    if (!avatarFile) return undefined;

    const formData = new FormData();
    formData.append("avatar", avatarFile);

    try {
      const response = await fetch("/api/v1/upload/avatar", {
        method: "POST",
        body: formData,
      });
      const data = await response.json();
      if (data.success) {
        return data.avatarUrl;
      } else {
        throw new Error(data.message || "Failed to upload avatar");
      }
    } catch (error) {
      console.error("Avatar upload error:", error);
      toast.error("Failed to upload profile image");
      return undefined;
    }
  };

  const onSubmit = async (data: UserFormData) => {
    if (usernameAvailable === false) {
      toast.error("Username is already taken");
      return;
    }

    setIsLoading(true);
    setIsUploading(!!avatarFile);

    try {
      // Upload avatar if exists
      let avatarUrl: string | undefined;
      if (avatarFile) {
        avatarUrl = await uploadAvatar();
        setIsUploading(false);
      }

      const finalData = { ...data, avatarUrl };
      let result;
      const role = roleEnumMap[userType];

      if (userType === "admin") {
        result = await usersApi.registerAdmin({
          ...finalData,
          role: "ADMIN",
        });
      } else if (userType === "principal" || userType === "schooladmin") {
        const payload = {
          ...finalData,
          role: role as "PRINCIPAL" | "SCHOOLADMIN",
          schoolId: data.schoolId!,
          campusId: data.campusId && data.campusId !== "none" ? data.campusId : undefined,
        };
        result = await usersApi.registerPrincipal(payload);
      } else if (userType === "teacher") {
        result = await usersApi.registerTeacher({
          ...finalData,
          joiningDate: data.joiningDate!,
          salary: data.salary ? parseFloat(data.salary) : undefined,
          schoolId: data.schoolId!, // Assert non-null as schema enforces it
        });
      } else {
        result = await usersApi.registerStaff({
          ...finalData,
          role: role as
            | "ACCOUNTANT"
            | "ADMISSIONOFFICER"
            | "CAMPUSHEAD"
            | "COMPUTEROPERATOR",
          schoolId: data.schoolId!,
        });
      }

      if (result.success && result.data) {
        toast.success(`${roleLabels[userType]} Registered`, {
          description: result.message || `${data.firstName} ${data.lastName} has been successfully registered.`,
        });
        reset();
        setAvatarFile(null);
        setAvatarPreview(null);
        setUsernameAvailable(null);
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
      setIsUploading(false);
    }
  };

  return (
    <Card className="w-full max-w-5xl mx-auto">
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
          {/* Avatar Upload */}
          <div className="flex flex-col items-center justify-center space-y-4 pb-6 border-b">
            <div className="relative h-24 w-24 rounded-full overflow-hidden bg-muted border-2 border-dashed border-muted-foreground/50 hover:border-primary transition-colors">
              {avatarPreview ? (
                <Image
                  src={avatarPreview}
                  alt="Avatar preview"
                  fill
                  className="object-cover"
                />
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                  <Upload className="h-8 w-8 mb-1" />
                  <span className="text-[10px]">Upload</span>
                </div>
              )}
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept="image/png, image/jpeg, image/webp"
                className="absolute inset-0 opacity-0 cursor-pointer"
                disabled={isLoading}
              />
            </div>
            <div className="text-center">
              <Label htmlFor="avatar" className="cursor-pointer text-sm font-medium text-primary hover:underline" onClick={() => fileInputRef.current?.click()}>
                {avatarPreview ? "Change Profile Photo" : "Upload Profile Photo"}
              </Label>
              <p className="text-xs text-muted-foreground mt-1">
                Max 5MB. PNG, JPG, or WebP.
              </p>
            </div>
            {avatarPreview && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  setAvatarFile(null);
                  setAvatarPreview(null);
                  if (fileInputRef.current) fileInputRef.current.value = "";
                }}
                className="text-destructive h-auto p-0 text-xs hover:bg-transparent"
              >
                Remove photo
              </Button>
            )}
          </div>

          {/* School Selection (Hidden for Admin) */}
          {!isAdmin && (
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
                      <SelectValue placeholder={loadingCampuses ? "Loading campuses..." : "Select a campus"} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No specific campus</SelectItem>
                      {campuses.map((campus) => (
                        <SelectItem key={campus.id} value={campus.id}>
                          {campus.name} ({campus.campusCode})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          )}

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

            <div className="grid gap-4 md:grid-cols-2">
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

              {isAdmin && (
                <div className="space-y-2">
                  <Label htmlFor="designation">Designation</Label>
                  <Input
                    id="designation"
                    placeholder="e.g. Senior Administrator"
                    {...register("designation")}
                    disabled={isLoading}
                  />
                </div>
              )}
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
                <div className="relative">
                  <Input
                    id="username"
                    placeholder="username123"
                    {...register("username")}
                    disabled={isLoading}
                    className={
                      usernameAvailable === true 
                        ? "border-green-500 focus-visible:ring-green-500" 
                        : usernameAvailable === false 
                          ? "border-red-500 focus-visible:ring-red-500" 
                          : ""
                    }
                  />
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                    {isCheckingUsername ? (
                      <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                    ) : usernameAvailable === true ? (
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                    ) : usernameAvailable === false ? (
                      <AlertCircle className="h-4 w-4 text-red-500" />
                    ) : null}
                  </div>
                </div>
                {errors.username ? (
                  <p className="text-sm text-destructive">
                    {errors.username.message}
                  </p>
                ) : usernameAvailable === false ? (
                  <p className="text-sm text-destructive">
                    Username is already taken
                  </p>
                ) : usernameAvailable === true ? (
                  <p className="text-sm text-green-600">
                    Username is available
                  </p>
                ) : null}
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password *</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    {...register("password")}
                    disabled={isLoading}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                    disabled={isLoading}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <Eye className="h-4 w-4 text-muted-foreground" />
                    )}
                    <span className="sr-only">
                      {showPassword ? "Hide password" : "Show password"}
                    </span>
                  </Button>
                </div>
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
            <Button type="submit" className="flex-1" disabled={isLoading || isUploading || usernameAvailable === false}>
              {isLoading || isUploading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {isUploading ? "Uploading..." : "Registering..."}
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
              onClick={() => {
                reset();
                setAvatarFile(null);
                setAvatarPreview(null);
                setUsernameAvailable(null);
              }}
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
