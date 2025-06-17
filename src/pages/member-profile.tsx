import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  Plus,
  Pencil,
  Trash2,
  Mail,
  Phone,
  Smartphone,
  MessageSquare,
  Linkedin,
  Twitter,
  Award,
  BookOpen,
  ClipboardCheck,
  Camera,
} from "lucide-react";
import { toast } from "sonner";
import {
  memberStorage,
  memberProfileStorage,
  memberSkillStorage,
  skillStorage,
  scaleStorage,
} from "@/lib/storage";
import type {
  Member,
  MemberProfile,
  MemberSkill,
  Skill,
  Scale,
  Certification,
  Assessment,
} from "@/types";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

export function MemberProfile() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [member, setMember] = useState<Member | null>(null);
  const [profile, setProfile] = useState<MemberProfile | null>(null);
  const [memberSkills, setMemberSkills] = useState<MemberSkill[]>([]);
  const [skills, setSkills] = useState<Skill[]>([]);
  const [scales, setScales] = useState<Scale[]>([]);

  // Dialog states
  const [isSkillDialogOpen, setIsSkillDialogOpen] = useState(false);
  const [isProfileDialogOpen, setIsProfileDialogOpen] = useState(false);
  const [isCertDialogOpen, setIsCertDialogOpen] = useState(false);
  const [isAssessmentDialogOpen, setIsAssessmentDialogOpen] = useState(false);

  // Form data
  const [skillFormData, setSkillFormData] = useState({
    skillId: "",
    scaleId: "",
    proficiencyValue: "",
  });

  const [profileFormData, setProfileFormData] = useState<
    Partial<MemberProfile>
  >({});
  const [certFormData, setCertFormData] = useState<Certification>({
    name: "",
    license: "",
    date: "",
  });
  const [assessmentFormData, setAssessmentFormData] = useState<Assessment>({
    name: "",
    score: "",
    date: "",
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (id) {
      loadData();
    }
  }, [id]);

  const loadData = () => {
    if (!id) return;

    const memberData = memberStorage.getById(id);
    if (!memberData) {
      toast.error("Member not found");
      navigate("/members");
      return;
    }

    setMember(memberData);

    const profileData = memberProfileStorage.getByMemberId(id);
    if (profileData) {
      setProfile(profileData);
      setProfileFormData(profileData);
    }

    setMemberSkills(memberSkillStorage.getByMemberId(id));
    setSkills(skillStorage.getAll());
    setScales(scaleStorage.getAll());
  };

  const handleAddSkill = (e: React.FormEvent) => {
    e.preventDefault();

    if (
      !skillFormData.skillId ||
      !skillFormData.scaleId ||
      !skillFormData.proficiencyValue
    ) {
      toast.error("Please fill in all fields");
      return;
    }

    if (!member) return;

    const newMemberSkill: MemberSkill = {
      memberId: member.id,
      skillId: skillFormData.skillId,
      scaleId: skillFormData.scaleId,
      proficiencyValue: skillFormData.proficiencyValue,
    };

    memberSkillStorage.add(newMemberSkill);
    toast.success("Skill added successfully");
    loadData();

    setSkillFormData({
      skillId: "",
      scaleId: "",
      proficiencyValue: "",
    });
    setIsSkillDialogOpen(false);
  };

  const handleRemoveSkill = (skillId: string) => {
    if (!member) return;

    memberSkillStorage.delete(member.id, skillId);
    toast.success("Skill removed successfully");
    loadData();
  };

  const handleUpdateProfile = (e: React.FormEvent) => {
    e.preventDefault();

    if (!profile) return;

    memberProfileStorage.update(profile.id, profileFormData);
    toast.success("Profile updated successfully");
    loadData();
    setIsProfileDialogOpen(false);
  };

  const handleAddCertification = (e: React.FormEvent) => {
    e.preventDefault();

    if (!certFormData.name || !certFormData.license || !certFormData.date) {
      toast.error("Please fill in all fields");
      return;
    }

    if (!profile) return;

    const updatedCertifications = [...profile.certifications, certFormData];
    memberProfileStorage.update(profile.id, {
      certifications: updatedCertifications,
    });
    toast.success("Certification added successfully");
    loadData();

    setCertFormData({ name: "", license: "", date: "" });
    setIsCertDialogOpen(false);
  };

  const handleAddAssessment = (e: React.FormEvent) => {
    e.preventDefault();

    if (
      !assessmentFormData.name ||
      !assessmentFormData.score ||
      !assessmentFormData.date
    ) {
      toast.error("Please fill in all fields");
      return;
    }

    if (!profile) return;

    const updatedAssessments = [...profile.assessments, assessmentFormData];
    memberProfileStorage.update(profile.id, {
      assessments: updatedAssessments,
    });
    toast.success("Assessment added successfully");
    loadData();

    setAssessmentFormData({ name: "", score: "", date: "" });
    setIsAssessmentDialogOpen(false);
  };

  const getSkillName = (skillId: string) => {
    const skill = skills.find((s) => s.id === skillId);
    return skill?.name || "Unknown";
  };

  const getScaleName = (scaleId: string) => {
    const scale = scales.find((s) => s.id === scaleId);
    return scale?.name || "Unknown";
  };

  const handlePhotoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !member) return;

    // Convert the image to base64
    const reader = new FileReader();
    reader.onload = (e) => {
      const base64 = e.target?.result as string;
      memberStorage.update(member.id, { photoUrl: base64 });
      setMember({ ...member, photoUrl: base64 });
    };
    reader.readAsDataURL(file);
  };

  if (!member || !profile) {
    return <div>Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate("/members")}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex items-center gap-4">
          <div className="relative group">
            <Avatar className="h-20 w-20">
              <AvatarImage src={member.photoUrl} alt={member.fullName} />
              <AvatarFallback className="text-lg">
                {member.fullName
                  .split(" ")
                  .map((n) => n[0])
                  .join("")}
              </AvatarFallback>
            </Avatar>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handlePhotoUpload}
            />
            <Button
              variant="secondary"
              size="icon"
              className="absolute bottom-0 right-0 h-8 w-8 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={() => fileInputRef.current?.click()}
            >
              <Camera className="h-4 w-4" />
            </Button>
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              {member.fullName}
            </h1>
            <p className="text-muted-foreground">{member.corporateEmail}</p>
          </div>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Basic Info Card */}
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground">Category</p>
              <Badge variant="secondary">{member.category}</Badge>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Location</p>
              <p className="font-medium">{member.location}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Hire Date</p>
              <p className="font-medium">
                {new Date(member.hireDate).toLocaleDateString()}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Current Client</p>
              <p className="font-medium">
                {member.currentAssignedClient || "None"}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Availability</p>
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
          </CardContent>
        </Card>

        {/* Profile Details */}
        <Card className="md:col-span-2">
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>Profile Details</CardTitle>
              <Button size="sm" onClick={() => setIsProfileDialogOpen(true)}>
                <Pencil className="h-4 w-4 mr-2" />
                Edit
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="about">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="about">About</TabsTrigger>
                <TabsTrigger value="contact">Contact</TabsTrigger>
                <TabsTrigger value="history">History</TabsTrigger>
              </TabsList>

              <TabsContent value="about" className="space-y-4">
                <div>
                  <h3 className="font-semibold mb-2">Bio</h3>
                  <p className="text-sm">{profile.bio || "No bio provided"}</p>
                </div>
                <div>
                  <h3 className="font-semibold mb-2">About Me</h3>
                  <p className="text-sm">
                    {profile.aboutMe || "No description provided"}
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold mb-2">Status</h3>
                  <p className="text-sm">{profile.status || "No status set"}</p>
                </div>
                <div>
                  <h3 className="font-semibold mb-2">Roles & Tasks</h3>
                  {profile.rolesAndTasks.length > 0 ? (
                    <ul className="list-disc list-inside text-sm space-y-1">
                      {profile.rolesAndTasks.map((role, index) => (
                        <li key={index}>{role}</li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      No roles defined
                    </p>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="contact" className="space-y-4">
                <div className="space-y-2">
                  {profile.contactInfo.email && (
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">
                        {profile.contactInfo.email}
                      </span>
                    </div>
                  )}
                  {profile.contactInfo.workPhone && (
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">
                        {profile.contactInfo.workPhone}
                      </span>
                    </div>
                  )}
                  {profile.contactInfo.cellPhone && (
                    <div className="flex items-center gap-2">
                      <Smartphone className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">
                        {profile.contactInfo.cellPhone}
                      </span>
                    </div>
                  )}
                  {profile.contactInfo.skype && (
                    <div className="flex items-center gap-2">
                      <MessageSquare className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">
                        {profile.contactInfo.skype}
                      </span>
                    </div>
                  )}
                </div>
                <div className="space-y-2 pt-4">
                  <h3 className="font-semibold">Social Connections</h3>
                  {profile.socialConnections.linkedin && (
                    <div className="flex items-center gap-2">
                      <Linkedin className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">
                        {profile.socialConnections.linkedin}
                      </span>
                    </div>
                  )}
                  {profile.socialConnections.twitter && (
                    <div className="flex items-center gap-2">
                      <Twitter className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">
                        {profile.socialConnections.twitter}
                      </span>
                    </div>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="history" className="space-y-4">
                <div>
                  <h3 className="font-semibold mb-2">Assignments</h3>
                  {profile.assignments.length > 0 ? (
                    <ul className="list-disc list-inside text-sm space-y-1">
                      {profile.assignments.map((assignment, index) => (
                        <li key={index}>{assignment}</li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      No assignments recorded
                    </p>
                  )}
                </div>
                <div>
                  <h3 className="font-semibold mb-2">Client Appreciations</h3>
                  {profile.appreciationsFromClients.length > 0 ? (
                    <ul className="list-disc list-inside text-sm space-y-1">
                      {profile.appreciationsFromClients.map(
                        (appreciation, index) => (
                          <li key={index}>{appreciation}</li>
                        )
                      )}
                    </ul>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      No appreciations recorded
                    </p>
                  )}
                </div>
                <div>
                  <h3 className="font-semibold mb-2">Feedback</h3>
                  {profile.feedbackComments.length > 0 ? (
                    <ul className="list-disc list-inside text-sm space-y-1">
                      {profile.feedbackComments.map((feedback, index) => (
                        <li key={index}>{feedback}</li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      No feedback recorded
                    </p>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>

      {/* Skills Section */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Skills</CardTitle>
              <CardDescription>
                {memberSkills.length} skill
                {memberSkills.length !== 1 ? "s" : ""} registered
              </CardDescription>
            </div>
            <Button onClick={() => setIsSkillDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Skill
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {memberSkills.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              No skills added yet. Click "Add Skill" to add one.
            </p>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {memberSkills.map((ms) => (
                <Card key={ms.skillId}>
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start">
                      <div className="space-y-1">
                        <h4 className="font-semibold">
                          {getSkillName(ms.skillId)}
                        </h4>
                        <p className="text-sm text-muted-foreground">
                          {getScaleName(ms.scaleId)}
                        </p>
                        <Badge variant="secondary">{ms.proficiencyValue}</Badge>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleRemoveSkill(ms.skillId)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Certifications & Assessments */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>Certifications</CardTitle>
                <CardDescription>
                  {profile.certifications.length} certification
                  {profile.certifications.length !== 1 ? "s" : ""}
                </CardDescription>
              </div>
              <Button size="sm" onClick={() => setIsCertDialogOpen(true)}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {profile.certifications.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No certifications added
              </p>
            ) : (
              <div className="space-y-3">
                {profile.certifications.map((cert, index) => (
                  <div key={index} className="flex items-start gap-2">
                    <Award className="h-4 w-4 text-muted-foreground mt-0.5" />
                    <div className="flex-1">
                      <p className="font-medium text-sm">{cert.name}</p>
                      <p className="text-xs text-muted-foreground">
                        License: {cert.license} •{" "}
                        {new Date(cert.date).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>Assessments</CardTitle>
                <CardDescription>
                  {profile.assessments.length} assessment
                  {profile.assessments.length !== 1 ? "s" : ""}
                </CardDescription>
              </div>
              <Button size="sm" onClick={() => setIsAssessmentDialogOpen(true)}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {profile.assessments.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No assessments added
              </p>
            ) : (
              <div className="space-y-3">
                {profile.assessments.map((assessment, index) => (
                  <div key={index} className="flex items-start gap-2">
                    <ClipboardCheck className="h-4 w-4 text-muted-foreground mt-0.5" />
                    <div className="flex-1">
                      <p className="font-medium text-sm">{assessment.name}</p>
                      <p className="text-xs text-muted-foreground">
                        Score: {assessment.score} •{" "}
                        {new Date(assessment.date).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Badges */}
      <Card>
        <CardHeader>
          <CardTitle>Badges</CardTitle>
          <CardDescription>
            {profile.badges.length} badge
            {profile.badges.length !== 1 ? "s" : ""} earned
          </CardDescription>
        </CardHeader>
        <CardContent>
          {profile.badges.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No badges earned yet
            </p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {profile.badges.map((badge, index) => (
                <Badge key={index} variant="secondary">
                  <BookOpen className="h-3 w-3 mr-1" />
                  {badge}
                </Badge>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Skill Dialog */}
      <Dialog open={isSkillDialogOpen} onOpenChange={setIsSkillDialogOpen}>
        <DialogContent>
          <form onSubmit={handleAddSkill}>
            <DialogHeader>
              <DialogTitle>Add Skill</DialogTitle>
              <DialogDescription>
                Add a new skill to the member's profile
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Skill</label>
                <Select
                  value={skillFormData.skillId}
                  onValueChange={(value) =>
                    setSkillFormData({ ...skillFormData, skillId: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a skill" />
                  </SelectTrigger>
                  <SelectContent>
                    {skills.map((skill) => (
                      <SelectItem key={skill.id} value={skill.id}>
                        {skill.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Scale</label>
                <Select
                  value={skillFormData.scaleId}
                  onValueChange={(value) =>
                    setSkillFormData({ ...skillFormData, scaleId: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a scale" />
                  </SelectTrigger>
                  <SelectContent>
                    {scales.map((scale) => (
                      <SelectItem key={scale.id} value={scale.id}>
                        {scale.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {skillFormData.scaleId && (
                <div className="space-y-2">
                  <label className="text-sm font-medium">Proficiency</label>
                  <Select
                    value={skillFormData.proficiencyValue}
                    onValueChange={(value) =>
                      setSkillFormData({
                        ...skillFormData,
                        proficiencyValue: value,
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select proficiency level" />
                    </SelectTrigger>
                    <SelectContent>
                      {scales
                        .find((s) => s.id === skillFormData.scaleId)
                        ?.values.map((value) => (
                          <SelectItem key={value} value={value}>
                            {value}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsSkillDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit">Add Skill</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Profile Dialog */}
      <Dialog open={isProfileDialogOpen} onOpenChange={setIsProfileDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <form onSubmit={handleUpdateProfile}>
            <DialogHeader>
              <DialogTitle>Edit Profile</DialogTitle>
              <DialogDescription>
                Update the member's profile information
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Bio</label>
                <Input
                  value={profileFormData.bio || ""}
                  onChange={(e) =>
                    setProfileFormData({
                      ...profileFormData,
                      bio: e.target.value,
                    })
                  }
                  placeholder="Short bio"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">About Me</label>
                <Textarea
                  value={profileFormData.aboutMe || ""}
                  onChange={(e) =>
                    setProfileFormData({
                      ...profileFormData,
                      aboutMe: e.target.value,
                    })
                  }
                  placeholder="Tell us about yourself"
                  rows={4}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Status</label>
                <Input
                  value={profileFormData.status || ""}
                  onChange={(e) =>
                    setProfileFormData({
                      ...profileFormData,
                      status: e.target.value,
                    })
                  }
                  placeholder="Current status"
                />
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Work Phone</label>
                  <Input
                    value={profileFormData.contactInfo?.workPhone || ""}
                    onChange={(e) =>
                      setProfileFormData({
                        ...profileFormData,
                        contactInfo: {
                          ...profileFormData.contactInfo!,
                          workPhone: e.target.value,
                        },
                      })
                    }
                    placeholder="+1 234 567 8900"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Cell Phone</label>
                  <Input
                    value={profileFormData.contactInfo?.cellPhone || ""}
                    onChange={(e) =>
                      setProfileFormData({
                        ...profileFormData,
                        contactInfo: {
                          ...profileFormData.contactInfo!,
                          cellPhone: e.target.value,
                        },
                      })
                    }
                    placeholder="+1 234 567 8900"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Skype</label>
                  <Input
                    value={profileFormData.contactInfo?.skype || ""}
                    onChange={(e) =>
                      setProfileFormData({
                        ...profileFormData,
                        contactInfo: {
                          ...profileFormData.contactInfo!,
                          skype: e.target.value,
                        },
                      })
                    }
                    placeholder="skype.username"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">LinkedIn</label>
                  <Input
                    value={profileFormData.socialConnections?.linkedin || ""}
                    onChange={(e) =>
                      setProfileFormData({
                        ...profileFormData,
                        socialConnections: {
                          ...profileFormData.socialConnections!,
                          linkedin: e.target.value,
                        },
                      })
                    }
                    placeholder="linkedin.com/in/username"
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsProfileDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit">Update Profile</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Add Certification Dialog */}
      <Dialog open={isCertDialogOpen} onOpenChange={setIsCertDialogOpen}>
        <DialogContent>
          <form onSubmit={handleAddCertification}>
            <DialogHeader>
              <DialogTitle>Add Certification</DialogTitle>
              <DialogDescription>
                Add a new certification to the member's profile
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">
                  Certification Name
                </label>
                <Input
                  value={certFormData.name}
                  onChange={(e) =>
                    setCertFormData({ ...certFormData, name: e.target.value })
                  }
                  placeholder="e.g., AWS Certified Solutions Architect"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">License Number</label>
                <Input
                  value={certFormData.license}
                  onChange={(e) =>
                    setCertFormData({
                      ...certFormData,
                      license: e.target.value,
                    })
                  }
                  placeholder="e.g., ABC123456"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Date Obtained</label>
                <Input
                  type="date"
                  value={certFormData.date}
                  onChange={(e) =>
                    setCertFormData({ ...certFormData, date: e.target.value })
                  }
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsCertDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit">Add Certification</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Add Assessment Dialog */}
      <Dialog
        open={isAssessmentDialogOpen}
        onOpenChange={setIsAssessmentDialogOpen}
      >
        <DialogContent>
          <form onSubmit={handleAddAssessment}>
            <DialogHeader>
              <DialogTitle>Add Assessment</DialogTitle>
              <DialogDescription>
                Add a new assessment result to the member's profile
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Assessment Name</label>
                <Input
                  value={assessmentFormData.name}
                  onChange={(e) =>
                    setAssessmentFormData({
                      ...assessmentFormData,
                      name: e.target.value,
                    })
                  }
                  placeholder="e.g., Sales Proficiency Exam"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Score</label>
                <Input
                  value={assessmentFormData.score}
                  onChange={(e) =>
                    setAssessmentFormData({
                      ...assessmentFormData,
                      score: e.target.value,
                    })
                  }
                  placeholder="e.g., 85% or 4.5/5"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Date Taken</label>
                <Input
                  type="date"
                  value={assessmentFormData.date}
                  onChange={(e) =>
                    setAssessmentFormData({
                      ...assessmentFormData,
                      date: e.target.value,
                    })
                  }
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsAssessmentDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit">Add Assessment</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
