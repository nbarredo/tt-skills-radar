import { LowSync } from "lowdb";
import { LocalStorage } from "lowdb/browser";
import type {
  KnowledgeArea,
  SkillCategory,
  Skill,
  Scale,
  Member,
  MemberProfile,
  MemberSkill,
  Client,
} from "@/types";

// Raw Excel data structure
interface ExcelRow {
  Date: number;
  Email: string;
  Skill: string;
  "Expertise Full Name"?: string;
}

// Database schema
interface DatabaseSchema {
  knowledgeAreas: KnowledgeArea[];
  skillCategories: SkillCategory[];
  skills: Skill[];
  scales: Scale[];
  members: Member[];
  memberProfiles: MemberProfile[];
  memberSkills: MemberSkill[];
  clients: Client[];
  rawExcelData: ExcelRow[];
  isInitialized: boolean;
}

// Default data structure
const defaultData: DatabaseSchema = {
  knowledgeAreas: [],
  skillCategories: [],
  skills: [],
  scales: [],
  members: [],
  memberProfiles: [],
  memberSkills: [],
  clients: [],
  rawExcelData: [],
  isInitialized: false,
};

// Database instance
let db: LowSync<DatabaseSchema> | null = null;

// Initialize database
export function initDatabase() {
  if (!db) {
    const adapter = new LocalStorage<DatabaseSchema>("tt-skills-radar-db");
    db = new LowSync(adapter, defaultData);
    db.read();
    console.log("Database initialized with lowdb");
  }
  return db;
}

// Get database instance
export function getDatabase() {
  if (!db) {
    initDatabase();
  }
  return db!;
}

