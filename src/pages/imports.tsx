import { useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ExcelImport } from "@/components/excel-import";
import { EntityImport } from "@/components/entity-import";
import { DataLoader } from "@/components/data-loader";
import { SmartFileImport } from "@/components/smart-file-import";
import {
  initDatabase,
  memberDb,
  clientDb,
  skillDb,
  memberSkillDb,
} from "@/lib/database";
import { Upload, FileSpreadsheet, Settings, Database } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { Member, Client, Skill, MemberSkill } from "@/types";

export function ImportsPage() {
  const { toast } = useToast();

  useEffect(() => {
    initDatabase();
  }, []);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleImportComplete = async (data: any[], entity: string) => {
    try {
      let imported = 0;
      let updated = 0;
      let errors = 0;

      // Cache database data once at the beginning to avoid repeated queries
      console.log("Caching database data...");
      const existingMembers = memberDb.getAllUnlimited();
      const existingClients = clientDb.getAll();
      const existingSkills = skillDb.getAllUnlimited();
      console.log("Database caching complete");

      // Process records using requestIdleCallback for true non-blocking execution
      await new Promise<void>((resolve) => {
        let currentIndex = 0;

        const processChunk = (deadline?: IdleDeadline) => {
          // Process records while we have time or in small chunks
          const chunkSize = deadline
            ? deadline.timeRemaining() > 5
              ? 10
              : 5
            : 5;

          const endIndex = Math.min(currentIndex + chunkSize, data.length);

          for (let i = currentIndex; i < endIndex; i++) {
            const record = data[i];

            try {
              switch (entity.toLowerCase()) {
                case "members": {
                  const existingMember = existingMembers.find(
                    (m) =>
                      m.corporateEmail === record.corporateEmail ||
                      m.fullName === record.fullName
                  );

                  if (existingMember) {
                    const updates: Partial<Member> = {};
                    if (record.currentAssignedClient)
                      updates.currentAssignedClient =
                        record.currentAssignedClient;
                    if (record.availabilityStatus)
                      updates.availabilityStatus = record.availabilityStatus;
                    if (record.location) updates.location = record.location;
                    if (record.category) updates.category = record.category;

                    memberDb.update(existingMember.id, updates);
                    updated++;
                  } else {
                    const newMember: Member = {
                      id:
                        record.id ||
                        `member-${Date.now()}-${Math.random()
                          .toString(36)
                          .substr(2, 9)}`,
                      fullName: record.fullName || record.name || "Unknown",
                      corporateEmail:
                        record.corporateEmail || record.email || "",
                      hireDate:
                        record.hireDate ||
                        new Date().toISOString().split("T")[0],
                      category: record.category || "Starter",
                      location: record.location || "Remote",
                      currentAssignedClient:
                        record.currentAssignedClient || "Available",
                      availabilityStatus:
                        record.availabilityStatus || "Available",
                    };
                    memberDb.add(newMember);
                    imported++;
                  }
                  break;
                }

                case "clients": {
                  const existingClient = existingClients.find(
                    (c) => c.name.toLowerCase() === record.name.toLowerCase()
                  );

                  if (existingClient) {
                    clientDb.update(existingClient.id, {
                      description:
                        record.description || existingClient.description,
                      industry: record.industry || existingClient.industry,
                      location: record.location || existingClient.location,
                      status: record.status || existingClient.status,
                    });
                    updated++;
                  } else {
                    const now = new Date().toISOString();
                    const newClient: Client = {
                      id:
                        record.id ||
                        `client-${Date.now()}-${Math.random()
                          .toString(36)
                          .substr(2, 9)}`,
                      name: record.name,
                      description: record.description || "",
                      industry: record.industry || "Unknown",
                      location: record.location || "Unknown",
                      status: record.status || "Active",
                      createdAt: now,
                      updatedAt: now,
                    };
                    clientDb.add(newClient);
                    imported++;
                  }
                  break;
                }

                case "skills": {
                  const existingSkill = existingSkills.find(
                    (s) => s.name.toLowerCase() === record.name.toLowerCase()
                  );

                  if (existingSkill) {
                    skillDb.update(existingSkill.id, {
                      purpose: record.purpose || existingSkill.purpose,
                      knowledgeAreaId:
                        record.knowledgeAreaId || existingSkill.knowledgeAreaId,
                      skillCategoryId:
                        record.skillCategoryId || existingSkill.skillCategoryId,
                    });
                    updated++;
                  } else {
                    const newSkill: Skill = {
                      id:
                        record.id ||
                        `skill-${Date.now()}-${Math.random()
                          .toString(36)
                          .substr(2, 9)}`,
                      name: record.name,
                      purpose: record.purpose || "",
                      knowledgeAreaId: record.knowledgeAreaId || "ka-1",
                      skillCategoryId: record.skillCategoryId || "sc-1",
                    };
                    skillDb.add(newSkill);
                    imported++;
                  }
                  break;
                }

                case "memberskills": {
                  const memberSkill: MemberSkill = {
                    memberId: record.memberId,
                    skillId: record.skillId,
                    scaleId: record.scaleId || "scale-expertise",
                    proficiencyValue: record.proficiencyValue || "1",
                  };
                  memberSkillDb.add(memberSkill);
                  imported++;
                  break;
                }

                default:
                  throw new Error(`Unknown entity type: ${entity}`);
              }
            } catch (err) {
              console.error("Error importing record:", err);
              errors++;
            }
          }

          currentIndex = endIndex;

          // Continue processing if there are more records
          if (currentIndex < data.length) {
            // Use requestIdleCallback if available, otherwise setTimeout
            if (typeof requestIdleCallback !== "undefined") {
              requestIdleCallback(processChunk);
            } else {
              setTimeout(() => processChunk(), 0);
            }
          } else {
            // All done!
            resolve();
          }
        };

        // Start processing
        if (typeof requestIdleCallback !== "undefined") {
          requestIdleCallback(processChunk);
        } else {
          setTimeout(() => processChunk(), 0);
        }
      });

      toast({
        title: "Import Complete",
        description: `Successfully imported ${imported} new records and updated ${updated} existing records${
          errors > 0 ? `. ${errors} errors occurred.` : "."
        }`,
        variant: errors > 0 ? "destructive" : "default",
      });
    } catch (error) {
      console.error("Import error:", error);
      toast({
        title: "Import Failed",
        description:
          error instanceof Error ? error.message : "Unknown error occurred",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Data Import</h1>
        <p className="text-muted-foreground">
          Import skills data from Excel files and manage system entities
        </p>
      </div>

      {/* Smart AI Import */}
      <Card>
        <CardContent className="p-0">
          <SmartFileImport
            onImportComplete={(data, entity) => {
              console.log(`Imported ${data.length} ${entity} records:`, data);
              handleImportComplete(data, entity);
            }}
          />
        </CardContent>
      </Card>

      {/* Import Options */}
      <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-2">
        {/* Excel Import */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileSpreadsheet className="h-5 w-5" />
              Excel Data Import
            </CardTitle>
            <CardDescription>
              Import member skills and expertise data from Excel files
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ExcelImport />
          </CardContent>
        </Card>

        {/* Entity Import */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Entity Management
            </CardTitle>
            <CardDescription>
              Manage knowledge areas, skill categories, skills, and scales
            </CardDescription>
          </CardHeader>
          <CardContent>
            <EntityImport />
          </CardContent>
        </Card>
      </div>

      {/* Data Loader */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Data Management
          </CardTitle>
          <CardDescription>
            Load and refresh data from external sources
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DataLoader />
        </CardContent>
      </Card>

      {/* Import Instructions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Import Instructions
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="font-medium mb-2">Smart AI Import</h4>
            <p className="text-sm text-muted-foreground mb-2">
              Use AI-powered intelligent file import to automatically analyze
              and map your data:
            </p>
            <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
              <li>Supports JSON, CSV, Excel, and text files up to 10MB</li>
              <li>
                AI automatically analyzes file structure and suggests field
                mappings
              </li>
              <li>
                Intelligently maps to Members, Skills, Clients, or other
                entities
              </li>
              <li>Preview data and review mappings before importing</li>
              <li>
                Handles data transformations and quality checks automatically
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-medium mb-2">Excel Data Import</h4>
            <p className="text-sm text-muted-foreground mb-2">
              Use this to import member skills and expertise levels from Excel
              files:
            </p>
            <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
              <li>
                Excel file should contain columns for member emails, skills, and
                proficiency levels
              </li>
              <li>
                System will automatically create member profiles if they don't
                exist
              </li>
              <li>
                Skills will be mapped to existing skill categories and knowledge
                areas
              </li>
              <li>
                Duplicate skills for the same member will be updated with new
                proficiency levels
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-medium mb-2">Entity Management</h4>
            <p className="text-sm text-muted-foreground mb-2">
              Use this to manage the foundational data structures:
            </p>
            <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
              <li>
                <strong>Knowledge Areas:</strong> High-level categories like
                "Technologies", "Cloud", "Data"
              </li>
              <li>
                <strong>Skill Categories:</strong> Groupings like "Programming
                Languages", "Frameworks", "Tools"
              </li>
              <li>
                <strong>Skills:</strong> Specific technologies like "React",
                "Node.js", "Python"
              </li>
              <li>
                <strong>Scales:</strong> Rating systems for measuring
                proficiency levels
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-medium mb-2">Data Management</h4>
            <p className="text-sm text-muted-foreground mb-2">
              Use this to refresh and synchronize data:
            </p>
            <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
              <li>Reload data from external sources or databases</li>
              <li>Refresh cached data to ensure consistency</li>
              <li>Initialize default entities if starting fresh</li>
              <li>Backup and restore data configurations</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
