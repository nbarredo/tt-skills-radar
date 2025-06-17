import { useState } from "react";
import * as XLSX from "xlsx";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  FileSpreadsheet,
  Upload,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import {
  knowledgeAreaStorage,
  skillCategoryStorage,
  skillStorage,
} from "@/lib/storage";
import type { KnowledgeArea, SkillCategory, Skill } from "@/types";
import { Loading } from "@/components/ui/loading";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface ImportedKnowledgeArea {
  name: string;
  description: string;
}

interface ImportedSkillCategory {
  name: string;
  criterion: string;
}

interface ImportedSkill {
  name: string;
  purpose: string;
  knowledgeArea: string;
  category: string;
}

interface ExcelRow {
  [key: string]: string | number | undefined;
}

export function EntityImport() {
  const [isOpen, setIsOpen] = useState(false);
  const [importedKnowledgeAreas, setImportedKnowledgeAreas] = useState<
    ImportedKnowledgeArea[]
  >([]);
  const [importedCategories, setImportedCategories] = useState<
    ImportedSkillCategory[]
  >([]);
  const [importedSkills, setImportedSkills] = useState<ImportedSkill[]>([]);
  const [errors, setErrors] = useState<string[]>([]);
  const [successCount, setSuccessCount] = useState({
    knowledgeAreas: 0,
    categories: 0,
    skills: 0,
  });
  const [isProcessing, setIsProcessing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isImporting, setIsImporting] = useState(false);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsLoading(true);
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: "array" });

        // Process Knowledge Areas
        const knowledgeAreasSheet = workbook.Sheets["Knowledge Areas"];
        if (knowledgeAreasSheet) {
          const jsonData =
            XLSX.utils.sheet_to_json<ExcelRow>(knowledgeAreasSheet);
          const mappedData: ImportedKnowledgeArea[] = jsonData.map((row) => ({
            name: String(row["Name"] || row["name"] || ""),
            description: String(row["Description"] || row["description"] || ""),
          }));
          setImportedKnowledgeAreas(mappedData);
        }

        // Process Skill Categories
        const categoriesSheet = workbook.Sheets["Skill Categories"];
        if (categoriesSheet) {
          const jsonData = XLSX.utils.sheet_to_json<ExcelRow>(categoriesSheet);
          const mappedData: ImportedSkillCategory[] = jsonData.map((row) => ({
            name: String(row["Name"] || row["name"] || ""),
            criterion: String(row["Criterion"] || row["criterion"] || ""),
          }));
          setImportedCategories(mappedData);
        }

        // Process Skills
        const skillsSheet = workbook.Sheets["Skills"];
        if (skillsSheet) {
          const jsonData = XLSX.utils.sheet_to_json<ExcelRow>(skillsSheet);
          const mappedData: ImportedSkill[] = jsonData.map((row) => ({
            name: String(row["Name"] || row["name"] || ""),
            purpose: String(row["Purpose"] || row["purpose"] || ""),
            knowledgeArea: String(
              row["Knowledge Area"] || row["knowledgeArea"] || ""
            ),
            category: String(row["Category"] || row["category"] || ""),
          }));
          setImportedSkills(mappedData);
        }

        // Validate data
        const validationErrors: string[] = [];

        // Validate Knowledge Areas
        importedKnowledgeAreas.forEach((area, index) => {
          if (!area.name) {
            validationErrors.push(
              `Knowledge Area row ${index + 2}: Missing name`
            );
          }
        });

        // Validate Categories
        importedCategories.forEach((category, index) => {
          if (!category.name) {
            validationErrors.push(`Category row ${index + 2}: Missing name`);
          }
          if (!category.criterion) {
            validationErrors.push(
              `Category row ${index + 2}: Missing criterion`
            );
          }
        });

        // Validate Skills
        importedSkills.forEach((skill, index) => {
          if (!skill.name) {
            validationErrors.push(`Skill row ${index + 2}: Missing name`);
          }
          if (!skill.purpose) {
            validationErrors.push(`Skill row ${index + 2}: Missing purpose`);
          }
          if (!skill.knowledgeArea) {
            validationErrors.push(
              `Skill row ${index + 2}: Missing knowledge area`
            );
          }
          if (!skill.category) {
            validationErrors.push(`Skill row ${index + 2}: Missing category`);
          }
        });

        setErrors(validationErrors);
      } catch (error) {
        setErrors([
          `Error reading file: ${
            error instanceof Error ? error.message : "Unknown error"
          }`,
        ]);
      } finally {
        setIsLoading(false);
      }
    };

    reader.readAsArrayBuffer(file);
  };

  const handleImport = async () => {
    setIsProcessing(true);
    setIsImporting(true);
    setSuccessCount({ knowledgeAreas: 0, categories: 0, skills: 0 });

    try {
      // Import Knowledge Areas
      const knowledgeAreaMap = new Map<string, string>();
      for (const area of importedKnowledgeAreas) {
        const existingArea = knowledgeAreaStorage
          .getAll()
          .find((a) => a.name.toLowerCase() === area.name.toLowerCase());

        if (existingArea) {
          knowledgeAreaMap.set(area.name, existingArea.id);
          knowledgeAreaStorage.update(existingArea.id, {
            description: area.description,
          });
        } else {
          const newArea: KnowledgeArea = {
            id: crypto.randomUUID(),
            name: area.name,
            description: area.description,
          };
          knowledgeAreaStorage.add(newArea);
          knowledgeAreaMap.set(area.name, newArea.id);
        }
        setSuccessCount((prev) => ({
          ...prev,
          knowledgeAreas: prev.knowledgeAreas + 1,
        }));
      }

      // Import Categories
      const categoryMap = new Map<string, string>();
      for (const category of importedCategories) {
        const existingCategory = skillCategoryStorage
          .getAll()
          .find((c) => c.name.toLowerCase() === category.name.toLowerCase());

        if (existingCategory) {
          categoryMap.set(category.name, existingCategory.id);
          skillCategoryStorage.update(existingCategory.id, {
            criterion: category.criterion,
          });
        } else {
          const newCategory: SkillCategory = {
            id: crypto.randomUUID(),
            name: category.name,
            criterion: category.criterion,
          };
          skillCategoryStorage.add(newCategory);
          categoryMap.set(category.name, newCategory.id);
        }
        setSuccessCount((prev) => ({
          ...prev,
          categories: prev.categories + 1,
        }));
      }

      // Import Skills
      for (const skill of importedSkills) {
        const knowledgeAreaId = knowledgeAreaMap.get(skill.knowledgeArea);
        const categoryId = categoryMap.get(skill.category);

        if (!knowledgeAreaId || !categoryId) {
          setErrors((prev) => [
            ...prev,
            `Skill "${skill.name}": Invalid knowledge area or category reference`,
          ]);
          continue;
        }

        const existingSkill = skillStorage
          .getAll()
          .find((s) => s.name.toLowerCase() === skill.name.toLowerCase());

        if (existingSkill) {
          skillStorage.update(existingSkill.id, {
            purpose: skill.purpose,
            knowledgeAreaId,
            skillCategoryId: categoryId,
          });
        } else {
          const newSkill: Skill = {
            id: crypto.randomUUID(),
            name: skill.name,
            purpose: skill.purpose,
            knowledgeAreaId,
            skillCategoryId: categoryId,
          };
          skillStorage.add(newSkill);
        }
        setSuccessCount((prev) => ({
          ...prev,
          skills: prev.skills + 1,
        }));
      }

      // Instead of refreshing the page, just close the dialog
      setImportedKnowledgeAreas([]);
      setImportedCategories([]);
      setImportedSkills([]);
      setErrors([]);
      setSuccessCount({ knowledgeAreas: 0, categories: 0, skills: 0 });
      setIsOpen(false);
    } catch (error) {
      setErrors([
        `Error importing data: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
      ]);
    } finally {
      setIsProcessing(false);
      setIsImporting(false);
    }
  };

  const downloadTemplate = () => {
    const template = {
      "Knowledge Areas": [
        {
          Name: "Project Management",
          Description: "Skills related to managing projects and teams",
        },
        {
          Name: "Cloud Computing",
          Description: "Skills related to cloud platforms and services",
        },
      ],
      "Skill Categories": [
        {
          Name: "Tools",
          Criterion: "Proficiency with specific software or tools",
        },
        {
          Name: "Languages",
          Criterion: "Programming language proficiency",
        },
      ],
      Skills: [
        {
          Name: "Agile",
          Purpose: "Project management methodology",
          "Knowledge Area": "Project Management",
          Category: "Tools",
        },
        {
          Name: "AWS",
          Purpose: "Cloud platform expertise",
          "Knowledge Area": "Cloud Computing",
          Category: "Tools",
        },
      ],
    };

    const wb = XLSX.utils.book_new();

    // Add each sheet
    Object.entries(template).forEach(([sheetName, data]) => {
      const ws = XLSX.utils.json_to_sheet(data);
      XLSX.utils.book_append_sheet(wb, ws, sheetName);
    });

    XLSX.writeFile(wb, "entities_import_template.xlsx");
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <FileSpreadsheet className="mr-2 h-4 w-4" />
          Import Entities
        </Button>
      </DialogTrigger>
      <DialogContent
        className="w-[1400px] h-[80vh] flex flex-col"
        style={{ maxWidth: "none" }}
      >
        <DialogHeader>
          <DialogTitle>Import Knowledge Areas, Categories & Skills</DialogTitle>
          <DialogDescription>
            Upload an Excel file with three sheets: "Knowledge Areas", "Skill
            Categories", and "Skills". Each sheet should have the appropriate
            columns as shown in the template.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 pr-6 overflow-y-auto">
          <div className="space-y-4">
            <div className="flex gap-4">
              <Button variant="outline" onClick={downloadTemplate}>
                Download Template
              </Button>

              <div className="flex-1">
                <label htmlFor="file-upload" className="cursor-pointer">
                  <div className="flex items-center gap-2 px-4 py-2 border rounded-md hover:bg-gray-50 dark:hover:bg-gray-800">
                    <Upload className="h-4 w-4" />
                    <span>Choose Excel File</span>
                  </div>
                  <input
                    id="file-upload"
                    type="file"
                    accept=".xlsx,.xls"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </label>
              </div>
            </div>

            {isLoading && (
              <div className="py-8">
                <Loading text="Processing Excel file..." />
              </div>
            )}

            {errors.length > 0 && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <div className="space-y-1">
                    {errors.map((error, index) => (
                      <div key={index}>{error}</div>
                    ))}
                  </div>
                </AlertDescription>
              </Alert>
            )}

            {(successCount.knowledgeAreas > 0 ||
              successCount.categories > 0 ||
              successCount.skills > 0) && (
              <Alert>
                <CheckCircle2 className="h-4 w-4" />
                <AlertDescription>
                  Successfully imported:
                  <ul className="list-disc list-inside mt-1">
                    {successCount.knowledgeAreas > 0 && (
                      <li>{successCount.knowledgeAreas} knowledge area(s)</li>
                    )}
                    {successCount.categories > 0 && (
                      <li>{successCount.categories} category(ies)</li>
                    )}
                    {successCount.skills > 0 && (
                      <li>{successCount.skills} skill(s)</li>
                    )}
                  </ul>
                </AlertDescription>
              </Alert>
            )}

            {(importedKnowledgeAreas.length > 0 ||
              importedCategories.length > 0 ||
              importedSkills.length > 0) && (
              <Tabs defaultValue="knowledge-areas" className="space-y-4">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="knowledge-areas">
                    Knowledge Areas ({importedKnowledgeAreas.length})
                  </TabsTrigger>
                  <TabsTrigger value="categories">
                    Categories ({importedCategories.length})
                  </TabsTrigger>
                  <TabsTrigger value="skills">
                    Skills ({importedSkills.length})
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="knowledge-areas">
                  {importedKnowledgeAreas.length > 0 ? (
                    <Card>
                      <CardContent className="overflow-x-auto p-0">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Name</TableHead>
                              <TableHead>Description</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {importedKnowledgeAreas.map((area, index) => (
                              <TableRow key={index}>
                                <TableCell>{area.name}</TableCell>
                                <TableCell>{area.description}</TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </CardContent>
                    </Card>
                  ) : (
                    <div className="text-center text-muted-foreground py-8">
                      No knowledge areas to import
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="categories">
                  {importedCategories.length > 0 ? (
                    <Card>
                      <CardContent className="overflow-x-auto p-0">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Name</TableHead>
                              <TableHead>Criterion</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {importedCategories.map((category, index) => (
                              <TableRow key={index}>
                                <TableCell>{category.name}</TableCell>
                                <TableCell>{category.criterion}</TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </CardContent>
                    </Card>
                  ) : (
                    <div className="text-center text-muted-foreground py-8">
                      No categories to import
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="skills">
                  {importedSkills.length > 0 ? (
                    <Card>
                      <CardContent className="overflow-x-auto p-0">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Name</TableHead>
                              <TableHead>Purpose</TableHead>
                              <TableHead>Knowledge Area</TableHead>
                              <TableHead>Category</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {importedSkills.map((skill, index) => (
                              <TableRow key={index}>
                                <TableCell>{skill.name}</TableCell>
                                <TableCell>{skill.purpose}</TableCell>
                                <TableCell>{skill.knowledgeArea}</TableCell>
                                <TableCell>{skill.category}</TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </CardContent>
                    </Card>
                  ) : (
                    <div className="text-center text-muted-foreground py-8">
                      No skills to import
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            )}
          </div>
        </div>

        {(importedKnowledgeAreas.length > 0 ||
          importedCategories.length > 0 ||
          importedSkills.length > 0) && (
          <div className="flex justify-end gap-2 pt-4 border-t mt-4">
            <Button
              variant="outline"
              onClick={() => {
                setImportedKnowledgeAreas([]);
                setImportedCategories([]);
                setImportedSkills([]);
                setErrors([]);
                setSuccessCount({
                  knowledgeAreas: 0,
                  categories: 0,
                  skills: 0,
                });
              }}
            >
              Clear
            </Button>
            <Button onClick={handleImport} disabled={isProcessing}>
              {isProcessing ? (
                <>
                  <Loading size="sm" className="mr-2" />
                  Importing...
                </>
              ) : (
                "Import All"
              )}
            </Button>
          </div>
        )}

        {isImporting && (
          <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center">
            <div className="text-center space-y-2">
              <Loading size="lg" text="Importing data..." />
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
