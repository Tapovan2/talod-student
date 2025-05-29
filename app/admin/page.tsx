"use client";

import type React from "react";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { standards } from "@/Data/index";
import { Checkbox } from "@/components/ui/checkbox";
import { ArrowRight, Users, GraduationCap } from "lucide-react";
import Link from "next/link";

export default function AdminPage() {
  const [students, setStudents] = useState<any[]>([]);
  const [editingStudent, setEditingStudent] = useState<any>(null);
  const [selectedStudents, setSelectedStudents] = useState<number[]>([]);

  const [selectedStandard, setSelectedStandard] = useState<string>("");
  const [selectedClass, setSelectedClass] = useState<string>("");
  const [isAddStudentOpen, setIsAddStudentOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingId, setLoadingId] = useState<number | null>(null);
  const [isAddingStudent, setIsAddingStudent] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [isMigrating, setIsMigrating] = useState(false);

  // Migration state
  const [isMigrationDialogOpen, setIsMigrationDialogOpen] = useState(false);
  const [sourceStandard, setSourceStandard] = useState<string>("");
  const [sourceClass, setSourceClass] = useState<string>("");
  const [destinationStandard, setDestinationStandard] = useState<string>("");
  const [destinationClass, setDestinationClass] = useState<string>("");
  const [sourceStudents, setSourceStudents] = useState<any[]>([]);
  const [selectedMigrationStudents, setSelectedMigrationStudents] = useState<
    number[]
  >([]);
  const [isLoadingSourceStudents, setIsLoadingSourceStudents] = useState(false);

  const STANDARDS = Object.keys(standards);
  const CLASSES = selectedStandard
    ? standards[selectedStandard as keyof typeof standards]?.classes || []
    : [];

  const SOURCE_CLASSES = sourceStandard
    ? standards[sourceStandard as keyof typeof standards]?.classes || []
    : [];

  const DESTINATION_CLASSES = destinationStandard
    ? standards[destinationStandard as keyof typeof standards]?.classes || []
    : [];

  const fetchStudents = async () => {
    if (selectedStandard && selectedClass) {
      setIsLoading(true);
      try {
        const response = await fetch(
          `/api/students?standard=${selectedStandard}&class=${selectedClass}`
        );
        const data = await response.json();
        setStudents(data);
      } catch (error) {
        console.error(error);
      } finally {
        setIsLoading(false);
      }
    }
  };

  const fetchSourceStudents = async () => {
    if (sourceStandard && sourceClass) {
      setIsLoadingSourceStudents(true);
      try {
        const response = await fetch(
          `/api/students?standard=${sourceStandard}&class=${sourceClass}`
        );
        const data = await response.json();
        setSourceStudents(data);
      } catch (error) {
        console.error(error);
      } finally {
        setIsLoadingSourceStudents(false);
      }
    }
  };

  const handleStandardChange = (value: string) => {
    setSelectedStandard(value);
    setSelectedClass("");
    setStudents([]);
  };

  const handleClassChange = (value: string) => {
    setSelectedClass(value);
  };

  const handleSourceStandardChange = (value: string) => {
    setSourceStandard(value);
    setSourceClass("");
    setSourceStudents([]);
    setSelectedMigrationStudents([]);
  };

  const handleSourceClassChange = (value: string) => {
    setSourceClass(value);
    setSelectedMigrationStudents([]);
  };

  const handleDestinationStandardChange = (value: string) => {
    setDestinationStandard(value);
    setDestinationClass("");
  };

  const handleDestinationClassChange = (value: string) => {
    setDestinationClass(value);
  };

  const handleEdit = (student: any) => {
    setEditingStudent(student);
  };

  const handleDelete = async (id: number) => {
    if (confirm("Are you sure you want to delete this student?")) {
      setDeletingId(id);
      await fetch(`/api/students/${id}`, { method: "DELETE" });
      fetchStudents();
      setDeletingId(null);
    }
  };

  const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const formData = new FormData(form);
    const data = Object.fromEntries(formData.entries());

    setLoadingId(editingStudent.id);
    await fetch(`/api/students/${editingStudent.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    setEditingStudent(null);
    fetchStudents();
    setLoadingId(null);
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    fetchStudents();
  };

  const handleAddStudent = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const formData = new FormData(form);
    const data = Object.fromEntries(formData.entries());

    setIsAddingStudent(true);
    await fetch(`/api/students`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    setIsAddingStudent(false);
    setIsAddStudentOpen(false);
    fetchStudents();
  };

  const handleStudentSelect = (studentId: number) => {
    setSelectedStudents((prev) =>
      prev.includes(studentId)
        ? prev.filter((id) => id !== studentId)
        : [...prev, studentId]
    );
  };

  const handleMigrationStudentSelect = (studentId: number) => {
    setSelectedMigrationStudents((prev) =>
      prev.includes(studentId)
        ? prev.filter((id) => id !== studentId)
        : [...prev, studentId]
    );
  };

  const handleSelectAllMigrationStudents = () => {
    if (selectedMigrationStudents.length === sourceStudents.length) {
      setSelectedMigrationStudents([]);
    } else {
      setSelectedMigrationStudents(sourceStudents.map((student) => student.id));
    }
  };

  const handleDeleteStudents = async () => {
    if (selectedStandard !== "12") {
      alert("Deletion is only allowed for students in standard 12");
      return;
    }

    const confirmDelete = window.confirm(
      `Are you sure you want to delete ${selectedStudents.length} student(s)?`
    );
    if (!confirmDelete) return;

    const response = await fetch("/api/delete-students", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        studentIds: selectedStudents,
      }),
    });

    if (response.ok) {
      alert("Students deleted successfully");
      setSelectedStudents([]);
      fetchStudents();
    } else {
      alert("Error deleting students");
    }
  };

  const handleMigrateStudents = async () => {
    const currentStd = Number.parseInt(selectedStandard);

    // Check if migration is allowed
    if (currentStd >= 12) {
      alert("Cannot migrate students from standard 12. Use delete instead.");
      return;
    }

    const nextStandard = currentStd + 1;
    const confirmMigrate = window.confirm(
      `Are you sure you want to migrate all students from Standard ${currentStd} to Standard ${nextStandard}?`
    );

    if (!confirmMigrate) return;

    setIsMigrating(true);
    try {
      const result = await fetch("/api/migrate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          currentStandard: selectedStandard,
          nextStandard: nextStandard.toString(),
        }),
      }).then((res) => res.json());

      if (result.success) {
        alert(
          `Successfully migrated ${result.migratedCount} students to Standard ${nextStandard}`
        );
        fetchStudents(); // Refresh the current view
      } else {
        alert(`Migration failed: ${result.error}`);
      }
    } catch (error) {
      alert("Migration failed: " + error);
    } finally {
      setIsMigrating(false);
    }
  };

  const handleSelectiveMigration = async () => {
    if (selectedMigrationStudents.length === 0) {
      alert("Please select at least one student to migrate");
      return;
    }

    if (!destinationStandard || !destinationClass) {
      alert("Please select destination standard and class");
      return;
    }

    const confirmMigrate = window.confirm(
      `Are you sure you want to migrate ${selectedMigrationStudents.length} student(s) from Standard ${sourceStandard} Class ${sourceClass} to Standard ${destinationStandard} Class ${destinationClass}?`
    );

    if (!confirmMigrate) return;

    setIsMigrating(true);
    try {
      const result = await fetch("/api/migrate-selective", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          studentIds: selectedMigrationStudents,
          sourceStandard,
          sourceClass,
          destinationStandard,
          destinationClass,
        }),
      }).then((res) => res.json());

      if (result.success) {
        alert(
          `Successfully migrated ${result.migratedCount} students to Standard ${destinationStandard} Class ${destinationClass}`
        );
        setIsMigrationDialogOpen(false);
        setSelectedMigrationStudents([]);
        setSourceStudents([]);
        fetchStudents(); // Refresh the current view if needed
      } else {
        alert(`Migration failed: ${result.error}`);
      }
    } catch (error) {
      alert("Migration failed: " + error);
    } finally {
      setIsMigrating(false);
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Admin Panel</h1>
      <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-4">
        <Select onValueChange={handleStandardChange}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Select Standard" />
          </SelectTrigger>
          <SelectContent>
            {STANDARDS.map((standard) => (
              <SelectItem key={standard} value={standard}>
                Standard {standard}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select onValueChange={handleClassChange} disabled={!selectedStandard}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Select Class" />
          </SelectTrigger>
          <SelectContent>
            {CLASSES.map((className) => (
              <SelectItem key={className} value={className}>
                Class {className}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button type="submit" disabled={isLoading}>
          {isLoading ? (
            <>
              <svg
                className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
              Loading...
            </>
          ) : (
            "Fetch Students"
          )}
        </Button>
        <Button variant="outline" onClick={() => setIsAddStudentOpen(true)}>
          Add New Student
        </Button>

        {/* Selective Migration Button */}
        <Dialog
          open={isMigrationDialogOpen}
          onOpenChange={setIsMigrationDialogOpen}
        >
          <DialogTrigger asChild>
            <Button variant="secondary" className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              Selective Migration
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <GraduationCap className="w-5 h-5" />
                Student Migration Tool
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-6">
              {/* Source Selection */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Source (From)</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Source Standard</Label>
                      <Select onValueChange={handleSourceStandardChange}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select Standard" />
                        </SelectTrigger>
                        <SelectContent>
                          {STANDARDS.map((standard) => (
                            <SelectItem key={standard} value={standard}>
                              Standard {standard}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Source Class</Label>
                      <Select
                        onValueChange={handleSourceClassChange}
                        disabled={!sourceStandard}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select Class" />
                        </SelectTrigger>
                        <SelectContent>
                          {SOURCE_CLASSES.map((className) => (
                            <SelectItem key={className} value={className}>
                              Class {className}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {sourceStandard && sourceClass && (
                    <Button
                      onClick={fetchSourceStudents}
                      disabled={isLoadingSourceStudents}
                    >
                      {isLoadingSourceStudents ? "Loading..." : "Load Students"}
                    </Button>
                  )}
                </CardContent>
              </Card>

              {/* Arrow */}
              {sourceStudents.length > 0 && (
                <div className="flex justify-center">
                  <ArrowRight className="w-8 h-8 text-blue-500" />
                </div>
              )}

              {/* Destination Selection */}
              {sourceStudents.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Destination (To)</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Destination Standard</Label>
                        <Select onValueChange={handleDestinationStandardChange}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select Standard" />
                          </SelectTrigger>
                          <SelectContent>
                            {STANDARDS.map((standard) => (
                              <SelectItem key={standard} value={standard}>
                                Standard {standard}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>Destination Class</Label>
                        <Select
                          onValueChange={handleDestinationClassChange}
                          disabled={!destinationStandard}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select Class" />
                          </SelectTrigger>
                          <SelectContent>
                            {DESTINATION_CLASSES.map((className) => (
                              <SelectItem key={className} value={className}>
                                Class {className}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Student Selection */}
              {sourceStudents.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center justify-between">
                      Select Students to Migrate
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleSelectAllMigrationStudents}
                      >
                        {selectedMigrationStudents.length ===
                        sourceStudents.length
                          ? "Deselect All"
                          : "Select All"}
                      </Button>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="max-h-60 overflow-y-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="w-12">Select</TableHead>
                            <TableHead>Roll No</TableHead>
                            <TableHead>Name</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {sourceStudents.map((student) => (
                            <TableRow key={student.id}>
                              <TableCell>
                                <Checkbox
                                  checked={selectedMigrationStudents.includes(
                                    student.id
                                  )}
                                  onCheckedChange={() =>
                                    handleMigrationStudentSelect(student.id)
                                  }
                                />
                              </TableCell>
                              <TableCell>{student.rollNo}</TableCell>
                              <TableCell>{student.name}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>

                    {selectedMigrationStudents.length > 0 &&
                      destinationStandard &&
                      destinationClass && (
                        <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                          <p className="text-sm text-blue-800">
                            Ready to migrate{" "}
                            <strong>{selectedMigrationStudents.length}</strong>{" "}
                            student(s) from
                            <strong>
                              {" "}
                              Standard {sourceStandard} Class {sourceClass}
                            </strong>{" "}
                            to
                            <strong>
                              {" "}
                              Standard {destinationStandard} Class{" "}
                              {destinationClass}
                            </strong>
                          </p>
                          <Button
                            onClick={handleSelectiveMigration}
                            disabled={isMigrating}
                            className="mt-2"
                          >
                            {isMigrating
                              ? "Migrating..."
                              : "Migrate Selected Students"}
                          </Button>
                        </div>
                      )}
                  </CardContent>
                </Card>
              )}
            </div>
          </DialogContent>
        </Dialog>

        {/* Original Migration Button - Only show when students are loaded and not standard 12 */}
        {students.length > 0 &&
          selectedStandard &&
          Number.parseInt(selectedStandard) < 12 && (
            <Button
              variant="secondary"
              onClick={handleMigrateStudents}
              disabled={isMigrating}
            >
              {isMigrating ? (
                <>
                  <svg
                    className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Migrating...
                </>
              ) : (
                `Migrate All to Std ${Number.parseInt(selectedStandard) + 1}`
              )}
            </Button>
          )}

        <Link href="/admin/excel">
          <Button variant="default">Excel</Button>
        </Link>
        <Link href="/admin/performance">
          <Button variant="default">Performance</Button>
        </Link>
        <Link href="/admin/attendance">
          <Button variant="default">Attendance</Button>
        </Link>
        <Link href="/admin/attendance/holiday">
          <Button variant="default">Holiday</Button>
        </Link>
      </form>

      <Dialog open={isAddStudentOpen} onOpenChange={setIsAddStudentOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Add New Student</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAddStudent} className="space-y-4">
            <div>
              <Label htmlFor="name">Name</Label>
              <Input id="name" name="name" required />
            </div>
            <div>
              <Label htmlFor="rollNo">Roll No</Label>
              <Input id="rollNo" name="rollNo" required />
            </div>
            <div>
              <Label htmlFor="standard">Standard</Label>
              <Input
                id="standard"
                name="standard"
                value={selectedStandard}
                readOnly
              />
            </div>
            <div>
              <Label htmlFor="class">Class</Label>
              <Input id="class" name="class" value={selectedClass} readOnly />
            </div>
            <Button type="submit" disabled={isAddingStudent}>
              {isAddingStudent ? (
                <>
                  <svg
                    className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Adding...
                </>
              ) : (
                "Add Student"
              )}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {selectedStudents.length >= 2 && (
        <Button onClick={handleDeleteStudents}>Selected Delete</Button>
      )}

      {students.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>
              Students - Standard {selectedStandard}, Class {selectedClass}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center items-center h-32">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Checkbox</TableHead>
                    <TableHead>Roll No</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {students.map((student) => (
                    <TableRow key={student.id}>
                      <TableCell>
                        <Checkbox
                          checked={selectedStudents.includes(student.id)}
                          onCheckedChange={() =>
                            handleStudentSelect(student.id)
                          }
                        />
                      </TableCell>
                      <TableCell>{student.rollNo}</TableCell>
                      <TableCell>{student.name}</TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleEdit(student)}
                              >
                                Edit
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-[425px]">
                              <DialogHeader>
                                <DialogTitle>Edit Student</DialogTitle>
                              </DialogHeader>
                              <form onSubmit={handleSave} className="space-y-4">
                                <div>
                                  <Label htmlFor="name">Name</Label>
                                  <Input
                                    id="name"
                                    name="name"
                                    defaultValue={editingStudent?.name}
                                  />
                                </div>
                                <div>
                                  <Label htmlFor="rollNo">Roll No</Label>
                                  <Input
                                    id="rollNo"
                                    name="rollNo"
                                    defaultValue={editingStudent?.rollNo}
                                  />
                                </div>
                                <div>
                                  <Label htmlFor="standard">Standard</Label>
                                  <Input
                                    id="standard"
                                    name="standard"
                                    defaultValue={selectedStandard}
                                    readOnly
                                  />
                                </div>
                                <div>
                                  <Label htmlFor="class">Class</Label>
                                  <Input
                                    id="class"
                                    name="class"
                                    defaultValue={selectedClass}
                                    readOnly
                                  />
                                </div>
                                <Button
                                  type="submit"
                                  disabled={loadingId === editingStudent?.id}
                                >
                                  {loadingId === editingStudent?.id
                                    ? "Saving..."
                                    : "Save Changes"}
                                </Button>
                              </form>
                            </DialogContent>
                          </Dialog>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleDelete(student.id)}
                            disabled={deletingId === student.id}
                          >
                            {deletingId === student.id
                              ? "Deleting..."
                              : "Delete"}
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
      )}
    </div>
  );
}
