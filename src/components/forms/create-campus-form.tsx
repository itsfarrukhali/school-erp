// src/components/forms/create-campus-form.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Building2 } from "lucide-react";
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
import { createCampusSchema, type CreateCampusInput } from "@/validations/user";
import { campusesApi } from "@/lib/api/campuses";

interface CreateCampusFormProps {
  schoolId: string;
  schoolName: string;
  onSuccess?: () => void;
}

export function CreateCampusForm({ schoolId, schoolName, onSuccess }: CreateCampusFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<CreateCampusInput>({
    resolver: zodResolver(createCampusSchema),
    defaultValues: {
      name: "",
      schoolId: schoolId,
      address: {
        street: "",
        city: "",
        state: "",
        country: "Pakistan",
        postalCode: "",
      },
      phone: "",
    },
  });

  const onSubmit = async (data: CreateCampusInput) => {
    setIsLoading(true);

    try {
      const result = await campusesApi.createCampus(data);

      if (result.success && result.data) {
        toast.success("Campus Created", {
          description: `${data.name} has been successfully created for ${schoolName}.`,
        });
        reset();
        onSuccess?.();
        router.push("/superadmin/schools"); // Or redirect to school details
        router.refresh();
      } else {
        const errorMessage = result.message || "Failed to create campus";
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
          error instanceof Error ? error.message : "Failed to create campus",
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
            <CardTitle className="text-2xl">Create New Campus</CardTitle>
            <CardDescription>
              Add a new campus for <span className="font-semibold">{schoolName}</span>
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <input type="hidden" {...register("schoolId")} value={schoolId} />
          
          {/* Basic Info */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold border-b pb-2">
              Basic Information
            </h3>

            <div className="space-y-2">
              <Label htmlFor="name">Campus Name *</Label>
              <Input
                id="name"
                placeholder="e.g., North Campus"
                {...register("name")}
                disabled={isLoading}
              />
              {errors.name && (
                <p className="text-sm text-destructive">
                  {errors.name.message}
                </p>
              )}
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

            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                placeholder="e.g., +92-21-12345678"
                {...register("phone")}
                disabled={isLoading}
              />
            </div>
          </div>

          <div className="flex gap-4">
            <Button type="submit" className="flex-1" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating Campus...
                </>
              ) : (
                <>
                  <Building2 className="mr-2 h-4 w-4" />
                  Create Campus
                </>
              )}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
              disabled={isLoading}
            >
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
