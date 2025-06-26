export interface KnowledgeArea {
  id: string;
  name: string;
  description: string;
}

export interface SkillCategory {
  id: string;
  name: string;
  criterion: string;
}

export interface Skill {
  id: string;
  name: string;
  purpose: string;
  knowledgeAreaId: string;
  skillCategoryId: string;
}

export interface Scale {
  id: string;
  name: string;
  type: string;
  values: string[];
}

export interface Member {
  id: string;
  corporateEmail: string;
  fullName: string;
  hireDate: string;
  currentAssignedClient: string;
  category: "Starter" | "Builder" | "Solver" | "Wizard";
  location: string;
  availabilityStatus: "Available" | "Available Soon" | "Assigned";
  photoUrl?: string;
}

export interface ContactInfo {
  email: string;
  phone?: string;
  workPhone?: string;
  cellPhone?: string;
  skype?: string;
}

export interface SocialConnections {
  linkedin?: string;
  github?: string;
  twitter?: string;
}

export interface Assignment {
  id: string;
  clientName: string;
  projectName: string;
  role: string;
  startDate: string;
  endDate?: string;
  description: string;
  technologies?: string[];
}

export interface Role {
  id: string;
  name: string;
  description: string;
  category: string;
}

export interface Appreciation {
  id: string;
  clientName: string;
  message: string;
  date: string;
  rating?: number;
}

export interface Feedback {
  id: string;
  source: string;
  message: string;
  date: string;
  type: "positive" | "constructive" | "neutral";
}

export interface TalentPoolPeriod {
  id: string;
  startDate: string;
  endDate?: string;
  reason: string;
}

export interface Certification {
  id: string;
  name: string;
  issuer: string;
  dateObtained: string;
  expiryDate?: string;
  credentialId?: string;
  verificationUrl?: string;
}

export interface Assessment {
  id: string;
  name: string;
  score: number;
  maxScore: number;
  completedDate: string;
  assessor: string;
}

export interface MemberProfile {
  id: string;
  memberId: string;
  assignments: Assignment[];
  rolesAndTasks: string[];
  appreciationsFromClients: string[];
  feedbackComments: string[];
  periodsInTalentPool: TalentPoolPeriod[];
  aboutMe: string;
  bio: string;
  contactInfo: ContactInfo;
  socialConnections: SocialConnections;
  status: "Active" | "Inactive" | "On Leave" | "Terminated";
  badges: string[];
  certifications: Certification[];
  assessments: Assessment[];
  careerInterests: string[];
  professionalGoals: string[];
}

export interface MemberSkill {
  memberId: string;
  skillId: string;
  scaleId: string;
  proficiencyValue: string;
}

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
  endDate?: string;
  role?: string;
  status: "Active" | "Completed" | "Planned";
  notes?: string;
  createdAt: string;
  updatedAt: string;
}
