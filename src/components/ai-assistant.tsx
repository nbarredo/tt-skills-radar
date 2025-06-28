import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Bot, Send, RefreshCw, Database, Clock, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface AIAssistantProps {
  contextType: string;
  contextDescription: string;
  placeholder?: string;
  className?: string;
}

interface ContextStatus {
  hasContext: boolean;
  lastUpdated: Date | null;
  sessionId: string | null;
  minutesUntilExpiry: number | null;
  teamMemberCount: number;
}

interface AIMessage {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: Date;
  contextType?: string;
}

// Global AI Context Manager
class AIContextManager {
  private static instance: AIContextManager;
  private contextData: any = null;
  private sessionId: string | null = null;
  private lastUpdated: Date | null = null;
  private readonly CONTEXT_EXPIRY_MINUTES = 30;
  private subscribers: Set<() => void> = new Set();

  static getInstance(): AIContextManager {
    if (!AIContextManager.instance) {
      AIContextManager.instance = new AIContextManager();
    }
    return AIContextManager.instance;
  }

  subscribe(callback: () => void) {
    this.subscribers.add(callback);
    return () => this.subscribers.delete(callback);
  }

  private notifySubscribers() {
    this.subscribers.forEach((callback) => callback());
  }

  async initializeContext(): Promise<void> {
    const now = new Date();

    // Check if context is still valid
    if (
      this.contextData &&
      this.lastUpdated &&
      now.getTime() - this.lastUpdated.getTime() <
        this.CONTEXT_EXPIRY_MINUTES * 60 * 1000
    ) {
      return;
    }

    try {
      // Import database functions dynamically to avoid circular dependencies
      const {
        memberDb,
        memberProfileDb,
        skillDb,
        memberSkillDb,
        knowledgeAreaDb,
      } = await import("@/lib/database");

      // Load all team data
      const members = memberDb.getAll();
      const profiles = memberProfileDb.getAll();
      const skills = skillDb.getAll();
      const knowledgeAreas = knowledgeAreaDb.getAll();

      // Create comprehensive but optimized context
      this.contextData = {
        teamSummary: await this.createTeamSummary(members, profiles, skills),
        fullTeamData: {
          members: members.map((m) => ({
            id: m.id,
            name: m.fullName,
            email: m.corporateEmail,
            category: m.category,
            location: m.location,
            currentClient: m.currentAssignedClient || "Available",
            availabilityStatus: m.availabilityStatus,
            hireDate: m.hireDate,
          })),
          skills: skills.map((s) => ({
            id: s.id,
            name: s.name,
            skillCategoryId: s.skillCategoryId,
            knowledgeAreaId: s.knowledgeAreaId,
          })),
          memberSkills: memberSkillDb
            .getAll()
            .filter((ms: any) => parseInt(ms.proficiencyValue) > 1),
          knowledgeAreas: knowledgeAreas.map((ka) => ({
            id: ka.id,
            name: ka.name,
            description: ka.description,
          })),
        },
        metadata: {
          totalMembers: members.length,
          totalSkills: skills.length,
          totalKnowledgeAreas: knowledgeAreas.length,
          lastUpdated: now.toISOString(),
        },
      };

      this.sessionId = `ai-session-${now.getTime()}`;
      this.lastUpdated = now;

      console.log("AI Context initialized:", {
        sessionId: this.sessionId,
        teamMembers: this.contextData.metadata.totalMembers,
        skills: this.contextData.metadata.totalSkills,
      });

      this.notifySubscribers();
    } catch (error) {
      console.error("Error initializing AI context:", error);
      throw error;
    }
  }

  private async createTeamSummary(
    members: any[],
    profiles: any[],
    skills: any[]
  ): Promise<string> {
    // Import memberSkillDb dynamically to avoid circular dependencies
    const { memberSkillDb } = await import("@/lib/database");

    return members
      .map((member) => {
        const profile = profiles.find((p) => p.memberId === member.id);
        const memberSkills = memberSkillDb
          .getByMemberId(member.id)
          .filter((ms: any) => parseInt(ms.proficiencyValue) > 1);

        const topSkills = memberSkills
          .filter((ms: any) => parseInt(ms.proficiencyValue) >= 3)
          .map((ms: any) => {
            const skill = skills.find((s) => s.id === ms.skillId);
            return `${skill?.name || "Unknown"}(L${ms.proficiencyValue})`;
          })
          .slice(0, 5)
          .join(", ");

        const experience = this.calculateExperience(member, profile);

        return `${member.fullName}: ${member.category}, ${member.location}, ${
          member.currentAssignedClient || "Available"
        }, ${experience}y exp, Skills: ${topSkills || "None"}`;
      })
      .join("\n");
  }

