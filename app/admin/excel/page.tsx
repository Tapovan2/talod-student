"use client"

import { useState, useEffect } from "react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import * as XLSX from "xlsx"
import { standards } from "@/Data"
import {
  Trash2,
  FileSpreadsheet,
  Download,
  Search,
  Calendar,
  BookOpen,
  Users,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Filter,
} from "lucide-react"

export default function MarkEntriesPage() {
  const [currentStandard, setCurrentStandard] = useState<string>("")
  const [currentClass, setCurrentClass] = useState<string>("")
  const [selectedStandard, setSelectedStandard] = useState<string>("")
  const [selectedClass, setSelectedClass] = useState<string>("")
  const [markEntries, setMarkEntries] = useState<any[]>([])
  const [selectedEntries, setSelectedEntries] = useState<string[]>([])
  const [classes, setClasses] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [fLoading, setfLoading] = useState<boolean>(false)
  const [dLoading, setIsdLoading] = useState<boolean>(false)

  useEffect(() => {
    if (currentStandard) {
      setClasses([...standards[currentStandard as keyof typeof standards].classes])
    }
  }, [currentStandard])

  useEffect(() => {
    if (selectedStandard && selectedClass) {
      fetchMarkEntries(selectedStandard, selectedClass)
    }
  }, [selectedStandard, selectedClass])

  const handleFetchStudents = () => {
    if (currentStandard && currentClass) {
      setSelectedStandard(currentStandard)
      setSelectedClass(currentClass)
      fetchMarkEntries(currentStandard, currentClass)
    } else {
      if (!currentStandard) {
        alert("Please select a standard first.")
        return
      }
      if (!currentClass) {
        alert("Please select a class first.")
        return
      }
    }
  }

  const fetchMarkEntries = async (standard: string, className: string) => {
    setfLoading(true)
    const response = await fetch(`/api/mark-entries?standard=${standard}&className=${className}`)
    const data = await response.json()
    setMarkEntries(data)
    setfLoading(false)
  }

  const handleEntrySelection = (entryId: string) => {
    setSelectedEntries((prev) => (prev.includes(entryId) ? prev.filter((id) => id !== entryId) : [...prev, entryId]))
  }

  const handleSelectAll = () => {
    if (selectedEntries.length === markEntries.length) {
      setSelectedEntries([])
    } else {
      setSelectedEntries(markEntries.map((entry) => entry.id))
    }
  }

  const generateExcel = async () => {
    if (selectedEntries.length === 0) {
      alert("Please select at least one mark entry")
      return
    }

    setIsLoading(true)

    try {
      const standardToSend = selectedStandard || currentStandard
      const classToSend = selectedClass || currentClass

      const response = await fetch("/api/generate-excel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          markEntryIds: selectedEntries,
          standard: standardToSend,
          class: classToSend,
        }),
      })
      if (!response.ok) throw new Error("Failed to generate Excel file")

      const data = await response.json()
      const wb = XLSX.utils.book_new()
      const ws = XLSX.utils.json_to_sheet(data)

      const centerAlignStyle = {
        alignment: { horizontal: "center", vertical: "center" },
        font: { name: "Arial", sz: 12 },
      }
      const headerStyle = {
        font: { bold: true, color: { rgb: "FFFFFF" }, name: "Arial", sz: 12 },
        fill: { fgColor: { rgb: "4472C4" } },
        alignment: { horizontal: "center", vertical: "center", wrapText: true },
      }

      const range = XLSX.utils.decode_range(ws["!ref"] || "A1")
      for (let R = range.s.r; R <= range.e.r; ++R) {
        for (let C = range.s.c; C <= range.e.c; ++C) {
          const cellRef = XLSX.utils.encode_cell({ r: R, c: C })
          if (!ws[cellRef]) ws[cellRef] = { v: "", t: "s" }
          ws[cellRef].s = R === 0 ? headerStyle : centerAlignStyle
        }
      }

      const colWidths = [{ wch: 8 }, { wch: 12 }, { wch: 30 }]

      for (let i = 3; i < Object.keys(data[0]).length; i++) {
        colWidths.push({ wch: 25 })
      }
      ws["!cols"] = colWidths

      XLSX.utils.book_append_sheet(wb, ws, "Marks")
      XLSX.writeFile(wb, `marks_${standardToSend}_${classToSend}.xlsx`)
    } catch (error) {
      console.error("Error generating Excel:", error)
      alert("Failed to generate Excel file. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async () => {
    if (selectedEntries.length === 0) {
      alert("Please select at least one mark entry to delete")
      return
    }

    if (confirm("Are you sure you want to delete the selected entries?")) {
      try {
        setIsdLoading(true)
        const response = await fetch("/api/mark-entries", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ markEntryIds: selectedEntries }),
        })

        if (response.ok) {
          setIsdLoading(false)
          alert("Selected entries have been deleted successfully")
        } else {
          setIsdLoading(false)
          alert("Failed to delete mark entries. Please try again.")
        }

        await fetchMarkEntries(selectedStandard || currentStandard, selectedClass || currentClass)
        setSelectedEntries([])
      } catch (error) {
        setIsdLoading(false)
        console.error("Error deleting mark entries:", error)
        alert("Failed to delete mark entries. Please try again.")
      }
    }
  }

  const getSubjectColor = (subject: string) => {
    const colors = {
      Math: "bg-blue-100 text-blue-700 border-blue-200",
      English: "bg-green-100 text-green-700 border-green-200",
      Science: "bg-purple-100 text-purple-700 border-purple-200",
      Hindi: "bg-orange-100 text-orange-700 border-orange-200",
      Social: "bg-indigo-100 text-indigo-700 border-indigo-200",
      Environment: "bg-emerald-100 text-emerald-700 border-emerald-200",
      Gujarati: "bg-pink-100 text-pink-700 border-pink-200",
      default: "bg-gray-100 text-gray-700 border-gray-200",
    }
    return colors[subject as keyof typeof colors] || colors.default
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Excel Management</h1>
      </div>

      {/* Filter Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="w-5 h-5" />
            Generate Report
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            <Select onValueChange={setCurrentStandard}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Select Standard" />
              </SelectTrigger>
              <SelectContent>
                {Object.keys(standards).map((standard) => (
                  <SelectItem key={standard} value={standard}>
                    Standard {standard}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select onValueChange={setCurrentClass} disabled={!currentStandard}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Select Class" />
              </SelectTrigger>
              <SelectContent>
                {classes.map((className) => (
                  <SelectItem key={className} value={className}>
                    Class {className}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button onClick={handleFetchStudents} disabled={fLoading}>
              {fLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Search className="w-4 h-4 mr-2" />
                  Generate Report
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Report Results */}
      {markEntries && markEntries.length > 0 && (
        <div className="space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Entries</p>
                    <p className="text-2xl font-bold">{markEntries.length}</p>
                  </div>
                  <BookOpen className="w-8 h-8 text-blue-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Selected</p>
                    <p className="text-2xl font-bold">{selectedEntries.length}</p>
                  </div>
                  <CheckCircle2 className="w-8 h-8 text-green-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Class</p>
                    <p className="text-lg font-semibold">
                      Standard {selectedStandard || currentStandard} - {selectedClass || currentClass}
                    </p>
                  </div>
                  <Users className="w-8 h-8 text-blue-600" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Mark Entries Table */}
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle className="flex items-center gap-2">
                  <FileSpreadsheet className="w-5 h-5" />
                  Mark Entries Overview
                </CardTitle>
                <Button variant="outline" size="sm" onClick={handleSelectAll} className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4" />
                  {selectedEntries.length === markEntries.length ? "Deselect All" : "Select All"}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[50px]">
                      <Checkbox
                        checked={selectedEntries.length === markEntries.length && markEntries.length > 0}
                        onCheckedChange={handleSelectAll}
                      />
                    </TableHead>
                    <TableHead>Student Name</TableHead>
                    <TableHead>Subject</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {markEntries.map((entry, index) => (
                    <TableRow key={entry.id}>
                      <TableCell>
                        <Checkbox
                          checked={selectedEntries.includes(entry.id)}
                          onCheckedChange={() => handleEntrySelection(entry.id)}
                        />
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white text-sm font-medium">
                            {index + 1}
                          </div>
                          <div>
                            <div className="font-medium">{entry.name}</div>
                            <div className="text-sm text-gray-500">ID: {entry.id}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={`${getSubjectColor(entry.subject)} border font-medium`}>
                          {entry.subject}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-gray-500" />
                          <span>
                            {new Date(entry.date).toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            })}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-green-600 border-green-200">
                          <CheckCircle2 className="w-3 h-3 mr-1" />
                          Active
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              <div className="flex flex-col sm:flex-row gap-3 mt-6 pt-4 border-t">
                <Button
                  onClick={generateExcel}
                  disabled={isLoading || selectedEntries.length === 0}
                  className="flex items-center gap-2 bg-green-600 hover:bg-green-700"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Download className="w-4 h-4" />
                      Generate Excel ({selectedEntries.length})
                    </>
                  )}
                </Button>

                {selectedEntries.length > 0 && (
                  <Button
                    variant="destructive"
                    onClick={handleDelete}
                    disabled={dLoading}
                    className="flex items-center gap-2"
                  >
                    {dLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Deleting...
                      </>
                    ) : (
                      <>
                        <Trash2 className="w-4 h-4" />
                        Delete Selected ({selectedEntries.length})
                      </>
                    )}
                  </Button>
                )}

                {selectedEntries.length > 0 && (
                  <div className="flex items-center gap-2 text-sm text-gray-600 ml-auto">
                    <AlertCircle className="w-4 h-4" />
                    {selectedEntries.length} of {markEntries.length} entries selected
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Empty State */}
      {markEntries.length === 0 && !fLoading && currentStandard && currentClass && (
        <Card>
          <CardContent className="p-12 text-center">
            <FileSpreadsheet className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-700 mb-2">No Mark Entries Found</h3>
            <p className="text-gray-500 mb-4">
              No mark entries found for Standard {currentStandard}, Class {currentClass}
            </p>
            <Button variant="outline" onClick={handleFetchStudents}>
              <Search className="w-4 h-4 mr-2" />
              Try Again
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
