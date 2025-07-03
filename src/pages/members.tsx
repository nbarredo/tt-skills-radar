import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Plus, Pencil, Trash2, Eye, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import {
  memberDb,
  memberProfileDb,
  memberSkillDb,
  initDatabase,
} from "@/lib/database";
import type { Member, MemberProfile } from "@/types";

export function Members() {
  const [members, setMembers] = useState<Member[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAll, setShowAll] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<Member | null>(null);
  const [formData, setFormData] = useState({
    corporateEmail: "",
    fullName: "",
    hireDate: "",
    currentAssignedClient: "",
    category: "" as Member["category"],
    location: "",
    availabilityStatus: "" as Member["availabilityStatus"],
  });

  useEffect(() => {
    initDatabase();
    loadMembers();
  }, []);

  const loadMembers = async () => {
    setIsLoading(true);
    try {
      // Load limited data by default to prevent hangs
      const memberData = showAll
        ? memberDb.getAllUnlimited()
        : memberDb.getAll(100);
      setMembers(memberData);
    } catch (error) {
      console.error("Error loading members:", error);
      toast.error("Failed to load members");
    } finally {
      setIsLoading(false);
    }
  };

  const handleShowAll = () => {
    setShowAll(true);
    loadMembers();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (
      !formData.corporateEmail.trim() ||
      !formData.fullName.trim() ||
      !formData.hireDate ||
      !formData.category ||
      !formData.location.trim() ||
      !formData.availabilityStatus
    ) {
      toast.error("Please fill in all required fields");
      return;
    }

    if (editingMember) {
      // Update existing
      memberDb.update(editingMember.id, formData);
      toast.success("Member updated successfully");
    } else {
      // Check if email already exists
      const existingMember = memberDb.getByEmail(formData.corporateEmail);
      if (existingMember) {
        toast.error("A member with this email already exists");
        return;
      }

      // Create new member
      const newMember: Member = {
        id: crypto.randomUUID(),
        ...formData,
      };
      memberDb.add(newMember);

      // Create empty profile for the new member
      const newProfile: MemberProfile = {
        id: crypto.randomUUID(),
        memberId: newMember.id,
        assignments: [],
        rolesAndTasks: [],
        appreciationsFromClients: [],
        feedbackComments: [],
        periodsInTalentPool: [],
        aboutMe: "",
        bio: "",
        contactInfo: {
          email: newMember.corporateEmail,
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

      toast.success("Member created successfully");
    }

    loadMembers();
    handleCloseDialog();
  };

  const handleEdit = (member: Member) => {
    setEditingMember(member);
    setFormData({
      corporateEmail: member.corporateEmail,
      fullName: member.fullName,
      hireDate: member.hireDate,
      currentAssignedClient: member.currentAssignedClient,
      category: member.category,
      location: member.location,
      availabilityStatus: member.availabilityStatus,
    });
    setIsDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    if (
      confirm(
        "Are you sure you want to delete this member? This will also delete their profile and skills."
      )
    ) {
      // Delete member
      memberDb.delete(id);

      // Delete associated profile
      const profile = memberProfileDb.getByMemberId(id);
      if (profile) {
        memberProfileDb.delete(profile.id);
      }

      // Delete associated skills
      memberSkillDb.deleteByMemberId(id);

      toast.success("Member deleted successfully");
      loadMembers();
    }
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingMember(null);
    setFormData({
      corporateEmail: "",
      fullName: "",
      hireDate: "",
      currentAssignedClient: "",
      category: "" as Member["category"],
      location: "",
      availabilityStatus: "" as Member["availabilityStatus"],
    });
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Members</h1>
            <p className="text-muted-foreground">Loading members...</p>
          </div>
        </div>
        <Card>
          <CardContent className="p-8">
            <div className="flex items-center justify-center">
              <RefreshCw className="animate-spin h-8 w-8 mr-2" />
              <span>Loading members...</span>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const totalMembers = showAll
    ? members.length
    : memberDb.getAllUnlimited().length;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Members</h1>
          <p className="text-muted-foreground">
            Manage techie members and their information
          </p>
        </div>
        <Button onClick={() => setIsDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Member
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Members</CardTitle>
          <CardDescription>
            Showing {members.length} of {totalMembers} members
            {!showAll && totalMembers > 100 && (
              <>
                {" "}
                <Button
                  variant="link"
                  onClick={handleShowAll}
                  className="p-0 h-auto text-primary"
                >
                  (Show all {totalMembers} members)
                </Button>
              </>
            )}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {members.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              No members registered yet. Click "Add Member" to create one.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-[120px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {members.map((member) => (
                  <TableRow key={member.id}>
                    <TableCell className="font-medium">
                      {member.fullName}
                    </TableCell>
                    <TableCell>{member.corporateEmail}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">{member.category}</Badge>
                    </TableCell>
                    <TableCell>{member.currentAssignedClient || "-"}</TableCell>
                    <TableCell>{member.location}</TableCell>
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
                      <div className="flex gap-2">
                        <Link to={`/member-profile/${member.id}`}>
                          <Button variant="ghost" size="icon">
                            <Eye className="h-4 w-4" />
                          </Button>
                        </Link>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEdit(member)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(member.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <form onSubmit={handleSubmit}>
            <DialogHeader>
              <DialogTitle>
                {editingMember ? "Edit Member" : "Add Member"}
              </DialogTitle>
              <DialogDescription>
                Enter the member's information
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4 md:grid-cols-2">
              <div className="space-y-2">
                <label htmlFor="fullName" className="text-sm font-medium">
                  Full Name
                </label>
                <Input
                  id="fullName"
                  placeholder="John Doe"
                  value={formData.fullName}
                  onChange={(e) =>
                    setFormData({ ...formData, fullName: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="corporateEmail" className="text-sm font-medium">
                  Corporate Email
                </label>
                <Input
                  id="corporateEmail"
                  type="email"
                  placeholder="john.doe@company.com"
                  value={formData.corporateEmail}
                  onChange={(e) =>
                    setFormData({ ...formData, corporateEmail: e.target.value })
                  }
                  disabled={!!editingMember}
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="hireDate" className="text-sm font-medium">
                  Hire Date
                </label>
                <Input
                  id="hireDate"
                  type="date"
                  value={formData.hireDate}
                  onChange={(e) =>
                    setFormData({ ...formData, hireDate: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="location" className="text-sm font-medium">
                  Location
                </label>
                <Select
                  value={formData.location}
                  onValueChange={(value) =>
                    setFormData({ ...formData, location: value })
                  }
                >
                  <SelectTrigger id="location">
                    <SelectValue placeholder="Select location" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Argentina">Argentina</SelectItem>
                    <SelectItem value="Uruguay">Uruguay</SelectItem>
                    <SelectItem value="Colombia">Colombia</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label htmlFor="category" className="text-sm font-medium">
                  Techie Category
                </label>
                <Select
                  value={formData.category}
                  onValueChange={(value) =>
                    setFormData({
                      ...formData,
                      category: value as Member["category"],
                    })
                  }
                >
                  <SelectTrigger id="category">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Starter">Starter</SelectItem>
                    <SelectItem value="Builder">Builder</SelectItem>
                    <SelectItem value="Solver">Solver</SelectItem>
                    <SelectItem value="Wizard">Wizard</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label
                  htmlFor="availabilityStatus"
                  className="text-sm font-medium"
                >
                  Availability Status
                </label>
                <Select
                  value={formData.availabilityStatus}
                  onValueChange={(value) =>
                    setFormData({
                      ...formData,
                      availabilityStatus: value as Member["availabilityStatus"],
                    })
                  }
                >
                  <SelectTrigger id="availabilityStatus">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Available">Available</SelectItem>
                    <SelectItem value="Available Soon">
                      Available Soon
                    </SelectItem>
                    <SelectItem value="Assigned">Assigned</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2 md:col-span-2">
                <label
                  htmlFor="currentAssignedClient"
                  className="text-sm font-medium"
                >
                  Current Assigned Client (Optional)
                </label>
                <Input
                  id="currentAssignedClient"
                  placeholder="Client name"
                  value={formData.currentAssignedClient}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      currentAssignedClient: e.target.value,
                    })
                  }
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={handleCloseDialog}
              >
                Cancel
              </Button>
              <Button type="submit">
                {editingMember ? "Update" : "Create"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
