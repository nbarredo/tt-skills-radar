import { GoogleGenAI } from "@google/genai";
import {
  memberDb,
  memberProfileDb,
  memberSkillDb,
  skillDb,
  knowledgeAreaDb,
} from "./database";
import type {
  Member,
  MemberProfile,
  Skill,
  MemberSkill,
  KnowledgeArea,
} from "@/types";

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

// Sales Use Cases Interfaces
export interface SkillAvailabilityResult {
  skill: string;
  totalPeople: number;
  availableNow: MemberSummary[];
  availableSoon: MemberSummary[];
  assigned: MemberSummary[];
}

export interface KnowledgeAreaStrength {
  knowledgeArea: string;
  totalTalent: number;
  averageExperience: number;
  expertCount: number;
  keyTechnologies: string[];
  topExperts: MemberSummary[];
}

// Solutions Use Cases Interfaces
export interface KnowledgeAreaExpert {
  knowledgeArea: string;
  experts: MemberExpertProfile[];
}

export interface KnowledgeAreaGap {
  knowledgeArea: string;
  talentCount: number;
  averageLevel: number;
  gapSeverity: "Critical" | "High" | "Medium" | "Low";
  recommendations: string[];
}

// People Use Cases Interfaces
export interface CareerAlignment {
  member: Member;
  profile: MemberProfile;
  currentAssignmentAlignment: number;
  interestAlignmentScore: number;
  recommendations: string[];
  potentialOpportunities: string[];
}

export interface DevelopmentOpportunity {
  member: Member;
  profile: MemberProfile;
  skillGaps: string[];
  careerPathSuggestions: string[];
  recommendedTraining: string[];
  mentorshipOpportunities: string[];
}

// Production Use Cases Interfaces
export interface ColleagueConnection {
  colleague: Member;
  profile: MemberProfile;
  matchScore: number;
  commonInterests: string[];
  commonSkills: string[];
  potentialCollaboration: string[];
}

// Helper Interfaces
export interface MemberSummary {
  id: string;
  name: string;
  category: string;
  location: string;
  currentClient: string;
  proficiencyLevel: number;
  experience: number; // years of experience
}

export interface MemberExpertProfile {
  member: Member;
  profile: MemberProfile;
  skillCount: number;
  averageProficiency: number;
  yearsExperience: number;
  specializations: string[];
}

interface SuggestionResponse {
  memberId: string;
  matchScore: number;
  reason: string;
  availability: string;
}

class GeminiChatService {
  private contextSession: {
    teamSummary: string;
    lastUpdated: Date;
    sessionId: string;
  } | null = null;

  private readonly CONTEXT_EXPIRY_MINUTES = 30; // Context expires after 30 minutes

  /**
   * Initialize or refresh the team context session
   */
  private async initializeContext(): Promise<string> {
    const now = new Date();

    // Check if we have a valid cached context
    if (
      this.contextSession &&
      now.getTime() - this.contextSession.lastUpdated.getTime() <
        this.CONTEXT_EXPIRY_MINUTES * 60 * 1000
    ) {
      return this.contextSession.teamSummary;
    }

    // Generate new context
    const members = memberDb.getAll();
    const profiles = memberProfileDb.getAll();
    const skills = skillDb.getAll();

    // Create a condensed team summary instead of full details
    const teamSummary = this.createCondensedTeamSummary(
      members,
      profiles,
      skills
    );

    // Cache the context
    this.contextSession = {
      teamSummary,
      lastUpdated: now,
      sessionId: `session-${now.getTime()}`,
    };

    return teamSummary;
  }

  /**
   * Create a condensed team summary for AI context
   */
  private createCondensedTeamSummary(
    members: Member[],
    profiles: MemberProfile[],
    skills: Skill[]
  ): string {
    const summary = members
      .map((member) => {
        const profile = profiles.find((p) => p.memberId === member.id);
        const memberSkills = memberSkillDb
          .getByMemberId(member.id)
          .filter((ms: MemberSkill) => parseInt(ms.proficiencyValue) > 1); // Exclude level 1 skills

        // Get top skills (level 3+)
        const topSkills = memberSkills
          .filter((ms: MemberSkill) => parseInt(ms.proficiencyValue) >= 3)
          .map((ms: MemberSkill) => {
            const skill = skills.find((s) => s.id === ms.skillId);
            return `${skill?.name || "Unknown"}(L${ms.proficiencyValue})`;
          })
          .slice(0, 5) // Top 5 skills only
          .join(", ");

        const experience = this.calculateExperience(member, profile);

        return `${member.fullName}: ${member.category}, ${member.location}, ${
          member.currentAssignedClient || "Available"
        }, ${experience}y exp, Skills: ${topSkills || "None"}`;
      })
      .join("\n");

    return `TEAM SUMMARY (${members.length} members):\n${summary}`;
  }

