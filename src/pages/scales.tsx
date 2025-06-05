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
import { Plus, Pencil, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { scaleStorage } from "@/lib/storage";
import type { Scale } from "@/types";

export function Scales() {
  const [scales, setScales] = useState<Scale[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingScale, setEditingScale] = useState<Scale | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    type: "",
    values: [] as string[],
  });
  const [newValue, setNewValue] = useState("");

  useEffect(() => {
    loadScales();
  }, []);

  const loadScales = () => {
    setScales(scaleStorage.getAll());
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (
      !formData.name.trim() ||
      !formData.type.trim() ||
      formData.values.length === 0
    ) {
      toast.error("Please fill in all fields and add at least one value");
      return;
    }

    if (editingScale) {
      // Update existing
      scaleStorage.update(editingScale.id, formData);
      toast.success("Scale updated successfully");
    } else {
      // Create new
      const newScale: Scale = {
        id: crypto.randomUUID(),
        ...formData,
      };
      scaleStorage.add(newScale);
      toast.success("Scale created successfully");
    }

    loadScales();
    handleCloseDialog();
  };

  const handleEdit = (scale: Scale) => {
    setEditingScale(scale);
    setFormData({
      name: scale.name,
      type: scale.type,
      values: [...scale.values],
    });
    setIsDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to delete this scale?")) {
      scaleStorage.delete(id);
      toast.success("Scale deleted successfully");
      loadScales();
    }
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingScale(null);
    setFormData({
      name: "",
      type: "",
      values: [],
    });
    setNewValue("");
  };

  const handleAddValue = () => {
    if (newValue.trim()) {
      setFormData({
        ...formData,
        values: [...formData.values, newValue.trim()],
      });
      setNewValue("");
    }
  };

  const handleRemoveValue = (index: number) => {
    setFormData({
      ...formData,
      values: formData.values.filter((_, i) => i !== index),
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Scales</h1>
          <p className="text-muted-foreground">
            Manage rating scales for measuring skills and experience
          </p>
        </div>
        <Button onClick={() => setIsDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Scale
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Scales</CardTitle>
          <CardDescription>
            {scales.length} scale{scales.length !== 1 ? "s" : ""} defined
          </CardDescription>
        </CardHeader>
        <CardContent>
          {scales.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              No scales defined yet. Click "Add Scale" to create one.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Values</TableHead>
                  <TableHead className="w-[100px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {scales.map((scale) => (
                  <TableRow key={scale.id}>
                    <TableCell className="font-medium">{scale.name}</TableCell>
                    <TableCell>{scale.type}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {scale.values.map((value, index) => (
                          <Badge key={index} variant="secondary">
                            {value}
                          </Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEdit(scale)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(scale.id)}
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
                {editingScale ? "Edit Scale" : "Add Scale"}
              </DialogTitle>
              <DialogDescription>
                Define a rating scale for measuring skills and experience
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <label htmlFor="name" className="text-sm font-medium">
                  Scale Name
                </label>
                <Input
                  id="name"
                  placeholder="e.g., Proficiency Level"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="type" className="text-sm font-medium">
                  Type
                </label>
                <Select
                  value={formData.type}
                  onValueChange={(value) =>
                    setFormData({ ...formData, type: value })
                  }
                >
                  <SelectTrigger id="type">
                    <SelectValue placeholder="Select scale type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Numeric">Numeric</SelectItem>
                    <SelectItem value="Qualitative">Qualitative</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Values</label>
                <div className="flex gap-2">
                  <Input
                    placeholder="Add a value"
                    value={newValue}
                    onChange={(e) => setNewValue(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleAddValue();
                      }
                    }}
                  />
                  <Button type="button" onClick={handleAddValue}>
                    Add
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2 mt-2">
                  {formData.values.map((value, index) => (
                    <Badge key={index} variant="secondary" className="pr-1">
                      {value}
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-4 w-4 ml-1"
                        onClick={() => handleRemoveValue(index)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </Badge>
                  ))}
                </div>
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
                {editingScale ? "Update" : "Create"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
