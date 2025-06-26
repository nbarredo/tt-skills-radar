import { useEffect } from "react";
import { Chatbot } from "@/components/chatbot";
import { initDatabase, loadExcelData } from "@/lib/database";

export function ChatbotPage() {
  useEffect(() => {
    initDatabase();
    loadExcelData();
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">AI Team Assistant</h1>
        <p className="text-muted-foreground">
          Get intelligent recommendations for your project team needs
        </p>
      </div>

      <Chatbot />
    </div>
  );
}
