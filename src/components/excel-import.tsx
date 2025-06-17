import { useState } from "react";
import * as XLSX from "xlsx";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
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
import { Member, MemberProfile } from "@/types";
import { memberStorage, memberProfileStorage } from "@/lib/storage";
import { Loading } from "@/components/ui/loading";

interface ImportedMember {
  corporateEmail: string;
  fullName: string;
  hireDate: string;
  currentAssignedClient: string;
  category: Member["category"];
  location: string;
  availabilityStatus: Member["availabilityStatus"];
}

interface ExcelRow {
  "Corporate Email": string;
  "Full Name": string;
  "Hire Date": string;
  "Current Assigned Client": string;
  Category: string;
  Location: string;
  "Availability Status": string;
}

export function ExcelImport() {
  const [isOpen, setIsOpen] = useState(false);
  const [importedData, setImportedData] = useState<ImportedMember[]>([]);
  const [errors, setErrors] = useState<string[]>([]);
  const [successCount, setSuccessCount] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isImporting, setIsImporting] = useState(false);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: "array" });
        const worksheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json<ExcelRow>(worksheet);

        const members: ImportedMember[] = jsonData.map((row) => ({
          corporateEmail: row["Corporate Email"] || "",
          fullName: row["Full Name"] || "",
          hireDate: row["Hire Date"] || "",
          currentAssignedClient: row["Current Assigned Client"] || "",
          category: (row.Category || "Starter") as Member["category"],
          location: row.Location || "",
          availabilityStatus: (row["Availability Status"] ||
            "Available") as Member["availabilityStatus"],
        }));

        const validationErrors: string[] = [];
        members.forEach((member, index) => {
          if (!member.corporateEmail) {
            validationErrors.push(
              `Row ${index + 2}: Corporate Email is required`
            );
          }
          if (!member.fullName) {
            validationErrors.push(`Row ${index + 2}: Full Name is required`);
          }
          if (!member.hireDate) {
            validationErrors.push(`Row ${index + 2}: Hire Date is required`);
          }
          if (!member.category) {
            validationErrors.push(`Row ${index + 2}: Category is required`);
          }
        });

        if (validationErrors.length > 0) {
          setErrors(validationErrors);
          setImportedData([]);
        } else {
          setErrors([]);
          setImportedData(members);
        }
      } catch (error) {
        setErrors([
          `Error reading file: ${
            error instanceof Error ? error.message : "Unknown error"
          }`,
        ]);
      }
    };

    reader.readAsArrayBuffer(file);
  };

  const handleImport = async () => {
    setIsProcessing(true);
    setIsImporting(true);
    try {
      setSuccessCount(0);
      const existingMembers = memberStorage.getAll();
      let imported = 0;

      for (const memberData of importedData) {
        const existingMember = existingMembers.find(
          (m) => m.corporateEmail === memberData.corporateEmail
        );

        if (existingMember) {
          // Update existing member
          memberStorage.update(existingMember.id, {
            ...existingMember,
            fullName: memberData.fullName,
            hireDate: memberData.hireDate,
            currentAssignedClient: memberData.currentAssignedClient,
            category: memberData.category,
            location: memberData.location,
            availabilityStatus: memberData.availabilityStatus,
          });
        } else {
          // Create new member
          const newMember: Member = {
            id: crypto.randomUUID(),
            corporateEmail: memberData.corporateEmail,
            fullName: memberData.fullName,
            hireDate: memberData.hireDate,
            currentAssignedClient: memberData.currentAssignedClient,
            category: memberData.category,
            location: memberData.location,
            availabilityStatus: memberData.availabilityStatus,
          };
          memberStorage.add(newMember);

          // Create empty profile
          const newProfile: MemberProfile = {
            id: crypto.randomUUID(),
            memberId: newMember.id,
            assignments: [],
            rolesAndTasks: [],
            appreciationsFromClients: [],
            feedbackComments: [],
            periodsInTalentPool: [],
            aboutMe: "",
            bio: "",
            contactInfo: {
              email: memberData.corporateEmail,
              workPhone: "",
              cellPhone: "",
              skype: "",
            },
            socialConnections: {
              linkedin: "",
              twitter: "",
            },
            status: "Active",
            badges: [],
            certifications: [],
            assessments: [],
          };
          memberProfileStorage.add(newProfile);
        }
        imported++;
      }

      setSuccessCount(imported);
      setImportedData([]);
      setErrors([]);
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
    const template = [
      {
        "Corporate Email": "john.doe@company.com",
        "Full Name": "John Doe",
        "Hire Date": "2023-01-15",
        "Current Client": "Acme Corp",
        Category: "Builder",
        Location: "New York",
        Availability: "Available",
      },
      {
        "Corporate Email": "jane.smith@company.com",
        "Full Name": "Jane Smith",
        "Hire Date": "2022-06-20",
        "Current Client": "Tech Solutions",
        Category: "Solver",
        Location: "San Francisco",
        Availability: "Assigned",
      },
    ];

    const ws = XLSX.utils.json_to_sheet(template);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Members");
    XLSX.writeFile(wb, "members_import_template.xlsx");
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <FileSpreadsheet className="mr-2 h-4 w-4" />
          Import Members
        </Button>
      </DialogTrigger>
      <DialogContent
        className="w-[1400px] h-[80vh] flex flex-col"
        style={{ maxWidth: "none" }}
      >
        <DialogHeader>
          <DialogTitle>Import Members</DialogTitle>
          <div className="text-muted-foreground text-sm mt-1">
            Upload an Excel file with member data. The file should have the
            following columns:
            <br />
            <b>
              Corporate Email, Full Name, Hire Date, Current Assigned Client,
              Category, Location, Availability Status.
            </b>
          </div>
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

            {isImporting && (
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

            {successCount > 0 && (
              <Alert>
                <CheckCircle2 className="h-4 w-4" />
                <AlertDescription>
                  Successfully imported {successCount} member(s)
                </AlertDescription>
              </Alert>
            )}

            {importedData.length > 0 && (
              <Card>
                <CardContent className="overflow-x-auto p-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Corporate Email</TableHead>
                        <TableHead>Full Name</TableHead>
                        <TableHead>Hire Date</TableHead>
                        <TableHead>Current Client</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead>Location</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {importedData.map((member, index) => (
                        <TableRow key={index}>
                          <TableCell>{member.corporateEmail}</TableCell>
                          <TableCell>{member.fullName}</TableCell>
                          <TableCell>{member.hireDate}</TableCell>
                          <TableCell>{member.currentAssignedClient}</TableCell>
                          <TableCell>{member.category}</TableCell>
                          <TableCell>{member.location}</TableCell>
                          <TableCell>{member.availabilityStatus}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {importedData.length > 0 && (
          <div className="flex justify-end gap-2 pt-4 border-t mt-4">
            <Button
              variant="outline"
              onClick={() => {
                setImportedData([]);
                setErrors([]);
                setSuccessCount(0);
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
