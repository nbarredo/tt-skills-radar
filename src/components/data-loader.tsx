import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle, AlertCircle, RefreshCw, Database } from "lucide-react";
import { loadExcelData, dbUtils } from "@/lib/database";

interface DataLoaderProps {
  onDataLoaded?: () => void;
}

export function DataLoader({ onDataLoaded }: DataLoaderProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState(dbUtils.getStats());

  useEffect(() => {
    setStats(dbUtils.getStats());
  }, []);

  const handleLoadData = async () => {
    setIsLoading(true);
    setError(null);

    try {
      await loadExcelData();
      setStats(dbUtils.getStats());
      onDataLoaded?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load data");
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    dbUtils.reset();
    setStats(dbUtils.getStats());
    setError(null);
  };

  if (stats.isInitialized) {
    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-500" />
            Data Loaded Successfully
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <strong>Members:</strong> {stats.members}
            </div>
            <div>
              <strong>Skills:</strong> {stats.skills}
            </div>
            <div>
              <strong>Skill Assignments:</strong> {stats.memberSkills}
            </div>
            <div>
              <strong>Raw Data Rows:</strong> {stats.rawDataRows}
            </div>
          </div>

          <Button
            onClick={handleReset}
            variant="outline"
            size="sm"
            className="w-full"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Reset Database
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="h-5 w-5" />
          Load Database
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-sm text-gray-600">
          Load the comprehensive skills database with members, skills, and
          assignments.
        </div>

        {error && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {isLoading && (
          <div className="space-y-2">
            <Progress value={undefined} className="w-full" />
            <div className="text-sm text-center text-gray-600">
              Loading Excel data...
            </div>
          </div>
        )}

        <Button
          onClick={handleLoadData}
          disabled={isLoading}
          className="w-full"
        >
          {isLoading ? "Loading..." : "Load Database"}
        </Button>

        <div className="text-xs text-gray-500">
          This will load 8 members, 15 skills, 6 knowledge areas, and
          comprehensive skill assignments.
        </div>
      </CardContent>
    </Card>
  );
}
