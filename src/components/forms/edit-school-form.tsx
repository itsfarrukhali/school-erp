// src/components/forms/edit-school-form.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Building2, Save } from "lucide-react";
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
import { toast } from "sonner";
import { createSchoolSchema, type CreateSchoolInput } from "@/validations/user";
import { schoolsApi, type School } from "@/lib/api/schools";

interface EditSchoolFormProps {
  school: School;
  onSuccess?: () => void;
}

export function EditSchoolForm({ school, onSuccess }: EditSchoolFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CreateSchoolInput>({
    resolver: zodResolver(createSchoolSchema),
    defaultValues: {
      name: school.name,
      code: school.code,
      address: {
        street: school.address.street,
        city: school.address.city,
        state: school.address.state || "",
        country: school.address.country,
        postalCode: school.address.postalCode || "",
      },
      phone: school.phone || "",
      whatsapp: school.whatsapp || "",
      email: school.email || "",
      website: school.website || "",
    },
  });

  const onSubmit = async (data: CreateSchoolInput) => {
    setIsLoading(true);

    try {
      const result = await schoolsApi.updateSchool(school.id, data);

      if (result.success && result.data) {
        toast.success("School Updated", {
          description: `${data.name} has been successfully updated.`,
        });
        onSuccess?.();
        router.push("/superadmin/schools");
        router.refresh();
      } else {
        const errorMessage = result.message || "Failed to update school";
        toast.error("Error", {
          description: errorMessage,
        });

        if (result.errors && result.errors.length > 0) {
          result.errors.forEach((err) => {
            toast.error(`${err.field}`, {
              description: err.message,
            });
          });
        }
      }
    } catch (error) {
      toast.error("Error", {
        description:
          error instanceof Error ? error.message : "Failed to update school",
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
            <Building2 className="h-6 w-6 text-primary" />
          </div>
          <div>
            <CardTitle className="text-2xl">Edit School</CardTitle>
            <CardDescription>
              Update school details for {school.name}
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Basic Info */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold border-b pb-2">
              Basic Information
            </h3>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name">School Name *</Label>
                <Input
                  id="name"
                  placeholder="e.g., ABC Public School"
                  {...register("name")}
                  disabled={isLoading}
                />
                {errors.name && (
                  <p className="text-sm text-destructive">
                    {errors.name.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="code">School Code *</Label>
                <Input
                  id="code"
                  placeholder="e.g., APS001"
                  {...register("code")}
                  disabled={isLoading}
                  className="uppercase"
                  onChange={(e) => {
                    e.target.value = e.target.value.toUpperCase();
                  }}
                />
                {errors.code && (
                  <p className="text-sm text-destructive">
                    {errors.code.message}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Address Info */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold border-b pb-2">
              Address Details
            </h3>

            <div className="space-y-2">
              <Label htmlFor="address.street">Street Address *</Label>
              <Input
                id="address.street"
                placeholder="Enter street address"
                {...register("address.street")}
                disabled={isLoading}
              />
              {errors.address?.street && (
                <p className="text-sm text-destructive">
                  {errors.address.street.message}
                </p>
              )}
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="address.city">City *</Label>
                <Input
                  id="address.city"
                  placeholder="e.g., Karachi"
                  {...register("address.city")}
                  disabled={isLoading}
                />
                {errors.address?.city && (
                  <p className="text-sm text-destructive">
                    {errors.address.city.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="address.state">State/Province</Label>
                <Input
                  id="address.state"
                  placeholder="e.g., Sindh"
                  {...register("address.state")}
                  disabled={isLoading}
                />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="address.country">Country *</Label>
                <Input
                  id="address.country"
                  placeholder="e.g., Pakistan"
                  {...register("address.country")}
                  disabled={isLoading}
                />
                {errors.address?.country && (
                  <p className="text-sm text-destructive">
                    {errors.address.country.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="address.postalCode">Postal Code</Label>
                <Input
                  id="address.postalCode"
                  placeholder="e.g., 75500"
                  {...register("address.postalCode")}
                  disabled={isLoading}
                />
              </div>
            </div>
          </div>

          {/* Contact Info */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold border-b pb-2">
              Contact Information
            </h3>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  placeholder="e.g., +92-21-12345678"
                  {...register("phone")}
                  disabled={isLoading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="whatsapp">WhatsApp Number</Label>
                <Input
                  id="whatsapp"
                  placeholder="e.g., +92-300-1234567"
                  {...register("whatsapp")}
                  disabled={isLoading}
                />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="info@school.edu.pk"
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
                <Label htmlFor="website">Website</Label>
                <Input
                  id="website"
                  placeholder="https://www.school.edu.pk"
                  {...register("website")}
                  disabled={isLoading}
                />
                {errors.website && (
                  <p className="text-sm text-destructive">
                    {errors.website.message}
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="flex gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button type="submit" className="flex-1" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Updating School...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Update School
                </>
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
