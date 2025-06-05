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
import { knowledgeAreaStorage } from "@/lib/storage";
import type { KnowledgeArea } from "@/types";

export function KnowledgeAreas() {
  const [knowledgeAreas, setKnowledgeAreas] = useState<KnowledgeArea[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingArea, setEditingArea] = useState<KnowledgeArea | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
  });

  useEffect(() => {
    loadKnowledgeAreas();
  }, []);

  const loadKnowledgeAreas = () => {
    setKnowledgeAreas(knowledgeAreaStorage.getAll());
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim() || !formData.description.trim()) {
      toast.error("Please fill in all fields");
      return;
    }

    if (editingArea) {
      // Update existing
      knowledgeAreaStorage.update(editingArea.id, formData);
      toast.success("Knowledge area updated successfully");
    } else {
      // Create new
      const newArea: KnowledgeArea = {
        id: crypto.randomUUID(),
        ...formData,
      };
      knowledgeAreaStorage.add(newArea);
      toast.success("Knowledge area created successfully");
    }

    loadKnowledgeAreas();
    handleCloseDialog();
  };

  const handleEdit = (area: KnowledgeArea) => {
    setEditingArea(area);
    setFormData({
      name: area.name,
      description: area.description,
    });
    setIsDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to delete this knowledge area?")) {
      knowledgeAreaStorage.delete(id);
      toast.success("Knowledge area deleted successfully");
      loadKnowledgeAreas();
    }
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingArea(null);
    setFormData({
      name: "",
      description: "",
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Knowledge Areas</h1>
          <p className="text-muted-foreground">
            Manage knowledge areas to categorize skills and expertise
          </p>
        </div>
        <Button onClick={() => setIsDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Knowledge Area
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Knowledge Areas</CardTitle>
          <CardDescription>
            {knowledgeAreas.length} knowledge area
            {knowledgeAreas.length !== 1 ? "s" : ""} defined
          </CardDescription>
        </CardHeader>
        <CardContent>
          {knowledgeAreas.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              No knowledge areas defined yet. Click "Add Knowledge Area" to
              create one.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead className="w-[100px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {knowledgeAreas.map((area) => (
                  <TableRow key={area.id}>
                    <TableCell className="font-medium">{area.name}</TableCell>
                    <TableCell className="max-w-md">
                      <p className="line-clamp-2">{area.description}</p>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEdit(area)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(area.id)}
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
                {editingArea ? "Edit Knowledge Area" : "Add Knowledge Area"}
              </DialogTitle>
              <DialogDescription>
                Define a knowledge area to categorize skills and expertise
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <label htmlFor="name" className="text-sm font-medium">
                  Area Name
                </label>
                <Input
                  id="name"
                  placeholder="e.g., Cloud Computing"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="description" className="text-sm font-medium">
                  Description
                </label>
                <Textarea
                  id="description"
                  placeholder="e.g., Types of problems addressed: cloud infrastructure, deployment, and migration; Key skills needed: AWS, Azure, GCP"
                  rows={4}
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
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
              <Button type="submit">{editingArea ? "Update" : "Create"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
