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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Network, Users, MessageCircle, MapPin } from "lucide-react";
import { geminiChatService, type ColleagueConnection } from "@/lib/gemini";
import { AIAssistant } from "@/components/ai-assistant";

export function ProductionInsightsPage() {
  const [loading, setLoading] = useState(false);
  const [memberName, setMemberName] = useState("");
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [connections, setConnections] = useState<ColleagueConnection[]>([]);
  const [error, setError] = useState<string | null>(null);

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

  const findConnections = async () => {
    if (!memberName.trim()) return;

    try {
      setLoading(true);
      setError(null);
      setShowSuggestions(false);

      const connectionsData =
        await geminiChatService.findColleagueConnectionsByName(memberName);
      setConnections(connectionsData);
    } catch (err) {
      console.error("Error finding connections:", err);
      setError(
        "Failed to find colleague connections. Please check the member name."
      );
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

  const getMatchScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600";
    if (score >= 60) return "text-blue-600";
    if (score >= 40) return "text-yellow-600";
    return "text-gray-600";
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center gap-2 mb-6">
        <Network className="h-6 w-6" />
        <h1 className="text-3xl font-bold">Production Insights</h1>
      </div>

      <Tabs defaultValue="colleague-networking" className="space-y-6">
        <TabsList>
          <TabsTrigger value="colleague-networking">
            Colleague Networking
          </TabsTrigger>
          <TabsTrigger value="ai-assistant">AI Assistant</TabsTrigger>
        </TabsList>

        <TabsContent value="colleague-networking" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Colleague Networking
              </CardTitle>
              <CardDescription>
                Find colleagues with similar profiles and interests for
                knowledge sharing and collaboration
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2 mb-6">
                <div className="relative flex-1">
                  <Input
                    placeholder="Enter your name (e.g., John Doe)"
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
                <Button onClick={findConnections} disabled={loading}>
                  {loading ? "Finding..." : "Find Connections"}
                </Button>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-md p-3 text-red-800 mb-4">
                  {error}
                </div>
              )}

              {connections.length > 0 && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">
                    Top Colleague Connections ({connections.length})
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {connections.map((connection) => (
                      <Card
                        key={connection.colleague.id}
                        className="hover:shadow-md transition-shadow"
                      >
                        <CardContent className="p-4">
                          <div className="flex justify-between items-start mb-3">
                            <div>
                              <h4 className="font-medium">
                                {connection.colleague.fullName}
                              </h4>
                              <p className="text-sm text-muted-foreground">
                                {connection.colleague.corporateEmail}
                              </p>
                            </div>
                            <div className="text-right">
                              <div
                                className={`text-lg font-bold ${getMatchScoreColor(
                                  connection.matchScore
                                )}`}
                              >
                                {connection.matchScore}%
                              </div>
                              <div className="text-xs text-muted-foreground">
                                Match Score
                              </div>
                            </div>
                          </div>

                          <div className="flex gap-2 mb-3">
                            <Badge
                              className={getCategoryColor(
                                connection.colleague.category
                              )}
                            >
                              {connection.colleague.category}
                            </Badge>
                            <Badge
                              variant="outline"
                              className="flex items-center gap-1"
                            >
                              <MapPin className="h-3 w-3" />
                              {connection.colleague.location}
                            </Badge>
                          </div>

                          {connection.commonInterests.length > 0 && (
                            <div className="mb-3">
                              <p className="text-sm font-medium mb-1">
                                Common Interests:
                              </p>
                              <div className="flex flex-wrap gap-1">
                                {connection.commonInterests.map((interest) => (
                                  <Badge
                                    key={interest}
                                    variant="secondary"
                                    className="text-xs"
                                  >
                                    {interest}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          )}

                          {connection.commonSkills.length > 0 && (
                            <div className="mb-3">
                              <p className="text-sm font-medium mb-1">
                                Common Skills:
                              </p>
                              <div className="flex flex-wrap gap-1">
                                {connection.commonSkills
                                  .slice(0, 4)
                                  .map((skill) => (
                                    <Badge
                                      key={skill}
                                      variant="outline"
                                      className="text-xs"
                                    >
                                      {skill}
                                    </Badge>
                                  ))}
                                {connection.commonSkills.length > 4 && (
                                  <Badge variant="outline" className="text-xs">
                                    +{connection.commonSkills.length - 4} more
                                  </Badge>
                                )}
                              </div>
                            </div>
                          )}

                          {connection.potentialCollaboration.length > 0 && (
                            <div>
                              <p className="text-sm font-medium mb-1 flex items-center gap-1">
                                <MessageCircle className="h-3 w-3" />
                                Collaboration Ideas:
                              </p>
                              <div className="space-y-1">
                                {connection.potentialCollaboration
                                  .slice(0, 2)
                                  .map((idea, index) => (
                                    <div
                                      key={index}
                                      className="text-xs text-muted-foreground flex items-start gap-1"
                                    >
                                      <div className="w-1 h-1 bg-blue-500 rounded-full mt-1.5 flex-shrink-0"></div>
                                      {idea}
                                    </div>
                                  ))}
                              </div>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* AI Assistant Tab */}
        <TabsContent value="ai-assistant" className="space-y-6">
          <AIAssistant
            contextType="PRODUCTION"
            contextDescription="Ask me about team productivity, project delivery capabilities, resource allocation, workload distribution, and operational efficiency for optimal project execution."
            placeholder="Ask about productivity, project delivery, or resource allocation..."
            className="min-h-[600px]"
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
