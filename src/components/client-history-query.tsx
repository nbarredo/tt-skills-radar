import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Search, Users } from "lucide-react";
import { memberDb, memberProfileDb } from "@/lib/database";
import type { Member, MemberProfile } from "@/types";

export function ClientHistoryQuery() {
  const [clientName, setClientName] = useState("");
  const [results, setResults] = useState<
    (Member & { profile?: MemberProfile })[]
  >([]);
  const [isSearching, setIsSearching] = useState(false);

  const searchByClient = () => {
    if (!clientName.trim()) return;

    setIsSearching(true);
    try {
      const allMembers = memberDb.getAll();
      const allProfiles = memberProfileDb.getAll();

      const matchingMembers = allMembers.filter((member) => {
        // Check current assignment
        if (
          member.currentAssignedClient
            .toLowerCase()
            .includes(clientName.toLowerCase())
        ) {
          return true;
        }

        // Check assignment history in profile
        const profile = allProfiles.find((p) => p.memberId === member.id);
        if (profile?.assignments) {
          return profile.assignments.some((assignment) =>
            assignment.clientName
              .toLowerCase()
              .includes(clientName.toLowerCase())
          );
        }

        return false;
      });

      const resultsWithProfiles = matchingMembers.map((member) => ({
        ...member,
        profile: allProfiles.find((p) => p.memberId === member.id),
      }));

      setResults(resultsWithProfiles);
    } catch (error) {
      console.error("Error searching by client:", error);
    } finally {
      setIsSearching(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      searchByClient();
    }
  };

  const getClientAssignments = (member: Member, profile?: MemberProfile) => {
    const assignments = [];

    // Current assignment
    if (
      member.currentAssignedClient &&
      member.currentAssignedClient
        .toLowerCase()
        .includes(clientName.toLowerCase())
    ) {
      assignments.push(`${member.currentAssignedClient} (Current)`);
    }

    // Historical assignments
    if (profile?.assignments) {
      profile.assignments
        .filter((assignment) =>
          assignment.clientName.toLowerCase().includes(clientName.toLowerCase())
        )
        .forEach((assignment) => {
          const period = assignment.endDate
            ? `${assignment.startDate} - ${assignment.endDate}`
            : `${assignment.startDate} - Present`;
          assignments.push(`${assignment.clientName} (${period})`);
        });
    }

    return assignments;
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Enter client name (e.g., Lunavi, Microsoft...)"
            value={clientName}
            onChange={(e) => setClientName(e.target.value)}
            onKeyPress={handleKeyPress}
            className="pl-8"
          />
        </div>
        <Button
          onClick={searchByClient}
          disabled={!clientName.trim() || isSearching}
        >
          {isSearching ? "Searching..." : "Search"}
        </Button>
      </div>

      {results.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sm font-medium">
            <Users className="h-4 w-4" />
            Found {results.length} member(s) who worked for "{clientName}"
          </div>

          {results.map((member) => {
            const assignments = getClientAssignments(member, member.profile);
            return (
              <Card key={member.id} className="p-3">
                <div className="space-y-2">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-medium">{member.fullName}</h4>
                      <p className="text-sm text-muted-foreground">
                        {member.corporateEmail}
                      </p>
                    </div>
                    <div className="flex gap-1">
                      <Badge variant="secondary">{member.category}</Badge>
                      <Badge
                        variant={
                          member.availabilityStatus === "Available"
                            ? "default"
                            : member.availabilityStatus === "Available Soon"
                            ? "secondary"
                            : "outline"
                        }
                      >
                        {member.availabilityStatus}
                      </Badge>
                    </div>
                  </div>

                  <div>
                    <p className="text-xs font-medium text-muted-foreground mb-1">
                      Client History:
                    </p>
                    <div className="space-y-1">
                      {assignments.map((assignment, index) => (
                        <p
                          key={index}
                          className="text-xs text-muted-foreground"
                        >
                          • {assignment}
                        </p>
                      ))}
                    </div>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {clientName && results.length === 0 && !isSearching && (
        <p className="text-center text-muted-foreground py-4">
          No members found who have worked for "{clientName}"
        </p>
      )}
    </div>
  );
}
