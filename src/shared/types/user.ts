import { Role } from "../enums/index.js";

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  status: "active" | "inactive";
  tenantId?: string;
  portalAccess?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateUserInput {
  name: string;
  email: string;
  password: string;
  role: Role;
  tenantId?: string;
}

export interface UpdateUserInput {
  name?: string;
  email?: string;
  role?: Role;
  status?: "active" | "inactive";
}

export interface UserListResponse {
  data: User[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}
