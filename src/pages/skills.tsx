import { useState, useEffect } from "react";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import {
  skillDb,
  knowledgeAreaDb,
  skillCategoryDb,
  initDatabase,
} from "@/lib/database";
import type { Skill, KnowledgeArea, SkillCategory } from "@/types";

export function Skills() {
  const [skills, setSkills] = useState<Skill[]>([]);
  const [knowledgeAreas, setKnowledgeAreas] = useState<KnowledgeArea[]>([]);
  const [skillCategories, setSkillCategories] = useState<SkillCategory[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingSkill, setEditingSkill] = useState<Skill | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    purpose: "",
    knowledgeAreaId: "",
    skillCategoryId: "",
  });

  useEffect(() => {
    initDatabase();
    loadData();
  }, []);

  const loadData = () => {
    setSkills(skillDb.getAll());
    setKnowledgeAreas(knowledgeAreaDb.getAll());
    setSkillCategories(skillCategoryDb.getAll());
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (
      !formData.name.trim() ||
      !formData.purpose.trim() ||
      !formData.knowledgeAreaId ||
      !formData.skillCategoryId
    ) {
      toast.error("Please fill in all fields");
      return;
    }

    if (editingSkill) {
      // Update existing
      skillDb.update(editingSkill.id, formData);
      toast.success("Skill updated successfully");
    } else {
      // Create new
      const newSkill: Skill = {
        id: crypto.randomUUID(),
        ...formData,
      };
      skillDb.add(newSkill);
      toast.success("Skill created successfully");
    }

    loadData();
    handleCloseDialog();
  };

  const handleEdit = (skill: Skill) => {
    setEditingSkill(skill);
    setFormData({
      name: skill.name,
      purpose: skill.purpose,
      knowledgeAreaId: skill.knowledgeAreaId,
      skillCategoryId: skill.skillCategoryId,
    });
    setIsDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to delete this skill?")) {
      skillDb.delete(id);
      toast.success("Skill deleted successfully");
      loadData();
    }
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingSkill(null);
    setFormData({
      name: "",
      purpose: "",
      knowledgeAreaId: "",
      skillCategoryId: "",
    });
  };

  const getKnowledgeAreaName = (id: string) => {
    const area = knowledgeAreas.find((a) => a.id === id);
    return area?.name || "Unknown";
  };

  const getCategoryName = (id: string) => {
    const category = skillCategories.find((c) => c.id === id);
    return category?.name || "Unknown";
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Skills</h1>
          <p className="text-muted-foreground">
            Manage skills and their relationships to knowledge areas and
            categories
          </p>
        </div>
        <Button onClick={() => setIsDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Skill
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Skills</CardTitle>
          <CardDescription>
            {skills.length} skill{skills.length !== 1 ? "s" : ""} defined
          </CardDescription>
        </CardHeader>
        <CardContent>
          {skills.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              No skills defined yet. Click "Add Skill" to create one.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Purpose</TableHead>
                  <TableHead>Knowledge Area</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead className="w-[100px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {skills.map((skill) => (
                  <TableRow key={skill.id}>
                    <TableCell className="font-medium">{skill.name}</TableCell>
                    <TableCell className="max-w-xs">
                      <p className="line-clamp-2">{skill.purpose}</p>
                    </TableCell>
                    <TableCell>
                      {getKnowledgeAreaName(skill.knowledgeAreaId)}
                    </TableCell>
                    <TableCell>
                      {getCategoryName(skill.skillCategoryId)}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEdit(skill)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(skill.id)}
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
        <DialogContent>
          <form onSubmit={handleSubmit}>
            <DialogHeader>
              <DialogTitle>
                {editingSkill ? "Edit Skill" : "Add Skill"}
              </DialogTitle>
              <DialogDescription>
                Define a skill and its relationships
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <label htmlFor="name" className="text-sm font-medium">
                  Skill Name
                </label>
                <Input
                  id="name"
                  placeholder="e.g., Python"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="purpose" className="text-sm font-medium">
                  Purpose
                </label>
                <Textarea
                  id="purpose"
                  placeholder="e.g., Used for data analysis, web development, and automation"
                  rows={3}
                  value={formData.purpose}
                  onChange={(e) =>
                    setFormData({ ...formData, purpose: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="knowledgeArea" className="text-sm font-medium">
                  Knowledge Area
                </label>
                <Select
                  value={formData.knowledgeAreaId}
                  onValueChange={(value) =>
                    setFormData({ ...formData, knowledgeAreaId: value })
                  }
                >
                  <SelectTrigger id="knowledgeArea">
                    <SelectValue placeholder="Select a knowledge area" />
                  </SelectTrigger>
                  <SelectContent>
                    {knowledgeAreas.map((area) => (
                      <SelectItem key={area.id} value={area.id}>
                        {area.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label htmlFor="skillCategory" className="text-sm font-medium">
                  Skill Category
                </label>
                <Select
                  value={formData.skillCategoryId}
                  onValueChange={(value) =>
                    setFormData({ ...formData, skillCategoryId: value })
                  }
                >
                  <SelectTrigger id="skillCategory">
                    <SelectValue placeholder="Select a skill category" />
                  </SelectTrigger>
                  <SelectContent>
                    {skillCategories.map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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
                {editingSkill ? "Update" : "Create"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
