import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Users, Target, TrendingUp, Bot, Send } from "lucide-react";
import {
  geminiChatService,
  type CareerAlignment,
  type DevelopmentOpportunity,
} from "@/lib/gemini";
import { AIAssistant } from "@/components/ai-assistant";

export function PeopleInsightsPage() {
  const [loading, setLoading] = useState(false);
  const [memberName, setMemberName] = useState("");
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [alignment, setAlignment] = useState<CareerAlignment | null>(null);
  const [development, setDevelopment] = useState<DevelopmentOpportunity | null>(
    null
  );
  const [error, setError] = useState<string | null>(null);

  // AI Chat state
  const [aiQuery, setAiQuery] = useState("");
  const [aiResponse, setAiResponse] = useState("");
  const [aiLoading, setAiLoading] = useState(false);

  const handleNameChange = (value: string) => {
    setMemberName(value);

    if (value.length >= 3) {
      const memberSuggestions =
        geminiChatService.getMemberNameSuggestions(value);
      setSuggestions(memberSuggestions);
      setShowSuggestions(memberSuggestions.length > 0);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  };

  const selectSuggestion = (suggestion: string) => {
    setMemberName(suggestion);
    setShowSuggestions(false);
    setSuggestions([]);
  };

  const analyzeCareer = async () => {
    if (!memberName.trim()) return;

    try {
      setLoading(true);
      setError(null);
      setShowSuggestions(false);

      const [alignmentData, developmentData] = await Promise.all([
        geminiChatService.analyzeCareerAlignmentByName(memberName),
        geminiChatService.getDevelopmentOpportunitiesByName(memberName),
      ]);
      setAlignment(alignmentData);
      setDevelopment(developmentData);
    } catch (err) {
      console.error("Error analyzing career:", err);
      setError("Failed to analyze career data. Please check the member name.");
    } finally {
      setLoading(false);
    }
  };

  const handleAiQuery = async () => {
    if (!aiQuery.trim()) return;

    try {
      setAiLoading(true);

      // Use the new optimized method that caches team context
      const response = await geminiChatService.getOptimizedInsightsResponse(
        aiQuery,
        "PEOPLE - Analyzing career alignment, development opportunities, colleague connections, mentorship matching, and personal growth recommendations for team members"
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

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center gap-2 mb-6">
        <Users className="h-6 w-6" />
        <h1 className="text-3xl font-bold">People Insights</h1>
      </div>

      <Tabs defaultValue="career-analysis" className="space-y-6">
        <TabsList>
          <TabsTrigger value="career-analysis">Career Analysis</TabsTrigger>
          <TabsTrigger value="ai-assistant">AI Assistant</TabsTrigger>
        </TabsList>

        <TabsContent value="career-analysis" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Career Analysis</CardTitle>
              <CardDescription>
                Analyze career path alignment and development opportunities
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2 mb-4">
                <div className="relative flex-1">
                  <Input
                    placeholder="Enter member name (e.g., John Doe)"
                    value={memberName}
                    onChange={(e) => handleNameChange(e.target.value)}
                    onBlur={() =>
                      setTimeout(() => setShowSuggestions(false), 200)
                    }
                    onFocus={() => {
                      if (suggestions.length > 0) {
                        setShowSuggestions(true);
                      }
                    }}
                  />
                  {showSuggestions && suggestions.length > 0 && (
                    <div className="absolute z-10 w-full mt-1 bg-background border border-border rounded-md shadow-lg max-h-60 overflow-auto">
                      {suggestions.map((suggestion, index) => (
                        <div
                          key={index}
                          className="px-3 py-2 cursor-pointer hover:bg-accent hover:text-accent-foreground text-sm"
                          onClick={() => selectSuggestion(suggestion)}
                        >
                          {suggestion}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <Button onClick={analyzeCareer} disabled={loading}>
                  {loading ? "Analyzing..." : "Analyze"}
                </Button>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-md p-3 text-red-800 mb-4">
                  {error}
                </div>
              )}

              {alignment && development && (
                <Tabs defaultValue="alignment" className="space-y-4">
                  <TabsList>
                    <TabsTrigger value="alignment">
                      Career Alignment
                    </TabsTrigger>
                    <TabsTrigger value="development">
                      Development Opportunities
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="alignment">
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Target className="h-5 w-5" />
                          {alignment.member.fullName}
                        </CardTitle>
                        <CardDescription>
                          {alignment.member.corporateEmail}
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="text-sm font-medium">
                              Current Assignment Alignment
                            </label>
                            <div className="flex items-center gap-2 mt-1">
                              <Progress
                                value={alignment.currentAssignmentAlignment}
                                className="flex-1"
                              />
                              <span className="text-sm font-medium">
                                {alignment.currentAssignmentAlignment}%
                              </span>
                            </div>
                          </div>
                          <div>
                            <label className="text-sm font-medium">
                              Interest Alignment Score
                            </label>
                            <div className="flex items-center gap-2 mt-1">
                              <Progress
                                value={alignment.interestAlignmentScore}
                                className="flex-1"
                              />
                              <span className="text-sm font-medium">
                                {alignment.interestAlignmentScore}%
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <h4 className="font-medium mb-2">
                              Recommendations
                            </h4>
                            <div className="space-y-1">
                              {alignment.recommendations.map((rec, index) => (
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
                          <div>
                            <h4 className="font-medium mb-2">
                              Potential Opportunities
                            </h4>
                            <div className="space-y-1">
                              {alignment.potentialOpportunities.map(
                                (opp, index) => (
                                  <div
                                    key={index}
                                    className="text-sm flex items-start gap-2"
                                  >
                                    <div className="w-2 h-2 bg-green-500 rounded-full mt-1.5 flex-shrink-0"></div>
                                    {opp}
                                  </div>
                                )
                              )}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>

                  <TabsContent value="development">
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <TrendingUp className="h-5 w-5" />
                          Development Plan for {development.member.fullName}
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <h4 className="font-medium mb-2">
                              Skill Gaps to Address
                            </h4>
                            <div className="space-y-1">
                              {development.skillGaps.length === 0 ? (
                                <p className="text-sm text-muted-foreground">
                                  No significant skill gaps identified
                                </p>
                              ) : (
                                development.skillGaps.map((skill, index) => (
                                  <Badge key={index} variant="outline">
                                    {skill}
                                  </Badge>
                                ))
                              )}
                            </div>
                          </div>
                          <div>
                            <h4 className="font-medium mb-2">
                              Career Path Suggestions
                            </h4>
                            <div className="space-y-1">
                              {development.careerPathSuggestions.map(
                                (path, index) => (
                                  <div
                                    key={index}
                                    className="text-sm flex items-start gap-2"
                                  >
                                    <div className="w-2 h-2 bg-purple-500 rounded-full mt-1.5 flex-shrink-0"></div>
                                    {path}
                                  </div>
                                )
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <h4 className="font-medium mb-2">
                              Recommended Training
                            </h4>
                            <div className="space-y-1">
                              {development.recommendedTraining.map(
                                (training, index) => (
                                  <div
                                    key={index}
                                    className="text-sm flex items-start gap-2"
                                  >
                                    <div className="w-2 h-2 bg-orange-500 rounded-full mt-1.5 flex-shrink-0"></div>
                                    {training}
                                  </div>
                                )
                              )}
                            </div>
                          </div>
                          <div>
                            <h4 className="font-medium mb-2">
                              Mentorship Opportunities
                            </h4>
                            <div className="space-y-1">
                              {development.mentorshipOpportunities.map(
                                (opportunity, index) => (
                                  <div
                                    key={index}
                                    className="text-sm flex items-start gap-2"
                                  >
                                    <div className="w-2 h-2 bg-green-500 rounded-full mt-1.5 flex-shrink-0"></div>
                                    {opportunity}
                                  </div>
                                )
                              )}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>
                </Tabs>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* AI Assistant Tab */}
        <TabsContent value="ai-assistant" className="space-y-6">
          <AIAssistant
            contextType="PEOPLE"
            contextDescription="Ask me about career alignment, development opportunities, colleague connections, mentorship matching, and personal growth recommendations for team members."
            placeholder="Ask about career development, mentorship, or team connections..."
            className="min-h-[600px]"
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
