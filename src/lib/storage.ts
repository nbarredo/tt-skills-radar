import type {
  KnowledgeArea,
  SkillCategory,
  Skill,
  Scale,
  Member,
  MemberProfile,
  MemberSkill,
} from "@/types";
import type { Client, MemberAssignment } from "@/lib/types";

const STORAGE_KEYS = {
  KNOWLEDGE_AREAS: "knowledgeAreas",
  SKILL_CATEGORIES: "skillCategories",
  SKILLS: "skills",
  SCALES: "scales",
  MEMBERS: "members",
  MEMBER_PROFILES: "memberProfiles",
  MEMBER_SKILLS: "memberSkills",
  CLIENTS: "clients",
  MEMBER_ASSIGNMENTS: "memberAssignments",
};

// Generic CRUD operations
function getItems<T>(key: string): T[] {
  const data = localStorage.getItem(key);
  return data ? JSON.parse(data) : [];
}

function setItems<T>(key: string, items: T[]): void {
  localStorage.setItem(key, JSON.stringify(items));
}

function addItem<T extends { id: string }>(key: string, item: T): void {
  const items = getItems<T>(key);
  items.push(item);
  setItems(key, items);
}

function updateItem<T extends { id: string }>(
  key: string,
  id: string,
  updates: Partial<T>
): void {
  const items = getItems<T>(key);
  const index = items.findIndex((item) => item.id === id);
  if (index !== -1) {
    items[index] = { ...items[index], ...updates };
    setItems(key, items);
  }
}

function deleteItem<T extends { id: string }>(key: string, id: string): void {
  const items = getItems<T>(key);
  const filtered = items.filter((item) => item.id !== id);
  setItems(key, filtered);
}

// Knowledge Areas
export const knowledgeAreaStorage = {
  getAll: () => getItems<KnowledgeArea>(STORAGE_KEYS.KNOWLEDGE_AREAS),
  getById: (id: string) =>
    getItems<KnowledgeArea>(STORAGE_KEYS.KNOWLEDGE_AREAS).find(
      (item) => item.id === id
    ),
  add: (item: KnowledgeArea) => addItem(STORAGE_KEYS.KNOWLEDGE_AREAS, item),
  update: (id: string, updates: Partial<KnowledgeArea>) =>
    updateItem(STORAGE_KEYS.KNOWLEDGE_AREAS, id, updates),
  delete: (id: string) => deleteItem(STORAGE_KEYS.KNOWLEDGE_AREAS, id),
};

// Skill Categories
export const skillCategoryStorage = {
  getAll: () => getItems<SkillCategory>(STORAGE_KEYS.SKILL_CATEGORIES),
  getById: (id: string) =>
    getItems<SkillCategory>(STORAGE_KEYS.SKILL_CATEGORIES).find(
      (item) => item.id === id
    ),
  add: (item: SkillCategory) => addItem(STORAGE_KEYS.SKILL_CATEGORIES, item),
  update: (id: string, updates: Partial<SkillCategory>) =>
    updateItem(STORAGE_KEYS.SKILL_CATEGORIES, id, updates),
  delete: (id: string) => deleteItem(STORAGE_KEYS.SKILL_CATEGORIES, id),
};

// Skills
export const skillStorage = {
  getAll: () => getItems<Skill>(STORAGE_KEYS.SKILLS),
  getById: (id: string) =>
    getItems<Skill>(STORAGE_KEYS.SKILLS).find((item) => item.id === id),
  add: (item: Skill) => addItem(STORAGE_KEYS.SKILLS, item),
  update: (id: string, updates: Partial<Skill>) =>
    updateItem(STORAGE_KEYS.SKILLS, id, updates),
  delete: (id: string) => deleteItem(STORAGE_KEYS.SKILLS, id),
  getByKnowledgeArea: (knowledgeAreaId: string) =>
    getItems<Skill>(STORAGE_KEYS.SKILLS).filter(
      (skill) => skill.knowledgeAreaId === knowledgeAreaId
    ),
  getByCategory: (categoryId: string) =>
    getItems<Skill>(STORAGE_KEYS.SKILLS).filter(
      (skill) => skill.skillCategoryId === categoryId
    ),
};

// Scales
export const scaleStorage = {
  getAll: () => getItems<Scale>(STORAGE_KEYS.SCALES),
  getById: (id: string) =>
    getItems<Scale>(STORAGE_KEYS.SCALES).find((item) => item.id === id),
  add: (item: Scale) => addItem(STORAGE_KEYS.SCALES, item),
  update: (id: string, updates: Partial<Scale>) =>
    updateItem(STORAGE_KEYS.SCALES, id, updates),
  delete: (id: string) => deleteItem(STORAGE_KEYS.SCALES, id),
};

