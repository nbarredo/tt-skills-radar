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
  workPhone?: string;
  cellPhone?: string;
  skype?: string;
}

export interface SocialConnections {
  linkedin?: string;
  twitter?: string;
}

export interface Certification {
  name: string;
  license: string;
  date: string;
}

export interface Assessment {
  name: string;
  score: string;
  date: string;
}

export interface MemberProfile {
  id: string;
  memberId: string;
  assignments: string[];
  rolesAndTasks: string[];
  appreciationsFromClients: string[];
  feedbackComments: string[];
  periodsInTalentPool: string[];
  aboutMe: string;
  bio: string;
  contactInfo: ContactInfo;
  socialConnections: SocialConnections;
  status: string;
  badges: string[];
  certifications: Certification[];
  assessments: Assessment[];
}

export interface MemberSkill {
  memberId: string;
  skillId: string;
  scaleId: string;
  proficiencyValue: string;
}
