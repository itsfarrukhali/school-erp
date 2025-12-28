// src/components/forms/enroll-student-form.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, GraduationCap } from "lucide-react";
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
import {
  enrollStudentSchema,
  type EnrollStudentInput,
} from "@/validations/user";
import { usersApi } from "@/lib/api/users";
import { schoolsApi, type School } from "@/lib/api/schools";

interface EnrollStudentFormProps {
  defaultSchoolId?: string;
  defaultCampusId?: string;
  onSuccess?: () => void;
}

export function EnrollStudentForm({
  defaultSchoolId,
  defaultCampusId,
  onSuccess,
}: EnrollStudentFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [schools, setSchools] = useState<School[]>([]);
  const [loadingSchools, setLoadingSchools] = useState(true);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch,
  } = useForm<EnrollStudentInput>({
    resolver: zodResolver(enrollStudentSchema),
    defaultValues: {
      studentName: "",
      firstName: "",
      lastName: "",
      email: "",
      password: "",
      gender: "MALE",
      dateOfBirth: "",
      schoolId: defaultSchoolId || "",
      campusId: defaultCampusId || "",
      classId: "",
      phoneNumber: "",
      address: {
        street: "",
        city: "",
        state: "",
        country: "Pakistan",
        postalCode: "",
      },
      fatherName: "",
      motherName: "",
      guardianPhone: "",
    },
  });

  const selectedSchoolId = watch("schoolId");
  const firstName = watch("firstName");
  const lastName = watch("lastName");

  // Auto-update studentName when firstName or lastName changes
  useEffect(() => {
    if (firstName && lastName) {
      setValue("studentName", `${firstName} ${lastName}`);
    }
  }, [firstName, lastName, setValue]);

  // Fetch schools
  useEffect(() => {
    const fetchSchools = async () => {
      try {
        const response = await schoolsApi.getSchools({ limit: 100 });
        if (response.success && response.data) {
          setSchools(response.data.data);
        }
      } catch (error) {
        console.error("Error fetching schools:", error);
      } finally {
        setLoadingSchools(false);
      }
    };
    fetchSchools();
  }, []);

  const onSubmit = async (data: EnrollStudentInput) => {
    setIsLoading(true);

    try {
      const result = await usersApi.enrollStudent(data);

      if (result.success) {
        toast.success("Student Enrolled", {
          description: `${data.studentName} has been successfully enrolled.`,
        });
        reset();
        onSuccess?.();
        router.refresh();
      }
    } catch (error) {
      toast.error("Enrollment Failed", {
        description:
          error instanceof Error ? error.message : "Failed to enroll student",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-3xl mx-auto">
      <CardHeader className="space-y-1">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-primary/10">
            <GraduationCap className="h-6 w-6 text-primary" />
          </div>
          <div>
            <CardTitle className="text-2xl">Enroll New Student</CardTitle>
            <CardDescription>
              Add a new student to the school system
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* School Selection */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold border-b pb-2">
              School & Class Assignment
            </h3>

            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="schoolId">School *</Label>
                <Select
                  disabled={isLoading || loadingSchools}
                  value={selectedSchoolId}
                  onValueChange={(value) => setValue("schoolId", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a school" />
                  </SelectTrigger>
                  <SelectContent>
                    {schools.map((school) => (
                      <SelectItem key={school.id} value={school.id}>
                        {school.name} ({school.code})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.schoolId && (
                  <p className="text-sm text-destructive">
                    {errors.schoolId.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="campusId">Campus</Label>
                <Select
                  disabled={isLoading || !selectedSchoolId}
                  onValueChange={(value) =>
                    setValue("campusId", value === "none" ? "" : value)
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a campus" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No specific campus</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="classId">Class</Label>
                <Select
                  disabled={isLoading || !selectedSchoolId}
                  onValueChange={(value) =>
                    setValue("classId", value === "none" ? "" : value)
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a class" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Assign later</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Student Info */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold border-b pb-2">
              Student Information
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

            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="dateOfBirth">Date of Birth</Label>
                <Input
                  id="dateOfBirth"
                  type="date"
                  {...register("dateOfBirth")}
                  disabled={isLoading}
                />
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

              <div className="space-y-2">
                <Label htmlFor="religion">Religion</Label>
                <Select
                  disabled={isLoading}
                  onValueChange={(value) =>
                    setValue(
                      "religion",
                      value as EnrollStudentInput["religion"]
                    )
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select religion" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ISLAM">Islam</SelectItem>
                    <SelectItem value="CHRISTIANITY">Christianity</SelectItem>
                    <SelectItem value="HINDUISM">Hinduism</SelectItem>
                    <SelectItem value="OTHERS">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="email">Email (Optional)</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="student@email.com"
                  {...register("email")}
                  disabled={isLoading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phoneNumber">Phone Number</Label>
                <Input
                  id="phoneNumber"
                  placeholder="+92-300-1234567"
                  {...register("phoneNumber")}
                  disabled={isLoading}
                />
              </div>
            </div>
          </div>

          {/* Family Info */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold border-b pb-2">
              Family Information
            </h3>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="fatherName">Father&apos;s Name *</Label>
                <Input
                  id="fatherName"
                  placeholder="Enter father's name"
                  {...register("fatherName")}
                  disabled={isLoading}
                />
                {errors.fatherName && (
                  <p className="text-sm text-destructive">
                    {errors.fatherName.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="motherName">Mother&apos;s Name *</Label>
                <Input
                  id="motherName"
                  placeholder="Enter mother's name"
                  {...register("motherName")}
                  disabled={isLoading}
                />
                {errors.motherName && (
                  <p className="text-sm text-destructive">
                    {errors.motherName.message}
                  </p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="guardianPhone">Guardian Phone Number *</Label>
              <Input
                id="guardianPhone"
                placeholder="+92-300-1234567"
                {...register("guardianPhone")}
                disabled={isLoading}
              />
              {errors.guardianPhone && (
                <p className="text-sm text-destructive">
                  {errors.guardianPhone.message}
                </p>
              )}
            </div>
          </div>

          {/* Address */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold border-b pb-2">Address</h3>

            <div className="space-y-2">
              <Label htmlFor="address.street">Street Address</Label>
              <Input
                id="address.street"
                placeholder="Enter street address"
                {...register("address.street")}
                disabled={isLoading}
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="address.city">City</Label>
                <Input
                  id="address.city"
                  placeholder="e.g., Karachi"
                  {...register("address.city")}
                  disabled={isLoading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="address.country">Country</Label>
                <Input
                  id="address.country"
                  placeholder="e.g., Pakistan"
                  {...register("address.country")}
                  disabled={isLoading}
                />
              </div>
            </div>
          </div>

          {/* Account Credentials */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold border-b pb-2">
              Login Credentials
            </h3>
            <p className="text-sm text-muted-foreground">
              The student will use these credentials to log in to the student
              portal.
            </p>

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

          <div className="flex gap-4">
            <Button type="submit" className="flex-1" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Enrolling Student...
                </>
              ) : (
                <>
                  <GraduationCap className="mr-2 h-4 w-4" />
                  Enroll Student
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
