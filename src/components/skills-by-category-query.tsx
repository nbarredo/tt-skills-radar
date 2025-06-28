import { useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Users, Code, Target } from "lucide-react";
import { memberDb, memberSkillDb, skillDb, scaleDb } from "@/lib/database";
import type { Member, Skill } from "@/types";

interface SkillWithMembers {
  skill: Skill;
  members: (Member & { proficiency: string; scaleValue: string })[];
}

export function SkillsByCategoryQuery() {
  const [selectedCategory, setSelectedCategory] = useState("");
  const [results, setResults] = useState<SkillWithMembers[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const categories = ["Starter", "Builder", "Solver", "Wizard"];

  const searchByCategory = () => {
    if (!selectedCategory) return;

    setIsSearching(true);
    try {
      const allMembers = memberDb.getAll();
      const allMemberSkills = memberSkillDb.getAll();
      const allSkills = skillDb.getAll();
      const allScales = scaleDb.getAll();

      // Filter members by category
      const membersInCategory = allMembers.filter(
        (member) => member.category === selectedCategory
      );

      // Get all skills possessed by members in this category
      const skillsMap = new Map<string, SkillWithMembers>();

      membersInCategory.forEach((member) => {
        const memberSkills = allMemberSkills.filter(
          (ms) => ms.memberId === member.id
        );

        memberSkills.forEach((memberSkill) => {
          const skill = allSkills.find((s) => s.id === memberSkill.skillId);
          const scale = allScales.find((s) => s.id === memberSkill.scaleId);

          if (skill) {
            if (!skillsMap.has(skill.id)) {
              skillsMap.set(skill.id, {
                skill,
                members: [],
              });
            }

            const scaleValue = scale
              ? scale.values[parseInt(memberSkill.proficiencyValue) - 1] ||
                memberSkill.proficiencyValue
              : memberSkill.proficiencyValue;

            skillsMap.get(skill.id)!.members.push({
              ...member,
              proficiency: memberSkill.proficiencyValue,
              scaleValue,
            });
          }
        });
      });

      // Sort skills by number of members who have them (most popular first)
      const sortedResults = Array.from(skillsMap.values()).sort(
        (a, b) => b.members.length - a.members.length
      );

      setResults(sortedResults);
    } catch (error) {
      console.error("Error searching by category:", error);
    } finally {
      setIsSearching(false);
    }
  };

  const getProficiencyColor = (value: string) => {
    const level = parseInt(value);
    if (level >= 4) return "bg-green-500";
    if (level >= 3) return "bg-blue-500";
    if (level >= 2) return "bg-yellow-500";
    return "bg-gray-500";
  };

  const getAverageProficiency = (members: { proficiency: string }[]) => {
    const total = members.reduce(
      (sum, member) => sum + parseInt(member.proficiency),
      0
    );
    return (total / members.length).toFixed(1);
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
          <SelectTrigger className="flex-1">
            <SelectValue placeholder="Select a Techie Category" />
          </SelectTrigger>
          <SelectContent>
            {categories.map((category) => (
              <SelectItem key={category} value={category}>
                {category}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button
          onClick={searchByCategory}
          disabled={!selectedCategory || isSearching}
        >
          {isSearching ? "Searching..." : "Search"}
        </Button>
      </div>

      {results.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-sm font-medium">
            <Code className="h-4 w-4" />
            Found {results.length} skill(s) among {selectedCategory} members
          </div>

          {results.map((skillData) => (
            <Card key={skillData.skill.id} className="p-4">
              <div className="space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="font-medium">{skillData.skill.name}</h4>
                    <p className="text-sm text-muted-foreground">
                      {skillData.skill.purpose}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      <span className="text-sm font-medium">
                        {skillData.members.length} members
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <Target className="h-4 w-4" />
                      <span className="text-sm text-muted-foreground">
                        Avg: {getAverageProficiency(skillData.members)}/5
                      </span>
                    </div>
                  </div>
                </div>

                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-2">
                    Members with this skill:
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {skillData.members.map((member) => (
                      <div
                        key={member.id}
                        className="flex items-center justify-between p-2 bg-muted rounded"
                      >
                        <div>
                          <p className="text-sm font-medium">
                            {member.fullName}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {member.corporateEmail}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <div
                            className={`w-2 h-2 rounded-full ${getProficiencyColor(
                              member.proficiency
                            )}`}
                          ></div>
                          <span className="text-xs">
                            {member.proficiency} - {member.scaleValue}
                          </span>
                          <Badge
                            variant={
                              member.availabilityStatus === "Available"
                                ? "default"
                                : member.availabilityStatus === "Available Soon"
                                ? "secondary"
                                : "outline"
                            }
                            className="text-xs"
                          >
                            {member.availabilityStatus}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {selectedCategory && results.length === 0 && !isSearching && (
        <p className="text-center text-muted-foreground py-4">
          No skills found for {selectedCategory} members
        </p>
      )}
    </div>
  );
}
