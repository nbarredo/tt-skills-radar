import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  MessageCircle,
  Send,
  Bot,
  User,
  Loader2,
  Sparkles,
  Users,
  Calendar,
  MapPin,
  Mail,
} from "lucide-react";
import {
  geminiChatService,
  type ChatMessage,
  type TeamMemberSuggestion,
} from "@/lib/gemini";
import { useToast } from "@/components/ui/use-toast";

export function Chatbot() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: crypto.randomUUID(),
      role: "assistant",
      content:
        'Hi! I\'m your AI assistant for finding the perfect team members for your projects. Just describe what you need and I\'ll suggest the best matches from our team! \n\nFor example, you could ask:\n- "I need a senior .NET developer for a US client"\n- "Who has experience with React and is available soon?"\n- "Find me someone who worked with Lunavi before"',
      timestamp: new Date(),
    },
  ]);
  const [inputMessage, setInputMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<TeamMemberSuggestion[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: "user",
      content: inputMessage.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputMessage("");
    setIsLoading(true);
    setSuggestions([]);

    try {
      // Get AI response with team recommendations
      const result =
        await geminiChatService.analyzeTeamAndProvideRecommendations(
          inputMessage
        );

      setSuggestions(result.suggestions);

      const assistantMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: result.response,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error("Error getting AI response:", error);
      toast({
        title: "Error",
        description: "Failed to get response. Please try again.",
        variant: "destructive",
      });

      const errorMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: "assistant",
        content:
          "Sorry, I encountered an error. Please try rephrasing your question or try again later.",
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  const exampleQuestions = [
    "I need a senior .NET developer for a US client",
    "Who has React experience and is available now?",
    "Find someone who worked with Lunavi before",
    "I need a full-stack developer for a startup project",
    "Who speaks Spanish and has mobile app experience?",
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bot className="h-6 w-6 text-primary" />
            Team Member Assistant
            <Sparkles className="h-4 w-4 text-yellow-500" />
          </CardTitle>
          <p className="text-muted-foreground">
            AI-powered team member recommendations based on skills, experience,
            and availability
          </p>
        </CardHeader>
      </Card>

      <div className="space-y-6">
        {/* Chat Interface */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-3">
            <Card className="h-[600px] flex flex-col">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <MessageCircle className="h-5 w-5" />
                  Chat
                </CardTitle>
              </CardHeader>

              <CardContent className="flex-1 flex flex-col p-4">
                {/* Messages */}
                <div className="flex-1 overflow-y-auto space-y-4 mb-4 scroll-smooth">
                  {messages.map((message, index) => (
                    <div
                      key={message.id}
                      className={`flex gap-3 ${
                        message.role === "user"
                          ? "justify-end"
                          : "justify-start"
                      } animate-in slide-in-from-bottom-2 fade-in duration-500`}
                      style={{ animationDelay: `${index * 100}ms` }}
                    >
                      {message.role === "assistant" && (
                        <Avatar className="h-8 w-8 flex-shrink-0">
                          <AvatarFallback className="bg-primary text-primary-foreground">
                            <Bot className="h-4 w-4" />
                          </AvatarFallback>
                        </Avatar>
                      )}

                      <div
                        className={`max-w-[85%] rounded-lg p-3 transition-all duration-300 ${
                          message.role === "user"
                            ? "bg-primary text-primary-foreground ml-auto"
                            : "bg-muted hover:bg-muted/80"
                        }`}
                      >
                        <div className="whitespace-pre-wrap text-sm leading-relaxed">
                          {message.content}
                        </div>
                        <div className="text-xs opacity-70 mt-2">
                          {formatTime(message.timestamp)}
                        </div>
                      </div>

                      {message.role === "user" && (
                        <Avatar className="h-8 w-8 flex-shrink-0">
                          <AvatarFallback className="bg-secondary">
                            <User className="h-4 w-4" />
                          </AvatarFallback>
                        </Avatar>
                      )}
                    </div>
                  ))}

                  {isLoading && (
                    <div className="flex gap-3 justify-start animate-in slide-in-from-bottom-2 fade-in duration-300">
                      <Avatar className="h-8 w-8 flex-shrink-0">
                        <AvatarFallback className="bg-primary text-primary-foreground">
                          <Bot className="h-4 w-4" />
                        </AvatarFallback>
                      </Avatar>
                      <div className="bg-muted rounded-lg p-3">
                        <div className="flex items-center gap-2">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          <span className="text-sm">Thinking...</span>
                        </div>
                      </div>
                    </div>
                  )}

                  <div ref={messagesEndRef} />
                </div>

                {/* Input */}
                <div className="flex gap-2 pt-2 border-t">
                  <Input
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Ask about team members..."
                    disabled={isLoading}
                    className="flex-1 transition-all duration-200 focus:ring-2 focus:ring-primary/20"
                  />
                  <Button
                    onClick={handleSendMessage}
                    disabled={isLoading || !inputMessage.trim()}
                    size="icon"
                    className="transition-all duration-200 hover:scale-105"
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Example Questions Sidebar */}
          <div>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Example Questions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-1">
                {exampleQuestions.map((question, index) => (
                  <Button
                    key={index}
                    variant="ghost"
                    size="sm"
                    className="w-full text-left justify-start h-auto p-2 text-[10px] leading-tight transition-all duration-200 hover:bg-accent hover:scale-[1.01] whitespace-normal"
                    onClick={() => setInputMessage(question)}
                    disabled={isLoading}
                  >
                    "{question}"
                  </Button>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Top Matches Section - Full Width Below Chat */}
        {suggestions.length > 0 && (
          <Card className="animate-in slide-in-from-bottom duration-500">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-xl">
                <Users className="h-6 w-6" />
                Top Matches ({suggestions.length})
              </CardTitle>
              <p className="text-muted-foreground">
                Best team member recommendations based on your requirements
              </p>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {suggestions.map((suggestion, index) => (
                  <div
                    key={suggestion.member.id}
                    className="p-4 border rounded-lg transition-all duration-300 hover:shadow-lg hover:border-primary/30 hover:scale-[1.02] animate-in slide-in-from-bottom fade-in bg-card"
                    style={{ animationDelay: `${index * 100}ms` }}
                  >
                    <div className="space-y-3">
                      {/* Header with Avatar and Match Score */}
                      <div className="flex items-center gap-3">
                        <Avatar className="h-12 w-12 flex-shrink-0">
                          <AvatarImage src={suggestion.member.photoUrl} />
                          <AvatarFallback className="text-sm font-medium">
                            {getInitials(suggestion.member.fullName)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold text-base truncate">
                            {suggestion.member.fullName}
                          </h4>
                          <Badge variant="secondary" className="text-xs">
                            {suggestion.matchScore}% match
                          </Badge>
                        </div>
                      </div>

                      {/* Contact Info */}
                      <div className="space-y-2 text-sm text-muted-foreground">
                        <div className="flex items-center gap-2">
                          <Mail className="h-4 w-4 flex-shrink-0" />
                          <span className="truncate">
                            {suggestion.member.corporateEmail}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4 flex-shrink-0" />
                          <span>{suggestion.member.location}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 flex-shrink-0" />
                          <span>{suggestion.availability}</span>
                        </div>
                      </div>

                      {/* Reason */}
                      <p className="text-sm text-muted-foreground line-clamp-3 leading-relaxed">
                        {suggestion.reason}
                      </p>

                      {/* Availability Badge */}
                      <div className="flex justify-between items-center">
                        <Badge
                          variant={
                            suggestion.member.availabilityStatus === "Available"
                              ? "default"
                              : suggestion.member.availabilityStatus ===
                                "Available Soon"
                              ? "secondary"
                              : "outline"
                          }
                          className="text-xs"
                        >
                          {suggestion.member.availabilityStatus}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {suggestion.member.category}
                        </Badge>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
