// src/app/api/auth/[...nextauth]/route.ts
import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import prisma from "@/lib/prisma";
import { verifyPassword } from "@/utils/password";

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        identifier: { label: "Username or Email", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.identifier || !credentials?.password) {
          throw new Error("Username/Email and password are required");
        }

        try {
          // Check if identifier is email or username
          const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(credentials.identifier);
          
          const user = await prisma.user.findUnique({
            where: isEmail ? { email: credentials.identifier } : { username: credentials.identifier },
            include: {
              schools: {
                include: {
                  school: {
                    select: {
                      id: true,
                      name: true,
                    },
                  },
                },
              },
              campuses: {
                include: {
                  campus: {
                    select: {
                      id: true,
                      name: true,
                    },
                  },
                },
              },
              userPermissions: {
                where: { allowed: true },
                include: {
                  permission: {
                    select: {
                      name: true,
                    },
                  },
                },
              },
            },
          });

          if (!user) {
            throw new Error("Invalid email or password");
          }

          if (!user.isEmailVerified) {
            throw new Error("Please verify your email before logging in");
          }

          if (user.status !== "ACTIVE") {
            throw new Error(
              `Account is ${user.status.toLowerCase()}. Please contact administrator`
            );
          }

          const isPasswordValid = await verifyPassword(
            credentials.password,
            user.password
          );

          if (!isPasswordValid) {
            throw new Error("Invalid email or password");
          }

          await prisma.user.update({
            where: { id: user.id },
            data: { lastLogin: new Date() },
          });

          const rolePermissions = await prisma.rolePermission.findMany({
            where: {
              role: user.role,
              allowed: true,
            },
            include: {
              permission: {
                select: {
                  name: true,
                },
              },
            },
          });

          const allPermissions = new Set([
            ...user.userPermissions.map((up) => up.permission.name),
            ...rolePermissions.map((rp) => rp.permission.name),
          ]);

          return {
            id: user.id,
            uid: user.uid,
            email: user.email,
            username: user.username,
            role: user.role,
            firstName: user.firstName,
            lastName: user.lastName,
            status: user.status,
            isEmailVerified: user.isEmailVerified,
            schools: user.schools.map((us) => ({
              schoolId: us.school.id,
              schoolName: us.school.name,
              roleForSchool: us.roleForSchool,
            })),
            campuses: user.campuses.map((uc) => ({
              campusId: uc.campus.id,
              campusName: uc.campus.name,
              roleAtCampus: uc.roleAtCampus,
            })),
            permissions: Array.from(allPermissions),
          };
        } catch (error) {
          console.error("Authorization error:", error);
          throw error;
        }
      },
    }),
  ],
  session: {
    strategy: "jwt",
    maxAge: 7 * 24 * 60 * 60, // 7 days
  },
  pages: {
    signIn: "/login",
    error: "/auth/error",
    verifyRequest: "/auth/verify-email",
  },
  callbacks: {
    async jwt({ token, user, trigger }) {
      if (user) {
        token.uid = user.uid;
        token.username = user.username;
        token.role = user.role;
        token.firstName = user.firstName;
        token.lastName = user.lastName;
        token.status = user.status;
        token.isEmailVerified = user.isEmailVerified;
        token.schools = user.schools;
        token.campuses = user.campuses;
        token.permissions = user.permissions;
      }

      if (trigger === "update") {
        const updatedUser = await prisma.user.findUnique({
          where: { id: token.sub as string },
          include: {
            schools: {
              include: {
                school: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
              },
            },
            campuses: {
              include: {
                campus: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
              },
            },
            userPermissions: {
              where: { allowed: true },
              include: {
                permission: {
                  select: {
                    name: true,
                  },
                },
              },
            },
          },
        });

        if (updatedUser) {
          const rolePermissions = await prisma.rolePermission.findMany({
            where: {
              role: updatedUser.role,
              allowed: true,
            },
            include: {
              permission: {
                select: {
                  name: true,
                },
              },
            },
          });

          const allPermissions = new Set([
            ...updatedUser.userPermissions.map((up) => up.permission.name),
            ...rolePermissions.map((rp) => rp.permission.name),
          ]);

          token.role = updatedUser.role;
          token.status = updatedUser.status;
          token.isEmailVerified = updatedUser.isEmailVerified;
          token.schools = updatedUser.schools.map((us) => ({
            schoolId: us.school.id,
            schoolName: us.school.name,
            roleForSchool: us.roleForSchool,
          }));
          token.campuses = updatedUser.campuses.map((uc) => ({
            campusId: uc.campus.id,
            campusName: uc.campus.name,
            roleAtCampus: uc.roleAtCampus,
          }));
          token.permissions = Array.from(allPermissions);
        }
      }

      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.sub as string;
        session.user.uid = token.uid;
        session.user.username = token.username;
        session.user.role = token.role;
        session.user.firstName = token.firstName;
        session.user.lastName = token.lastName;
        session.user.status = token.status;
        session.user.isEmailVerified = token.isEmailVerified;
        session.user.schools = token.schools;
        session.user.campuses = token.campuses;
        session.user.permissions = token.permissions;
      }
      return session;
    },
  },
  events: {
    async signOut({ token }) {
      if (token.sub) {
        await prisma.user.update({
          where: { id: token.sub },
          data: { lastLogout: new Date() },
        });
      }
    },
  },
  debug: process.env.NODE_ENV === "development",
  secret: process.env.NEXTAUTH_SECRET,
};

