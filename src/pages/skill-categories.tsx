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
import { skillCategoryStorage } from "@/lib/storage";
import type { SkillCategory } from "@/types";

export function SkillCategories() {
  const [skillCategories, setSkillCategories] = useState<SkillCategory[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<SkillCategory | null>(
    null
  );
  const [formData, setFormData] = useState({
    name: "",
    criterion: "",
  });

  useEffect(() => {
    loadSkillCategories();
  }, []);

  const loadSkillCategories = () => {
    setSkillCategories(skillCategoryStorage.getAll());
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim() || !formData.criterion.trim()) {
      toast.error("Please fill in all fields");
      return;
    }

    if (editingCategory) {
      // Update existing
      skillCategoryStorage.update(editingCategory.id, formData);
      toast.success("Skill category updated successfully");
    } else {
      // Create new
      const newCategory: SkillCategory = {
        id: crypto.randomUUID(),
        ...formData,
      };
      skillCategoryStorage.add(newCategory);
      toast.success("Skill category created successfully");
    }

    loadSkillCategories();
    handleCloseDialog();
  };

  const handleEdit = (category: SkillCategory) => {
    setEditingCategory(category);
    setFormData({
      name: category.name,
      criterion: category.criterion,
    });
    setIsDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to delete this skill category?")) {
      skillCategoryStorage.delete(id);
      toast.success("Skill category deleted successfully");
      loadSkillCategories();
    }
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingCategory(null);
    setFormData({
      name: "",
      criterion: "",
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Skill Categories
          </h1>
          <p className="text-muted-foreground">
            Manage skill categories to group skills by type
          </p>
        </div>
        <Button onClick={() => setIsDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Skill Category
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Skill Categories</CardTitle>
          <CardDescription>
            {skillCategories.length} skill{" "}
            {skillCategories.length !== 1 ? "categories" : "category"} defined
          </CardDescription>
        </CardHeader>
        <CardContent>
          {skillCategories.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              No skill categories defined yet. Click "Add Skill Category" to
              create one.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Criterion</TableHead>
                  <TableHead className="w-[100px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {skillCategories.map((category) => (
                  <TableRow key={category.id}>
                    <TableCell className="font-medium">
                      {category.name}
                    </TableCell>
                    <TableCell className="max-w-md">
                      <p className="line-clamp-2">{category.criterion}</p>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEdit(category)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(category.id)}
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
                {editingCategory ? "Edit Skill Category" : "Add Skill Category"}
              </DialogTitle>
              <DialogDescription>
                Define a skill category to group skills by type
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <label htmlFor="name" className="text-sm font-medium">
                  Category Name
                </label>
                <Input
                  id="name"
                  placeholder="e.g., Languages"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="criterion" className="text-sm font-medium">
                  Criterion
                </label>
                <Textarea
                  id="criterion"
                  placeholder="e.g., Skills grouped by programming or scripting languages"
                  rows={3}
                  value={formData.criterion}
                  onChange={(e) =>
                    setFormData({ ...formData, criterion: e.target.value })
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
                {editingCategory ? "Update" : "Create"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
