import { GoogleGenAI } from "@google/genai";
import { memberDb, memberProfileDb, memberSkillDb, skillDb } from "./database";
import type { Member, MemberProfile, Skill, MemberSkill } from "@/types";

const API_KEY = "AIzaSyB1t_U2kgK4vXqU4g0yQjT42pXnLtHN8ek";
const ai = new GoogleGenAI({ apiKey: API_KEY });

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

export interface TeamMemberSuggestion {
  member: Member;
  profile?: MemberProfile;
  matchScore: number;
  reason: string;
  availability: string;
}

interface SuggestionResponse {
  memberId: string;
  matchScore: number;
  reason: string;
  availability: string;
}

class GeminiChatService {
  async analyzeTeamAndProvideRecommendations(prompt: string): Promise<{
    response: string;
    suggestions: TeamMemberSuggestion[];
  }> {
    try {
      // Load team data
      const members = memberDb.getAll();
      const profiles = memberProfileDb.getAll();
      const skills = skillDb.getAll();

      // Create team context
      const teamContext = this.createTeamContext(members, profiles, skills);

      // Create analysis prompt
      const analysisPrompt = `
You are a team assignment AI assistant for Techie Talent. Your role is to analyze team members and provide intelligent recommendations based on project requirements.

TEAM DATA:
${teamContext}

USER REQUEST: ${prompt}

Please provide:
1. A conversational response addressing the user's request
2. Specific team member recommendations with match scores (0-100)
3. Clear reasoning for each recommendation

Format your response as JSON with this structure:
{
  "response": "Your conversational response here",
  "suggestions": [
    {
      "memberId": "member-id",
      "matchScore": 85,
      "reason": "Detailed reason for recommendation",
      "availability": "Available/Assigned to ClientName"
    }
  ]
}

Focus on:
- Technical skills and proficiency levels
- Assignment history and client experience
- Current availability status
- Location and timezone considerations
- Career interests and professional goals
`;

      const result = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: analysisPrompt,
      });

      // Parse the response
      const responseText = result.text || "";
      let parsedResponse;

      try {
        // Try to extract JSON from the response
        const jsonMatch = responseText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          parsedResponse = JSON.parse(jsonMatch[0]);
        } else {
          throw new Error("No JSON found in response");
        }
      } catch (error) {
        console.error("Failed to parse AI response:", error);
        // Fallback response
        parsedResponse = {
          response: responseText,
          suggestions: [],
        };
      }

      // Map suggestions to include full member data
      const suggestions: TeamMemberSuggestion[] =
        parsedResponse.suggestions
          ?.map((suggestion: SuggestionResponse) => {
            const member = members.find(
              (m: Member) => m.id === suggestion.memberId
            );
            const profile = profiles.find(
              (p: MemberProfile) => p.memberId === suggestion.memberId
            );

            if (!member) {
              return null;
            }

            return {
              member,
              profile,
              matchScore: suggestion.matchScore,
              reason: suggestion.reason,
              availability: suggestion.availability,
            };
          })
          .filter(Boolean) || [];

      return {
        response: parsedResponse.response || responseText,
        suggestions,
      };
    } catch (error) {
      console.error("Error in team analysis:", error);
      return {
        response:
          "I'm sorry, I encountered an error while analyzing the team. Please try again.",
        suggestions: [],
      };
    }
  }

  private createTeamContext(
    members: Member[],
    profiles: MemberProfile[],
    skills: Skill[]
  ): string {
    const context = members
      .map((member) => {
        const profile = profiles.find((p) => p.memberId === member.id);
        const memberSkills = memberSkillDb.getByMemberId(member.id);

        return `
MEMBER: ${member.fullName} (${member.id})
- Email: ${member.corporateEmail}
- Category: ${member.category}
- Location: ${member.location}
- Current Status: ${member.currentAssignedClient || "Available"}
- Hire Date: ${member.hireDate}

SKILLS:
${memberSkills
  .map((ms: MemberSkill) => {
    const skill = skills.find((s) => s.id === ms.skillId);
    return `- ${skill?.name || "Unknown"}: Level ${ms.proficiencyValue}`;
  })
  .join("\n")}

PROFILE:
${
  profile
    ? `
- About: ${profile.aboutMe || "Not provided"}
- Goals: ${profile.professionalGoals?.join(", ") || "Not specified"}
- Interests: ${profile.careerInterests?.join(", ") || "Not specified"}
- Assignments: ${profile.assignments?.length || 0} previous assignments
- Feedback Comments: ${profile.feedbackComments?.length || 0} feedback entries
`
    : "No profile available"
}
      `;
      })
      .join("\n---\n");

    return context;
  }

  async sendMessage(message: string): Promise<string> {
    try {
      const response = await ai.models.generateContent({
        model: "gemini-2.5-pro",
        contents: message,
      });

      return response.text || "";
    } catch (error) {
      console.error("Error sending message:", error);
      throw new Error("Failed to get response from AI");
    }
  }
}

export const geminiChatService = new GeminiChatService();
