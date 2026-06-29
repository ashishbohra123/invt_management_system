export interface Tenant {
  id: string;
  name: string;
  domains: string[];
  status: "active" | "inactive";
  createdAt: string;
  updatedAt: string;
}

export interface CreateTenantInput {
  name: string;
  domains?: string[];
}

export interface UpdateTenantInput {
  name?: string;
  domains?: string[];
  status?: "active" | "inactive";
}