// Load structured JSON data
export async function loadExcelData() {
  const database = getDatabase();

  // Skip if already initialized
  if (database.data.isInitialized) {
    console.log("Database already initialized");
    return;
  }

  try {
    console.log("Loading data from db.json...");

    // Fetch the JSON data - use relative path for GitHub Pages compatibility
    const basePath = import.meta.env.BASE_URL || "/";
    const dataUrl = `${basePath}data/db.json`.replace(/\/+/g, "/");
    console.log("Fetching from:", dataUrl);
    const response = await fetch(dataUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch data: ${response.statusText}`);
    }

    const structuredData: DatabaseSchema = await response.json();
    console.log("Loaded structured data from db.json");

    // Load all data directly
    database.data.knowledgeAreas = structuredData.knowledgeAreas || [];
    database.data.skillCategories = structuredData.skillCategories || [];
    database.data.skills = structuredData.skills || [];
    database.data.scales = structuredData.scales || [];
    database.data.members = structuredData.members || [];
    database.data.memberProfiles = structuredData.memberProfiles || [];
    database.data.memberSkills = structuredData.memberSkills || [];
    database.data.clients = structuredData.clients || [];
    database.data.rawExcelData = structuredData.rawExcelData || [];
    database.data.isInitialized = true;

    database.write();

    console.log(`Data loaded successfully:
    - Knowledge Areas: ${database.data.knowledgeAreas.length}
    - Skill Categories: ${database.data.skillCategories.length}
    - Skills: ${database.data.skills.length}
    - Scales: ${database.data.scales.length}
    - Members: ${database.data.members.length}
    - Member Profiles: ${database.data.memberProfiles.length}
    - Member Skills: ${database.data.memberSkills.length}
    - Clients: ${database.data.clients.length}`);
  } catch (error) {
    console.error("Failed to load data:", error);
    throw error;
  }
}

// Generic CRUD operations
function getItems<T>(collection: keyof DatabaseSchema): T[] {
  const database = getDatabase();
  return database.data[collection] as unknown as T[];
}

function addItem<T extends { id: string }>(
  collection: keyof DatabaseSchema,
  item: T
): void {
  const database = getDatabase();
  (database.data[collection] as unknown as T[]).push(item);
  database.write();
}

function updateItem<T extends { id: string }>(
  collection: keyof DatabaseSchema,
  id: string,
  updates: Partial<T>
): void {
  const database = getDatabase();
  const items = database.data[collection] as unknown as T[];
  const index = items.findIndex((item) => item.id === id);
  console.log(`Updating ${collection} with id ${id}:`, updates);
  console.log(`Found item at index: ${index}`);
  if (index !== -1) {
    const oldItem = items[index];
    items[index] = { ...items[index], ...updates };
    console.log(`Updated item from:`, oldItem);
    console.log(`Updated item to:`, items[index]);
    database.write();
    console.log(`Successfully updated ${collection} with id ${id}`);
  } else {
    console.log(`Item with id ${id} not found in ${collection}`);
  }
}

function deleteItem<T extends { id: string }>(
  collection: keyof DatabaseSchema,
  id: string
): void {
  const database = getDatabase();
  const items = database.data[collection] as unknown as T[];
  const filtered = items.filter((item) => item.id !== id);
  (database.data[collection] as unknown as T[]) = filtered;
  database.write();
}

// Knowledge Areas
export const knowledgeAreaDb = {
  getAll: () => getItems<KnowledgeArea>("knowledgeAreas"),
  getById: (id: string) => {
    const items = getItems<KnowledgeArea>("knowledgeAreas");
    return items.find((item) => item.id === id);
  },
  add: (item: KnowledgeArea) => addItem("knowledgeAreas", item),
  update: (id: string, updates: Partial<KnowledgeArea>) =>
    updateItem("knowledgeAreas", id, updates),
  delete: (id: string) => deleteItem("knowledgeAreas", id),
};

// Skill Categories
export const skillCategoryDb = {
  getAll: () => getItems<SkillCategory>("skillCategories"),
  getById: (id: string) => {
    const items = getItems<SkillCategory>("skillCategories");
    return items.find((item) => item.id === id);
  },
  add: (item: SkillCategory) => addItem("skillCategories", item),
  update: (id: string, updates: Partial<SkillCategory>) =>
    updateItem("skillCategories", id, updates),
  delete: (id: string) => deleteItem("skillCategories", id),
};

// Skills
export const skillDb = {
  getAll: () => getItems<Skill>("skills"),
  getById: (id: string) => {
    const items = getItems<Skill>("skills");
    return items.find((item) => item.id === id);
  },
  add: (item: Skill) => addItem("skills", item),
  update: (id: string, updates: Partial<Skill>) =>
    updateItem("skills", id, updates),
  delete: (id: string) => deleteItem("skills", id),
  getByKnowledgeArea: (knowledgeAreaId: string) => {
    const items = getItems<Skill>("skills");
    return items.filter((skill) => skill.knowledgeAreaId === knowledgeAreaId);
  },
  getByCategory: (categoryId: string) => {
    const items = getItems<Skill>("skills");
    return items.filter((skill) => skill.skillCategoryId === categoryId);
  },
};

// Scales
export const scaleDb = {
  getAll: () => getItems<Scale>("scales"),
  getById: (id: string) => {
    const items = getItems<Scale>("scales");
    return items.find((item) => item.id === id);
  },
  add: (item: Scale) => addItem("scales", item),
  update: (id: string, updates: Partial<Scale>) =>
    updateItem("scales", id, updates),
  delete: (id: string) => deleteItem("scales", id),
};

// Members
export const memberDb = {
  getAll: () => getItems<Member>("members"),
  getById: (id: string) => {
    const items = getItems<Member>("members");
    return items.find((item) => item.id === id);
  },
  getByEmail: (email: string) => {
    const items = getItems<Member>("members");
    return items.find((item) => item.corporateEmail === email);
  },
  add: (item: Member) => addItem("members", item),
  update: (id: string, updates: Partial<Member>) =>
    updateItem("members", id, updates),
  delete: (id: string) => deleteItem("members", id),
  getByAvailabilityStatus: (status: string) => {
    const items = getItems<Member>("members");
    return items.filter((item) => item.availabilityStatus === status);
  },
  getByCategory: (category: string) => {
    const items = getItems<Member>("members");
    return items.filter((item) => item.category === category);
  },
};

// Member Profiles
export const memberProfileDb = {
  getAll: () => getItems<MemberProfile>("memberProfiles"),
  getById: (id: string) => {
    const items = getItems<MemberProfile>("memberProfiles");
    return items.find((item) => item.id === id);
  },
  getByMemberId: (memberId: string) => {
    const items = getItems<MemberProfile>("memberProfiles");
    return items.find((item) => item.memberId === memberId);
  },
  add: (item: MemberProfile) => addItem("memberProfiles", item),
  update: (id: string, updates: Partial<MemberProfile>) =>
    updateItem("memberProfiles", id, updates),
  delete: (id: string) => deleteItem("memberProfiles", id),
};

// Member Skills
export const memberSkillDb = {
  getAll: () => getItems<MemberSkill>("memberSkills"),
  getByMemberId: (memberId: string) => {
    const items = getItems<MemberSkill>("memberSkills");
    return items.filter((item) => item.memberId === memberId);
  },
  getBySkillId: (skillId: string) => {
    const items = getItems<MemberSkill>("memberSkills");
    return items.filter((item) => item.skillId === skillId);
  },
  add: (item: MemberSkill) => {
    const database = getDatabase();
    const items = database.data.memberSkills;
    // Remove existing skill for this member if it exists
    const filtered = items.filter(
      (ms) => !(ms.memberId === item.memberId && ms.skillId === item.skillId)
    );
    filtered.push(item);
    database.data.memberSkills = filtered;
    database.write();
  },
  delete: (memberId: string, skillId: string) => {
    const database = getDatabase();
    const items = database.data.memberSkills;
    const filtered = items.filter(
      (item) => !(item.memberId === memberId && item.skillId === skillId)
    );
    database.data.memberSkills = filtered;
    database.write();
  },
  deleteByMemberId: (memberId: string) => {
    const database = getDatabase();
    const items = database.data.memberSkills;
    const filtered = items.filter((item) => item.memberId !== memberId);
    database.data.memberSkills = filtered;
    database.write();
  },
};

// Clients
export const clientDb = {
  getAll: () => getItems<Client>("clients"),
  getById: (id: string) => {
    const items = getItems<Client>("clients");
    return items.find((item) => item.id === id);
  },
  add: (item: Client) => addItem("clients", item),
  update: (id: string, updates: Partial<Client>) =>
    updateItem("clients", id, updates),
  delete: (id: string) => deleteItem("clients", id),
};

// Utility functions
export const dbUtils = {
  isInitialized: () => {
    const database = getDatabase();
    return database.data.isInitialized;
  },
  reset: () => {
    const database = getDatabase();
    Object.assign(database.data, defaultData);
    database.write();
    console.log("Database reset to defaults");
  },
  forceReload: async () => {
    // Clear localStorage cache if it exists
    if (typeof window !== "undefined") {
      localStorage.removeItem("tt-skills-radar-db");
      console.log("Cleared localStorage cache");
    }

    // Reset and reload from JSON file
    const database = getDatabase();
    Object.assign(database.data, defaultData);

    // Force reload from Excel data
    await loadExcelData();
    console.log("Force reloaded database from JSON file");
  },
  getStats: () => {
    const database = getDatabase();
    return {
      members: database.data.members.length,
      skills: database.data.skills.length,
      memberSkills: database.data.memberSkills.length,
      knowledgeAreas: database.data.knowledgeAreas.length,
      skillCategories: database.data.skillCategories.length,
      scales: database.data.scales.length,
      rawDataRows: database.data.rawExcelData.length,
      isInitialized: database.data.isInitialized,
    };
  },
};

// Legacy bulk operations for backwards compatibility
export const bulkOperations = {
  addMembers: (members: Member[]) => {
    const database = getDatabase();
    database.data.members.push(...members);
    database.write();
  },
  addMemberProfiles: (profiles: MemberProfile[]) => {
    const database = getDatabase();
    database.data.memberProfiles.push(...profiles);
    database.write();
  },
  addSkills: (skills: Skill[]) => {
    const database = getDatabase();
    database.data.skills.push(...skills);
    database.write();
  },
  addMemberSkills: (memberSkills: MemberSkill[]) => {
    const database = getDatabase();
    database.data.memberSkills.push(...memberSkills);
    database.write();
  },
  createDefaultEntities: () => {
    const database = getDatabase();

    if (database.data.knowledgeAreas.length === 0) {
      const defaultKnowledgeArea: KnowledgeArea = {
        id: crypto.randomUUID(),
        name: "Technologies",
        description: "Technical skills and technologies",
      };
      database.data.knowledgeAreas.push(defaultKnowledgeArea);
    }

    if (database.data.skillCategories.length === 0) {
      const defaultCategory: SkillCategory = {
        id: crypto.randomUUID(),
        name: "Technical Skills",
        criterion: "Technical proficiency and experience",
      };
      database.data.skillCategories.push(defaultCategory);
    }

    if (database.data.scales.length === 0) {
      const defaultScale: Scale = {
        id: crypto.randomUUID(),
        name: "Proficiency Level",
        type: "Numeric",
        values: ["1", "2", "3", "4", "5"],
      };
      database.data.scales.push(defaultScale);
    }

    database.write();

    return {
      defaultKnowledgeArea: database.data.knowledgeAreas[0],
      defaultCategory: database.data.skillCategories[0],
      defaultScale: database.data.scales[0],
    };
  },
};
