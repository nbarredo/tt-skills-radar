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
import { initDatabase } from "@/lib/database";
import { Upload, FileSpreadsheet, Settings, Database } from "lucide-react";

export function ImportsPage() {
  useEffect(() => {
    initDatabase();
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Data Import</h1>
        <p className="text-muted-foreground">
          Import skills data from Excel files and manage system entities
        </p>
      </div>

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
