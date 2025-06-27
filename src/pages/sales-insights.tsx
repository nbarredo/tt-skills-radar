import { useState, useEffect } from "react";
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
import { Search, TrendingUp, MapPin, Users } from "lucide-react";
import {
  geminiChatService,
  type SkillAvailabilityResult,
  type KnowledgeAreaStrength,
} from "@/lib/gemini";
import { AIAssistant } from "@/components/ai-assistant";

export function SalesInsightsPage() {
  const [loading, setLoading] = useState(false);
  const [skillQuery, setSkillQuery] = useState("");
  const [skillAvailability, setSkillAvailability] =
    useState<SkillAvailabilityResult | null>(null);
  const [knowledgeStrengths, setKnowledgeStrengths] = useState<
    KnowledgeAreaStrength[]
  >([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadKnowledgeStrengths();
  }, []);

  const loadKnowledgeStrengths = async () => {
    try {
      setLoading(true);
      const strengths = await geminiChatService.getKnowledgeAreaStrengths();
      setKnowledgeStrengths(strengths);
    } catch (err) {
      console.error("Error loading knowledge strengths:", err);
      setError("Failed to load knowledge area strengths");
    } finally {
      setLoading(false);
    }
  };

  const searchSkillAvailability = async () => {
    if (!skillQuery.trim()) return;

    try {
      setLoading(true);
      setError(null);
      const result = await geminiChatService.getSkillAvailability(skillQuery);
      setSkillAvailability(result);
    } catch (err) {
      console.error("Error searching skill availability:", err);
      setError(
        `Failed to find skill "${skillQuery}". Please try a different skill name.`
      );
      setSkillAvailability(null);
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

  const getProficiencyColor = (level: number) => {
    if (level >= 4) return "bg-green-500";
    if (level >= 3) return "bg-blue-500";
    if (level >= 2) return "bg-yellow-500";
    return "bg-gray-500";
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center gap-2 mb-6">
        <TrendingUp className="h-6 w-6" />
        <h1 className="text-3xl font-bold">Sales Insights</h1>
      </div>

      <Tabs defaultValue="skill-availability" className="space-y-6">
        <TabsList>
          <TabsTrigger value="skill-availability">
            Skill Availability
          </TabsTrigger>
          <TabsTrigger value="knowledge-strengths">
            Knowledge Area Strengths
          </TabsTrigger>
          <TabsTrigger value="ai-assistant">AI Assistant</TabsTrigger>
        </TabsList>

        {/* Skill Availability Tab */}
        <TabsContent value="skill-availability" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Search className="h-5 w-5" />
                Skill Availability Query
              </CardTitle>
              <CardDescription>
                Find team members with specific skills/technologies who are
                available for new projects
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2 mb-4">
                <Input
                  placeholder="Enter skill or technology (e.g., React, Java, Python)"
                  value={skillQuery}
                  onChange={(e) => setSkillQuery(e.target.value)}
                  onKeyPress={(e) =>
                    e.key === "Enter" && searchSkillAvailability()
                  }
                />
                <Button onClick={searchSkillAvailability} disabled={loading}>
                  {loading ? "Searching..." : "Search"}
                </Button>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-md p-3 text-red-800 mb-4">
                  {error}
                </div>
              )}

              {skillAvailability && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <Card>
                      <CardContent className="p-4">
                        <div className="text-2xl font-bold text-center">
                          {skillAvailability.totalPeople}
                        </div>
                        <div className="text-sm text-muted-foreground text-center">
                          Total People
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="p-4">
                        <div className="text-2xl font-bold text-green-600 text-center">
                          {skillAvailability.availableNow.length}
                        </div>
                        <div className="text-sm text-muted-foreground text-center">
                          Available Now
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="p-4">
                        <div className="text-2xl font-bold text-yellow-600 text-center">
                          {skillAvailability.availableSoon.length}
                        </div>
                        <div className="text-sm text-muted-foreground text-center">
                          Available Soon
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="p-4">
                        <div className="text-2xl font-bold text-red-600 text-center">
                          {skillAvailability.assigned.length}
                        </div>
                        <div className="text-sm text-muted-foreground text-center">
                          Currently Assigned
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Available Now */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-green-600">
                          Available Now
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        {skillAvailability.availableNow.length === 0 ? (
                          <p className="text-muted-foreground">
                            No members available now
                          </p>
                        ) : (
                          <div className="space-y-3">
                            {skillAvailability.availableNow.map((member) => (
                              <div
                                key={member.id}
                                className="border rounded-lg p-3"
                              >
                                <div className="flex justify-between items-start mb-2">
                                  <h4 className="font-medium">{member.name}</h4>
                                  <div className="flex items-center gap-1">
                                    <div
                                      className={`w-3 h-3 rounded-full ${getProficiencyColor(
                                        member.proficiencyLevel
                                      )}`}
                                    ></div>
                                    <span className="text-sm">
                                      L{member.proficiencyLevel}
                                    </span>
                                  </div>
                                </div>
                                <div className="flex gap-2 mb-2">
                                  <Badge
                                    className={getCategoryColor(
                                      member.category
                                    )}
                                  >
                                    {member.category}
                                  </Badge>
                                  <Badge
                                    variant="outline"
                                    className="flex items-center gap-1"
                                  >
                                    <MapPin className="h-3 w-3" />
                                    {member.location}
                                  </Badge>
                                </div>
                                <div className="text-sm text-muted-foreground">
                                  {member.experience} years experience
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </CardContent>
                    </Card>

                    {/* Available Soon */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-yellow-600">
                          Available Soon
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        {skillAvailability.availableSoon.length === 0 ? (
                          <p className="text-muted-foreground">
                            No members available soon
                          </p>
                        ) : (
                          <div className="space-y-3">
                            {skillAvailability.availableSoon.map((member) => (
                              <div
                                key={member.id}
                                className="border rounded-lg p-3"
                              >
                                <div className="flex justify-between items-start mb-2">
                                  <h4 className="font-medium">{member.name}</h4>
                                  <div className="flex items-center gap-1">
                                    <div
                                      className={`w-3 h-3 rounded-full ${getProficiencyColor(
                                        member.proficiencyLevel
                                      )}`}
                                    ></div>
                                    <span className="text-sm">
                                      L{member.proficiencyLevel}
                                    </span>
                                  </div>
                                </div>
                                <div className="flex gap-2 mb-2">
                                  <Badge
                                    className={getCategoryColor(
                                      member.category
                                    )}
                                  >
                                    {member.category}
                                  </Badge>
                                  <Badge
                                    variant="outline"
                                    className="flex items-center gap-1"
                                  >
                                    <MapPin className="h-3 w-3" />
                                    {member.location}
                                  </Badge>
                                </div>
                                <div className="text-sm text-muted-foreground">
                                  {member.experience} years experience
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </CardContent>
                    </Card>

                    {/* Currently Assigned */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-red-600">
                          Currently Assigned
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        {skillAvailability.assigned.length === 0 ? (
                          <p className="text-muted-foreground">
                            No members currently assigned
                          </p>
                        ) : (
                          <div className="space-y-3">
                            {skillAvailability.assigned.map((member) => (
                              <div
                                key={member.id}
                                className="border rounded-lg p-3"
                              >
                                <div className="flex justify-between items-start mb-2">
                                  <h4 className="font-medium">{member.name}</h4>
                                  <div className="flex items-center gap-1">
                                    <div
                                      className={`w-3 h-3 rounded-full ${getProficiencyColor(
                                        member.proficiencyLevel
                                      )}`}
                                    ></div>
                                    <span className="text-sm">
                                      L{member.proficiencyLevel}
                                    </span>
                                  </div>
                                </div>
                                <div className="flex gap-2 mb-2">
                                  <Badge
                                    className={getCategoryColor(
                                      member.category
                                    )}
                                  >
                                    {member.category}
                                  </Badge>
                                  <Badge
                                    variant="outline"
                                    className="flex items-center gap-1"
                                  >
                                    <MapPin className="h-3 w-3" />
                                    {member.location}
                                  </Badge>
                                </div>
                                <div className="text-sm text-muted-foreground mb-1">
                                  {member.experience} years experience
                                </div>
                                <div className="text-sm text-blue-600">
                                  Currently: {member.currentClient}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Knowledge Area Strengths Tab */}
        <TabsContent value="knowledge-strengths" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Knowledge Area Strengths
              </CardTitle>
              <CardDescription>
                Overview of our strongest knowledge areas for positioning in
                client conversations
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8">
                  Loading knowledge area strengths...
                </div>
              ) : (
                <div className="space-y-6">
                  {knowledgeStrengths.map((strength, index) => (
                    <Card
                      key={strength.knowledgeArea}
                      className="border-l-4 border-l-blue-500"
                    >
                      <CardHeader>
                        <div className="flex justify-between items-start">
                          <div>
                            <CardTitle className="text-lg">
                              #{index + 1} {strength.knowledgeArea}
                            </CardTitle>
                            <CardDescription>
                              {strength.totalTalent} team members •{" "}
                              {strength.expertCount} experts (Level 4+)
                            </CardDescription>
                          </div>
                          <div className="text-right">
                            <div className="text-2xl font-bold text-blue-600">
                              {strength.averageExperience.toFixed(1)}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              Avg Experience
                            </div>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                          <div>
                            <h4 className="font-medium mb-3">
                              Key Technologies
                            </h4>
                            <div className="flex flex-wrap gap-2">
                              {strength.keyTechnologies.map((tech) => (
                                <Badge key={tech} variant="outline">
                                  {tech}
                                </Badge>
                              ))}
                            </div>
                          </div>
                          <div>
                            <h4 className="font-medium mb-3">Top Experts</h4>
                            <div className="space-y-2">
                              {strength.topExperts.slice(0, 3).map((expert) => (
                                <div
                                  key={expert.id}
                                  className="flex justify-between items-center"
                                >
                                  <div>
                                    <span className="font-medium">
                                      {expert.name}
                                    </span>
                                    <span className="text-sm text-muted-foreground ml-2">
                                      ({expert.category})
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <div
                                      className={`w-3 h-3 rounded-full ${getProficiencyColor(
                                        expert.proficiencyLevel
                                      )}`}
                                    ></div>
                                    <span className="text-sm">
                                      L{expert.proficiencyLevel}
                                    </span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                        <div className="mt-4">
                          <div className="flex justify-between text-sm mb-2">
                            <span>Team Strength</span>
                            <span>
                              {Math.round(
                                (strength.totalTalent /
                                  Math.max(
                                    ...knowledgeStrengths.map(
                                      (s) => s.totalTalent
                                    )
                                  )) *
                                  100
                              )}
                              %
                            </span>
                          </div>
                          <Progress
                            value={
                              (strength.totalTalent /
                                Math.max(
                                  ...knowledgeStrengths.map(
                                    (s) => s.totalTalent
                                  )
                                )) *
                              100
                            }
                          />
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* AI Assistant Tab */}
        <TabsContent value="ai-assistant" className="space-y-6">
          <AIAssistant
            contextType="SALES"
            contextDescription="Ask me about team member skills, availability, client presentations, competitive positioning, and sales opportunities. I can help you find the right people for client needs."
            placeholder="Ask about team skills, availability, or sales opportunities..."
            className="min-h-[600px]"
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
