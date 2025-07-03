import { useState, useEffect } from "react";
import { Plus, Pencil, Trash2, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import { Member, Skill, Scale, MemberSkill } from "@/types";
import { memberSkillDb, skillDb, scaleDb } from "@/lib/database";

interface SkillsEditorProps {
  member: Member;
  onSkillsUpdated?: () => void;
}

export function SkillsEditor({ member, onSkillsUpdated }: SkillsEditorProps) {
  const [memberSkills, setMemberSkills] = useState<MemberSkill[]>([]);
  const [allSkills, setAllSkills] = useState<Skill[]>([]);
  const [scales, setScales] = useState<Scale[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingSkill, setEditingSkill] = useState<MemberSkill | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSkillId, setSelectedSkillId] = useState("");
  const [selectedScaleId, setSelectedScaleId] = useState("");
  const [proficiencyValue, setProficiencyValue] = useState("");
  const { toast } = useToast();

  useEffect(() => {
    loadData();
  }, [member.id]);

  const loadData = () => {
    const skills = memberSkillDb.getByMemberId(member.id);
    const allSkillsData = skillDb.getAll();
    const scalesData = scaleDb.getAll();

    setMemberSkills(skills);
    setAllSkills(allSkillsData);
    setScales(scalesData);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedSkillId || !selectedScaleId || !proficiencyValue) {
      toast({
        title: "Error",
        description: "Please fill in all fields",
        variant: "destructive",
      });
      return;
    }

    const memberSkill: MemberSkill = {
      memberId: member.id,
      skillId: selectedSkillId,
      scaleId: selectedScaleId,
      proficiencyValue: proficiencyValue,
    };

    try {
      memberSkillDb.add(memberSkill);
      loadData();
      onSkillsUpdated?.();

      toast({
        title: editingSkill ? "Skill Updated" : "Skill Added",
        description: `Successfully ${
          editingSkill ? "updated" : "added"
        } skill proficiency.`,
      });

      resetForm();
      setIsDialogOpen(false);
    } catch {
      toast({
        title: "Error",
        description: "Failed to save skill. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleEdit = (memberSkill: MemberSkill) => {
    setEditingSkill(memberSkill);
    setSelectedSkillId(memberSkill.skillId);
    setSelectedScaleId(memberSkill.scaleId);
    setProficiencyValue(memberSkill.proficiencyValue);
    setIsDialogOpen(true);
  };

  const handleDelete = (skillId: string) => {
    if (window.confirm("Are you sure you want to remove this skill?")) {
      try {
        memberSkillDb.delete(member.id, skillId);
        loadData();
        onSkillsUpdated?.();

        toast({
          title: "Skill Removed",
          description: "Successfully removed skill from member profile.",
        });
      } catch {
        toast({
          title: "Error",
          description: "Failed to remove skill. Please try again.",
          variant: "destructive",
        });
      }
    }
  };

  const resetForm = () => {
    setEditingSkill(null);
    setSelectedSkillId("");
    setSelectedScaleId("");
    setProficiencyValue("");
    setSearchTerm("");
  };

  const getSkillName = (skillId: string) => {
    const skill = allSkills.find((s) => s.id === skillId);
    return skill?.name || "Unknown Skill";
  };

  const getScaleName = (scaleId: string) => {
    const scale = scales.find((s) => s.id === scaleId);
    return scale?.name || "Unknown Scale";
  };

  const getScaleValue = (scaleId: string, value: string) => {
    const scale = scales.find((s) => s.id === scaleId);
    if (!scale || !scale.values) return value;
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

  const filteredSkills = allSkills.filter((skill) =>
    skill.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const availableSkills = filteredSkills.filter(
    (skill) => !memberSkills.some((ms) => ms.skillId === skill.id)
  );

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Skills & Proficiency</CardTitle>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => resetForm()}>
                <Plus className="h-4 w-4 mr-2" />
                Add Skill
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {editingSkill ? "Edit Skill Proficiency" : "Add Skill"}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Skill</label>
                  {!editingSkill && (
                    <div className="relative">
                      <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Search skills..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  )}
                  <Select
                    value={selectedSkillId}
                    onValueChange={setSelectedSkillId}
                    disabled={!!editingSkill}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a skill" />
                    </SelectTrigger>
                    <SelectContent>
                      {(editingSkill
                        ? [
                            allSkills.find(
                              (s) => s.id === editingSkill.skillId
                            )!,
                          ]
                        : availableSkills
                      )
                        .filter(Boolean)
                        .map((skill) => (
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
                    value={selectedScaleId}
                    onValueChange={setSelectedScaleId}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select scale" />
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

                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    Proficiency Level
                  </label>
                  <Select
                    value={proficiencyValue}
                    onValueChange={setProficiencyValue}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select level" />
                    </SelectTrigger>
                    <SelectContent>
                      {selectedScaleId &&
                        scales
                          .find((s) => s.id === selectedScaleId)
                          ?.values.map((value, index) => (
                            <SelectItem
                              key={index + 1}
                              value={(index + 1).toString()}
                            >
                              Level {index + 1} - {value}
                            </SelectItem>
                          ))}
                    </SelectContent>
                  </Select>
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
                    {editingSkill ? "Update" : "Add"} Skill
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {memberSkills.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">
            No skills recorded yet. Click "Add Skill" to get started.
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {memberSkills.map((memberSkill) => (
              <Card
                key={`${memberSkill.skillId}-${memberSkill.scaleId}`}
                className="p-4 relative group"
              >
                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => handleEdit(memberSkill)}
                    >
                      <Pencil className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 text-destructive"
                      onClick={() => handleDelete(memberSkill.skillId)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
                <div className="space-y-2">
                  <h4 className="font-medium pr-12">
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
                  <Badge variant="outline" className="text-xs">
                    {getScaleName(memberSkill.scaleId)}
                  </Badge>
                </div>
              </Card>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