  private calculateExperience(member: any, profile: any): number {
    if (profile?.yearsOfExperience) {
      return profile.yearsOfExperience;
    }

    if (member.hireDate) {
      const hireDate = new Date(member.hireDate);
      const now = new Date();
      const years =
        (now.getTime() - hireDate.getTime()) / (1000 * 60 * 60 * 24 * 365);
      return Math.max(0, Math.round(years * 10) / 10);
    }

    return 2.4; // Default fallback
  }

  getContextStatus(): ContextStatus {
    if (!this.contextData || !this.lastUpdated) {
      return {
        hasContext: false,
        lastUpdated: null,
        sessionId: null,
        minutesUntilExpiry: null,
        teamMemberCount: 0,
      };
    }

    const now = new Date();
    const minutesElapsed =
      (now.getTime() - this.lastUpdated.getTime()) / (1000 * 60);
    const minutesUntilExpiry = this.CONTEXT_EXPIRY_MINUTES - minutesElapsed;

    return {
      hasContext: true,
      lastUpdated: this.lastUpdated,
      sessionId: this.sessionId,
      minutesUntilExpiry: Math.max(0, minutesUntilExpiry),
      teamMemberCount: this.contextData.metadata?.totalMembers || 0,
    };
  }

  getTeamSummary(): string {
    return this.contextData?.teamSummary || "";
  }

  async refreshContext(): Promise<void> {
    this.contextData = null;
    this.sessionId = null;
    this.lastUpdated = null;
    await this.initializeContext();
  }

  clearContext(): void {
    this.contextData = null;
    this.sessionId = null;
    this.lastUpdated = null;
    this.notifySubscribers();
  }
}

