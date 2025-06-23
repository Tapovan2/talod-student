"use client"
import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Upload, FileSpreadsheet, Download, Loader2, Users, BarChart3, Calendar, CalendarDays } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { standards } from "@/Data"
import Link from "next/link"

export default function EnhancedAdminPanel() {
  // State for students data - now using real data structure
  const [allStudents, setAllStudents] = useState({})
  const [activeTab, setActiveTab] = useState("1")
  const [selectedStudents, setSelectedStudents] = useState([])
  const [editingStudent, setEditingStudent] = useState(null)
  const [isAddStudentOpen, setIsAddStudentOpen] = useState(false)
  const [isExcelUploadOpen, setIsExcelUploadOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [loadingStandards, setLoadingStandards] = useState({})
  const [uploadProgress, setUploadProgress] = useState(0)
  const [uploadResults, setUploadResults] = useState(null)
  const [selectedFile, setSelectedFile] = useState(null)
  const [selectedStandardForUpload, setSelectedStandardForUpload] = useState("")
  const [selectedClassForUpload, setSelectedClassForUpload] = useState("")
  const [selectedSubClassForUpload, setSelectedSubClassForUpload] = useState("")

  const [isAddingStudent, setIsAddingStudent] = useState(false)
  const [deletingId, setDeletingId] = useState(null)
  const [loadingId, setLoadingId] = useState(null)

  const STANDARDS = Object.keys(standards).sort((a, b) => {
    // Custom sort to put KG1, KG2 first, then numeric order
    if (a.startsWith("KG") && !b.startsWith("KG")) return -1
    if (!a.startsWith("KG") && b.startsWith("KG")) return 1
    if (a.startsWith("KG") && b.startsWith("KG")) {
      return a.localeCompare(b)
    }
    return Number.parseInt(a) - Number.parseInt(b)
  })

  // Fetch students for a specific standard and class
  const fetchStudentsForClass = async (standard, className) => {
    const key = `${standard}-${className}`
    setLoadingStandards((prev) => ({ ...prev, [key]: true }))
    console.log("key", key)

    try {
      const response = await fetch(`/api/students?standard=${standard}&class=${className}`)
      const data = await response.json()

      setAllStudents((prev) => ({
        ...prev,
        [standard]: {
          ...prev[standard],
          [className]: data,
        },
      }))
    } catch (error) {
      console.error("Error fetching students:", error)
    } finally {
      setLoadingStandards((prev) => ({ ...prev, [key]: false }))
    }
  }

  // Load students when tab changes
  useEffect(() => {
    const standard = activeTab
    const classes = standards[standard]?.classes || []

    // Fetch students for all classes in the active standard
    classes.forEach((className) => {
      if (!allStudents[standard]?.[className]) {
        fetchStudentsForClass(standard, className)
      }
    })
  }, [activeTab])

  const handleFileSelect = (event) => {
    const file = event.target.files[0]
    if (
      file &&
      (file.type === "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" ||
        file.type === "application/vnd.ms-excel" ||
        file.name.endsWith(".xlsx") ||
        file.name.endsWith(".xls"))
    ) {
      setSelectedFile(file)
    } else {
      alert("Please select a valid Excel file (.xlsx or .xls)")
    }
  }

  const parseExcelData = async (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = async (e) => {
        try {
          // Import XLSX library dynamically
          const XLSX = await import("xlsx")

          // Read the file
          const data = new Uint8Array(e.target.result)
          const workbook = XLSX.read(data, { type: "array" })

          // Get the first worksheet
          const worksheetName = workbook.SheetNames[0]
          const worksheet = workbook.Sheets[worksheetName]

          // Convert to JSON
          const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 })

          // Skip header row and parse data
          const parsedData = []
          for (let i = 1; i < jsonData.length; i++) {
            const row = jsonData[i]
            if (row[0] && row[1]) {
              // Check if both rollNo and name exist
              const studentData = {
                rollNo: row[0].toString().trim(),
                name: row[1].toString().trim(),
              }

              // Add class if provided in column C
              if (row[2]) {
                studentData.class = row[2].toString().trim()
              }

              // Add subClass if provided in column D
              if (row[3]) {
                studentData.subClass = row[3].toString().trim()
              }

              parsedData.push(studentData)
            }
          }

          if (parsedData.length === 0) {
            reject(
              new Error(
                "No valid data found in Excel file. Please ensure the file has Roll No in column A, Name in column B, and optionally Class in column C.",
              ),
            )
            return
          }

          resolve(parsedData)
        } catch (error) {
          reject(new Error(`Failed to parse Excel file: ${error.message}`))
        }
      }
      reader.onerror = () => reject(new Error("Failed to read file"))
      reader.readAsArrayBuffer(file)
    })
  }

  const handleExcelUpload = async () => {
    if (!selectedFile || !selectedStandardForUpload) {
      alert("Please select file and standard")
      return
    }

    setIsLoading(true)
    setUploadProgress(0)

    try {
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => {
          if (prev >= 90) {
            clearInterval(progressInterval)
            return prev
          }
          return prev + 10
        })
      }, 200)

      const parsedData = await parseExcelData(selectedFile)

      // Group students by class if class column exists
      const studentsByClass = {}
      const studentsWithoutClass = []

      parsedData.forEach((student) => {
        if (student.class) {
          if (!studentsByClass[student.class]) {
            studentsByClass[student.class] = []
          }
          studentsByClass[student.class].push({
            rollNo: student.rollNo,
            name: student.name,
            currentStandard: selectedStandardForUpload, // Changed from 'standard' to 'currentStandard'
            class: student.class,
            subClass: student.subClass || selectedSubClassForUpload, // Use Excel subClass or dropdown selection
          })
        } else {
          // If no class specified, use the selected class from dropdown
          studentsWithoutClass.push({
            rollNo: student.rollNo,
            name: student.name,
            currentStandard: selectedStandardForUpload, // Changed from 'standard' to 'currentStandard'
            class: selectedClassForUpload,
            subClass: selectedSubClassForUpload,
          })
        }
      })

      // Prepare students for upload
      let allStudentsToUpload = []

      // Add students with class from Excel
      Object.values(studentsByClass).forEach((classStudents) => {
        allStudentsToUpload = [...allStudentsToUpload, ...classStudents]
      })

      // Add students without class (using selected class)
      if (studentsWithoutClass.length > 0) {
        if (!selectedClassForUpload) {
          alert("Some students don't have class specified in Excel. Please select a default class.")
          setIsLoading(false)
          return
        }
        allStudentsToUpload = [...allStudentsToUpload, ...studentsWithoutClass]
      }

      // Send data to API for bulk upload
      const response = await fetch("/api/students/bulk", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          students: allStudentsToUpload,
        }),
      })

      const result = await response.json()

      clearInterval(progressInterval)
      setUploadProgress(100)

      if (result.success) {
        setUploadResults({
          success: true,
          count: result.count,
          students: result.students,
          summary: `Uploaded ${result.count} students across ${Object.keys(studentsByClass).length + (studentsWithoutClass.length > 0 ? 1 : 0)} classes`,
        })

        // Refresh the students data for all affected classes
        const affectedClasses = [...Object.keys(studentsByClass)]
        if (studentsWithoutClass.length > 0) {
          affectedClasses.push(selectedClassForUpload)
        }

        for (const className of affectedClasses) {
          await fetchStudentsForClass(selectedStandardForUpload, className)
        }
      } else {
        setUploadResults({
          success: false,
          error: result.error,
        })
      }

      setTimeout(() => {
        setIsExcelUploadOpen(false)
        setSelectedFile(null)
        setUploadProgress(0)
        setUploadResults(null)
      }, 3000)
    } catch (error) {
      setUploadResults({
        success: false,
        error: error.message,
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleStudentSelect = (studentId) => {
    setSelectedStudents((prev) =>
      prev.includes(studentId) ? prev.filter((id) => id !== studentId) : [...prev, studentId],
    )
  }

  const handleDeleteStudents = async () => {
    if (selectedStudents.length === 0) return

    const confirmDelete = window.confirm(`Are you sure you want to delete ${selectedStudents.length} student(s)?`)

    if (!confirmDelete) return

    try {
      const response = await fetch("/api/delete-students", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          studentIds: selectedStudents,
        }),
      })

      if (response.ok) {
        alert("Students deleted successfully")
        setSelectedStudents([])

        // Refresh all loaded classes
        Object.keys(allStudents).forEach((standard) => {
          Object.keys(allStudents[standard]).forEach((className) => {
            fetchStudentsForClass(standard, className)
          })
        })
      } else {
        alert("Error deleting students")
      }
    } catch (error) {
      console.error("Error deleting students:", error)
      alert("Error deleting students")
    }
  }

  const handleAddStudent = async (e) => {
    e.preventDefault()
    const formData = new FormData(e.target)

    const data = Object.fromEntries(formData.entries())
    console.log("data", data)

    // Change 'standard' to 'currentStandard'
    const studentData = {
      ...data,
    }
    delete studentData.standard

    setIsAddingStudent(true)

    try {
      const response = await fetch(`/api/students`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(studentData),
      })

      if (response.ok) {
        setIsAddStudentOpen(false)
        // Refresh the students data for the added class
        await fetchStudentsForClass(data.standard, data.class)
      } else {
        alert("Error adding student")
      }
    } catch (error) {
      console.error("Error adding student:", error)
      alert("Error adding student")
    } finally {
      setIsAddingStudent(false)
    }
  }

  const handleEditStudent = async (e) => {
    e.preventDefault()
    const formData = new FormData(e.target)
    const data = Object.fromEntries(formData.entries())
    console.log("data", data)

    // Change 'standard' to 'currentStandard'
    const studentData = {
      ...data,
    }

    setLoadingId(editingStudent.id)

    try {
      const response = await fetch(`/api/students/${editingStudent.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(studentData),
      })

      if (response.ok) {
        setEditingStudent(null)
        // Refresh the students data
        await fetchStudentsForClass(data.standard, data.class)
      } else {
        alert("Error updating student")
      }
    } catch (error) {
      console.error("Error updating student:", error)
      alert("Error updating student")
    } finally {
      setLoadingId(null)
    }
  }

  const handleDeleteStudent = async (studentId, standard, className) => {
    if (!confirm("Are you sure you want to delete this student?")) return

    setDeletingId(studentId)

    try {
      const response = await fetch(`/api/students/${studentId}`, {
        method: "DELETE",
      })

      if (response.ok) {
        // Refresh the students data
        await fetchStudentsForClass(standard, className)
      } else {
        alert("Error deleting student")
      }
    } catch (error) {
      console.error("Error deleting student:", error)
      alert("Error deleting student")
    } finally {
      setDeletingId(null)
    }
  }

  const downloadTemplate = async () => {
    try {
      // Import XLSX library dynamically
      const XLSX = await import("xlsx")

      // Create sample data with class column
      const templateData = [
        ["Roll No", "Name", "Class", "SubClass"], // Header row
        ["1", "Student Name 1", "A", "Maths"],
        ["2", "Student Name 2", "A", "Biology"],
        ["3", "Student Name 3", "B", "Maths"],
        ["4", "Student Name 4", "B", "Biology"],
        ["5", "Student Name 5", "C", "Maths"],
      ]

      // Create workbook and worksheet
      const wb = XLSX.utils.book_new()
      const ws = XLSX.utils.aoa_to_sheet(templateData)

      // Set column widths for better readability
      ws["!cols"] = [
        { wch: 10 }, // Roll No column
        { wch: 25 }, // Name column
        { wch: 10 }, // Class column
        { wch: 15 }, // SubClass column
      ]

      // Add worksheet to workbook
      XLSX.utils.book_append_sheet(wb, ws, "Students")

      // Generate Excel file and download
      XLSX.writeFile(wb, "student_template.xlsx")
    } catch (error) {
      console.error("Error creating template:", error)
      // Fallback to CSV if XLSX fails
      const csvContent =
        "Roll No,Name,Class,SubClass\n1,Student Name 1,A,Maths\n2,Student Name 2,A,Biology\n3,Student Name 3,B,Maths\n4,Student Name 4,B,Biology\n5,Student Name 5,C,Maths\n"
      const blob = new Blob([csvContent], { type: "text/csv" })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = "student_template.csv"
      a.click()
      window.URL.revokeObjectURL(url)
    }
  }

  const getStudentsForClass = (standard, className) => {
    return allStudents[standard]?.[className] || []
  }

  const isClassLoading = (standard, className) => {
    const key = `${standard}-${className}`
    return loadingStandards[key] || false
  }

  return (
    <div className="space-y-6">
      {/* Header with Navigation */}
      <div className="flex flex-col space-y-4">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Admin Panel</h1>
          <Link href="/admin">
            <Button className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              Students
            </Button>
          </Link>
          <Link href="/admin/excel">
            <Button className="flex items-center gap-2">
              <FileSpreadsheet className="w-4 h-4" />
              Excel Management
            </Button>
          </Link>
          <Link href="/admin/performance">
            <Button className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              Performance
            </Button>
          </Link>
          <Link href="/admin/attendance">
            <Button className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Attendance
            </Button>
          </Link>
          <Link href="/admin/attendance/holiday">
            <Button className="flex items-center gap-2">
              <CalendarDays className="w-4 h-4" />
              Holiday Management
            </Button>
          </Link>

          <div className="flex gap-2">
            <Dialog open={isExcelUploadOpen} onOpenChange={setIsExcelUploadOpen}>
              <DialogTrigger asChild>
                <Button className="flex items-center gap-2">
                  <Upload className="w-4 h-4" />
                  Bulk Upload Excel
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <FileSpreadsheet className="w-5 h-5" />
                    Upload Students from Excel
                  </DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label>Select Standard</Label>
                    <Select onValueChange={setSelectedStandardForUpload}>
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
                    <Label>Select Class (Optional)</Label>
                    <Select onValueChange={setSelectedClassForUpload}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select Default Class (Optional)" />
                      </SelectTrigger>
                      <SelectContent>
                        {selectedStandardForUpload &&
                          standards[selectedStandardForUpload]?.classes.map((className) => (
                            <SelectItem key={className} value={className}>
                              Class {className}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                    <p className="text-sm text-gray-500 mt-1">Only needed if your Excel doesn't have a Class column</p>
                  </div>
                  {selectedStandardForUpload &&
                    (selectedStandardForUpload === "11" || selectedStandardForUpload === "12") && (
                      <div>
                        <Label>Select SubClass (Optional)</Label>
                        <Select onValueChange={setSelectedSubClassForUpload}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select Default SubClass (Optional)" />
                          </SelectTrigger>
                          <SelectContent>
                            {["Maths", "Biology"].map((data) => (
                              <SelectItem key={data} value={data}>
                                {data}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <p className="text-sm text-gray-500 mt-1">
                          Only needed if your Excel doesn't have a SubClass column (Column D)
                        </p>
                      </div>
                    )}

                  <div>
                    <Label>Upload Excel File</Label>
                    <Input type="file" accept=".xlsx,.xls" onChange={handleFileSelect} className="mt-1" />
                    <p className="text-sm text-gray-500 mt-1">Supports .xlsx and .xls files</p>
                  </div>

                  <Button variant="outline" onClick={downloadTemplate} className="w-full flex items-center gap-2">
                    <Download className="w-4 h-4" />
                    Download Template
                  </Button>

                  {uploadProgress > 0 && (
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Uploading...</span>
                        <span>{uploadProgress}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${uploadProgress}%` }}
                        ></div>
                      </div>
                    </div>
                  )}

                  {uploadResults && (
                    <Alert className={uploadResults.success ? "border-green-500" : "border-red-500"}>
                      <AlertDescription>
                        {uploadResults.success
                          ? `Successfully uploaded ${uploadResults.count} students!`
                          : `Upload failed: ${uploadResults.error}`}
                      </AlertDescription>
                    </Alert>
                  )}

                  <Button
                    onClick={handleExcelUpload}
                    disabled={!selectedFile || !selectedStandardForUpload || isLoading}
                    className="w-full"
                  >
                    {isLoading ? "Uploading..." : "Upload Students"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>

            {selectedStudents.length > 0 && (
              <Button variant="destructive" onClick={handleDeleteStudents}>
                Delete Selected ({selectedStudents.length})
              </Button>
            )}
          </div>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className="space-y-2">
          <TabsList className="grid grid-cols-6 h-auto p-1 bg-muted rounded-md">
            {STANDARDS.slice(0, 6).map((standard) => (
              <TabsTrigger
                key={standard}
                value={standard}
                className="data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm"
              >
                Std {standard}
              </TabsTrigger>
            ))}
          </TabsList>

          {STANDARDS.slice(6).length > 0 && (
            <TabsList className="grid grid-cols-6 h-auto p-1 bg-muted rounded-md">
              {STANDARDS.slice(6).map((standard) => (
                <TabsTrigger
                  key={standard}
                  value={standard}
                  className="data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm"
                >
                  Std {standard}
                </TabsTrigger>
              ))}
              {/* Fill empty slots if needed */}
              {Array.from({ length: 6 - STANDARDS.slice(6).length }).map((_, index) => (
                <div key={`empty-${index}`} className="invisible"></div>
              ))}
            </TabsList>
          )}
        </div>

        {/* Rest of the TabsContent remains the same */}
        {STANDARDS.map((standard) => (
          <TabsContent key={standard} value={standard} className="mt-6">
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-semibold">Standard {standard}</h2>
                <Dialog open={isAddStudentOpen} onOpenChange={setIsAddStudentOpen}>
                  <DialogTrigger asChild>
                    <Button>Add New Student</Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                      <DialogTitle>Add New Student to Standard {standard}</DialogTitle>
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
                        <Label htmlFor="currentStandard">Standard</Label>
                        <Input id="currentStandard" name="currentStandard" value={standard} readOnly />
                      </div>
                      <div>
                        <Label htmlFor="class">Class</Label>
                        <Select name="class" required>
                          <SelectTrigger>
                            <SelectValue placeholder="Select Class" />
                          </SelectTrigger>
                          <SelectContent>
                            {standards[standard]?.classes.map((className) => (
                              <SelectItem key={className} value={className}>
                                Class {className}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      {standard === "11" && (
                        <div>
                          <Label htmlFor="subClass">SubClass</Label>
                          <Select name="subClass" required>
                            <SelectTrigger>
                              <SelectValue placeholder="Select SubClass" />
                            </SelectTrigger>
                            <SelectContent>
                              {["Maths", "Biology"].map((className) => (
                                <SelectItem key={className} value={className}>
                                  Class {className}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      )}

                      <Button type="submit" disabled={isAddingStudent}>
                        {isAddingStudent ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Adding...
                          </>
                        ) : (
                          "Add Student"
                        )}
                      </Button>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>

              <Tabs defaultValue={standards[standard]?.classes[0]} className="w-full">
                <TabsList>
                  {standards[standard]?.classes.map((className) => (
                    <TabsTrigger key={className} value={className}>
                      Class {className}
                    </TabsTrigger>
                  ))}
                </TabsList>

                {standards[standard]?.classes.map((className) => (
                  <TabsContent key={className} value={className} className="mt-4">
                    <Card>
                      <CardHeader>
                        <CardTitle>
                          Students - Standard {standard}, Class {className}
                          <span className="ml-2 text-sm font-normal text-gray-500">
                            ({getStudentsForClass(standard, className).length} students)
                          </span>
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        {isClassLoading(standard, className) ? (
                          <div className="flex justify-center items-center h-32">
                            <Loader2 className="w-8 h-8 animate-spin" />
                          </div>
                        ) : getStudentsForClass(standard, className).length > 0 ? (
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead className="w-12">
                                  <Checkbox
                                    checked={getStudentsForClass(standard, className).every((s) =>
                                      selectedStudents.includes(s.id),
                                    )}
                                    onCheckedChange={(checked) => {
                                      const classStudentIds = getStudentsForClass(standard, className).map((s) => s.id)
                                      if (checked) {
                                        setSelectedStudents((prev) => [...new Set([...prev, ...classStudentIds])])
                                      } else {
                                        setSelectedStudents((prev) =>
                                          prev.filter((id) => !classStudentIds.includes(id)),
                                        )
                                      }
                                    }}
                                  />
                                </TableHead>
                                <TableHead>Roll No</TableHead>
                                <TableHead>Name</TableHead>
                                <TableHead>Actions</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {getStudentsForClass(standard, className).map((student) => (
                                <TableRow key={student.id}>
                                  <TableCell>
                                    <Checkbox
                                      checked={selectedStudents.includes(student.id)}
                                      onCheckedChange={() => handleStudentSelect(student.id)}
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
                                            onClick={() => setEditingStudent(student)}
                                          >
                                            Edit
                                          </Button>
                                        </DialogTrigger>
                                        <DialogContent className="sm:max-w-[425px]">
                                          <DialogHeader>
                                            <DialogTitle>Edit Student</DialogTitle>
                                          </DialogHeader>
                                          <form onSubmit={handleEditStudent} className="space-y-4">
                                            <div>
                                              <Label htmlFor="name">Name</Label>
                                              <Input
                                                id="name"
                                                name="name"
                                                defaultValue={editingStudent?.name}
                                                required
                                              />
                                            </div>
                                            <div>
                                              <Label htmlFor="rollNo">Roll No</Label>
                                              <Input
                                                id="rollNo"
                                                name="rollNo"
                                                defaultValue={editingStudent?.rollNo}
                                                required
                                              />
                                            </div>
                                            <div>
                                              <Label htmlFor="currentStandard">Standard</Label>
                                              <Input
                                                id="currentStandard"
                                                name="currentStandard"
                                                defaultValue={standard}
                                                readOnly
                                              />
                                            </div>
                                            <div>
                                              <Label htmlFor="class">Class</Label>
                                              <Input id="class" name="class" defaultValue={className} readOnly />
                                            </div>
                                            {standard === "11" && (
                                              <div>
                                                <Label htmlFor="subClass">SubClass</Label>
                                                <Select name="subClass" required>
                                                  <SelectTrigger>
                                                    <SelectValue placeholder="Select SubClass" />
                                                  </SelectTrigger>
                                                  <SelectContent>
                                                    {["Maths", "Biology"].map((className) => (
                                                      <SelectItem key={className} value={className}>
                                                        Class {className}
                                                      </SelectItem>
                                                    ))}
                                                  </SelectContent>
                                                </Select>
                                              </div>
                                            )}
                                            <Button type="submit" disabled={loadingId === editingStudent?.id}>
                                              {loadingId === editingStudent?.id ? (
                                                <>
                                                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                                  Saving...
                                                </>
                                              ) : (
                                                "Save Changes"
                                              )}
                                            </Button>
                                          </form>
                                        </DialogContent>
                                      </Dialog>
                                      <Button
                                        variant="destructive"
                                        size="sm"
                                        onClick={() => handleDeleteStudent(student.id, standard, className)}
                                        disabled={deletingId === student.id}
                                      >
                                        {deletingId === student.id ? (
                                          <>
                                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                            Deleting...
                                          </>
                                        ) : (
                                          "Delete"
                                        )}
                                      </Button>
                                    </div>
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        ) : (
                          <div className="text-center py-8 text-gray-500">
                            No students found in this class.
                            <br />
                            <Button variant="outline" className="mt-2" onClick={() => setIsExcelUploadOpen(true)}>
                              Upload Students
                            </Button>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </TabsContent>
                ))}
              </Tabs>
            </div>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  )
}
