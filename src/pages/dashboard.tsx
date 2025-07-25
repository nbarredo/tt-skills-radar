import { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DataLoader } from "@/components/data-loader";
import { ClientHistoryQuery } from "@/components/client-history-query";
import { SkillsByCategoryQuery } from "@/components/skills-by-category-query";
import { SimpleBarChart } from "@/components/charts/simple-bar-chart";
import { SimplePieChart } from "@/components/charts/simple-pie-chart";

import {
  Users,
  Brain,
  Lightbulb,
  Tags,
  FileSpreadsheet,
  Search,
  X,
} from "lucide-react";
import {
  memberDb,
  skillDb,
  knowledgeAreaDb,
  skillCategoryDb,
  memberSkillDb,
  initDatabase,
  loadExcelData,
  dbUtils,
} from "@/lib/database";
import type { Member, Skill, KnowledgeArea, SkillCategory } from "@/types";

export function Dashboard() {
  const [members, setMembers] = useState<Member[]>([]);
  const [skills, setSkills] = useState<Skill[]>([]);
  const [knowledgeAreas, setKnowledgeAreas] = useState<KnowledgeArea[]>([]);
  const [skillCategories, setSkillCategories] = useState<SkillCategory[]>([]);
  const [isDataLoaded, setIsDataLoaded] = useState(false);

  // Filters
  const [nameFilter, setNameFilter] = useState("");
  const [knowledgeAreaFilter, setKnowledgeAreaFilter] = useState("");
  const [skillCategoryFilter, setSkillCategoryFilter] = useState("");
  const [skillFilter, setSkillFilter] = useState("");
  const [clientFilter, setClientFilter] = useState("");
  const [availabilityFilter, setAvailabilityFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");

  useEffect(() => {
    // Initialize database and load data
    const initializeData = async () => {
      initDatabase();

      // Force reload data from file to ensure we have the latest
      try {
        await dbUtils.forceReload();
        console.log("Successfully force reloaded all data");
      } catch (error) {
        console.error("Failed to force reload data:", error);
        // Fallback to regular load
        try {
          await loadExcelData();
          console.log("Fallback: Excel data loaded successfully");
        } catch (fallbackError) {
          console.error("Failed to load Excel data:", fallbackError);
        }
      }

      // Load data into state
      const memberData = memberDb.getAll();
      console.log("=== DASHBOARD DATA CHECK ===");
      console.log("Total members loaded:", memberData.length);
      console.log("Sample member locations:");
      memberData
        .slice(0, 5)
        .forEach((m) =>
          console.log(
            `${m.fullName}: ${m.location} (${m.availabilityStatus}) - ${m.currentAssignedClient}`
          )
        );

      // Location distribution
      const locations: Record<string, number> = {};
      memberData.forEach((m) => {
        locations[m.location] = (locations[m.location] || 0) + 1;
      });
      console.log("Location distribution:", locations);

      // Availability distribution
      const availability: Record<string, number> = {};
      memberData.forEach((m) => {
        availability[m.availabilityStatus] =
          (availability[m.availabilityStatus] || 0) + 1;
      });
      console.log("Availability distribution:", availability);

      setMembers(memberData);
      setSkills(skillDb.getAll());
      setKnowledgeAreas(knowledgeAreaDb.getAll());
      setSkillCategories(skillCategoryDb.getAll());
      setIsDataLoaded(dbUtils.isInitialized());
    };

    initializeData();
  }, []);

  // Get unique clients from members
  const uniqueClients = useMemo(() => {
    const clients = new Set(
      members.map((m) => m.currentAssignedClient).filter(Boolean)
    );
    return Array.from(clients);
  }, [members]);

  // Filter members based on all criteria
  const filteredMembers = useMemo(() => {
    return members.filter((member) => {
      // Name filter
      if (
        nameFilter &&
        !member.fullName.toLowerCase().includes(nameFilter.toLowerCase())
      ) {
        return false;
      }

      // Client filter
      if (clientFilter && member.currentAssignedClient !== clientFilter) {
        return false;
      }

      // Availability filter
      if (
        availabilityFilter &&
        member.availabilityStatus !== availabilityFilter
      ) {
        return false;
      }

      // Category filter
      if (categoryFilter && member.category !== categoryFilter) {
        return false;
      }

      // Skill-based filters
      if (knowledgeAreaFilter || skillCategoryFilter || skillFilter) {
        const memberSkills = memberSkillDb.getByMemberId(member.id);
        const memberSkillIds = memberSkills.map((ms) => ms.skillId);

        if (skillFilter && !memberSkillIds.includes(skillFilter)) {
          return false;
        }

        if (knowledgeAreaFilter || skillCategoryFilter) {
          const relevantSkills = skills.filter((skill) => {
            if (
              knowledgeAreaFilter &&
              skill.knowledgeAreaId !== knowledgeAreaFilter
            )
              return false;
            if (
              skillCategoryFilter &&
              skill.skillCategoryId !== skillCategoryFilter
            )
              return false;
            return true;
          });

          const relevantSkillIds = relevantSkills.map((s) => s.id);
          const hasRelevantSkill = memberSkillIds.some((id) =>
            relevantSkillIds.includes(id)
          );

          if (!hasRelevantSkill) return false;
        }
      }

      return true;
    });
  }, [
    members,
    nameFilter,
    knowledgeAreaFilter,
    skillCategoryFilter,
    skillFilter,
    clientFilter,
    availabilityFilter,
    categoryFilter,
    skills,
  ]);

  const stats = [
    { name: "Total Members", value: members.length, icon: Users },
    { name: "Knowledge Areas", value: knowledgeAreas.length, icon: Brain },
    { name: "Skills", value: skills.length, icon: Lightbulb },
    { name: "Skill Categories", value: skillCategories.length, icon: Tags },
  ];

  const handleDataLoaded = () => {
    // Refresh data after loading
    setMembers(memberDb.getAll());
    setSkills(skillDb.getAll());
    setKnowledgeAreas(knowledgeAreaDb.getAll());
    setSkillCategories(skillCategoryDb.getAll());
    setIsDataLoaded(true);
  };

  const handleRefreshData = async () => {
    console.log("Manual refresh triggered");
    try {
      await dbUtils.forceReload();
      console.log("Successfully refreshed all data");

      // Reload state
      const memberData = memberDb.getAll();
      console.log("=== MANUAL REFRESH DATA CHECK ===");
      console.log("Total members reloaded:", memberData.length);

      setMembers(memberData);
      setSkills(skillDb.getAll());
      setKnowledgeAreas(knowledgeAreaDb.getAll());
      setSkillCategories(skillCategoryDb.getAll());
      setIsDataLoaded(true);
    } catch (error) {
      console.error("Failed to refresh data:", error);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
            <p className="text-muted-foreground">
              Welcome to TT Skills Radar. Manage and explore techie skills and
              expertise.
            </p>
          </div>
          <Button onClick={handleRefreshData} variant="outline">
            <FileSpreadsheet className="h-4 w-4 mr-2" />
            Refresh Data
          </Button>
        </div>
      </div>

      {/* Data Loader */}
      {!isDataLoaded && <DataLoader onDataLoaded={handleDataLoaded} />}

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.name}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.name}</CardTitle>
              <stat.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Analytics Charts */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Members by Client Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Members by Client</CardTitle>
          </CardHeader>
          <CardContent>
            <SimpleBarChart
              data={uniqueClients.map((client) => ({
                name: client === "Available" ? "Available" : client,
                value: members.filter((m) => m.currentAssignedClient === client)
                  .length,
                color: client === "Available" ? "#6b7280" : undefined,
              }))}
            />
          </CardContent>
        </Card>

        {/* Members by Country Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Members by Country</CardTitle>
          </CardHeader>
          <CardContent>
            <SimplePieChart
              data={[...new Set(members.map((m) => m.location))].map(
                (location) => ({
                  name: location,
                  value: members.filter((m) => m.location === location).length,
                })
              )}
              size={160}
            />
          </CardContent>
        </Card>

        {/* Availability Status Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Availability Status</CardTitle>
          </CardHeader>
          <CardContent>
            <SimplePieChart
              data={[
                {
                  name: "Available",
                  value: members.filter(
                    (m) => m.availabilityStatus === "Available"
                  ).length,
                  color: "#10b981",
                },
                {
                  name: "Assigned",
                  value: members.filter(
                    (m) => m.availabilityStatus === "Assigned"
                  ).length,
                  color: "#3b82f6",
                },
                {
                  name: "Available Soon",
                  value: members.filter(
                    (m) => m.availabilityStatus === "Available Soon"
                  ).length,
                  color: "#f59e0b",
                },
              ]}
              size={160}
            />
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filter Members</CardTitle>
          <CardDescription>
            Search and filter members by various criteria
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <div className="space-y-2">
              <label className="text-sm font-medium">Name</label>
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name..."
                  value={nameFilter}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setNameFilter(e.target.value)
                  }
                  className="pl-8"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Knowledge Area</label>
              <div className="relative">
                <Select
                  value={knowledgeAreaFilter}
                  onValueChange={setKnowledgeAreaFilter}
                >
                  <SelectTrigger className={knowledgeAreaFilter ? "pr-10" : ""}>
                    <SelectValue placeholder="All areas" />
                  </SelectTrigger>
                  <SelectContent>
                    {knowledgeAreas.map((area) => (
                      <SelectItem key={area.id} value={area.id}>
                        {area.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {knowledgeAreaFilter && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                    onClick={() => setKnowledgeAreaFilter("")}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Skill Category</label>
              <div className="relative">
                <Select
                  value={skillCategoryFilter}
                  onValueChange={setSkillCategoryFilter}
                >
                  <SelectTrigger className={skillCategoryFilter ? "pr-10" : ""}>
                    <SelectValue placeholder="All categories" />
                  </SelectTrigger>
                  <SelectContent>
                    {skillCategories.map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {skillCategoryFilter && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                    onClick={() => setSkillCategoryFilter("")}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Skill</label>
              <div className="relative">
                <Select value={skillFilter} onValueChange={setSkillFilter}>
                  <SelectTrigger className={skillFilter ? "pr-10" : ""}>
                    <SelectValue placeholder="All skills" />
                  </SelectTrigger>
                  <SelectContent>
                    {skills.map((skill) => (
                      <SelectItem key={skill.id} value={skill.id}>
                        {skill.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {skillFilter && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                    onClick={() => setSkillFilter("")}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Client</label>
              <div className="relative">
                <Select value={clientFilter} onValueChange={setClientFilter}>
                  <SelectTrigger className={clientFilter ? "pr-10" : ""}>
                    <SelectValue placeholder="All clients" />
                  </SelectTrigger>
                  <SelectContent>
                    {uniqueClients.map((client) => (
                      <SelectItem key={client} value={client}>
                        {client}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {clientFilter && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                    onClick={() => setClientFilter("")}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Availability</label>
              <div className="relative">
                <Select
                  value={availabilityFilter}
                  onValueChange={setAvailabilityFilter}
                >
                  <SelectTrigger className={availabilityFilter ? "pr-10" : ""}>
                    <SelectValue placeholder="All statuses" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Available">Available</SelectItem>
                    <SelectItem value="Available Soon">
                      Available Soon
                    </SelectItem>
                    <SelectItem value="Assigned">Assigned</SelectItem>
                  </SelectContent>
                </Select>
                {availabilityFilter && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                    onClick={() => setAvailabilityFilter("")}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Techie Category</label>
              <div className="relative">
                <Select
                  value={categoryFilter}
                  onValueChange={setCategoryFilter}
                >
                  <SelectTrigger className={categoryFilter ? "pr-10" : ""}>
                    <SelectValue placeholder="All categories" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Starter">Starter</SelectItem>
                    <SelectItem value="Builder">Builder</SelectItem>
                    <SelectItem value="Solver">Solver</SelectItem>
                    <SelectItem value="Wizard">Wizard</SelectItem>
                  </SelectContent>
                </Select>
                {categoryFilter && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                    onClick={() => setCategoryFilter("")}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          </div>

          <div className="mt-4 flex gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setNameFilter("");
                setKnowledgeAreaFilter("");
                setSkillCategoryFilter("");
                setSkillFilter("");
                setClientFilter("");
                setAvailabilityFilter("");
                setCategoryFilter("");
              }}
            >
              Clear Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Advanced Queries */}
      {isDataLoaded && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Client History Query */}
          <Card>
            <CardHeader>
              <CardTitle>Members by Client History</CardTitle>
              <CardDescription>
                Find all members who have worked for a specific client
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ClientHistoryQuery />
            </CardContent>
          </Card>

          {/* Skills by Category Query */}
          <Card>
            <CardHeader>
              <CardTitle>Skills by Techie Category</CardTitle>
              <CardDescription>
                View all skills possessed by members in a specific category
              </CardDescription>
            </CardHeader>
            <CardContent>
              <SkillsByCategoryQuery />
            </CardContent>
          </Card>
        </div>
      )}

      {/* Members List */}
      <Card>
        <CardHeader>
          <CardTitle>Members ({filteredMembers.length})</CardTitle>
          <CardDescription>
            {filteredMembers.length === members.length
              ? "Showing all members"
              : `Showing ${filteredMembers.length} of ${members.length} members`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredMembers.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                No members found matching the selected filters.
              </p>
            ) : (
              filteredMembers.map((member) => (
                <Link
                  key={member.id}
                  to={`/member-profile/${member.id}`}
                  className="block"
                >
                  <Card className="hover:bg-accent transition-colors">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-semibold">{member.fullName}</h3>
                          <p className="text-sm text-muted-foreground">
                            {member.corporateEmail}
                          </p>
                          <div className="flex gap-2 mt-2">
                            <Badge variant="secondary">{member.category}</Badge>
                            <Badge
                              variant={
                                member.availabilityStatus === "Available"
                                  ? "default"
                                  : member.availabilityStatus ===
                                    "Available Soon"
                                  ? "secondary"
                                  : "outline"
                              }
                            >
                              {member.availabilityStatus}
                            </Badge>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium">
                            {member.currentAssignedClient || "No client"}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {member.location}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
