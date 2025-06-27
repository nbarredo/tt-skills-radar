import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AlertTriangle,
  Trophy,
  TrendingDown,
  MapPin,
  Bot,
  Send,
  Users,
  Brain,
} from "lucide-react";
import {
  geminiChatService,
  type KnowledgeAreaExpert,
  type KnowledgeAreaGap,
} from "@/lib/gemini";
import { AIAssistant } from "@/components/ai-assistant";

export function SolutionsInsightsPage() {
  const [loading, setLoading] = useState(false);
  const [experts, setExperts] = useState<KnowledgeAreaExpert[]>([]);
  const [gaps, setGaps] = useState<KnowledgeAreaGap[]>([]);
  const [error, setError] = useState<string | null>(null);

  // AI Chat state
  const [aiQuery, setAiQuery] = useState("");
  const [aiResponse, setAiResponse] = useState("");
  const [aiLoading, setAiLoading] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [expertsData, gapsData] = await Promise.all([
        geminiChatService.getKnowledgeAreaExperts(),
        geminiChatService.getKnowledgeAreaGaps(),
      ]);
      setExperts(expertsData);
      setGaps(gapsData);
    } catch (err) {
      console.error("Error loading solutions insights:", err);
      setError("Failed to load solutions insights data");
    } finally {
      setLoading(false);
    }
  };

  const getCategoryColor = (category: string) => {
    const colors = {
      Starter: "bg-blue-100 text-blue-800",
      Builder: "bg-green-100 text-green-800",
      Solver: "bg-purple-100 text-purple-800",
      Wizard: "bg-yellow-100 text-yellow-800",
    };
    return (
      colors[category as keyof typeof colors] || "bg-gray-100 text-gray-800"
    );
  };

  const getGapSeverityColor = (severity: string) => {
    const colors = {
      Critical: "bg-red-100 text-red-800 border-red-200",
      High: "bg-orange-100 text-orange-800 border-orange-200",
      Medium: "bg-yellow-100 text-yellow-800 border-yellow-200",
      Low: "bg-green-100 text-green-800 border-green-200",
    };
    return (
      colors[severity as keyof typeof colors] ||
      "bg-gray-100 text-gray-800 border-gray-200"
    );
  };

  const getGapSeverityIcon = (severity: string) => {
    if (severity === "Critical" || severity === "High") {
      return <AlertTriangle className="h-4 w-4" />;
    }
    return <TrendingDown className="h-4 w-4" />;
  };

  const calculateExpertiseScore = (expert: {
    averageProficiency: number;
    skillCount: number;
    yearsExperience: number;
  }) => {
    return Math.round(
      (expert.averageProficiency *
        expert.skillCount *
        (expert.yearsExperience + 1)) /
        10
    );
  };

  const handleAiQuery = async () => {
    if (!aiQuery.trim()) return;

    try {
      setAiLoading(true);

      // Use the new optimized method that caches team context
      const response = await geminiChatService.getOptimizedInsightsResponse(
        aiQuery,
        "SOLUTIONS - Analyzing team capabilities for technical solutions, identifying skill gaps, recommending team compositions for projects, evaluating technical expertise and innovation potential"
      );

      setAiResponse(response);
    } catch (err) {
      console.error("Error getting AI response:", err);
      const errorMessage =
        err instanceof Error ? err.message : "Unknown error occurred";
      setAiResponse(
        `Sorry, I encountered an error: ${errorMessage}. Please try again.`
      );
    } finally {
      setAiLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center py-8">Loading solutions insights...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <div className="bg-red-50 border border-red-200 rounded-md p-4 text-red-800">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center gap-2 mb-6">
        <Trophy className="h-6 w-6" />
        <h1 className="text-3xl font-bold">Solutions Insights</h1>
      </div>

      <Tabs defaultValue="experts" className="space-y-6">
        <TabsList>
          <TabsTrigger value="experts">Knowledge Area Experts</TabsTrigger>
          <TabsTrigger value="gaps">Gap Analysis</TabsTrigger>
          <TabsTrigger value="ai-assistant">AI Assistant</TabsTrigger>
        </TabsList>

        <TabsContent value="experts" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="h-5 w-5" />
                Knowledge Area Experts
              </CardTitle>
              <CardDescription>
                Key people in each knowledge area for structuring professional
                development programs
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {experts.map((area) => (
                  <Card
                    key={area.knowledgeArea}
                    className="border-l-4 border-l-purple-500"
                  >
                    <CardHeader>
                      <CardTitle className="text-lg">
                        {area.knowledgeArea}
                      </CardTitle>
                      <CardDescription>
                        {area.experts.length} experts identified
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      {area.experts.length === 0 ? (
                        <p className="text-muted-foreground">
                          No experts identified in this area
                        </p>
                      ) : (
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                          {area.experts.slice(0, 4).map((expert, index) => (
                            <Card key={expert.member.id} className="relative">
                              <CardContent className="p-4">
                                {index === 0 && (
                                  <div className="absolute -top-2 -right-2">
                                    <Badge className="bg-yellow-500 text-white">
                                      Top Expert
                                    </Badge>
                                  </div>
                                )}
                                <div className="flex justify-between items-start mb-3">
                                  <div>
                                    <h4 className="font-medium">
                                      {expert.member.fullName}
                                    </h4>
                                    <p className="text-sm text-muted-foreground">
                                      {expert.member.corporateEmail}
                                    </p>
                                  </div>
                                  <div className="text-right">
                                    <div className="text-lg font-bold text-purple-600">
                                      {calculateExpertiseScore(expert)}
                                    </div>
                                    <div className="text-xs text-muted-foreground">
                                      Score
                                    </div>
                                  </div>
                                </div>

                                <div className="flex gap-2 mb-3">
                                  <Badge
                                    className={getCategoryColor(
                                      expert.member.category
                                    )}
                                  >
                                    {expert.member.category}
                                  </Badge>
                                  <Badge
                                    variant="outline"
                                    className="flex items-center gap-1"
                                  >
                                    <MapPin className="h-3 w-3" />
                                    {expert.member.location}
                                  </Badge>
                                </div>

                                <div className="space-y-2">
                                  <div className="flex justify-between text-sm">
                                    <span>Skills:</span>
                                    <span className="font-medium">
                                      {expert.skillCount}
                                    </span>
                                  </div>
                                  <div className="flex justify-between text-sm">
                                    <span>Avg Proficiency:</span>
                                    <span className="font-medium">
                                      {expert.averageProficiency.toFixed(1)}/5
                                    </span>
                                  </div>
                                  <div className="flex justify-between text-sm">
                                    <span>Experience:</span>
                                    <span className="font-medium">
                                      {expert.yearsExperience} years
                                    </span>
                                  </div>
                                </div>

                                {expert.specializations.length > 0 && (
                                  <div className="mt-3">
                                    <div className="text-sm font-medium mb-1">
                                      Specializations:
                                    </div>
                                    <div className="flex flex-wrap gap-1">
                                      {expert.specializations
                                        .slice(0, 3)
                                        .map((spec) => (
                                          <Badge
                                            key={spec}
                                            variant="secondary"
                                            className="text-xs"
                                          >
                                            {spec}
                                          </Badge>
                                        ))}
                                    </div>
                                  </div>
                                )}
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="gaps" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                Knowledge Area Gaps
              </CardTitle>
              <CardDescription>
                Knowledge areas with less talent/experience to assess training
                needs
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {gaps.map((gap) => (
                  <Card
                    key={gap.knowledgeArea}
                    className={`border-l-4 ${
                      gap.gapSeverity === "Critical"
                        ? "border-l-red-500"
                        : gap.gapSeverity === "High"
                        ? "border-l-orange-500"
                        : gap.gapSeverity === "Medium"
                        ? "border-l-yellow-500"
                        : "border-l-green-500"
                    }`}
                  >
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="text-lg">
                            {gap.knowledgeArea}
                          </CardTitle>
                          <CardDescription>
                            {gap.talentCount} team members • Avg Level:{" "}
                            {gap.averageLevel.toFixed(1)}
                          </CardDescription>
                        </div>
                        <Badge
                          className={`${getGapSeverityColor(
                            gap.gapSeverity
                          )} flex items-center gap-1`}
                        >
                          {getGapSeverityIcon(gap.gapSeverity)}
                          {gap.gapSeverity}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div>
                          <div className="flex justify-between text-sm mb-2">
                            <span>Talent Gap Severity</span>
                            <span>{gap.gapSeverity}</span>
                          </div>
                          <Progress
                            value={
                              gap.gapSeverity === "Critical"
                                ? 100
                                : gap.gapSeverity === "High"
                                ? 75
                                : gap.gapSeverity === "Medium"
                                ? 50
                                : 25
                            }
                            className={
                              gap.gapSeverity === "Critical"
                                ? "bg-red-100 [&>div]:bg-red-500"
                                : gap.gapSeverity === "High"
                                ? "bg-orange-100 [&>div]:bg-orange-500"
                                : gap.gapSeverity === "Medium"
                                ? "bg-yellow-100 [&>div]:bg-yellow-500"
                                : "bg-green-100 [&>div]:bg-green-500"
                            }
                          />
                        </div>
                        <div>
                          <h4 className="font-medium mb-2">Recommendations:</h4>
                          <div className="space-y-1">
                            {gap.recommendations.map((rec, index) => (
                              <div
                                key={index}
                                className="text-sm flex items-start gap-2"
                              >
                                <div className="w-2 h-2 bg-blue-500 rounded-full mt-1.5 flex-shrink-0"></div>
                                {rec}
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* AI Assistant Tab */}
        <TabsContent value="ai-assistant" className="space-y-6">
          <AIAssistant
            contextType="SOLUTIONS"
            contextDescription="Ask me about technical experts, skill gaps, development strategies, mentorship opportunities, and solution delivery capabilities. I can help identify the right talent for technical challenges."
            placeholder="Ask about experts, skill gaps, or development strategies..."
            className="min-h-[600px]"
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