  /**
   * Optimized insights response that uses cached context
   */
  async getOptimizedInsightsResponse(
    prompt: string,
    contextType: string
  ): Promise<string> {
    try {
      // Get or initialize the condensed team context
      const teamSummary = await this.initializeContext();

      // Create optimized analysis prompt
      const analysisPrompt = `
You are a team insights AI assistant for Techie Talent. You have been provided with a condensed team summary below.

TEAM CONTEXT:
${teamSummary}

CONTEXT TYPE: ${contextType}

USER QUESTION: ${prompt}

INSTRUCTIONS:
- Use ONLY the team members listed in the context above
- Provide specific names, skill levels, and availability from the data
- Format with **bold** headers and - bullet points
- Be concise but specific

Please analyze the team data and provide specific recommendations with actual team member names.
`;

      console.log("Calling Gemini API with optimized prompt...");

      const result = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: [{ role: "user", parts: [{ text: analysisPrompt }] }],
      });

      console.log("Received result from Gemini:", result);

      // Extract the response text using the same pattern as getInsightsResponse
      const responseText =
        result.text ||
        result.candidates?.[0]?.content?.parts?.[0]?.text ||
        "I'm sorry, I couldn't generate a response. Please try again.";

      console.log(
        "Extracted response text:",
        responseText.substring(0, 200) + "..."
      );
      return responseText;
    } catch (error) {
      console.error("Error getting optimized insights response:", error);
      throw new Error(
        `AI Service Error: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

  /**
   * Clear the context cache (useful for testing or when data changes)
   */
  clearContext(): void {
    this.contextSession = null;
  }

  /**
   * Force refresh the context cache
   */
  async refreshContext(): Promise<void> {
    this.contextSession = null;
    await this.initializeContext();
  }

  /**
   * Get context status for debugging
   */
  getContextStatus(): {
    hasContext: boolean;
    lastUpdated: Date | null;
    sessionId: string | null;
    minutesUntilExpiry: number | null;
  } {
    if (!this.contextSession) {
      return {
        hasContext: false,
        lastUpdated: null,
        sessionId: null,
        minutesUntilExpiry: null,
      };
    }

    const now = new Date();
    const minutesElapsed =
      (now.getTime() - this.contextSession.lastUpdated.getTime()) / (1000 * 60);
    const minutesUntilExpiry = this.CONTEXT_EXPIRY_MINUTES - minutesElapsed;

    return {
      hasContext: true,
      lastUpdated: this.contextSession.lastUpdated,
      sessionId: this.contextSession.sessionId,
      minutesUntilExpiry: Math.max(0, minutesUntilExpiry),
    };
  }

  // === SALES USE CASES ===

  /**
   * Sales Use Case 1: Find people with specific skills/technologies who are available
   */
  async getSkillAvailability(
    skillName: string
  ): Promise<SkillAvailabilityResult> {
    try {
      const members = memberDb.getAll();
      const profiles = memberProfileDb.getAll();
      const skills = skillDb.getAll();
      const memberSkills = memberSkillDb.getAll();

      // Find the skill by name (fuzzy matching)
      const skill = skills.find(
        (s) =>
          s.name.toLowerCase().includes(skillName.toLowerCase()) ||
          skillName.toLowerCase().includes(s.name.toLowerCase())
      );

      if (!skill) {
        throw new Error(`Skill "${skillName}" not found`);
      }

      // Get all members with this skill (excluding level 1)
      const membersWithSkill = memberSkills
        .filter(
          (ms) => ms.skillId === skill.id && parseInt(ms.proficiencyValue) > 1
        )
        .map((ms) => {
          const member = members.find((m) => m.id === ms.memberId);
          const profile = profiles.find((p) => p.memberId === ms.memberId);
          return {
            member,
            profile,
            proficiency: parseInt(ms.proficiencyValue),
            memberSkill: ms,
          };
        })
        .filter((item) => item.member)
        .sort((a, b) => b.proficiency - a.proficiency);

      // Categorize by availability
      const availableNow: MemberSummary[] = [];
      const availableSoon: MemberSummary[] = [];
      const assigned: MemberSummary[] = [];

      membersWithSkill.forEach(({ member, profile, proficiency }) => {
        if (!member) return;

        const summary: MemberSummary = {
          id: member.id,
          name: member.fullName,
          category: member.category,
          location: member.location,
          currentClient: member.currentAssignedClient || "Available",
          proficiencyLevel: proficiency,
          experience: this.calculateExperience(member, profile),
        };

        if (member.availabilityStatus === "Available") {
          availableNow.push(summary);
        } else if (member.availabilityStatus === "Available Soon") {
          availableSoon.push(summary);
        } else {
          assigned.push(summary);
        }
      });

      return {
        skill: skill.name,
        totalPeople: membersWithSkill.length,
        availableNow,
        availableSoon,
        assigned,
      };
    } catch (error) {
      console.error("Error getting skill availability:", error);
      throw error;
    }
  }

  /**
   * Sales Use Case 2: Identify knowledge areas with most talent and experience
   */
  async getKnowledgeAreaStrengths(): Promise<KnowledgeAreaStrength[]> {
    try {
      const members = memberDb.getAll();
      const profiles = memberProfileDb.getAll();
      const skills = skillDb.getAll();
      const knowledgeAreas = knowledgeAreaDb.getAll();
      const memberSkills = memberSkillDb.getAll();

      const strengthsMap = new Map<
        string,
        {
          knowledgeArea: KnowledgeArea;
          members: Set<string>;
          totalProficiency: number;
          skillCount: number;
          technologies: Set<string>;
        }
      >();

      // Analyze each member's skills (excluding level 1)
      memberSkills.forEach((ms) => {
        if (parseInt(ms.proficiencyValue) <= 1) return; // Skip level 1 skills

        const skill = skills.find((s) => s.id === ms.skillId);
        if (!skill) return;

        const knowledgeArea = knowledgeAreas.find(
          (ka) => ka.id === skill.knowledgeAreaId
        );
        if (!knowledgeArea) return;

        const key = knowledgeArea.id;
        if (!strengthsMap.has(key)) {
          strengthsMap.set(key, {
            knowledgeArea,
            members: new Set(),
            totalProficiency: 0,
            skillCount: 0,
            technologies: new Set(),
          });
        }

        const data = strengthsMap.get(key)!;
        data.members.add(ms.memberId);
        data.totalProficiency += parseInt(ms.proficiencyValue);
        data.skillCount++;
        data.technologies.add(skill.name);
      });

      // Convert to results with expert analysis
      const results: KnowledgeAreaStrength[] = [];

      for (const [, data] of strengthsMap) {
        const memberIds = Array.from(data.members);
        const topExperts = memberIds
          .map((memberId) => {
            const member = members.find((m) => m.id === memberId);
            const profile = profiles.find((p) => p.memberId === memberId);
            const memberSkillsInArea = memberSkills.filter(
              (ms) =>
                ms.memberId === memberId &&
                skills.find(
                  (s) =>
                    s.id === ms.skillId &&
                    s.knowledgeAreaId === data.knowledgeArea.id
                )
            );

            if (!member) return null;

            const avgProficiency =
              memberSkillsInArea.reduce(
                (sum, ms) => sum + parseInt(ms.proficiencyValue),
                0
              ) / memberSkillsInArea.length;

            return {
              id: member.id,
              name: member.fullName,
              category: member.category,
              location: member.location,
              currentClient: member.currentAssignedClient || "Available",
              proficiencyLevel: Math.round(avgProficiency),
              experience: this.calculateExperience(member, profile),
            };
          })
          .filter(Boolean)
          .sort((a, b) => b!.proficiencyLevel - a!.proficiencyLevel)
          .slice(0, 5) as MemberSummary[];

        const expertCount = topExperts.filter(
          (expert) => expert.proficiencyLevel >= 4
        ).length;

        results.push({
          knowledgeArea: data.knowledgeArea.name,
          totalTalent: data.members.size,
          averageExperience: data.totalProficiency / data.skillCount,
          expertCount,
          keyTechnologies: Array.from(data.technologies).slice(0, 10),
          topExperts,
        });
      }

      return results.sort(
        (a, b) =>
          b.totalTalent * b.averageExperience -
          a.totalTalent * a.averageExperience
      );
    } catch (error) {
      console.error("Error getting knowledge area strengths:", error);
      throw error;
    }
  }

  // === SOLUTIONS USE CASES ===

  /**
   * Solutions Use Case 1: Identify key people in each knowledge area based on experience
   */
  async getKnowledgeAreaExperts(): Promise<KnowledgeAreaExpert[]> {
    try {
      const members = memberDb.getAll();
      const profiles = memberProfileDb.getAll();
      const skills = skillDb.getAll();
      const knowledgeAreas = knowledgeAreaDb.getAll();
      const memberSkills = memberSkillDb.getAll();

      const expertsMap = new Map<string, MemberExpertProfile[]>();

      // Group by knowledge areas
      knowledgeAreas.forEach((ka) => {
        const relevantSkills = skills.filter(
          (s) => s.knowledgeAreaId === ka.id
        );
        const expertsInArea: MemberExpertProfile[] = [];

        members.forEach((member) => {
          const profile = profiles.find((p) => p.memberId === member.id);
          const memberSkillsInArea = memberSkills.filter(
            (ms) =>
              ms.memberId === member.id &&
              parseInt(ms.proficiencyValue) > 1 && // Exclude level 1 skills
              relevantSkills.some((rs) => rs.id === ms.skillId)
          );

          if (memberSkillsInArea.length === 0) return;

          const avgProficiency =
            memberSkillsInArea.reduce(
              (sum, ms) => sum + parseInt(ms.proficiencyValue),
              0
            ) / memberSkillsInArea.length;

          const specializations = memberSkillsInArea
            .filter((ms) => parseInt(ms.proficiencyValue) >= 4)
            .map((ms) => skills.find((s) => s.id === ms.skillId)?.name)
            .filter(Boolean) as string[];

          expertsInArea.push({
            member,
            profile: profile!,
            skillCount: memberSkillsInArea.length,
            averageProficiency: avgProficiency,
            yearsExperience: this.calculateExperience(member, profile),
            specializations,
          });
        });

        // Sort by expertise (combination of proficiency, skill count, and experience)
        expertsInArea.sort((a, b) => {
          const scoreA =
            a.averageProficiency * a.skillCount * (a.yearsExperience + 1);
          const scoreB =
            b.averageProficiency * b.skillCount * (b.yearsExperience + 1);
          return scoreB - scoreA;
        });

        expertsMap.set(ka.id, expertsInArea.slice(0, 10)); // Top 10 experts per area
      });

      return knowledgeAreas.map((ka) => ({
        knowledgeArea: ka.name,
        experts: expertsMap.get(ka.id) || [],
      }));
    } catch (error) {
      console.error("Error getting knowledge area experts:", error);
      throw error;
    }
  }

  /**
   * Solutions Use Case 2: Identify knowledge areas with less talent/experience (gaps)
   */
  async getKnowledgeAreaGaps(): Promise<KnowledgeAreaGap[]> {
    try {
      const strengths = await this.getKnowledgeAreaStrengths();

      return strengths
        .map((strength) => {
          let gapSeverity: "Critical" | "High" | "Medium" | "Low";
          const recommendations: string[] = [];

          if (strength.totalTalent < 2) {
            gapSeverity = "Critical";
            recommendations.push("Urgent hiring needed in this area");
            recommendations.push(
              "Consider external consultants for immediate needs"
            );
            recommendations.push(
              "Prioritize training programs for existing staff"
            );
          } else if (
            strength.totalTalent < 5 ||
            strength.averageExperience < 2.5
          ) {
            gapSeverity = "High";
            recommendations.push("Increase hiring in this knowledge area");
            recommendations.push("Develop comprehensive training programs");
            recommendations.push("Consider strategic partnerships");
          } else if (strength.expertCount < 2) {
            gapSeverity = "Medium";
            recommendations.push("Develop senior talent through mentorship");
            recommendations.push(
              "Provide advanced training and certifications"
            );
          } else {
            gapSeverity = "Low";
            recommendations.push("Continue regular skill development");
            recommendations.push("Monitor for future growth needs");
          }

          return {
            knowledgeArea: strength.knowledgeArea,
            talentCount: strength.totalTalent,
            averageLevel: strength.averageExperience,
            gapSeverity,
            recommendations,
          };
        })
        .sort((a, b) => {
          const severityOrder = { Critical: 4, High: 3, Medium: 2, Low: 1 };
          return severityOrder[b.gapSeverity] - severityOrder[a.gapSeverity];
        });
    } catch (error) {
      console.error("Error getting knowledge area gaps:", error);
      throw error;
    }
  }

  // === PEOPLE USE CASES ===

  /**
   * People Use Case 1: Analyze career path alignment with current assignment
   */
  async analyzeCareerAlignment(memberId: string): Promise<CareerAlignment> {
    try {
      const member = memberDb.getById(memberId);
      const profile = memberProfileDb.getByMemberId(memberId);

      if (!member || !profile) {
        throw new Error("Member or profile not found");
      }

      const currentAssignment = profile.assignments.find((a) => !a.endDate);
      const interests = profile.careerInterests || [];

      // Calculate alignment scores
      let currentAssignmentAlignment = 0;
      let interestAlignmentScore = 0;

      if (currentAssignment) {
        // Check if current role aligns with career interests
        const roleInterestMatch = interests.some(
          (interest) =>
            currentAssignment.role
              .toLowerCase()
              .includes(interest.toLowerCase()) ||
            interest
              .toLowerCase()
              .includes(currentAssignment.role.toLowerCase())
        );

        // Check if technologies align with interests
        const techInterestMatch =
          currentAssignment.technologies?.some((tech) =>
            interests.some(
              (interest) =>
                tech.toLowerCase().includes(interest.toLowerCase()) ||
                interest.toLowerCase().includes(tech.toLowerCase())
            )
          ) || false;

        currentAssignmentAlignment =
          (roleInterestMatch ? 50 : 0) + (techInterestMatch ? 50 : 0);
      }

      // Calculate overall interest alignment
      interestAlignmentScore = this.calculateInterestAlignment(profile, member);

      const recommendations: string[] = [];
      const potentialOpportunities: string[] = [];

      if (currentAssignmentAlignment < 50) {
        recommendations.push(
          "Consider discussing role alignment with your manager"
        );
        recommendations.push(
          "Explore opportunities to incorporate your interests into current projects"
        );
      }

      if (interestAlignmentScore < 60) {
        recommendations.push(
          "Consider professional development in areas of interest"
        );
        potentialOpportunities.push("Seek cross-functional projects");
        potentialOpportunities.push("Explore internal mobility opportunities");
      }

      // Add specific opportunities based on interests
      interests.forEach((interest) => {
        potentialOpportunities.push(
          `Explore ${interest} related projects or roles`
        );
      });

      return {
        member,
        profile,
        currentAssignmentAlignment,
        interestAlignmentScore,
        recommendations,
        potentialOpportunities: potentialOpportunities.slice(0, 5),
      };
    } catch (error) {
      console.error("Error analyzing career alignment:", error);
      throw error;
    }
  }

  /**
   * People Use Case 2: Identify professional development opportunities
   */
  async getDevelopmentOpportunities(
    memberId: string
  ): Promise<DevelopmentOpportunity> {
    try {
      const member = memberDb.getById(memberId);
      const profile = memberProfileDb.getByMemberId(memberId);
      const memberSkills = memberSkillDb.getByMemberId(memberId);
      const allSkills = skillDb.getAll();

      if (!member || !profile) {
        throw new Error("Member or profile not found");
      }

      // Identify skill gaps (level 2-3 are considered gaps, level 1 is ignored)
      const lowProficiencySkills = memberSkills
        .filter((ms) => {
          const proficiency = parseInt(ms.proficiencyValue);
          return proficiency > 1 && proficiency < 3; // Only include levels 2-3 as gaps
        })
        .map((ms) => allSkills.find((s) => s.id === ms.skillId)?.name)
        .filter(Boolean) as string[];

      // Career path suggestions based on current skills and interests
      const careerPathSuggestions = this.generateCareerPathSuggestions(
        member,
        profile,
        memberSkills
      );

      // Training recommendations
      const recommendedTraining = this.generateTrainingRecommendations(
        member,
        profile,
        memberSkills
      );

      // Mentorship opportunities
      const mentorshipOpportunities = await this.findMentorshipOpportunities(
        member,
        profile
      );

      return {
        member,
        profile,
        skillGaps: lowProficiencySkills,
        careerPathSuggestions,
        recommendedTraining,
        mentorshipOpportunities,
      };
    } catch (error) {
      console.error("Error getting development opportunities:", error);
      throw error;
    }
  }

  // === PRODUCTION USE CASES ===

  /**
   * Production Use Case: Find colleagues with similar profiles/interests for networking
   */
  async findColleagueConnections(
    memberId: string
  ): Promise<ColleagueConnection[]> {
    try {
      const member = memberDb.getById(memberId);
      const profile = memberProfileDb.getByMemberId(memberId);
      const memberSkills = memberSkillDb
        .getByMemberId(memberId)
        .filter((ms) => parseInt(ms.proficiencyValue) > 1);

      if (!member || !profile) {
        throw new Error("Member or profile not found");
      }

      const allMembers = memberDb.getAll().filter((m) => m.id !== memberId);
      const allProfiles = memberProfileDb.getAll();
      const allMemberSkills = memberSkillDb.getAll();
      const skills = skillDb.getAll();

      const connections: ColleagueConnection[] = [];

      allMembers.forEach((colleague) => {
        const colleagueProfile = allProfiles.find(
          (p) => p.memberId === colleague.id
        );
        if (!colleagueProfile) return;

        const colleagueSkills = allMemberSkills.filter(
          (ms) =>
            ms.memberId === colleague.id && parseInt(ms.proficiencyValue) > 1
        );

        // Calculate match score based on various factors
        const commonInterests = this.findCommonInterests(
          profile,
          colleagueProfile
        );
        const commonSkills = this.findCommonSkills(
          memberSkills,
          colleagueSkills,
          skills
        );
        const locationBonus = member.location === colleague.location ? 10 : 0;
        const categoryBonus = this.getCategoryCompatibility(
          member.category,
          colleague.category
        );

        const matchScore = Math.min(
          100,
          commonInterests.length * 15 +
            commonSkills.length * 10 +
            locationBonus +
            categoryBonus
        );

        if (matchScore > 20) {
          // Only include meaningful connections
          const potentialCollaboration = this.generateCollaborationIdeas(
            profile,
            colleagueProfile,
            commonSkills,
            commonInterests
          );

          connections.push({
            colleague,
            profile: colleagueProfile,
            matchScore,
            commonInterests,
            commonSkills,
            potentialCollaboration,
          });
        }
      });

      return connections
        .sort((a, b) => b.matchScore - a.matchScore)
        .slice(0, 10); // Top 10 connections
    } catch (error) {
      console.error("Error finding colleague connections:", error);
      throw error;
    }
  }

  // === HELPER METHODS ===

  /**
   * Get member name suggestions for autocomplete
   */
  getMemberNameSuggestions(searchTerm: string): string[] {
    if (searchTerm.length < 3) return [];

    const members = memberDb.getAll();
    const term = searchTerm.toLowerCase().trim();

    const suggestions = members
      .filter(
        (member) =>
          member.fullName.toLowerCase().includes(term) ||
          term.split(" ").some((word) =>
            member.fullName
              .toLowerCase()
              .split(" ")
              .some((namePart) => namePart.startsWith(word))
          )
      )
      .map((member) => member.fullName)
      .sort()
      .slice(0, 10); // Limit to 10 suggestions

    return suggestions;
  }

  /**
   * Find member by name (fuzzy search)
   */
  private findMemberByName(memberName: string): Member | null {
    const members = memberDb.getAll();
    const searchTerm = memberName.toLowerCase().trim();

    // First try exact match
    let member = members.find((m) => m.fullName.toLowerCase() === searchTerm);

    // If no exact match, try partial match
    if (!member) {
      member = members.find(
        (m) =>
          m.fullName.toLowerCase().includes(searchTerm) ||
          searchTerm.includes(m.fullName.toLowerCase())
      );
    }

    // If still no match, try matching individual words
    if (!member) {
      const searchWords = searchTerm.split(" ");
      member = members.find((m) => {
        const nameWords = m.fullName.toLowerCase().split(" ");
        return searchWords.some((searchWord) =>
          nameWords.some(
            (nameWord) =>
              nameWord.includes(searchWord) || searchWord.includes(nameWord)
          )
        );
      });
    }

    return member || null;
  }

  /**
   * People Use Case 1: Analyze career path alignment with current assignment (by name)
   */
  async analyzeCareerAlignmentByName(
    memberName: string
  ): Promise<CareerAlignment> {
    const member = this.findMemberByName(memberName);
    if (!member) {
      throw new Error(`Member "${memberName}" not found`);
    }
    return this.analyzeCareerAlignment(member.id);
  }

  /**
   * People Use Case 2: Identify professional development opportunities (by name)
   */
  async getDevelopmentOpportunitiesByName(
    memberName: string
  ): Promise<DevelopmentOpportunity> {
    const member = this.findMemberByName(memberName);
    if (!member) {
      throw new Error(`Member "${memberName}" not found`);
    }
    return this.getDevelopmentOpportunities(member.id);
  }

  /**
   * Production Use Case: Find colleagues with similar profiles/interests for networking (by name)
   */
  async findColleagueConnectionsByName(
    memberName: string
  ): Promise<ColleagueConnection[]> {
    const member = this.findMemberByName(memberName);
    if (!member) {
      throw new Error(`Member "${memberName}" not found`);
    }
    return this.findColleagueConnections(member.id);
  }

  private calculateExperience(member: Member, profile?: MemberProfile): number {
    const hireDate = new Date(member.hireDate);
    const now = new Date();
    const yearsAtCompany =
      (now.getTime() - hireDate.getTime()) / (1000 * 60 * 60 * 24 * 365);

    // Add experience from assignments
    const assignmentExperience =
      profile?.assignments.reduce((total, assignment) => {
        const start = new Date(assignment.startDate);
        const end = assignment.endDate ? new Date(assignment.endDate) : now;
        return (
          total +
          (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24 * 365)
        );
      }, 0) || 0;

    return Math.round(Math.max(yearsAtCompany, assignmentExperience) * 10) / 10;
  }

  private calculateInterestAlignment(
    profile: MemberProfile,
    member: Member
  ): number {
    const interests = profile.careerInterests || [];
    const goals = profile.professionalGoals || [];
    const assignments = profile.assignments || [];

    if (interests.length === 0 && goals.length === 0) return 50; // Neutral if no data

    let alignmentScore = 0;
    let totalFactors = 0;

    // Check recent assignments alignment
    const recentAssignments = assignments.slice(-3); // Last 3 assignments
    if (recentAssignments.length > 0) {
      const assignmentAlignment = recentAssignments.some((assignment) =>
        interests.some(
          (interest) =>
            assignment.role.toLowerCase().includes(interest.toLowerCase()) ||
            assignment.technologies?.some((tech) =>
              tech.toLowerCase().includes(interest.toLowerCase())
            )
        )
      );
      alignmentScore += assignmentAlignment ? 30 : 10;
      totalFactors += 30;
    }

    // Check current category alignment with goals
    if (goals.length > 0) {
      const categoryGoalAlignment = goals.some(
        (goal) =>
          goal.toLowerCase().includes(member.category.toLowerCase()) ||
          member.category.toLowerCase().includes(goal.toLowerCase())
      );
      alignmentScore += categoryGoalAlignment ? 20 : 5;
      totalFactors += 20;
    }

    return totalFactors > 0
      ? Math.round((alignmentScore / totalFactors) * 100)
      : 50;
  }

  private generateCareerPathSuggestions(
    member: Member,
    profile: MemberProfile,
    memberSkills: MemberSkill[]
  ): string[] {
    const suggestions: string[] = [];
    const currentCategory = member.category;
    const interests = profile.careerInterests || [];

    // Career progression suggestions
    const categoryProgression = {
      Starter: ["Builder", "Technical Specialist"],
      Builder: ["Solver", "Technical Lead", "Senior Developer"],
      Solver: ["Wizard", "Architect", "Team Lead", "Technical Manager"],
      Wizard: [
        "Principal Engineer",
        "Engineering Manager",
        "Technical Director",
      ],
    };

    const nextSteps =
      categoryProgression[
        currentCategory as keyof typeof categoryProgression
      ] || [];
    nextSteps.forEach((step) => {
      suggestions.push(`Progress to ${step} role`);
    });

    // Interest-based suggestions
    interests.forEach((interest) => {
      suggestions.push(`Explore specialization in ${interest}`);
    });

    // Skill-based suggestions (only consider skills above level 1)
    const highProficiencySkills = memberSkills
      .filter((ms) => parseInt(ms.proficiencyValue) >= 4)
      .slice(0, 3);

    if (highProficiencySkills.length > 0) {
      suggestions.push("Consider mentoring junior developers");
      suggestions.push("Lead technical initiatives");
    }

    return [...new Set(suggestions)].slice(0, 5);
  }

  private generateTrainingRecommendations(
    member: Member,
    profile: MemberProfile,
    memberSkills: MemberSkill[]
  ): string[] {
    const recommendations: string[] = [];
    const interests = profile.careerInterests || [];
    // Only consider skills above level 1 for improvement recommendations
    const lowSkills = memberSkills.filter((ms) => {
      const proficiency = parseInt(ms.proficiencyValue);
      return proficiency > 1 && proficiency < 3;
    });

    // Skills improvement
    if (lowSkills.length > 0) {
      recommendations.push("Focus on improving foundational skills");
      recommendations.push("Seek mentorship for skill development");
    }

    // Interest-based training
    interests.forEach((interest) => {
      recommendations.push(`Advanced training in ${interest}`);
      recommendations.push(`Certification programs for ${interest}`);
    });

    // Category-specific recommendations
    const categoryTraining = {
      Starter: ["Fundamental programming concepts", "Best practices training"],
      Builder: ["Advanced technical skills", "Project management basics"],
      Solver: ["Leadership skills", "Architecture and design patterns"],
      Wizard: ["Strategic thinking", "Technology evangelism"],
    };

    const categoryRecs =
      categoryTraining[member.category as keyof typeof categoryTraining] || [];
    recommendations.push(...categoryRecs);

    return [...new Set(recommendations)].slice(0, 8);
  }

  private async findMentorshipOpportunities(
    member: Member,
    profile: MemberProfile
  ): Promise<string[]> {
    const opportunities: string[] = [];
    const interests = profile.careerInterests || [];

    // Find potential mentors based on interests and seniority
    const allMembers = memberDb.getAll();
    const seniorMembers = allMembers.filter(
      (m) =>
        m.id !== member.id &&
        (m.category === "Solver" || m.category === "Wizard")
    );

    if (seniorMembers.length > 0) {
      opportunities.push("Connect with senior team members for mentorship");
      opportunities.push("Join cross-functional project teams");
    }

    // Interest-based mentorship
    interests.forEach((interest) => {
      opportunities.push(`Find mentor specializing in ${interest}`);
    });

    // General opportunities
    opportunities.push("Participate in technical discussion forums");
    opportunities.push("Join professional development programs");
    opportunities.push("Attend industry conferences and workshops");

    return [...new Set(opportunities)].slice(0, 6);
  }

  private findCommonInterests(
    profile1: MemberProfile,
    profile2: MemberProfile
  ): string[] {
    const interests1 = new Set(
      profile1.careerInterests?.map((i) => i.toLowerCase()) || []
    );
    const interests2 = new Set(
      profile2.careerInterests?.map((i) => i.toLowerCase()) || []
    );

    return Array.from(interests1).filter((interest) =>
      interests2.has(interest)
    );
  }

  private findCommonSkills(
    skills1: MemberSkill[],
    skills2: MemberSkill[],
    allSkills: Skill[]
  ): string[] {
    // Only consider skills above level 1
    const skillIds1 = new Set(
      skills1
        .filter((ms) => parseInt(ms.proficiencyValue) > 1)
        .map((ms) => ms.skillId)
    );
    const skillIds2 = new Set(
      skills2
        .filter((ms) => parseInt(ms.proficiencyValue) > 1)
        .map((ms) => ms.skillId)
    );

    const commonSkillIds = Array.from(skillIds1).filter((skillId) =>
      skillIds2.has(skillId)
    );

    return commonSkillIds
      .map((skillId) => allSkills.find((s) => s.id === skillId)?.name)
      .filter(Boolean) as string[];
  }

  private getCategoryCompatibility(
    category1: string,
    category2: string
  ): number {
    const compatibilityMatrix: Record<string, Record<string, number>> = {
      Starter: { Starter: 15, Builder: 20, Solver: 10, Wizard: 5 },
      Builder: { Starter: 20, Builder: 15, Solver: 20, Wizard: 10 },
      Solver: { Starter: 10, Builder: 20, Solver: 15, Wizard: 20 },
      Wizard: { Starter: 5, Builder: 10, Solver: 20, Wizard: 15 },
    };

    return compatibilityMatrix[category1]?.[category2] || 0;
  }

  private generateCollaborationIdeas(
    profile1: MemberProfile,
    profile2: MemberProfile,
    commonSkills: string[],
    commonInterests: string[]
  ): string[] {
    const ideas: string[] = [];

    if (commonSkills.length > 0) {
      ideas.push(`Collaborate on ${commonSkills[0]} projects`);
      ideas.push("Share technical knowledge and best practices");
    }

    if (commonInterests.length > 0) {
      ideas.push(`Explore ${commonInterests[0]} initiatives together`);
      ideas.push("Start a study group or technical discussion");
    }

    ideas.push("Peer programming sessions");
    ideas.push("Cross-review each other's work");
    ideas.push("Joint presentation or knowledge sharing session");

    return ideas.slice(0, 4);
  }

  // === EXISTING METHODS ===

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
        contents: [{ role: "user", parts: [{ text: analysisPrompt }] }],
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
  .filter((ms: MemberSkill) => parseInt(ms.proficiencyValue) > 1) // Exclude level 1 skills
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

  async getInsightsResponse(prompt: string): Promise<string> {
    try {
      // Load team data
      const members = memberDb.getAll();
      const profiles = memberProfileDb.getAll();
      const skills = skillDb.getAll();

      // Create team context
      const teamContext = this.createTeamContext(members, profiles, skills);

      // Create analysis prompt
      const analysisPrompt = `
You are a team insights AI assistant for Techie Talent. Your role is to analyze team members and provide specific, actionable insights.

TEAM DATA:
${teamContext}

USER REQUEST: ${prompt}

IMPORTANT INSTRUCTIONS:
- ALWAYS mention specific team member names from the data above
- Include their skill levels, availability status, and experience
- Provide concrete recommendations with justification
- Use the actual data provided - don't make up information
- Format your response with clear sections using **bold** for headers
- Use bullet points with - for lists

Please provide a detailed response with specific team member recommendations based on the actual team data provided above.
`;

      const result = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: [{ role: "user", parts: [{ text: analysisPrompt }] }],
      });

      // Get response text
      const responseText =
        result.text ||
        result.candidates?.[0]?.content?.parts?.[0]?.text ||
        "I'm sorry, I couldn't generate a response. Please try again.";

      return responseText;
    } catch (error) {
      console.error("Error getting insights response:", error);
      throw new Error(
        `AI Service Error: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

  async sendMessage(message: string): Promise<string> {
    try {
      console.log(
        "Attempting to call Gemini API with message:",
        message.substring(0, 100) + "..."
      );

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: [{ role: "user", parts: [{ text: message }] }],
      });

      console.log("Received response from Gemini API:", response);

      // Try different ways to access the response text
      const responseText =
        response.text ||
        response.candidates?.[0]?.content?.parts?.[0]?.text ||
        JSON.stringify(response);

      return responseText;
    } catch (error) {
      console.error("Error sending message:", error);
      console.error("Error details:", error);
      console.error(
        "Error stack:",
        error instanceof Error ? error.stack : "No stack available"
      );

      // Provide more specific error information
      if (error instanceof Error) {
        throw new Error(`AI Service Error: ${error.message}`);
      }
      throw new Error("Failed to get response from AI service");
    }
  }
}

export const geminiChatService = new GeminiChatService();
