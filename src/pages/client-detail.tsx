import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  ArrowLeft,
  Building,
  Calendar,
  Users,
  MapPin,
  Mail,
  ExternalLink,
  RefreshCw,
} from "lucide-react";
import {
  clientDb,
  memberDb,
  memberProfileDb,
  initDatabase,
  loadExcelData,
  dbUtils,
} from "@/lib/database";
import type { Client, Member, MemberProfile, Assignment } from "@/types";

export function ClientDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [client, setClient] = useState<Client | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [memberProfiles, setMemberProfiles] = useState<MemberProfile[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    initDatabase();

    // Debug: Check if database is initialized
    const stats = dbUtils.getStats();
    console.log("Database stats:", stats);

    // If not initialized, try to load data
    if (!stats.isInitialized) {
      console.log("Database not initialized, attempting to load...");
      loadExcelData()
        .then(() => {
          console.log("Data loaded, reloading client data...");
          loadClientData();
        })
        .catch((error) => {
          console.error("Failed to load data:", error);
          setLoading(false);
        });
    } else {
      loadClientData();
    }
  }, [id]);

  const loadClientData = () => {
    if (!id) return;

    try {
      const clientData = clientDb.getById(id);
      const allMembers = memberDb.getAll();
      const allProfiles = memberProfileDb.getAll();

      console.log(
        "Loading client data for:",
        clientData?.name,
        "Members:",
        allMembers.length
      );

      // Find all assignments for this client
      const clientAssignments: Assignment[] = [];
      const clientMembers: Member[] = [];
      const clientMemberProfiles: MemberProfile[] = [];

      // First, find members who are currently assigned to this client
      allMembers.forEach((member) => {
        if (member.currentAssignedClient === clientData?.name) {
          const profile = allProfiles.find((p) => p.memberId === member.id);
          if (profile) {
            // Add member if not already added
            if (!clientMembers.find((m) => m.id === member.id)) {
              clientMembers.push(member);
              clientMemberProfiles.push(profile);
            }

            // Add their assignments for this client
            if (profile.assignments) {
              const memberClientAssignments = profile.assignments.filter(
                (assignment) => assignment.clientName === clientData?.name
              );
              clientAssignments.push(...memberClientAssignments);
            }
          }
        }
      });

      // Second, find members with assignment history for this client (who might not be currently assigned)
      allProfiles.forEach((profile) => {
        const member = allMembers.find((m) => m.id === profile.memberId);
        if (member && profile.assignments) {
          const memberClientAssignments = profile.assignments.filter(
            (assignment) => assignment.clientName === clientData?.name
          );

          if (memberClientAssignments.length > 0) {
            // Add assignments
            const newAssignments = memberClientAssignments.filter(
              (assignment) =>
                !clientAssignments.find((a) => a.id === assignment.id)
            );
            clientAssignments.push(...newAssignments);

            // Add member if not already added
            if (!clientMembers.find((m) => m.id === member.id)) {
              clientMembers.push(member);
              clientMemberProfiles.push(profile);
            }
          }
        }
      });

      console.log(
        "Found members for",
        clientData?.name + ":",
        clientMembers.length
      );

      setClient(clientData || null);
      setMembers(clientMembers);
      setMemberProfiles(clientMemberProfiles);
      setAssignments(clientAssignments);
    } catch (error) {
      console.error("Error loading client data:", error);
    } finally {
      setLoading(false);
    }
  };

  const getMemberAssignments = (memberId: string) => {
    const profile = memberProfiles.find((p) => p.memberId === memberId);
    return (
      profile?.assignments?.filter((a) => a.clientName === client?.name) || []
    );
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();
  };

  const formatDuration = (startDate: string, endDate?: string) => {
    const start = new Date(startDate);
    const end = endDate ? new Date(endDate) : new Date();
    const months = Math.ceil(
      (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24 * 30)
    );
    return `${months} month${months !== 1 ? "s" : ""}`;
  };

  const forceRefresh = async () => {
    setLoading(true);
    try {
      // Clear localStorage and force reload
      dbUtils.reset();
      await loadExcelData();
      loadClientData();
    } catch (error) {
      console.error("Error force refreshing:", error);
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Loading client details...</p>
        </div>
      </div>
    );
  }

  if (!client) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold mb-4">Client Not Found</h2>
        <p className="text-muted-foreground mb-4">
          The client you're looking for doesn't exist.
        </p>
        <Link to="/clients">
          <Button>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Clients
          </Button>
        </Link>
      </div>
    );
  }

  // Check if we have a data sync issue
  const stats = dbUtils.getStats();
  const hasDataSyncIssue = client && members.length === 0 && stats.members > 0;

  return (
    <div className="space-y-6">
      {hasDataSyncIssue && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-yellow-800">
              <RefreshCw className="h-4 w-4" />
              <span className="font-medium">Data Sync Issue Detected</span>
            </div>
            <p className="text-sm text-yellow-700 mt-1">
              No members found for this client, but the database has{" "}
              {stats.members} members total. Try clicking "Force Refresh" to
              reload the data.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link to="/clients">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold">{client.name}</h1>
            <p className="text-muted-foreground">{client.description}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={forceRefresh} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Force Refresh
          </Button>
          <Badge variant="default">Active</Badge>
        </div>
      </div>

      {/* Client Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {members.length}
              </div>
              <div className="text-sm text-muted-foreground">Total Members</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {assignments.filter((a) => !a.endDate).length}
              </div>
              <div className="text-sm text-muted-foreground">
                Active Assignments
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {assignments.length}
              </div>
              <div className="text-sm text-muted-foreground">
                Total Assignments
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">
                {new Set(assignments.map((a) => a.projectName)).size}
              </div>
              <div className="text-sm text-muted-foreground">
                Unique Projects
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Client Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building className="h-5 w-5" />
            Client Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {client.industry && (
              <div className="flex items-center gap-2">
                <Building className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">Industry: {client.industry}</span>
              </div>
            )}
            {client.location && (
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">Location: {client.location}</span>
              </div>
            )}
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">
                Added: {new Date(client.createdAt).toLocaleDateString()}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Members Assigned to Client */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Members Assigned to {client.name}
          </CardTitle>
          <CardDescription>
            Current and historical members for this client
          </CardDescription>
        </CardHeader>
        <CardContent>
          {members.length === 0 ? (
            <div className="text-center py-8">
              <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground">
                No members assigned to this client yet.
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Member</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Current Assignment</TableHead>
                  <TableHead>Start Date</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {members
                  .sort((a, b) => {
                    // Sort by: 1) Currently assigned to this client, 2) Alphabetical
                    const aIsCurrent = a.currentAssignedClient === client.name;
                    const bIsCurrent = b.currentAssignedClient === client.name;

                    if (aIsCurrent && !bIsCurrent) return -1;
                    if (!aIsCurrent && bIsCurrent) return 1;
                    return a.fullName.localeCompare(b.fullName);
                  })
                  .map((member) => {
                    const memberAssignments = getMemberAssignments(member.id);
                    const currentAssignment = memberAssignments.find(
                      (a) => !a.endDate
                    );
                    const firstAssignment = memberAssignments.sort(
                      (a, b) =>
                        new Date(a.startDate).getTime() -
                        new Date(b.startDate).getTime()
                    )[0];

                    const isCurrentlyAssigned =
                      member.currentAssignedClient === client.name;

                    return (
                      <TableRow key={member.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar className="h-8 w-8">
                              <AvatarImage src={member.photoUrl || ""} />
                              <AvatarFallback className="text-xs">
                                {getInitials(member.fullName)}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <div className="font-medium flex items-center gap-2">
                                {member.fullName}
                                {isCurrentlyAssigned && (
                                  <Badge variant="default" className="text-xs">
                                    Current
                                  </Badge>
                                )}
                              </div>
                              <div className="text-sm text-muted-foreground flex items-center gap-1">
                                <Mail className="h-3 w-3" />
                                {member.corporateEmail}
                              </div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary">{member.category}</Badge>
                        </TableCell>
                        <TableCell>
                          {currentAssignment ? (
                            <div>
                              <div className="font-medium">
                                {currentAssignment.projectName}
                              </div>
                              <div className="text-sm text-muted-foreground">
                                {currentAssignment.role}
                              </div>
                            </div>
                          ) : isCurrentlyAssigned ? (
                            <span className="text-orange-600 text-sm">
                              Assignment pending
                            </span>
                          ) : (
                            <span className="text-muted-foreground">
                              No current assignment
                            </span>
                          )}
                        </TableCell>
                        <TableCell>
                          {firstAssignment ? (
                            <div className="text-sm">
                              {new Date(
                                firstAssignment.startDate
                              ).toLocaleDateString()}
                            </div>
                          ) : (
                            "-"
                          )}
                        </TableCell>
                        <TableCell>
                          {firstAssignment ? (
                            <div className="text-sm">
                              {formatDuration(
                                firstAssignment.startDate,
                                currentAssignment
                                  ? undefined
                                  : memberAssignments[
                                      memberAssignments.length - 1
                                    ]?.endDate
                              )}
                            </div>
                          ) : (
                            "-"
                          )}
                        </TableCell>
                        <TableCell>
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
                        </TableCell>
                        <TableCell>
                          <Link to={`/member-profile/${member.id}`}>
                            <Button variant="ghost" size="sm">
                              <ExternalLink className="h-4 w-4 mr-1" />
                              View Profile
                            </Button>
                          </Link>
                        </TableCell>
                      </TableRow>
                    );
                  })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
