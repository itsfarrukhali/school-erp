// src/components/auth/login-form.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2 } from "lucide-react";
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
import { authApi } from "@/lib/api/auth";
import { toast } from "sonner";

const loginSchema = z.object({
  identifier: z
    .string()
    .min(3, "Please enter your username or email")
    .refine(
      (val) => {
        // Check if it's a valid email OR valid username
        const isEmail = z.string().email().safeParse(val).success;
        const isUsername = /^[a-zA-Z0-9_]{3,20}$/.test(val);
        return isEmail || isUsername;
      },
      {
        message: "Please enter a valid email or username",
      }
    ),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

type LoginFormData = z.infer<typeof loginSchema>;

export function LoginForm() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true);

    try {
      const result = await authApi.login(data);

      if (result.success) {
        toast.success("Welcome back!", {
          description: "You have successfully logged in.",
        });
        
        // Get user session to determine role and redirect
        const sessionResponse = await fetch('/api/auth/session');
        const sessionData = await sessionResponse.json();
        
        if (sessionData?.user?.role) {
          const { getDashboardRoute } = await import('@/lib/utils/dashboard-routes');
          const dashboardPath = getDashboardRoute(sessionData.user.role);
          router.push(dashboardPath);
        } else {
          // Fallback to superadmin dashboard if role not found
          router.push('/superadmin');
        }
        
        router.refresh();
      } else {
        toast.error("Login Failed", {
          description:
            result.message || "Invalid credentials. Please try again.",
        });
      }
    } catch {
      toast.error("Login Failed", {
        description: "An unexpected error occurred. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-bold">Welcome Back</CardTitle>
        <CardDescription>
          Enter your credentials to access your account
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="identifier">Username or Email</Label>
            <Input
              id="identifier"
              type="text"
              placeholder="username or email@example.com"
              {...register("identifier")}
              disabled={isLoading}
            />
            {errors.identifier && (
              <p className="text-sm text-destructive">{errors.identifier.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
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

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Logging in...
              </>
            ) : (
              "Login"
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
