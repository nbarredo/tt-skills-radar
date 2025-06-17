import { useState, useEffect } from "react";
import { Plus, Pencil, Trash2 } from "lucide-react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Client, MemberAssignment } from "@/lib/types";
import type { Member } from "@/types";
import { useToast } from "@/components/ui/use-toast";

export default function MemberAssignmentsPage() {
  const [members, setMembers] = useState<Member[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [assignments, setAssignments] = useState<MemberAssignment[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingAssignment, setEditingAssignment] =
    useState<MemberAssignment | null>(null);
  const [selectedMember, setSelectedMember] = useState<string>("");
  const { toast } = useToast();

  // Form state
  const [formData, setFormData] = useState<{
    memberId: string;
    clientId: string;
    startDate: string;
    endDate: string;
    role: string;
    status: "Active" | "Completed" | "Planned";
    notes: string;
  }>({
    memberId: "",
    clientId: "",
    startDate: "",
    endDate: "",
    role: "",
    status: "Active",
    notes: "",
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    const storedMembers = localStorage.getItem("members");
    const storedClients = localStorage.getItem("clients");
    const storedAssignments = localStorage.getItem("memberAssignments");

    if (storedMembers) setMembers(JSON.parse(storedMembers));
    if (storedClients) setClients(JSON.parse(storedClients));
    if (storedAssignments) setAssignments(JSON.parse(storedAssignments));
  };

  const saveAssignments = (updatedAssignments: MemberAssignment[]) => {
    localStorage.setItem(
      "memberAssignments",
      JSON.stringify(updatedAssignments)
    );
    setAssignments(updatedAssignments);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const now = new Date().toISOString();

    if (editingAssignment) {
      // Update existing assignment
      const updatedAssignments = assignments.map((assignment) =>
        assignment.id === editingAssignment.id
          ? { ...assignment, ...formData, updatedAt: now }
          : assignment
      );
      saveAssignments(updatedAssignments);
      toast({
        title: "Assignment updated",
        description: "The assignment has been updated successfully.",
      });
    } else {
      // Create new assignment
      const newAssignment: MemberAssignment = {
        id: crypto.randomUUID(),
        ...formData,
        createdAt: now,
        updatedAt: now,
      };
      saveAssignments([...assignments, newAssignment]);
      toast({
        title: "Assignment created",
        description: "The new assignment has been created successfully.",
      });
    }

    setIsDialogOpen(false);
    resetForm();
  };

  const handleEdit = (assignment: MemberAssignment) => {
    setEditingAssignment(assignment);
    setFormData({
      memberId: assignment.memberId,
      clientId: assignment.clientId,
      startDate: assignment.startDate,
      endDate: assignment.endDate || "",
      role: assignment.role || "",
      status: assignment.status,
      notes: assignment.notes || "",
    });
    setIsDialogOpen(true);
  };

  const handleDelete = (assignmentId: string) => {
    if (window.confirm("Are you sure you want to delete this assignment?")) {
      const updatedAssignments = assignments.filter(
        (assignment) => assignment.id !== assignmentId
      );
      saveAssignments(updatedAssignments);
      toast({
        title: "Assignment deleted",
        description: "The assignment has been deleted successfully.",
      });
    }
  };

  const resetForm = () => {
    setEditingAssignment(null);
    setFormData({
      memberId: "",
      clientId: "",
      startDate: "",
      endDate: "",
      role: "",
      status: "Active",
      notes: "",
    });
  };

  const getMemberAssignments = (memberId: string) => {
    return assignments
      .filter((assignment) => assignment.memberId === memberId)
      .sort(
        (a, b) =>
          new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
      );
  };

  const getClientName = (clientId: string) => {
    return (
      clients.find((client) => client.id === clientId)?.name || "Unknown Client"
    );
  };

  const getMemberName = (memberId: string) => {
    return (
      members.find((member) => member.id === memberId)?.fullName ||
      "Unknown Member"
    );
  };

  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Member Assignments</h1>
        <div className="flex gap-4">
          <Select value={selectedMember} onValueChange={setSelectedMember}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Select member" />
            </SelectTrigger>
            <SelectContent>
              {members.map((member) => (
                <SelectItem key={member.id} value={member.id}>
                  {member.fullName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => resetForm()}>
                <Plus className="h-4 w-4 mr-2" />
                Add Assignment
              </Button>
            </DialogTrigger>
            <DialogContent className="w-[600px]">
              <DialogHeader>
                <DialogTitle>
                  {editingAssignment ? "Edit Assignment" : "Add New Assignment"}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Member</label>
                  <Select
                    value={formData.memberId}
                    onValueChange={(value) =>
                      setFormData({ ...formData, memberId: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select member" />
                    </SelectTrigger>
                    <SelectContent>
                      {members.map((member) => (
                        <SelectItem key={member.id} value={member.id}>
                          {member.fullName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Client</label>
                  <Select
                    value={formData.clientId}
                    onValueChange={(value) =>
                      setFormData({ ...formData, clientId: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select client" />
                    </SelectTrigger>
                    <SelectContent>
                      {clients.map((client) => (
                        <SelectItem key={client.id} value={client.id}>
                          {client.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Start Date</label>
                    <Input
                      type="date"
                      value={formData.startDate}
                      onChange={(e) =>
                        setFormData({ ...formData, startDate: e.target.value })
                      }
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">End Date</label>
                    <Input
                      type="date"
                      value={formData.endDate}
                      onChange={(e) =>
                        setFormData({ ...formData, endDate: e.target.value })
                      }
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Role</label>
                  <Input
                    value={formData.role}
                    onChange={(e) =>
                      setFormData({ ...formData, role: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Status</label>
                  <Select
                    value={formData.status}
                    onValueChange={(
                      value: "Active" | "Completed" | "Planned"
                    ) => setFormData({ ...formData, status: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Active">Active</SelectItem>
                      <SelectItem value="Completed">Completed</SelectItem>
                      <SelectItem value="Planned">Planned</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Notes</label>
                  <Textarea
                    value={formData.notes}
                    onChange={(e) =>
                      setFormData({ ...formData, notes: e.target.value })
                    }
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button type="submit">
                    {editingAssignment ? "Update" : "Create"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {selectedMember && (
        <div className="space-y-6">
          <h2 className="text-xl font-semibold">
            Assignments for {getMemberName(selectedMember)}
          </h2>
          <div className="space-y-4">
            {getMemberAssignments(selectedMember).map((assignment) => (
              <div
                key={assignment.id}
                className="border rounded-lg p-4 relative"
              >
                <div className="absolute top-4 right-4 flex gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleEdit(assignment)}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDelete(assignment.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h3 className="font-medium">
                      {getClientName(assignment.clientId)}
                    </h3>
                    <p className="text-sm text-gray-500">{assignment.role}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm">
                      {new Date(assignment.startDate).toLocaleDateString()} -{" "}
                      {assignment.endDate
                        ? new Date(assignment.endDate).toLocaleDateString()
                        : "Present"}
                    </p>
                    <span
                      className={`inline-block px-2 py-1 rounded-full text-xs mt-1 ${
                        assignment.status === "Active"
                          ? "bg-green-100 text-green-800"
                          : assignment.status === "Completed"
                          ? "bg-gray-100 text-gray-800"
                          : "bg-blue-100 text-blue-800"
                      }`}
                    >
                      {assignment.status}
                    </span>
                  </div>
                </div>
                {assignment.notes && (
                  <p className="mt-2 text-sm text-gray-600">
                    {assignment.notes}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
