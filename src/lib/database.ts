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

// Load and process Excel data
export async function loadExcelData() {
  const database = getDatabase();

  // Skip if already initialized
  if (database.data.isInitialized) {
    console.log("Database already initialized with Excel data");
    return;
  }

  try {
    console.log("Loading Excel data from bootcamp-skills.json...");

    // Fetch the JSON data
    const response = await fetch("/data/bootcamp-skills.json");
    if (!response.ok) {
      throw new Error(`Failed to fetch Excel data: ${response.statusText}`);
    }

    const rawData: ExcelRow[] = await response.json();
    console.log(`Loaded ${rawData.length} rows from Excel data`);

    // Store raw data
    database.data.rawExcelData = rawData;

    // Process the data
    await processExcelData(rawData);

    // Mark as initialized
    database.data.isInitialized = true;
    database.write();

    console.log("Excel data processing completed successfully");
  } catch (error) {
    console.error("Failed to load Excel data:", error);
    throw error;
  }
}

// Process Excel data into structured entities
async function processExcelData(rawData: ExcelRow[]) {
  const database = getDatabase();

  // Create default entities
  const defaultKnowledgeArea: KnowledgeArea = {
    id: crypto.randomUUID(),
    name: "Technologies",
    description: "Technical skills and technologies",
  };

  const defaultCategory: SkillCategory = {
    id: crypto.randomUUID(),
    name: "Technical Skills",
    criterion: "Technical proficiency and experience",
  };

  const defaultScale: Scale = {
    id: crypto.randomUUID(),
    name: "Proficiency Level",
    type: "Numeric",
    values: ["1", "2", "3", "4", "5"],
  };

  database.data.knowledgeAreas = [defaultKnowledgeArea];
  database.data.skillCategories = [defaultCategory];
  database.data.scales = [defaultScale];

  // Process members and skills
  const memberMap = new Map<string, Member>();
  const skillMap = new Map<string, Skill>();
  const memberSkills: MemberSkill[] = [];

  let processedRows = 0;

  for (const row of rawData) {
    try {
      // Skip rows with missing essential data
      if (!row.Email || !row.Skill || row.Skill.trim() === "") {
        continue;
      }

      // Skip open-ended questions without expertise levels
      if (
        !row["Expertise Full Name"] ||
        row["Expertise Full Name"] === "undefined" ||
        row["Expertise Full Name"].trim() === ""
      ) {
        // Only skip if it looks like an open-ended question
        if (
          row.Skill.toLowerCase().includes("other") ||
          row.Skill.toLowerCase().includes("share") ||
          row.Skill.toLowerCase().includes("please") ||
          row.Skill.toLowerCase().includes("additional")
        ) {
          continue;
        }
      }

      const email = row.Email.trim();
      const skillName = row.Skill.trim();
      const expertiseText = row["Expertise Full Name"] || "";

      // Create member if not exists
      if (!memberMap.has(email)) {
        const member = generateMemberFromEmail(email);
        memberMap.set(email, member);
      }

      // Create skill if not exists
      if (!skillMap.has(skillName.toLowerCase())) {
        const skill: Skill = {
          id: crypto.randomUUID(),
          name: skillName,
          purpose: `Technical skill: ${skillName}`,
          knowledgeAreaId: defaultKnowledgeArea.id,
          skillCategoryId: defaultCategory.id,
        };
        skillMap.set(skillName.toLowerCase(), skill);
      }

      // Create member skill assignment
      const member = memberMap.get(email)!;
      const skill = skillMap.get(skillName.toLowerCase())!;
      const proficiencyLevel = mapProficiencyLevel(expertiseText);

      const memberSkill: MemberSkill = {
        memberId: member.id,
        skillId: skill.id,
        scaleId: defaultScale.id,
        proficiencyValue: proficiencyLevel.toString(),
      };

      memberSkills.push(memberSkill);
    } catch (error) {
      console.warn(`Error processing row ${processedRows + 1}:`, error);
    }

    processedRows++;
  }

  // Store processed data
  database.data.members = Array.from(memberMap.values());
  database.data.skills = Array.from(skillMap.values());
  database.data.memberSkills = memberSkills;

  // Create member profiles
  database.data.memberProfiles = database.data.members.map((member) =>
    generateMemberProfile(member.id)
  );

  console.log(`Processed data:
    - Members: ${database.data.members.length}
    - Skills: ${database.data.skills.length}
    - Member Skills: ${database.data.memberSkills.length}`);
}

// Helper functions
function mapProficiencyLevel(expertiseText: string): number {
  if (
    !expertiseText ||
    expertiseText === "undefined" ||
    expertiseText.trim() === ""
  ) {
    return 2; // Default level
  }

  const text = expertiseText.toLowerCase();

  // Standard format mapping
  if (text.includes("(1)") || text.includes("don't know")) return 1;
  if (text.includes("(2)") || text.includes("know but didn't use")) return 2;
  if (
    text.includes("(3)") ||
    text.includes("know well") ||
    text.includes("used it several times")
  )
    return 3;
  if (
    text.includes("(4)") ||
    text.includes("wide knowledge") ||
    text.includes("reference")
  )
    return 4;
  if (text.includes("(5)") || text.includes("expert")) return 5;

  // Custom descriptions mapping
  if (
    text.includes("expert") ||
    text.includes("reference") ||
    text.includes("senior")
  )
    return 4;
  if (
    text.includes("know well") ||
    text.includes("experience") ||
    text.includes("comfortable")
  )
    return 3;
  if (text.includes("used") || text.includes("tried") || text.includes("basic"))
    return 2;
  if (text.includes("heard") || text.includes("aware")) return 1;

  return 2; // Default fallback
}

function generateMemberFromEmail(email: string): Member {
  const name = email
    .split("@")[0]
    .split(".")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");

  return {
    id: crypto.randomUUID(),
    corporateEmail: email,
    fullName: name,
    hireDate: new Date().toISOString().split("T")[0],
    currentAssignedClient: "Not Assigned",
    category: "Starter",
    location: "Unknown",
    availabilityStatus: "Available",
  };
}

function generateMemberProfile(memberId: string): MemberProfile {
  return {
    id: crypto.randomUUID(),
    memberId,
    assignments: [],
    rolesAndTasks: [],
    appreciationsFromClients: [],
    feedbackComments: [],
    periodsInTalentPool: [],
    aboutMe: "",
    bio: "",
    contactInfo: { email: "", workPhone: "", cellPhone: "", skype: "" },
    socialConnections: { linkedin: "", twitter: "" },
    status: "Active",
    badges: [],
    certifications: [],
    assessments: [],
  };
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
  if (index !== -1) {
    items[index] = { ...items[index], ...updates };
    database.write();
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