export function AIAssistant({
  contextType,
  contextDescription,
  placeholder = "Ask me anything about the team...",
  className,
}: AIAssistantProps) {
  const [messages, setMessages] = useState<AIMessage[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [contextStatus, setContextStatus] = useState<ContextStatus>({
    hasContext: false,
    lastUpdated: null,
    sessionId: null,
    minutesUntilExpiry: null,
    teamMemberCount: 0,
  });

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const contextManager = AIContextManager.getInstance();

  // Subscribe to context updates
  useEffect(() => {
    const updateContextStatus = () => {
      setContextStatus(contextManager.getContextStatus());
    };

    updateContextStatus();
    const unsubscribe = contextManager.subscribe(updateContextStatus);

    // Update status every minute
    const interval = setInterval(updateContextStatus, 60000);

    return () => {
      unsubscribe();
      clearInterval(interval);
    };
  }, []);

  // Initialize context on first load
  useEffect(() => {
    const initContext = async () => {
      try {
        await contextManager.initializeContext();
      } catch (error) {
        console.error("Error initializing context:", error);
      }
    };

    if (!contextStatus.hasContext) {
      initContext();
    }
  }, [contextStatus.hasContext]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: AIMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      content: input.trim(),
      timestamp: new Date(),
      contextType,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      // Ensure context is initialized
      await contextManager.initializeContext();

      const teamSummary = contextManager.getTeamSummary();

      // Build conversation history for context
      const conversationHistory = messages
        .slice(-6) // Keep last 6 messages for context (3 exchanges)
        .map(
          (msg) =>
            `${msg.role === "user" ? "User" : "Assistant"}: ${msg.content}`
        )
        .join("\n\n");

      // Create the AI prompt with context and conversation history
      const prompt = `
You are a team insights AI assistant for Techie Talent. You have access to our team data and should maintain conversation context.

TEAM CONTEXT:
${teamSummary}

CONTEXT TYPE: ${contextType}
CONTEXT DESCRIPTION: ${contextDescription}

${
  conversationHistory ? `CONVERSATION HISTORY:\n${conversationHistory}\n\n` : ""
}

CURRENT USER QUESTION: ${input.trim()}

INSTRUCTIONS:
- Use ONLY the team members listed in the context above
- Maintain conversation flow - refer back to previous questions/answers when relevant
- Provide specific names, skill levels, and availability from the data
- Format with **bold** headers and - bullet points
- Be concise but specific
- Always mention actual team member names when relevant
- If the user is asking follow-up questions, build upon previous responses

Please analyze the team data and provide specific recommendations while maintaining conversation context.
`;

      // Import gemini service dynamically
      const { geminiChatService } = await import("@/lib/gemini");

      // Call the AI service
      const response = await geminiChatService.sendMessage(prompt);

      const assistantMessage: AIMessage = {
        id: `assistant-${Date.now()}`,
        role: "assistant",
        content: response,
        timestamp: new Date(),
        contextType,
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error("Error getting AI response:", error);
      const errorMessage: AIMessage = {
        id: `error-${Date.now()}`,
        role: "assistant",
        content: `Sorry, I encountered an error: ${
          error instanceof Error ? error.message : "Unknown error"
        }. Please try again.`,
        timestamp: new Date(),
        contextType,
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefreshContext = async () => {
    try {
      await contextManager.refreshContext();
    } catch (error) {
      console.error("Error refreshing context:", error);
    }
  };

  const handleClearConversation = () => {
    setMessages([]);
  };

  const formatMessage = (content: string) => {
    // Convert markdown-style formatting to HTML
    return content
      .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
      .replace(/\*(.*?)\*/g, "<em>$1</em>")
      .replace(/^- (.+)$/gm, "• $1")
      .replace(/\n/g, "<br/>");
  };

  return (
    <Card className={cn("h-full flex flex-col", className)}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bot className="h-5 w-5 text-primary" />
            <span>AI Assistant</span>
            <Badge variant="outline" className="text-xs">
              {contextType}
            </Badge>
          </div>

          <div className="flex items-center gap-2">
            {contextStatus.hasContext && (
              <>
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Database className="h-3 w-3" />
                  <span>{contextStatus.teamMemberCount} members</span>
                </div>
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  <span>
                    {Math.round(contextStatus.minutesUntilExpiry || 0)}m
                  </span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleRefreshContext}
                  className="h-6 px-2"
                  title="Refresh team context"
                >
                  <RefreshCw className="h-3 w-3" />
                </Button>
                {messages.length > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleClearConversation}
                    className="h-6 px-2"
                    title="Clear conversation"
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                )}
              </>
            )}
          </div>
        </CardTitle>

        <p className="text-sm text-muted-foreground">{contextDescription}</p>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col gap-4 p-4">
        {/* Messages */}
        <div className="flex-1 overflow-y-auto space-y-4 min-h-[300px] max-h-[500px]">
          {messages.length === 0 && (
            <div className="text-center text-muted-foreground py-8">
              <Bot className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>Ask me anything about the team!</p>
              <p className="text-xs mt-1">
                I have access to all team member skills, availability, and
                profiles.
              </p>
            </div>
          )}

          {messages.map((message) => (
            <div
              key={message.id}
              className={cn(
                "flex gap-3 p-3 rounded-lg",
                message.role === "user"
                  ? "bg-primary text-primary-foreground ml-8"
                  : "bg-muted mr-8"
              )}
            >
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-medium">
                    {message.role === "user" ? "You" : "AI Assistant"}
                  </span>
                  <span className="text-xs opacity-70">
                    {message.timestamp.toLocaleTimeString()}
                  </span>
                </div>
                <div
                  className="text-sm"
                  dangerouslySetInnerHTML={{
                    __html: formatMessage(message.content),
                  }}
                />
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex gap-3 p-3 rounded-lg bg-muted mr-8">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-medium">AI Assistant</span>
                  <div className="flex gap-1">
                    <div className="w-2 h-2 bg-primary rounded-full animate-bounce"></div>
                    <div
                      className="w-2 h-2 bg-primary rounded-full animate-bounce"
                      style={{ animationDelay: "0.1s" }}
                    ></div>
                    <div
                      className="w-2 h-2 bg-primary rounded-full animate-bounce"
                      style={{ animationDelay: "0.2s" }}
                    ></div>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">Thinking...</p>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="flex gap-2">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={placeholder}
            className="min-h-[60px]"
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
          />
          <Button
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            className="self-end"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export { AIContextManager };
