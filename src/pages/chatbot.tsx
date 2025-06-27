import { AIAssistant } from "@/components/ai-assistant";

export function ChatbotPage() {
  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">AI Assistant</h1>
        <p className="text-muted-foreground">
          Ask me anything about the team members, their skills, availability,
          career development, or any insights you need.
        </p>
      </div>

      <AIAssistant
        contextType="GENERAL"
        contextDescription="I'm your general AI assistant with access to all team data. Ask me about anything related to team members, skills, projects, career development, or business insights."
        placeholder="Ask me anything about the team..."
        className="min-h-[700px]"
      />
    </div>
  );
}
