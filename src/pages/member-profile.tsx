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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  User,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Building,
  Award,
  Target,
  MessageSquare,
  ExternalLink,
  ArrowLeft,
  Users,
  Code,
  Briefcase,
} from "lucide-react";
import {
  memberDb,
  memberProfileDb,
  memberSkillDb,
  skillDb,
  scaleDb,
  initDatabase,
  loadExcelData,
} from "@/lib/database";
import { MemberProfileEditor } from "@/components/member-profile-editor";
import type { Member, MemberProfile, MemberSkill, Skill, Scale } from "@/types";

export function MemberProfilePage() {
  const { id } = useParams<{ id: string }>();
  const [member, setMember] = useState<Member | null>(null);
  const [profile, setProfile] = useState<MemberProfile | null>(null);
  const [memberSkills, setMemberSkills] = useState<MemberSkill[]>([]);
  const [skills, setSkills] = useState<Skill[]>([]);
  const [scales, setScales] = useState<Scale[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    initDatabase();
    loadMemberData();
  }, [id]);

  const loadMemberData = async () => {
    if (!id) return;

    try {
      // Ensure we load fresh data from the database
      await loadExcelData();

      const memberData = memberDb.getById(id);
      let profileData = memberProfileDb.getByMemberId(id);
      const skillsData = memberSkillDb.getByMemberId(id);
      const allSkills = skillDb.getAll();
      const allScales = scaleDb.getAll();

      console.log("=== Loading member profile for ID:", id, "===");
      console.log("Member data:", memberData);
      console.log("Profile data:", profileData);

      // If no profile exists, create a basic one
      if (memberData && !profileData) {
        const newProfile: MemberProfile = {
          id: crypto.randomUUID(),
          memberId: id,
          assignments: [],
          rolesAndTasks: [],
          appreciationsFromClients: [],
          feedbackComments: [],
          periodsInTalentPool: [],
          aboutMe: "",
          bio: "",
          contactInfo: {
            email: memberData.corporateEmail,
          },
          socialConnections: {},
          status: "Active",
          badges: [],
          certifications: [],
          assessments: [],
          careerInterests: [],
          professionalGoals: [],
        };
        memberProfileDb.add(newProfile);
        profileData = newProfile;
        console.log("✓ Created new profile for member:", memberData.fullName);
      }

      console.log("Profile assignments:", profileData?.assignments);
      console.log("Profile aboutMe:", profileData?.aboutMe);
      console.log("Profile bio:", profileData?.bio);
      console.log("=== End member profile loading ===");

      setMember(memberData || null);
      setProfile(profileData || null);
      setMemberSkills(skillsData);
      setSkills(allSkills);
      setScales(allScales);
    } catch (error) {
      console.error("Error loading member data:", error);
    } finally {
      setLoading(false);
    }
  };

  const getSkillName = (skillId: string) => {
    return skills.find((s) => s.id === skillId)?.name || "Unknown Skill";
  };

  const getScaleValue = (scaleId: string, value: string) => {
    const scale = scales.find((s) => s.id === scaleId);
    if (!scale) return value;

    const index = parseInt(value) - 1;
    return scale.values[index] || value;
  };

  const getProficiencyColor = (value: string) => {
    const level = parseInt(value);
    if (level >= 4) return "bg-green-500";
    if (level >= 3) return "bg-blue-500";
    if (level >= 2) return "bg-yellow-500";
    return "bg-gray-500";
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Loading member profile...</p>
        </div>
      </div>
    );
  }

  if (!member) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold mb-4">Member Not Found</h2>
        <p className="text-muted-foreground mb-4">
          The member profile you're looking for doesn't exist.
        </p>
        <Link to="/members">
          <Button>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Members
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link to="/members">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold">{member.fullName}</h1>
            <p className="text-muted-foreground">{member.corporateEmail}</p>
          </div>
        </div>
        {profile && (
          <MemberProfileEditor
            profile={profile}
            onProfileUpdated={loadMemberData}
          />
        )}
      </div>

      {/* Member Overview Card */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-start gap-6">
            <Avatar className="h-20 w-20">
              <AvatarImage src={member.photoUrl || ""} />
              <AvatarFallback className="text-lg">
                {getInitials(member.fullName)}
              </AvatarFallback>
            </Avatar>

            <div className="flex-1 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{member.corporateEmail}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Building className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">
                    {member.currentAssignedClient}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{member.location}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">Hired: {member.hireDate}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <Badge variant="secondary">{member.category}</Badge>
                </div>
                <div className="flex items-center gap-2">
                  <Target className="h-4 w-4 text-muted-foreground" />
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

              {profile?.bio && (
                <div>
                  <h3 className="font-medium mb-2">Bio</h3>
                  <p className="text-sm text-muted-foreground">{profile.bio}</p>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs for detailed information */}
      <Tabs defaultValue="skills" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="skills">Skills</TabsTrigger>
          <TabsTrigger value="assignments">Assignments</TabsTrigger>
          <TabsTrigger value="certifications">Certifications</TabsTrigger>
          <TabsTrigger value="about">About</TabsTrigger>
        </TabsList>

        {/* Skills Tab */}
        <TabsContent value="skills">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Code className="h-5 w-5" />
                Technical Skills ({memberSkills.length})
              </CardTitle>
              <CardDescription>Skills and proficiency levels</CardDescription>
            </CardHeader>
            <CardContent>
              {memberSkills.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  No skills recorded yet.
                </p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {memberSkills.map((memberSkill) => (
                    <Card
                      key={`${memberSkill.skillId}-${memberSkill.scaleId}`}
                      className="p-4"
                    >
                      <div className="space-y-2">
                        <h4 className="font-medium">
                          {getSkillName(memberSkill.skillId)}
                        </h4>
                        <div className="flex items-center gap-2">
                          <div
                            className={`w-3 h-3 rounded-full ${getProficiencyColor(
                              memberSkill.proficiencyValue
                            )}`}
                          ></div>
                          <span className="text-sm">
                            Level {memberSkill.proficiencyValue} -{" "}
                            {getScaleValue(
                              memberSkill.scaleId,
                              memberSkill.proficiencyValue
                            )}
                          </span>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Assignments Tab */}
        <TabsContent value="assignments">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Briefcase className="h-5 w-5" />
                Assignment History ({profile?.assignments?.length || 0})
              </CardTitle>
              <CardDescription>
                Complete timeline of assignments since hiring
              </CardDescription>
            </CardHeader>
            <CardContent>
              {!profile?.assignments?.length ? (
                <div className="text-center py-8">
                  <Briefcase className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground">
                    No assignments recorded yet.
                  </p>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Timeline Header */}
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    <span>Timeline since hiring: {member.hireDate}</span>
                  </div>

                  {/* Timeline */}
                  <div className="relative">
                    {/* Timeline line */}
                    <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-border"></div>

                    {profile.assignments
                      .sort(
                        (a, b) =>
                          new Date(a.startDate).getTime() -
                          new Date(b.startDate).getTime()
                      )
                      .map((assignment) => (
                        <div
                          key={assignment.id}
                          className="relative flex gap-6 pb-8"
                        >
                          {/* Timeline dot */}
                          <div className="relative z-10 flex h-8 w-8 items-center justify-center">
                            <div
                              className={`h-3 w-3 rounded-full ${
                                assignment.endDate
                                  ? "bg-blue-500"
                                  : "bg-green-500"
                              } border-2 border-background`}
                            ></div>
                          </div>

                          {/* Assignment Card */}
                          <div className="flex-1 min-w-0">
                            <Card className="mb-0">
                              <CardContent className="p-4">
                                <div className="space-y-3">
                                  {/* Header */}
                                  <div className="flex items-start justify-between">
                                    <div className="min-w-0 flex-1">
                                      <h4 className="font-semibold text-lg">
                                        {assignment.projectName}
                                      </h4>
                                      <div className="flex items-center gap-2 mt-1">
                                        <Building className="h-4 w-4 text-muted-foreground" />
                                        <span className="text-sm font-medium text-blue-600">
                                          {assignment.clientName}
                                        </span>
                                      </div>
                                    </div>
                                    <Badge
                                      variant={
                                        assignment.endDate
                                          ? "secondary"
                                          : "default"
                                      }
                                    >
                                      {assignment.role}
                                    </Badge>
                                  </div>

                                  {/* Duration */}
                                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                    <Calendar className="h-4 w-4" />
                                    <span>
                                      {new Date(
                                        assignment.startDate
                                      ).toLocaleDateString()}{" "}
                                      -{" "}
                                      {assignment.endDate
                                        ? new Date(
                                            assignment.endDate
                                          ).toLocaleDateString()
                                        : "Present"}
                                    </span>
                                    <span className="text-xs">
                                      (
                                      {assignment.endDate
                                        ? Math.ceil(
                                            (new Date(
                                              assignment.endDate
                                            ).getTime() -
                                              new Date(
                                                assignment.startDate
                                              ).getTime()) /
                                              (1000 * 60 * 60 * 24 * 30)
                                          )
                                        : Math.ceil(
                                            (new Date().getTime() -
                                              new Date(
                                                assignment.startDate
                                              ).getTime()) /
                                              (1000 * 60 * 60 * 24 * 30)
                                          )}{" "}
                                      months)
                                    </span>
                                  </div>

                                  {/* Description */}
                                  {assignment.description && (
                                    <p className="text-sm text-muted-foreground">
                                      {assignment.description}
                                    </p>
                                  )}

                                  {/* Technologies */}
                                  {assignment.technologies &&
                                    assignment.technologies.length > 0 && (
                                      <div className="space-y-2">
                                        <div className="flex items-center gap-2">
                                          <Code className="h-4 w-4 text-muted-foreground" />
                                          <span className="text-sm font-medium">
                                            Technologies:
                                          </span>
                                        </div>
                                        <div className="flex flex-wrap gap-1">
                                          {assignment.technologies.map(
                                            (tech) => (
                                              <Badge
                                                key={tech}
                                                variant="outline"
                                                className="text-xs"
                                              >
                                                {tech}
                                              </Badge>
                                            )
                                          )}
                                        </div>
                                      </div>
                                    )}

                                  {/* Status indicator */}
                                  <div className="flex items-center gap-2 pt-2 border-t">
                                    <div
                                      className={`h-2 w-2 rounded-full ${
                                        assignment.endDate
                                          ? "bg-gray-400"
                                          : "bg-green-500"
                                      }`}
                                    ></div>
                                    <span className="text-xs text-muted-foreground">
                                      {assignment.endDate
                                        ? "Completed"
                                        : "Current Assignment"}
                                    </span>
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          </div>
                        </div>
                      ))}
                  </div>

                  {/* Summary Stats */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t">
                    <Card className="p-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-blue-600">
                          {profile.assignments.length}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          Total Assignments
                        </div>
                      </div>
                    </Card>
                    <Card className="p-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-green-600">
                          {
                            new Set(
                              profile.assignments.map((a) => a.clientName)
                            ).size
                          }
                        </div>
                        <div className="text-sm text-muted-foreground">
                          Unique Clients
                        </div>
                      </div>
                    </Card>
                    <Card className="p-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-purple-600">
                          {profile.assignments.filter((a) => !a.endDate).length}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          Current Assignments
                        </div>
                      </div>
                    </Card>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Certifications Tab */}
        <TabsContent value="certifications">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="h-5 w-5" />
                Certifications & Assessments
              </CardTitle>
              <CardDescription>
                Professional certifications, licenses, and assessments
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* Certifications */}
                <div>
                  <h4 className="font-medium mb-3">
                    Certifications ({profile?.certifications.length || 0})
                  </h4>
                  {!profile?.certifications.length ? (
                    <p className="text-center text-muted-foreground py-4">
                      No certifications recorded yet.
                    </p>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {profile.certifications.map((cert) => (
                        <Card key={cert.id} className="p-4">
                          <div className="space-y-2">
                            <h5 className="font-medium">{cert.name}</h5>
                            <p className="text-sm text-muted-foreground">
                              {cert.issuer}
                            </p>
                            <div className="text-sm">
                              {cert.credentialId && (
                                <div>Credential ID: {cert.credentialId}</div>
                              )}
                              <div>Issued: {cert.dateObtained}</div>
                              {cert.expiryDate && (
                                <div>Expires: {cert.expiryDate}</div>
                              )}
                            </div>
                            {cert.verificationUrl && (
                              <a
                                href={cert.verificationUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800"
                              >
                                Verify <ExternalLink className="h-3 w-3" />
                              </a>
                            )}
                          </div>
                        </Card>
                      ))}
                    </div>
                  )}
                </div>

                {/* Assessments */}
                <div>
                  <h4 className="font-medium mb-3">
                    Assessments ({profile?.assessments.length || 0})
                  </h4>
                  {!profile?.assessments.length ? (
                    <p className="text-center text-muted-foreground py-4">
                      No assessments recorded yet.
                    </p>
                  ) : (
                    <div className="space-y-4">
                      {profile.assessments.map((assessment) => (
                        <Card key={assessment.id} className="p-4">
                          <div className="space-y-2">
                            <div className="flex items-start justify-between">
                              <div>
                                <h5 className="font-medium">
                                  {assessment.name}
                                </h5>
                                <p className="text-sm text-muted-foreground">
                                  Assessed by: {assessment.assessor}
                                </p>
                              </div>
                              <div className="text-right">
                                <div className="text-lg font-bold">
                                  {assessment.score}/{assessment.maxScore}
                                </div>
                                <div className="text-sm text-muted-foreground">
                                  {assessment.completedDate}
                                </div>
                              </div>
                            </div>
                          </div>
                        </Card>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* About Tab */}
        <TabsContent value="about">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* About Me & Contact */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  About & Contact
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {profile?.aboutMe && (
                  <div>
                    <h4 className="font-medium mb-2">About Me</h4>
                    <p className="text-sm text-muted-foreground">
                      {profile.aboutMe}
                    </p>
                  </div>
                )}

                {profile?.contactInfo && (
                  <div>
                    <h4 className="font-medium mb-2">Contact Information</h4>
                    <div className="space-y-2 text-sm">
                      {profile.contactInfo.workPhone && (
                        <div className="flex items-center gap-2">
                          <Phone className="h-4 w-4" />
                          <span>Work: {profile.contactInfo.workPhone}</span>
                        </div>
                      )}
                      {profile.contactInfo.cellPhone && (
                        <div className="flex items-center gap-2">
                          <Phone className="h-4 w-4" />
                          <span>Cell: {profile.contactInfo.cellPhone}</span>
                        </div>
                      )}
                      {profile.contactInfo.skype && (
                        <div className="flex items-center gap-2">
                          <MessageSquare className="h-4 w-4" />
                          <span>Skype: {profile.contactInfo.skype}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {profile?.socialConnections && (
                  <div>
                    <h4 className="font-medium mb-2">Social Connections</h4>
                    <div className="space-y-2 text-sm">
                      {profile.socialConnections.linkedin && (
                        <a
                          href={profile.socialConnections.linkedin}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 text-blue-600 hover:text-blue-800"
                        >
                          LinkedIn <ExternalLink className="h-3 w-3" />
                        </a>
                      )}
                      {profile.socialConnections.github && (
                        <a
                          href={profile.socialConnections.github}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 text-blue-600 hover:text-blue-800"
                        >
                          GitHub <ExternalLink className="h-3 w-3" />
                        </a>
                      )}
                      {profile.socialConnections.twitter && (
                        <a
                          href={profile.socialConnections.twitter}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 text-blue-600 hover:text-blue-800"
                        >
                          Twitter <ExternalLink className="h-3 w-3" />
                        </a>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Career & Feedback */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  Career & Feedback
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {profile?.careerInterests &&
                  profile.careerInterests.length > 0 && (
                    <div>
                      <h4 className="font-medium mb-2">Career Interests</h4>
                      <div className="flex flex-wrap gap-1">
                        {profile.careerInterests.map((interest, index) => (
                          <Badge
                            key={index}
                            variant="secondary"
                            className="text-xs"
                          >
                            {interest}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                {profile?.professionalGoals &&
                  profile.professionalGoals.length > 0 && (
                    <div>
                      <h4 className="font-medium mb-2">Professional Goals</h4>
                      <div className="space-y-1">
                        {profile.professionalGoals.map((goal, index) => (
                          <p
                            key={index}
                            className="text-sm text-muted-foreground"
                          >
                            • {goal}
                          </p>
                        ))}
                      </div>
                    </div>
                  )}

                {profile?.appreciationsFromClients &&
                  profile.appreciationsFromClients.length > 0 && (
                    <div>
                      <h4 className="font-medium mb-2">
                        Recent Client Feedback
                      </h4>
                      <div className="space-y-2">
                        {profile.appreciationsFromClients
                          .slice(0, 3)
                          .map((appreciation, index) => (
                            <div key={index} className="p-2 bg-muted rounded">
                              <p className="text-sm text-muted-foreground">
                                {appreciation}
                              </p>
                            </div>
                          ))}
                      </div>
                    </div>
                  )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
