import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import * as XLSX from "xlsx";
import { toast } from "sonner";
import type { Member, MemberProfile, Skill, MemberSkill } from "@/types";
import {
  memberDb,
  skillDb,
  bulkOperations,
  initDatabase,
} from "@/lib/database";

interface ExcelRow {
  Date: string;
  Email: string;
  Skill: string;
  "Expertise Full Name": string;
}

interface ImportStats {
  totalRows: number;
  membersCreated: number;
  skillsCreated: number;
  skillAssignments: number;
  errors: string[];
}

export function ExcelImport() {
  const [isImporting, setIsImporting] = useState(false);
  const [importProgress, setImportProgress] = useState(0);
  const [importStats, setImportStats] = useState<ImportStats | null>(null);
  const [file, setFile] = useState<File | null>(null);

  // Initialize database on component mount
  React.useEffect(() => {
    initDatabase();
  }, []);

  const mapProficiencyLevel = (expertiseText: string): number => {
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
    if (text.includes("(3)") || text.includes("know and used")) return 3;
    if (text.includes("(4)") || text.includes("know well")) return 4;
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
    if (
      text.includes("used") ||
      text.includes("tried") ||
      text.includes("basic")
    )
      return 2;
    if (text.includes("heard") || text.includes("aware")) return 1;

    return 2; // Default fallback
  };

  const generateMemberFromEmail = (email: string): Member => {
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
  };

  const generateMemberProfile = (memberId: string): MemberProfile => ({
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
    careerInterests: [],
    professionalGoals: [],
  });

  const processExcelData = async (data: ExcelRow[]): Promise<ImportStats> => {
    const stats: ImportStats = {
      totalRows: data.length,
      membersCreated: 0,
      skillsCreated: 0,
      skillAssignments: 0,
      errors: [],
    };

    try {
      // Create default entities
      const { defaultKnowledgeArea, defaultCategory, defaultScale } =
        bulkOperations.createDefaultEntities();

      // Get existing data
      const existingMembers = memberDb.getAll();
      const existingSkills = skillDb.getAll();

      const newMembers: Member[] = [];
      const newMemberProfiles: MemberProfile[] = [];
      const newSkills: Skill[] = [];
      const newMemberSkills: MemberSkill[] = [];

      const memberEmailMap = new Map<string, string>();
      const skillNameMap = new Map<string, string>();

      // Build maps of existing data
      existingMembers.forEach((member) => {
        memberEmailMap.set(member.corporateEmail, member.id);
      });

      existingSkills.forEach((skill) => {
        skillNameMap.set(skill.name.toLowerCase(), skill.id);
      });

      let processedRows = 0;

      for (const row of data) {
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
              row.Skill.toLowerCase().includes("additional")
            ) {
              continue;
            }
          }

          const email = row.Email.trim();
          const skillName = row.Skill.trim();
          const expertiseText = row["Expertise Full Name"] || "";

          // Handle member creation
          let memberId = memberEmailMap.get(email);
          if (!memberId) {
            const newMember = generateMemberFromEmail(email);
            memberId = newMember.id;
            memberEmailMap.set(email, memberId);
            newMembers.push(newMember);
            newMemberProfiles.push(generateMemberProfile(memberId));
            stats.membersCreated++;
          }

          // Handle skill creation
          let skillId = skillNameMap.get(skillName.toLowerCase());
          if (!skillId) {
            const newSkill: Skill = {
              id: crypto.randomUUID(),
              name: skillName,
              purpose: `Technical skill: ${skillName}`,
              knowledgeAreaId: defaultKnowledgeArea.id,
              skillCategoryId: defaultCategory.id,
            };
            skillId = newSkill.id;
            skillNameMap.set(skillName.toLowerCase(), skillId);
            newSkills.push(newSkill);
            stats.skillsCreated++;
          }

          // Create member skill assignment
          const proficiencyLevel = mapProficiencyLevel(expertiseText);
          const memberSkill: MemberSkill = {
            memberId,
            skillId,
            scaleId: defaultScale.id,
            proficiencyValue: proficiencyLevel.toString(),
          };

          newMemberSkills.push(memberSkill);
          stats.skillAssignments++;
        } catch (error) {
          stats.errors.push(
            `Row ${processedRows + 1}: ${
              error instanceof Error ? error.message : "Unknown error"
            }`
          );
        }

        processedRows++;

        // Update progress
        const progress = Math.round((processedRows / data.length) * 100);
        setImportProgress(progress);

        // Yield control periodically to prevent UI blocking
        if (processedRows % 100 === 0) {
          await new Promise((resolve) => setTimeout(resolve, 10));
        }
      }

      // Bulk insert all data
      console.log("Inserting bulk data...");

      if (newMembers.length > 0) {
        bulkOperations.addMembers(newMembers);
      }

      if (newMemberProfiles.length > 0) {
        bulkOperations.addMemberProfiles(newMemberProfiles);
      }

      if (newSkills.length > 0) {
        bulkOperations.addSkills(newSkills);
      }

      if (newMemberSkills.length > 0) {
        bulkOperations.addMemberSkills(newMemberSkills);
      }

      console.log("Import completed successfully");
    } catch (error) {
      stats.errors.push(
        `Critical error: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }

    return stats;
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setImportStats(null);
    }
  };

  const handleImport = async () => {
    if (!file) return;

    setIsImporting(true);
    setImportProgress(0);
    setImportStats(null);

    try {
      console.log("Reading Excel file...");

      const arrayBuffer = await file.arrayBuffer();
      const workbook = XLSX.read(arrayBuffer, { type: "array" });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const data = XLSX.utils.sheet_to_json(worksheet) as ExcelRow[];

      console.log(`Processing ${data.length} rows...`);

      const stats = await processExcelData(data);
      setImportStats(stats);

      if (stats.errors.length === 0) {
        toast.success(
          `Import completed! Created ${stats.membersCreated} members, ${stats.skillsCreated} skills, and ${stats.skillAssignments} skill assignments.`
        );
      } else {
        toast.warning(
          `Import completed with ${stats.errors.length} errors. Check the results below.`
        );
      }
    } catch (error) {
      console.error("Import failed:", error);
      toast.error(
        `Import failed: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
      setImportStats({
        totalRows: 0,
        membersCreated: 0,
        skillsCreated: 0,
        skillAssignments: 0,
        errors: [error instanceof Error ? error.message : "Unknown error"],
      });
    } finally {
      setIsImporting(false);
      setImportProgress(0);
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Excel Import</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <label
            htmlFor="excel-file"
            className="block text-sm font-medium mb-2"
          >
            Select Excel File
          </label>
          <input
            id="excel-file"
            type="file"
            accept=".xlsx,.xls"
            onChange={handleFileSelect}
            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
          />
        </div>

        {file && (
          <div className="text-sm text-gray-600">
            Selected: {file.name} ({Math.round(file.size / 1024)} KB)
          </div>
        )}

        <Button
          onClick={handleImport}
          disabled={!file || isImporting}
          className="w-full"
        >
          {isImporting ? "Importing..." : "Import Excel Data"}
        </Button>

        {isImporting && (
          <div className="space-y-2">
            <Progress value={importProgress} className="w-full" />
            <div className="text-sm text-center text-gray-600">
              {importProgress}% complete
            </div>
          </div>
        )}

        {importStats && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <strong>Total Rows:</strong> {importStats.totalRows}
              </div>
              <div>
                <strong>Members Created:</strong> {importStats.membersCreated}
              </div>
              <div>
                <strong>Skills Created:</strong> {importStats.skillsCreated}
              </div>
              <div>
                <strong>Skill Assignments:</strong>{" "}
                {importStats.skillAssignments}
              </div>
            </div>

            {importStats.errors.length > 0 && (
              <Alert>
                <AlertDescription>
                  <div className="font-medium mb-2">
                    {importStats.errors.length} error(s) occurred:
                  </div>
                  <div className="max-h-40 overflow-y-auto text-xs">
                    {importStats.errors.slice(0, 10).map((error, index) => (
                      <div key={index} className="mb-1">
                        {error}
                      </div>
                    ))}
                    {importStats.errors.length > 10 && (
                      <div className="text-gray-500">
                        ... and {importStats.errors.length - 10} more errors
                      </div>
                    )}
                  </div>
                </AlertDescription>
              </Alert>
            )}
          </div>
        )}

        <Alert>
          <AlertDescription>
            <div className="text-sm">
              <strong>Expected Excel Format:</strong>
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>Date column</li>
                <li>Email column (member identification)</li>
                <li>Skill column (skill names)</li>
                <li>Expertise Full Name column (proficiency levels)</li>
              </ul>
              <p className="mt-2">
                The import will automatically create members from email
                addresses and skills from the skill names. Proficiency levels
                will be mapped from the expertise descriptions.
              </p>
            </div>
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );
}
