export interface Client {
  id: string;
  name: string;
  description?: string;
  industry?: string;
  location?: string;
  status: "Active" | "Inactive";
  createdAt: string;
  updatedAt: string;
}

export interface MemberAssignment {
  id: string;
  memberId: string;
  clientId: string;
  startDate: string;
  endDate?: string; // Optional for current assignments
  role?: string;
  status: "Active" | "Completed" | "Planned";
  notes?: string;
  createdAt: string;
  updatedAt: string;
}