// Members
export const memberStorage = {
  getAll: () => getItems<Member>(STORAGE_KEYS.MEMBERS),
  getById: (id: string) =>
    getItems<Member>(STORAGE_KEYS.MEMBERS).find((item) => item.id === id),
  getByEmail: (email: string) =>
    getItems<Member>(STORAGE_KEYS.MEMBERS).find(
      (item) => item.corporateEmail === email
    ),
  add: (item: Member) => addItem(STORAGE_KEYS.MEMBERS, item),
  update: (id: string, updates: Partial<Member>) =>
    updateItem(STORAGE_KEYS.MEMBERS, id, updates),
  delete: (id: string) => deleteItem(STORAGE_KEYS.MEMBERS, id),
};

// Member Profiles
export const memberProfileStorage = {
  getAll: () => getItems<MemberProfile>(STORAGE_KEYS.MEMBER_PROFILES),
  getById: (id: string) =>
    getItems<MemberProfile>(STORAGE_KEYS.MEMBER_PROFILES).find(
      (item) => item.id === id
    ),
  getByMemberId: (memberId: string) =>
    getItems<MemberProfile>(STORAGE_KEYS.MEMBER_PROFILES).find(
      (item) => item.memberId === memberId
    ),
  add: (item: MemberProfile) => addItem(STORAGE_KEYS.MEMBER_PROFILES, item),
  update: (id: string, updates: Partial<MemberProfile>) =>
    updateItem(STORAGE_KEYS.MEMBER_PROFILES, id, updates),
  delete: (id: string) => deleteItem(STORAGE_KEYS.MEMBER_PROFILES, id),
};

// Member Skills
export const memberSkillStorage = {
  getAll: () => getItems<MemberSkill>(STORAGE_KEYS.MEMBER_SKILLS),
  getByMemberId: (memberId: string) =>
    getItems<MemberSkill>(STORAGE_KEYS.MEMBER_SKILLS).filter(
      (item) => item.memberId === memberId
    ),
  getBySkillId: (skillId: string) =>
    getItems<MemberSkill>(STORAGE_KEYS.MEMBER_SKILLS).filter(
      (item) => item.skillId === skillId
    ),
  add: (item: MemberSkill) => {
    const items = getItems<MemberSkill>(STORAGE_KEYS.MEMBER_SKILLS);
    // Remove existing skill for this member if it exists
    const filtered = items.filter(
      (ms) => !(ms.memberId === item.memberId && ms.skillId === item.skillId)
    );
    filtered.push(item);
    setItems(STORAGE_KEYS.MEMBER_SKILLS, filtered);
  },
  delete: (memberId: string, skillId: string) => {
    const items = getItems<MemberSkill>(STORAGE_KEYS.MEMBER_SKILLS);
    const filtered = items.filter(
      (item) => !(item.memberId === memberId && item.skillId === skillId)
    );
    setItems(STORAGE_KEYS.MEMBER_SKILLS, filtered);
  },
  deleteByMemberId: (memberId: string) => {
    const items = getItems<MemberSkill>(STORAGE_KEYS.MEMBER_SKILLS);
    const filtered = items.filter((item) => item.memberId !== memberId);
    setItems(STORAGE_KEYS.MEMBER_SKILLS, filtered);
  },
};

// Clients
export const clientStorage = {
  getAll: () => getItems<Client>(STORAGE_KEYS.CLIENTS),
  getById: (id: string) =>
    getItems<Client>(STORAGE_KEYS.CLIENTS).find((item) => item.id === id),
  add: (item: Client) => addItem(STORAGE_KEYS.CLIENTS, item),
  update: (id: string, updates: Partial<Client>) =>
    updateItem(STORAGE_KEYS.CLIENTS, id, updates),
  delete: (id: string) => deleteItem(STORAGE_KEYS.CLIENTS, id),
};

// Member Assignments
export const memberAssignmentStorage = {
  getAll: () => getItems<MemberAssignment>(STORAGE_KEYS.MEMBER_ASSIGNMENTS),
  getById: (id: string) =>
    getItems<MemberAssignment>(STORAGE_KEYS.MEMBER_ASSIGNMENTS).find(
      (item) => item.id === id
    ),
  getByMemberId: (memberId: string) =>
    getItems<MemberAssignment>(STORAGE_KEYS.MEMBER_ASSIGNMENTS).filter(
      (item) => item.memberId === memberId
    ),
  getByClientId: (clientId: string) =>
    getItems<MemberAssignment>(STORAGE_KEYS.MEMBER_ASSIGNMENTS).filter(
      (item) => item.clientId === clientId
    ),
  add: (item: MemberAssignment) => addItem(STORAGE_KEYS.MEMBER_ASSIGNMENTS, item),
  update: (id: string, updates: Partial<MemberAssignment>) =>
    updateItem(STORAGE_KEYS.MEMBER_ASSIGNMENTS, id, updates),
  delete: (id: string) => deleteItem(STORAGE_KEYS.MEMBER_ASSIGNMENTS, id),
};
