// src/types/next-auth.d.ts
import { Role, Status } from "@prisma/client";
import { DefaultUser } from "next-auth";
import { JWT as DefaultJWT } from "next-auth/jwt";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      uid: string;
      email: string;
      username: string;
      role: Role;
      firstName: string;
      lastName: string;
      status: Status;
      isEmailVerified: boolean;
      schools: Array<{
        schoolId: string;
        schoolName: string;
        roleForSchool: Role;
      }>;
      campuses: Array<{
        campusId: string;
        campusName: string;
        roleAtCampus: Role | null;
      }>;
      permissions: string[];
    };
  }

  interface User extends DefaultUser {
    uid: string;
    username: string;
    role: Role;
    firstName: string;
    lastName: string;
    status: Status;
    isEmailVerified: boolean;
    schools: Array<{
      schoolId: string;
      schoolName: string;
      roleForSchool: Role;
    }>;
    campuses: Array<{
      campusId: string;
      campusName: string;
      roleAtCampus: Role | null;
    }>;
    permissions: string[];
  }
}

declare module "next-auth/jwt" {
  interface JWT extends DefaultJWT {
    uid: string;
    username: string;
    role: Role;
    firstName: string;
    lastName: string;
    status: Status;
    isEmailVerified: boolean;
    schools: Array<{
      schoolId: string;
      schoolName: string;
      roleForSchool: Role;
    }>;
    campuses: Array<{
      campusId: string;
      campusName: string;
      roleAtCampus: Role | null;
    }>;
    permissions: string[];
  }
}