import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Edit,
  Plus,
  X,
  User,
  MessageSquare,
  Target,
  Award,
  Phone,
  Mail,
  Linkedin,
  Github,
} from "lucide-react";
import { memberProfileDb } from "@/lib/database";
import { useToast } from "@/components/ui/use-toast";
import type { MemberProfile, Certification } from "@/types";

interface MemberProfileEditorProps {
  profile: MemberProfile;
  onProfileUpdated: () => void;
}

export function MemberProfileEditor({
  profile,
  onProfileUpdated,
}: MemberProfileEditorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { toast } = useToast();

  // Form states
  const [aboutMe, setAboutMe] = useState(profile.aboutMe || "");
  const [bio, setBio] = useState(profile.bio || "");
  const [email, setEmail] = useState(profile.contactInfo?.email || "");
  const [phone, setPhone] = useState(profile.contactInfo?.phone || "");
  const [linkedin, setLinkedin] = useState(
    profile.socialConnections?.linkedin || ""
  );
  const [github, setGithub] = useState(profile.socialConnections?.github || "");

  // Goals and interests
  const [professionalGoals, setProfessionalGoals] = useState<string[]>(
    profile.professionalGoals || []
  );
  const [careerInterests, setCareerInterests] = useState<string[]>(
    profile.careerInterests || []
  );
  const [newGoal, setNewGoal] = useState("");
  const [newInterest, setNewInterest] = useState("");

  // Feedback comments
  const [feedbackComments, setFeedbackComments] = useState<string[]>(
    profile.feedbackComments || []
  );
  const [newFeedback, setNewFeedback] = useState("");

  // Certifications
  const [certifications, setCertifications] = useState<Certification[]>(
    profile.certifications || []
  );
  const [newCertification, setNewCertification] = useState({
    name: "",
    issuer: "",
    dateObtained: "",
    expiryDate: "",
    credentialId: "",
  });

  // Sync state with profile prop changes
  useEffect(() => {
    console.log("Profile changed, syncing state:", profile);
    setAboutMe(profile.aboutMe || "");
    setBio(profile.bio || "");
    setEmail(profile.contactInfo?.email || "");
    setPhone(profile.contactInfo?.phone || "");
    setLinkedin(profile.socialConnections?.linkedin || "");
    setGithub(profile.socialConnections?.github || "");
    setProfessionalGoals(profile.professionalGoals || []);
    setCareerInterests(profile.careerInterests || []);
    setFeedbackComments(profile.feedbackComments || []);
    setCertifications(profile.certifications || []);
  }, [profile]);

  // Reset form when dialog opens
  useEffect(() => {
    if (isOpen) {
      console.log("Dialog opened, resetting form state");
      setAboutMe(profile.aboutMe || "");
      setBio(profile.bio || "");
      setEmail(profile.contactInfo?.email || "");
      setPhone(profile.contactInfo?.phone || "");
      setLinkedin(profile.socialConnections?.linkedin || "");
      setGithub(profile.socialConnections?.github || "");
      setProfessionalGoals(profile.professionalGoals || []);
      setCareerInterests(profile.careerInterests || []);
      setFeedbackComments(profile.feedbackComments || []);
      setCertifications(profile.certifications || []);
      // Reset input fields
      setNewGoal("");
      setNewInterest("");
      setNewFeedback("");
      setNewCertification({
        name: "",
        issuer: "",
        dateObtained: "",
        expiryDate: "",
        credentialId: "",
      });
    }
  }, [isOpen, profile]);

  const handleSave = () => {
    try {
      console.log("=== SAVING PROFILE ===");
      console.log("Career interests state:", careerInterests);
      console.log("Professional goals state:", professionalGoals);

      const updatedProfile: Partial<MemberProfile> = {
        aboutMe,
        bio,
        contactInfo: {
          ...profile.contactInfo,
          email,
          phone,
        },
        socialConnections: {
          ...profile.socialConnections,
          linkedin,
          github,
        },
        professionalGoals,
        careerInterests,
        feedbackComments,
        certifications,
      };

      console.log("Updated profile data:", updatedProfile);
      console.log(
        "Career interests in update:",
        updatedProfile.careerInterests
      );

      // Update the existing profile
      memberProfileDb.update(profile.id, updatedProfile);

      console.log("Updating profile with:", updatedProfile);
      console.log("Profile ID:", profile.id);

      toast({
        title: "Profile updated",
        description: "The member profile has been updated successfully.",
      });

      onProfileUpdated();
      setIsOpen(false);
    } catch (error) {
      console.error("Error updating profile:", error);
      toast({
        title: "Error",
        description: "Failed to update profile. Please try again.",
        variant: "destructive",
      });
    }
  };

  const addGoal = () => {
    if (newGoal.trim()) {
      setProfessionalGoals([...professionalGoals, newGoal.trim()]);
      setNewGoal("");
    }
  };

  const removeGoal = (index: number) => {
    setProfessionalGoals(professionalGoals.filter((_, i) => i !== index));
  };

  const addInterest = () => {
    console.log("Adding interest:", newInterest);
    console.log("Current careerInterests:", careerInterests);
    if (newInterest.trim()) {
      const updatedInterests = [...careerInterests, newInterest.trim()];
      console.log("Updated careerInterests:", updatedInterests);
      setCareerInterests(updatedInterests);
      setNewInterest("");
    }
  };

  const removeInterest = (index: number) => {
    console.log("Removing interest at index:", index);
    console.log("Current careerInterests:", careerInterests);
    const updatedInterests = careerInterests.filter((_, i) => i !== index);
    console.log("Updated careerInterests:", updatedInterests);
    setCareerInterests(updatedInterests);
  };

  const addFeedback = () => {
    if (newFeedback.trim()) {
      setFeedbackComments([...feedbackComments, newFeedback.trim()]);
      setNewFeedback("");
    }
  };

  const removeFeedback = (index: number) => {
    setFeedbackComments(feedbackComments.filter((_, i) => i !== index));
  };

  const addCertification = () => {
    if (newCertification.name.trim() && newCertification.issuer.trim()) {
      const certification: Certification = {
        id: crypto.randomUUID(),
        ...newCertification,
        name: newCertification.name.trim(),
        issuer: newCertification.issuer.trim(),
      };

      setCertifications([...certifications, certification]);
      setNewCertification({
        name: "",
        issuer: "",
        dateObtained: "",
        expiryDate: "",
        credentialId: "",
      });
    }
  };

  const removeCertification = (id: string) => {
    setCertifications(certifications.filter((cert) => cert.id !== id));
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button>
          <Edit className="h-4 w-4 mr-2" />
          Edit Profile
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Member Profile</DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="personal" className="space-y-4">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="personal">Personal</TabsTrigger>
            <TabsTrigger value="goals">Goals & Interests</TabsTrigger>
            <TabsTrigger value="feedback">Feedback</TabsTrigger>
            <TabsTrigger value="certifications">Certifications</TabsTrigger>
          </TabsList>

          {/* Personal Information Tab */}
          <TabsContent value="personal" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Personal Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">About Me</label>
                  <Textarea
                    value={aboutMe}
                    onChange={(e) => setAboutMe(e.target.value)}
                    placeholder="Tell us about yourself..."
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Bio</label>
                  <Textarea
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    placeholder="Professional bio..."
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium flex items-center gap-2">
                      <Mail className="h-4 w-4" />
                      Email
                    </label>
                    <Input
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="email@example.com"
                      type="email"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium flex items-center gap-2">
                      <Phone className="h-4 w-4" />
                      Phone
                    </label>
                    <Input
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+1-555-0123"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium flex items-center gap-2">
                      <Linkedin className="h-4 w-4" />
                      LinkedIn
                    </label>
                    <Input
                      value={linkedin}
                      onChange={(e) => setLinkedin(e.target.value)}
                      placeholder="https://linkedin.com/in/username"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium flex items-center gap-2">
                      <Github className="h-4 w-4" />
                      GitHub
                    </label>
                    <Input
                      value={github}
                      onChange={(e) => setGithub(e.target.value)}
                      placeholder="https://github.com/username"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Goals & Interests Tab */}
          <TabsContent value="goals" className="space-y-4">
            {/* Professional Goals */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  Professional Goals
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2">
                  <Input
                    value={newGoal}
                    onChange={(e) => setNewGoal(e.target.value)}
                    placeholder="Add a professional goal..."
                    onKeyPress={(e) => e.key === "Enter" && addGoal()}
                  />
                  <Button onClick={addGoal} size="sm">
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>

                <div className="flex flex-wrap gap-2">
                  {professionalGoals.map((goal, index) => (
                    <Badge key={index} variant="secondary" className="text-sm">
                      {goal}
                      <Button
                        variant="ghost"
                        size="sm"
                        className="ml-2 h-auto p-0"
                        onClick={() => removeGoal(index)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Career Interests */}
            <Card>
              <CardHeader>
                <CardTitle>Career Interests</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2">
                  <Input
                    value={newInterest}
                    onChange={(e) => setNewInterest(e.target.value)}
                    placeholder="Add a career interest..."
                    onKeyPress={(e) => e.key === "Enter" && addInterest()}
                  />
                  <Button onClick={addInterest} size="sm">
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>

                <div className="flex flex-wrap gap-2">
                  {careerInterests.map((interest, index) => (
                    <Badge key={index} variant="outline" className="text-sm">
                      {interest}
                      <Button
                        variant="ghost"
                        size="sm"
                        className="ml-2 h-auto p-0"
                        onClick={() => removeInterest(index)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Feedback Tab */}
          <TabsContent value="feedback" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5" />
                  Feedback Comments
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2">
                  <Input
                    value={newFeedback}
                    onChange={(e) => setNewFeedback(e.target.value)}
                    placeholder="Add feedback comment..."
                    onKeyPress={(e) => e.key === "Enter" && addFeedback()}
                  />
                  <Button onClick={addFeedback} size="sm">
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>

                <div className="space-y-2">
                  {feedbackComments.map((comment, index) => (
                    <div
                      key={index}
                      className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg flex justify-between items-start"
                    >
                      <span className="text-sm">{comment}</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeFeedback(index)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Certifications Tab */}
          <TabsContent value="certifications" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Award className="h-5 w-5" />
                  Certifications
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Add new certification form */}
                <div className="p-4 border rounded-lg space-y-3">
                  <h4 className="font-medium">Add New Certification</h4>

                  <div className="grid grid-cols-2 gap-3">
                    <Input
                      value={newCertification.name}
                      onChange={(e) =>
                        setNewCertification({
                          ...newCertification,
                          name: e.target.value,
                        })
                      }
                      placeholder="Certification name"
                    />
                    <Input
                      value={newCertification.issuer}
                      onChange={(e) =>
                        setNewCertification({
                          ...newCertification,
                          issuer: e.target.value,
                        })
                      }
                      placeholder="Issuing organization"
                    />
                    <Input
                      type="date"
                      value={newCertification.dateObtained}
                      onChange={(e) =>
                        setNewCertification({
                          ...newCertification,
                          dateObtained: e.target.value,
                        })
                      }
                      placeholder="Date obtained"
                    />
                    <Input
                      type="date"
                      value={newCertification.expiryDate}
                      onChange={(e) =>
                        setNewCertification({
                          ...newCertification,
                          expiryDate: e.target.value,
                        })
                      }
                      placeholder="Expiry date (optional)"
                    />
                    <Input
                      value={newCertification.credentialId}
                      onChange={(e) =>
                        setNewCertification({
                          ...newCertification,
                          credentialId: e.target.value,
                        })
                      }
                      placeholder="Credential ID (optional)"
                      className="col-span-2"
                    />
                  </div>

                  <Button onClick={addCertification} size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Certification
                  </Button>
                </div>

                {/* Existing certifications */}
                <div className="space-y-3">
                  {certifications.map((cert) => (
                    <div key={cert.id} className="p-4 border rounded-lg">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h4 className="font-medium">{cert.name}</h4>
                          <p className="text-sm text-muted-foreground">
                            {cert.issuer}
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeCertification(cert.id)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>

                      <div className="text-xs text-muted-foreground space-y-1">
                        {cert.dateObtained && (
                          <div>Obtained: {cert.dateObtained}</div>
                        )}
                        {cert.expiryDate && (
                          <div>Expires: {cert.expiryDate}</div>
                        )}
                        {cert.credentialId && (
                          <div>ID: {cert.credentialId}</div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <div className="flex justify-end gap-2 pt-4">
          <Button variant="outline" onClick={() => setIsOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave}>Save Changes</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
