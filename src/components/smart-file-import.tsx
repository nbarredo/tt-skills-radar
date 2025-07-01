import { useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Upload,
  FileText,
  FileSpreadsheet,
  FileJson,
  Bot,
  CheckCircle,
  AlertCircle,
  Trash2,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface FileUploadResult {
  fileName: string;
  fileType: string;
  size: number;
  content: any;
  rawContent: string;
  parsedData?: any[];
  aiAnalysis?: string;
  mappingSuggestions?: MappingSuggestion[];
  errors?: string[];
  duplicateCount?: number;
  duplicateMatches?: Array<{
    uploadField: string;
    existingId: string;
    existingName: string;
    matchConfidence: number;
    matchType: string;
  }>;
}

interface ImportRecord {
  id: string;
  originalData: any;
  transformedData: any;
  isSelected: boolean;
  hasChanges: boolean;
  changeType: "new" | "update" | "conflict";
  conflictFields?: string[];
}

interface MappingSuggestion {
  sourceField: string;
  targetEntity: string;
  targetField: string;
  confidence: number;
  reasoning: string;
  sampleValues: string[];
}

interface SmartFileImportProps {
  onImportComplete?: (data: any[], entity: string) => void;
  className?: string;
}

export function SmartFileImport({
  onImportComplete,
  className,
}: SmartFileImportProps) {
  const [uploadResult, setUploadResult] = useState<FileUploadResult | null>(
    null
  );
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [analysisProgress, setAnalysisProgress] = useState(0);
  const [selectedMappings, setSelectedMappings] = useState<
    Record<string, MappingSuggestion>
  >({});
  const [importResults, setImportResults] = useState<{
    success: number;
    errors: string[];
  } | null>(null);
  const [importRecords, setImportRecords] = useState<ImportRecord[]>([]);
  const [selectedNestedArray, setSelectedNestedArray] = useState<string>("");

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsAnalyzing(true);
    setAnalysisProgress(0);
    setUploadResult(null);
    setImportResults(null);

    try {
      // Read file content
      const content = await readFileContent(file);
      setAnalysisProgress(25);

      // Parse file based on type
      const parsedData = await parseFileContent(file, content);
      setAnalysisProgress(50);

      // Analyze with AI
      const aiAnalysis = await analyzeFileWithAI(
        file.name,
        file.type,
        parsedData
      );
      setAnalysisProgress(75);

      const result: FileUploadResult = {
        fileName: file.name,
        fileType: file.type,
        size: file.size,
        content: parsedData,
        rawContent:
          typeof content === "string" ? content : JSON.stringify(content),
        aiAnalysis: aiAnalysis.analysis,
        mappingSuggestions: aiAnalysis.mappings,
        errors: aiAnalysis.errors,
        duplicateCount: aiAnalysis.duplicateCount,
        duplicateMatches: aiAnalysis.duplicateMatches,
      };

      setUploadResult(result);
      setAnalysisProgress(100);

      // Auto-select high confidence mappings
      const autoMappings: Record<string, MappingSuggestion> = {};
      aiAnalysis.mappings?.forEach((mapping: MappingSuggestion) => {
        if (mapping.confidence > 0.8) {
          autoMappings[mapping.sourceField] = mapping;
        }
      });
      setSelectedMappings(autoMappings);

      // Prepare import records for confirmation - now with AI duplicate detection results
      await prepareImportRecordsWithDuplicateInfo(
        parsedData,
        aiAnalysis.duplicateMatches || []
      );
    } catch (error) {
      console.error("Error processing file:", error);
      setUploadResult({
        fileName: file.name,
        fileType: file.type,
        size: file.size,
        content: null,
        rawContent: "",
        errors: [
          error instanceof Error ? error.message : "Unknown error occurred",
        ],
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const readFileContent = (file: File): Promise<string | any> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = (e) => {
        const result = e.target?.result;
        if (typeof result === "string") {
          resolve(result);
        } else if (result instanceof ArrayBuffer) {
          // For Excel files, we'll need to handle binary data
          resolve(result);
        } else {
          reject(new Error("Could not read file content"));
        }
      };

      reader.onerror = () => reject(new Error("Failed to read file"));

      if (
        file.type.includes("json") ||
        file.type.includes("text") ||
        file.name.endsWith(".csv")
      ) {
        reader.readAsText(file);
      } else {
        reader.readAsArrayBuffer(file);
      }
    });
  };

  const parseFileContent = async (file: File, content: any): Promise<any[]> => {
    const fileName = file.name.toLowerCase();
    const fileType = file.type;

    try {
      // JSON files
      if (fileType.includes("json") || fileName.endsWith(".json")) {
        const jsonData =
          typeof content === "string" ? JSON.parse(content) : content;

        // Handle nested data structures (like mixed-data-sample.json)
        if (
          !Array.isArray(jsonData) &&
          typeof jsonData === "object" &&
          jsonData !== null
        ) {
          // Look for nested arrays that could be separate entities
          const nestedArrays = Object.entries(jsonData).filter(
            ([, value]) => Array.isArray(value) && value.length > 0
          );

          if (nestedArrays.length > 0) {
            // If we found nested arrays, flatten the largest one for initial analysis
            const largestArray = nestedArrays.reduce((prev, current) =>
              (current[1] as any[]).length > (prev[1] as any[]).length
                ? current
                : prev
            );

            // Store metadata about available nested arrays for user selection
            (jsonData as any)._nestedArrays = nestedArrays.map(
              ([key, value]) => ({
                key,
                count: (value as any[]).length,
                sample: (value as any[])[0],
              })
            );

            return largestArray[1] as any[];
          }
        }

        return Array.isArray(jsonData) ? jsonData : [jsonData];
      }

      // CSV files
      if (fileType.includes("csv") || fileName.endsWith(".csv")) {
        return parseCSV(content);
      }

      // Excel files
      if (
        fileType.includes("spreadsheet") ||
        fileName.endsWith(".xlsx") ||
        fileName.endsWith(".xls")
      ) {
        // For now, we'll ask user to convert to CSV or JSON
        // In a full implementation, you'd use a library like xlsx
        throw new Error(
          "Excel files not yet supported. Please convert to CSV or JSON format."
        );
      }

      // Text files - try to detect structure
      if (fileType.includes("text") || fileName.endsWith(".txt")) {
        return parseTextFile(content);
      }

      throw new Error(`Unsupported file type: ${fileType}`);
    } catch (error) {
      throw new Error(
        `Failed to parse file: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  };

  const parseCSV = (content: string): any[] => {
    const lines = content.trim().split("\n");
    if (lines.length < 2)
      throw new Error("CSV file must have at least a header and one data row");

    const headers = lines[0].split(",").map((h) => h.trim().replace(/"/g, ""));
    const data = lines.slice(1).map((line) => {
      const values = line.split(",").map((v) => v.trim().replace(/"/g, ""));
      const row: any = {};
      headers.forEach((header, index) => {
        row[header] = values[index] || "";
      });
      return row;
    });

    return data;
  };

  const parseTextFile = (content: string): any[] => {
    // Try to detect if it's JSON lines, tab-separated, or other structured format
    const lines = content.trim().split("\n");

    // Check if it's JSON lines format
    try {
      return lines.map((line) => JSON.parse(line.trim()));
    } catch {
      // Try tab-separated
      if (content.includes("\t")) {
        const headers = lines[0].split("\t");
        return lines.slice(1).map((line) => {
          const values = line.split("\t");
          const row: any = {};
          headers.forEach((header, index) => {
            row[header] = values[index] || "";
          });
          return row;
        });
      }
    }

    // Fallback: treat as unstructured text
    return [{ content: content }];
  };

  const analyzeFileWithAI = async (
    fileName: string,
    fileType: string,
    data: any[]
  ) => {
    if (!data || data.length === 0) {
      return {
        analysis: "No data found in file",
        mappings: [],
        errors: ["File appears to be empty"],
      };
    }

    // Sample the data for AI analysis (first 3 records)
    const sampleData = data.slice(0, 3);
    const dataStructure = Object.keys(sampleData[0] || {});

    // Get existing database data for duplicate detection
    let existingData: any = {};
    try {
      const basePath = import.meta.env.BASE_URL || "/";
      const dataUrl = `${basePath}data/db.json`.replace(/\/+/g, "/");
      const response = await fetch(dataUrl);
      if (response.ok) {
        existingData = await response.json();
      }
    } catch (error) {
      console.log("Could not load existing database for comparison");
    }

    // Compress existing data for AI analysis (sample to avoid token limits)
    const compressedExistingData = JSON.stringify({
      skills:
        existingData.skills
          ?.slice(0, 50)
          .map((s: any) => ({ id: s.id, name: s.name })) || [],
      members:
        existingData.members?.slice(0, 30).map((m: any) => ({
          id: m.id,
          fullName: m.fullName,
          corporateEmail: m.corporateEmail,
        })) || [],
      clients:
        existingData.clients
          ?.slice(0, 20)
          .map((c: any) => ({ id: c.id, name: c.name })) || [],
    });

    const prompt = `
You are a data import specialist with DUPLICATE DETECTION capabilities. Analyze this file and check for existing records.

FILE INFO:
- Name: ${fileName}
- Type: ${fileType}
- Records: ${data.length}
- Fields: ${dataStructure.join(", ")}

SAMPLE UPLOAD DATA:
${JSON.stringify(sampleData, null, 2)}

EXISTING DATABASE DATA (for duplicate detection):
${compressedExistingData}

AVAILABLE TARGET ENTITIES:
1. Members (id, fullName, corporateEmail, hireDate, category, location, currentAssignedClient, availabilityStatus)
2. Skills (id, name, purpose, knowledgeAreaId, skillCategoryId)
3. MemberSkills (memberId, skillId, scaleId, proficiencyValue)
4. Clients (id, name, description, industry, location, status)
5. MemberProfiles (id, memberId, bio, aboutMe, contactInfo, etc.)

DUPLICATE DETECTION RULES:
- Skills: Match by name (case-insensitive, ignore spaces/punctuation)
- Members: Match by email first, then by name (case-insensitive)
- Clients: Match by name (case-insensitive)

INSTRUCTIONS:
1. Provide a brief analysis of the data structure and content
2. Suggest which target entity this data should map to
3. For each source field, suggest the best target field mapping
4. **CRITICAL: Check for duplicates by comparing upload data against existing database**
5. Identify any data quality issues or required transformations
6. List all duplicate matches found with existing database records

IMPORTANT: Respond with ONLY the JSON object below, no markdown formatting, no code blocks, no additional text:

{
  "analysis": "Brief description including duplicate detection results",
  "recommendedEntity": "Members|Skills|MemberSkills|Clients|MemberProfiles",
  "duplicateCount": 0,
  "duplicateMatches": [
    {
      "uploadField": "React",
      "existingId": "skill-7",
      "existingName": "React",
      "matchConfidence": 1.0,
      "matchType": "exact"
    }
  ],
  "mappings": [
    {
      "sourceField": "field_name",
      "targetEntity": "Members",
      "targetField": "fullName",
      "confidence": 0.95,
      "reasoning": "Field contains full names",
      "sampleValues": ["John Doe", "Jane Smith"]
    }
  ],
  "transformations": ["List of suggested data transformations"],
  "issues": ["List of potential data quality issues including duplicate warnings"]
}
`;

    try {
      const { geminiChatService } = await import("@/lib/gemini");
      const response = await geminiChatService.sendMessage(prompt);

      // Clean the response by removing markdown formatting if present
      let cleanResponse = response.trim();

      // Remove markdown code blocks more robustly
      if (cleanResponse.includes("```json")) {
        // Find the JSON content between ```json and ```
        const jsonStart = cleanResponse.indexOf("```json") + 7;
        const jsonEnd = cleanResponse.lastIndexOf("```");
        if (jsonStart > 6 && jsonEnd > jsonStart) {
          cleanResponse = cleanResponse.substring(jsonStart, jsonEnd).trim();
        }
      } else if (cleanResponse.includes("```")) {
        // Handle generic code blocks
        const codeStart = cleanResponse.indexOf("```") + 3;
        const codeEnd = cleanResponse.lastIndexOf("```");
        if (codeStart > 2 && codeEnd > codeStart) {
          cleanResponse = cleanResponse.substring(codeStart, codeEnd).trim();
        }
      }

      // Additional cleanup - remove any remaining backticks or newlines at start/end
      cleanResponse = cleanResponse
        .replace(/^[\s`\n]+/, "")
        .replace(/[\s`\n]+$/, "");

      // Parse AI response
      const aiResult = JSON.parse(cleanResponse);

      return {
        analysis: aiResult.analysis,
        mappings: aiResult.mappings || [],
        errors: aiResult.issues || [],
        duplicateCount: aiResult.duplicateCount || 0,
        duplicateMatches: aiResult.duplicateMatches || [],
      };
    } catch (error) {
      console.error("AI analysis failed:", error);
      return {
        analysis: "AI analysis failed. Please review the data manually.",
        mappings: [],
        errors: [
          "Could not perform AI analysis: " +
            (error instanceof Error ? error.message : "Unknown error"),
        ],
      };
    }
  };

  const generateId = () => {
    return (
      "id_" +
      Math.random().toString(36).substr(2, 9) +
      "_" +
      Date.now().toString(36)
    );
  };

  const addMissingIds = (records: any[], entityType: string) => {
    return records.map((record) => {
      // If record already exists, use existing ID
      if (record._isExisting && record._existingId) {
        return { id: record._existingId, ...record };
      }

      // Check if record already has an ID field
      const hasId = "id" in record || "ID" in record || "Id" in record;

      if (!hasId) {
        // Add an ID based on entity type and existing data
        let generatedId = generateId();

        // Try to create more meaningful IDs based on entity type and data
        if (
          entityType.toLowerCase().includes("member") &&
          (record.email || record.name)
        ) {
          const identifier = record.email || record.name || "unknown";
          generatedId = `member_${identifier
            .toLowerCase()
            .replace(/[^a-z0-9]/g, "_")}_${Date.now().toString(36)}`;
        } else if (entityType.toLowerCase().includes("skill") && record.name) {
          generatedId = `skill_${record.name
            .toLowerCase()
            .replace(/[^a-z0-9]/g, "_")}_${Date.now().toString(36)}`;
        } else if (entityType.toLowerCase().includes("client") && record.name) {
          generatedId = `client_${record.name
            .toLowerCase()
            .replace(/[^a-z0-9]/g, "_")}_${Date.now().toString(36)}`;
        }

        return { id: generatedId, ...record };
      }

      return record;
    });
  };

  const prepareImportRecordsWithDuplicateInfo = async (
    data: any[],
    duplicateMatches: any[]
  ) => {
    // Determine entity type from mappings
    const primaryEntity =
      uploadResult?.mappingSuggestions?.[0]?.targetEntity || "Records";

    // Add IDs to records that don't have them
    const dataWithIds = addMissingIds(data, primaryEntity);

    const records: ImportRecord[] = dataWithIds.map((record, index) => {
      // Check if this record was identified as a duplicate by AI
      const recordName =
        record.name || record.skill_name || record.email || record.fullName;

      const duplicateMatch = duplicateMatches.find((match) => {
        return recordName && match.uploadField === recordName;
      });

      return {
        id: `record-${index}`,
        originalData: record,
        transformedData: {},
        isSelected: true, // Default to selected
        hasChanges: !duplicateMatch,
        changeType: duplicateMatch ? "update" : "new",
        conflictFields: [],
      };
    });

    setImportRecords(records);
  };

  const toggleRecordSelection = (recordId: string) => {
    setImportRecords((prev) =>
      prev.map((record) =>
        record.id === recordId
          ? { ...record, isSelected: !record.isSelected }
          : record
      )
    );
  };

  const toggleAllRecords = (selected: boolean) => {
    setImportRecords((prev) =>
      prev.map((record) => ({ ...record, isSelected: selected }))
    );
  };

  const switchToNestedArray = async (arrayKey: string) => {
    if (!uploadResult || !uploadResult.rawContent) return;

    try {
      const originalData = JSON.parse(uploadResult.rawContent);
      const nestedData = originalData.data?.[arrayKey];

      if (Array.isArray(nestedData) && nestedData.length > 0) {
        setSelectedNestedArray(arrayKey);

        // Re-analyze with the new data
        const aiAnalysis = await analyzeFileWithAI(
          `${uploadResult.fileName} - ${arrayKey}`,
          uploadResult.fileType,
          nestedData
        );

        // Update the upload result with new analysis
        const updatedResult = {
          ...uploadResult,
          content: nestedData,
          aiAnalysis: aiAnalysis.analysis,
          mappingSuggestions: aiAnalysis.mappings,
          errors: aiAnalysis.errors,
          duplicateCount: aiAnalysis.duplicateCount,
          duplicateMatches: aiAnalysis.duplicateMatches,
        };

        setUploadResult(updatedResult);

        // Auto-select high confidence mappings
        const autoMappings: Record<string, MappingSuggestion> = {};
        aiAnalysis.mappings?.forEach((mapping: MappingSuggestion) => {
          if (mapping.confidence > 0.8) {
            autoMappings[mapping.sourceField] = mapping;
          }
        });
        setSelectedMappings(autoMappings);

        // Prepare new import records with duplicate detection
        await prepareImportRecordsWithDuplicateInfo(
          nestedData,
          aiAnalysis.duplicateMatches || []
        );
      }
    } catch (error) {
      console.error("Failed to switch nested array:", error);
    }
  };

  const handleImport = async () => {
    if (!uploadResult || !uploadResult.content) return;

    setIsImporting(true);
    const errors: string[] = [];
    let successCount = 0;

    try {
      // Get only selected records
      const selectedRecords = importRecords.filter(
        (record) => record.isSelected
      );

      const transformedData = selectedRecords.map((record) => {
        const transformed: any = {};

        Object.entries(selectedMappings).forEach(([sourceField, mapping]) => {
          const value = record.originalData[sourceField];
          transformed[mapping.targetField] = value;
        });

        return transformed;
      });

      // Import the transformed data
      const primaryEntity =
        uploadResult.mappingSuggestions?.[0]?.targetEntity || "Members";

      if (onImportComplete) {
        onImportComplete(transformedData, primaryEntity);
      }

      successCount = transformedData.length;
      setImportResults({ success: successCount, errors });
    } catch (error) {
      errors.push(error instanceof Error ? error.message : "Import failed");
      setImportResults({ success: successCount, errors });
    } finally {
      setIsImporting(false);
    }
  };

  const getFileIcon = (fileName: string, fileType: string) => {
    if (fileType.includes("json") || fileName.endsWith(".json")) {
      return <FileJson className="h-8 w-8 text-blue-500" />;
    }
    if (
      fileType.includes("spreadsheet") ||
      fileName.endsWith(".xlsx") ||
      fileName.endsWith(".xls")
    ) {
      return <FileSpreadsheet className="h-8 w-8 text-green-500" />;
    }
    return <FileText className="h-8 w-8 text-gray-500" />;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  return (
    <Card className={cn("w-full", className)}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bot className="h-5 w-5 text-primary" />
          Smart File Import
          <Badge variant="outline">AI-Powered</Badge>
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Upload JSON, CSV, Excel, or text files and let AI intelligently map
          them to your Skills Radar data
        </p>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* File Upload */}
        <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center">
          <input
            ref={fileInputRef}
            type="file"
            accept=".json,.csv,.xlsx,.xls,.txt"
            onChange={handleFileSelect}
            className="hidden"
          />

          <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-lg font-medium mb-2">Upload Your File</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Supports JSON, CSV, Excel, and text files up to 10MB
          </p>

          <Button
            onClick={() => fileInputRef.current?.click()}
            disabled={isAnalyzing}
          >
            {isAnalyzing ? "Analyzing..." : "Choose File"}
          </Button>
        </div>

        {/* Analysis Progress */}
        {isAnalyzing && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span>Analyzing file with AI...</span>
              <span>{analysisProgress}%</span>
            </div>
            <Progress value={analysisProgress} />
          </div>
        )}

        {/* Upload Results */}
        {uploadResult && (
          <Tabs defaultValue="analysis" className="w-full">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="analysis">Analysis</TabsTrigger>
              <TabsTrigger value="mapping">Field Mapping</TabsTrigger>
              <TabsTrigger value="preview">Data Preview</TabsTrigger>
              <TabsTrigger value="confirm">Confirm Records</TabsTrigger>
              <TabsTrigger value="import">Import</TabsTrigger>
            </TabsList>

            {/* File Analysis Tab */}
            <TabsContent value="analysis" className="space-y-4">
              <div className="flex items-center gap-3 p-4 bg-muted rounded-lg">
                {getFileIcon(uploadResult.fileName, uploadResult.fileType)}
                <div className="flex-1">
                  <h4 className="font-medium">{uploadResult.fileName}</h4>
                  <p className="text-sm text-muted-foreground">
                    {formatFileSize(uploadResult.size)} •{" "}
                    {Array.isArray(uploadResult.content)
                      ? uploadResult.content.length
                      : 0}{" "}
                    records
                  </p>
                </div>
              </div>

              {uploadResult.aiAnalysis && (
                <Alert>
                  <Bot className="h-4 w-4" />
                  <AlertDescription>
                    <strong>AI Analysis:</strong> {uploadResult.aiAnalysis}
                  </AlertDescription>
                </Alert>
              )}

              {/* Duplicate Detection Results */}
              {uploadResult.duplicateCount !== undefined &&
                uploadResult.duplicateCount > 0 && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      <strong>🔍 Duplicates Detected:</strong> Found{" "}
                      {uploadResult.duplicateCount} records that already exist
                      in your database.
                      <div className="mt-2 space-y-1">
                        {uploadResult.duplicateMatches
                          ?.slice(0, 5)
                          .map((match, index) => (
                            <div
                              key={index}
                              className="text-xs bg-background p-2 rounded border"
                            >
                              <strong>"{match.uploadField}"</strong> matches
                              existing record{" "}
                              <strong>{match.existingId}</strong>(
                              {match.matchConfidence > 0.9
                                ? "Exact"
                                : "Similar"}{" "}
                              match)
                            </div>
                          ))}
                        {uploadResult.duplicateMatches &&
                          uploadResult.duplicateMatches.length > 5 && (
                            <div className="text-xs text-muted-foreground">
                              ... and {uploadResult.duplicateMatches.length - 5}{" "}
                              more duplicates
                            </div>
                          )}
                      </div>
                      <p className="mt-2 text-sm">
                        These records will be marked for update instead of
                        creating duplicates.
                      </p>
                    </AlertDescription>
                  </Alert>
                )}

              {uploadResult.duplicateCount === 0 &&
                uploadResult.duplicateMatches !== undefined && (
                  <Alert>
                    <CheckCircle className="h-4 w-4" />
                    <AlertDescription>
                      <strong>✅ No Duplicates Found:</strong> All records
                      appear to be new and will be added to your database.
                    </AlertDescription>
                  </Alert>
                )}

              {/* Show nested arrays if detected */}
              {uploadResult.content &&
                (uploadResult.content as any)._nestedArrays && (
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      <strong>Complex Data Structure Detected:</strong> This
                      file contains multiple entity types:
                      <ul className="list-disc list-inside mt-2">
                        {(
                          (uploadResult.content as any)._nestedArrays as any[]
                        ).map((nested: any, index: number) => (
                          <li key={index}>
                            <strong>{nested.key}</strong>: {nested.count}{" "}
                            records
                          </li>
                        ))}
                      </ul>
                      <p className="mt-2 text-sm">
                        Currently analyzing:{" "}
                        <strong>
                          {selectedNestedArray ||
                            (
                              (uploadResult.content as any)
                                ._nestedArrays as any[]
                            ).find(
                              (n: any) =>
                                n.count ===
                                Math.max(
                                  ...(
                                    (uploadResult.content as any)
                                      ._nestedArrays as any[]
                                  ).map((x: any) => x.count)
                                )
                            )?.key}
                        </strong>
                        {!selectedNestedArray && " (largest array)"}
                      </p>
                      <div className="flex flex-wrap gap-2 mt-3">
                        {(
                          (uploadResult.content as any)._nestedArrays as any[]
                        ).map((nested: any, index: number) => (
                          <Button
                            key={index}
                            variant="outline"
                            size="sm"
                            onClick={() => switchToNestedArray(nested.key)}
                          >
                            Switch to {nested.key} ({nested.count})
                          </Button>
                        ))}
                      </div>
                    </AlertDescription>
                  </Alert>
                )}

              {/* Auto-ID Generation Notice */}
              {uploadResult.content &&
                Array.isArray(uploadResult.content) &&
                uploadResult.content.length > 0 &&
                !("id" in uploadResult.content[0]) &&
                !("ID" in uploadResult.content[0]) &&
                !("Id" in uploadResult.content[0]) && (
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      <strong>ID Generation:</strong> This data doesn't contain
                      ID fields. Unique IDs will be automatically generated for
                      each record during import.
                    </AlertDescription>
                  </Alert>
                )}

              {uploadResult.errors && uploadResult.errors.length > 0 && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Issues Found:</strong>
                    <ul className="list-disc list-inside mt-2">
                      {uploadResult.errors.map((error, index) => (
                        <li key={index}>{error}</li>
                      ))}
                    </ul>
                  </AlertDescription>
                </Alert>
              )}
            </TabsContent>

            {/* Field Mapping Tab */}
            <TabsContent value="mapping" className="space-y-4">
              <div className="text-sm text-muted-foreground mb-4">
                Review and adjust the AI-suggested field mappings:
              </div>

              {uploadResult.mappingSuggestions?.map((suggestion, index) => (
                <div key={index} className="border rounded-lg p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{suggestion.sourceField}</Badge>
                      <span className="text-sm">→</span>
                      <Badge>
                        {suggestion.targetEntity}.{suggestion.targetField}
                      </Badge>
                    </div>
                    <Badge
                      variant={
                        suggestion.confidence > 0.8 ? "default" : "secondary"
                      }
                    >
                      {Math.round(suggestion.confidence * 100)}% confident
                    </Badge>
                  </div>

                  <p className="text-sm text-muted-foreground">
                    {suggestion.reasoning}
                  </p>

                  <div className="text-xs text-muted-foreground">
                    Sample values: {suggestion.sampleValues.join(", ")}
                  </div>
                </div>
              ))}
            </TabsContent>

            {/* Data Preview Tab */}
            <TabsContent value="preview" className="space-y-4">
              <div className="text-sm text-muted-foreground mb-4">
                Preview of your data (showing first 5 records):
              </div>

              {uploadResult.content && Array.isArray(uploadResult.content) && (
                <div className="border rounded-lg overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-muted">
                        <tr>
                          {Object.keys(uploadResult.content[0] || {}).map(
                            (key) => (
                              <th
                                key={key}
                                className="p-2 text-left font-medium"
                              >
                                {key}
                              </th>
                            )
                          )}
                        </tr>
                      </thead>
                      <tbody>
                        {uploadResult.content
                          .slice(0, 5)
                          .map((record, index) => (
                            <tr key={index} className="border-t">
                              {Object.values(record).map((value, cellIndex) => (
                                <td key={cellIndex} className="p-2">
                                  {typeof value === "object" && value !== null
                                    ? Array.isArray(value)
                                      ? `[${value.length} items]`
                                      : `{${Object.keys(value).length} fields}`
                                    : String(value).length > 50
                                    ? String(value).substring(0, 50) + "..."
                                    : String(value)}
                                </td>
                              ))}
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </TabsContent>

            {/* Confirm Records Tab */}
            <TabsContent value="confirm" className="space-y-4">
              <div className="flex items-center justify-between mb-4">
                <div className="text-sm text-muted-foreground">
                  Select which records to import (
                  {importRecords.filter((r) => r.isSelected).length} of{" "}
                  {importRecords.length} selected):
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => toggleAllRecords(true)}
                  >
                    Select All
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => toggleAllRecords(false)}
                  >
                    Select None
                  </Button>
                </div>
              </div>

              <div className="space-y-2 max-h-96 overflow-y-auto">
                {importRecords.map((record) => (
                  <div
                    key={record.id}
                    className={cn(
                      "border rounded-lg p-3 space-y-2",
                      record.isSelected
                        ? "border-primary bg-primary/5"
                        : "border-muted"
                    )}
                  >
                    <div className="flex items-start gap-3">
                      <Checkbox
                        checked={record.isSelected}
                        onCheckedChange={() => toggleRecordSelection(record.id)}
                        className="mt-1"
                      />
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-2">
                          <Badge
                            variant={
                              record.changeType === "new"
                                ? "default"
                                : record.changeType === "update"
                                ? "secondary"
                                : "destructive"
                            }
                          >
                            {record.changeType === "new"
                              ? "NEW"
                              : record.changeType === "update"
                              ? "UPDATE EXISTING"
                              : "CONFLICT"}
                          </Badge>

                          {/* Show AI-detected duplicate info */}
                          {record.changeType === "update" &&
                            uploadResult?.duplicateMatches &&
                            (() => {
                              const recordName =
                                record.originalData.name ||
                                record.originalData.skill_name ||
                                record.originalData.email ||
                                record.originalData.fullName;
                              const duplicateMatch =
                                uploadResult.duplicateMatches.find(
                                  (match) => match.uploadField === recordName
                                );
                              return duplicateMatch ? (
                                <Badge variant="outline">
                                  Matches: {duplicateMatch.existingId}
                                </Badge>
                              ) : null;
                            })()}

                          {record.originalData.id &&
                            record.originalData.id
                              .toString()
                              .startsWith("id_") &&
                            record.changeType === "new" && (
                              <Badge variant="outline">ID Generated</Badge>
                            )}
                          {record.conflictFields &&
                            record.conflictFields.length > 0 && (
                              <Badge variant="destructive">
                                {record.conflictFields.length} field conflicts
                              </Badge>
                            )}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                          {Object.entries(record.originalData)
                            .slice(0, 4)
                            .map(([key, value]) => (
                              <div key={key} className="flex">
                                <span className="font-medium text-muted-foreground min-w-20">
                                  {key}:
                                </span>
                                <span className="ml-2 truncate">
                                  {String(value).length > 30
                                    ? String(value).substring(0, 30) + "..."
                                    : String(value)}
                                </span>
                              </div>
                            ))}
                          {Object.keys(record.originalData).length > 4 && (
                            <div className="text-xs text-muted-foreground col-span-full">
                              ... and{" "}
                              {Object.keys(record.originalData).length - 4} more
                              fields
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {importRecords.length === 0 && (
                <div className="text-center text-muted-foreground py-8">
                  No records to confirm. Please complete the field mapping
                  first.
                </div>
              )}
            </TabsContent>

            {/* Import Tab */}
            <TabsContent value="import" className="space-y-4">
              <div className="space-y-4">
                <Alert>
                  <CheckCircle className="h-4 w-4" />
                  <AlertDescription>
                    Ready to import{" "}
                    {importRecords.filter((r) => r.isSelected).length} of{" "}
                    {importRecords.length} records with{" "}
                    {Object.keys(selectedMappings).length} mapped fields.
                  </AlertDescription>
                </Alert>

                <div className="flex gap-2">
                  <Button
                    onClick={handleImport}
                    disabled={
                      isImporting ||
                      Object.keys(selectedMappings).length === 0 ||
                      importRecords.filter((r) => r.isSelected).length === 0
                    }
                    className="flex-1"
                  >
                    {isImporting ? "Importing..." : "Import Data"}
                  </Button>

                  <Button
                    variant="outline"
                    onClick={() => {
                      setUploadResult(null);
                      setSelectedMappings({});
                      setImportResults(null);
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>

                {importResults && (
                  <Alert
                    variant={
                      importResults.errors.length > 0
                        ? "destructive"
                        : "default"
                    }
                  >
                    <CheckCircle className="h-4 w-4" />
                    <AlertDescription>
                      <strong>Import Complete:</strong> {importResults.success}{" "}
                      records imported successfully.
                      {importResults.errors.length > 0 && (
                        <div className="mt-2">
                          <strong>Errors:</strong>
                          <ul className="list-disc list-inside">
                            {importResults.errors.map((error, index) => (
                              <li key={index}>{error}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            </TabsContent>
          </Tabs>
        )}
      </CardContent>
    </Card>
  );
}
