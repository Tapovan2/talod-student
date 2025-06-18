"use client"

import { useState } from "react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { standards } from "@/Data"
import { PDFLoadingButton } from "@/components/PDFLoadingButton"
import { StudentReportPDF } from "@/components/StudentReportPdf"
import { CombinedStudentReportPDF } from "@/components/CombinedStudentReportPDF"
import { BarChart3, Calendar, FileText, GraduationCap, Loader2, TrendingUp, Users, Award } from "lucide-react"

export default function PerformanceReportPage() {
  const [selectedStandard, setSelectedStandard] = useState<string>("")
  const [selectedClass, setSelectedClass] = useState<string>("")
  const [reportData, setReportData] = useState<any>()
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth().toString())
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString())

  const handleStandardChange = (value: string) => {
    setSelectedStandard(value)
    setSelectedClass("")
  }

  const STANDARDS = Object.keys(standards)
  const CLASSES = selectedStandard ? standards[selectedStandard as keyof typeof standards]?.classes || [] : []

  const months = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ]
  const years = Array.from({ length: 5 }, (_, i) => (new Date().getFullYear() - 2 + i).toString())

  const generateReport = async () => {
    if (!selectedStandard || !selectedClass || !selectedMonth || !selectedYear) {
      toast({
        title: "Error",
        description: "Please select standard, class, month, and year.",
        variant: "destructive",
      })
      return
    }

    setLoading(true)
    try {
      const [performanceResponse, attendanceResponse] = await Promise.all([
        fetch("/api/performance", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            standard: selectedStandard,
            classParam: selectedClass,
            month: selectedMonth,
            year: selectedYear,
          }),
        }),
        fetch(
          `https://t1-api-attendance.vercel.app/api/pattendance?standard=${selectedStandard}&class=${selectedClass}&month=${selectedMonth}&year=${selectedYear}`,
        ),
      ])

      if (!performanceResponse.ok || !attendanceResponse.ok) {
        throw new Error("Failed to generate report")
      }

      const performanceData = await performanceResponse.json()
      const attendanceData = await attendanceResponse.json()

      // Process attendance data
      const processedAttendanceData = attendanceData.reduce((acc: any, curr: any) => {
        if (!acc[curr.studentId]) {
          acc[curr.studentId] = {
            totalAttendance: 0,
            presentAttendance: 0,
            absentAttendance: 0,
            absentDates: [],
          }
        }
        acc[curr.studentId].totalAttendance++
        if (curr.status === "P") {
          acc[curr.studentId].presentAttendance++
        } else if (curr.status === "A") {
          acc[curr.studentId].absentAttendance++
          acc[curr.studentId].absentDates.push({
            date: curr.date,
            reason: curr.reason || "Not specified",
          })
        }
        return acc
      }, {})

      // Merge performance and attendance data
      const mergedData = {
        ...performanceData,
        students: performanceData.students.map((student: any) => {
          const studentAttendance = processedAttendanceData[student.studentId]
          if (!studentAttendance) {
            console.warn(`No attendance data found for student ID: ${student.studentId}`)
          }
          return {
            ...student,
            attendance: studentAttendance || {
              totalAttendance: 0,
              presentAttendance: 0,
              absentAttendance: 0,
              absentDates: [],
            },
          }
        }),
      }

      setReportData(mergedData)
      toast({
        title: "Report Generated",
        description: "Complete performance report has been generated successfully.",
      })
    } catch (error) {
      console.error("Error generating report:", error)
      toast({
        title: "Error",
        description: "Failed to generate report. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const getAttendancePercentage = (present: number, total: number) => {
    return total > 0 ? Math.round((present / total) * 100) : 0
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Performance Report</h1>
      </div>

      {/* Filter Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />
            Generate Report
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
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

            <Select onValueChange={setSelectedClass} disabled={!selectedStandard}>
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

            <Select value={selectedMonth} onValueChange={setSelectedMonth}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Select Month" />
              </SelectTrigger>
              <SelectContent>
                {months.map((month, index) => (
                  <SelectItem key={month} value={index.toString()}>
                    {month}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedYear} onValueChange={setSelectedYear}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Select Year" />
              </SelectTrigger>
              <SelectContent>
                {years.map((year) => (
                  <SelectItem key={year} value={year}>
                    {year}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button onClick={generateReport} disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <TrendingUp className="w-4 h-4 mr-2" />
                  Generate Report
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Report Results */}
      {reportData && (
        <div className="space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Students</p>
                    <p className="text-2xl font-bold">{reportData.students.length}</p>
                  </div>
                  <Users className="w-8 h-8 text-blue-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Report Period</p>
                    <p className="text-lg font-semibold">
                      {months[Number.parseInt(selectedMonth)]} {selectedYear}
                    </p>
                  </div>
                  <Calendar className="w-8 h-8 text-blue-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Class</p>
                    <p className="text-lg font-semibold">
                      Standard {selectedStandard} - {selectedClass}
                    </p>
                  </div>
                  <GraduationCap className="w-8 h-8 text-blue-600" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Student Performance Details */}
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle className="flex items-center gap-2">
                  <Award className="w-5 h-5" />
                  Student Performance Overview
                </CardTitle>
                <PDFLoadingButton
                  document={
                    <CombinedStudentReportPDF
                      month={months[Number.parseInt(selectedMonth)]}
                      year={selectedYear}
                      standard={selectedStandard}
                      className={selectedClass}
                      students={reportData.students.map((student: any) => ({
                        name: student.name,
                        rollNo: student.rollNo,
                        currentStandard: Number.parseInt(selectedStandard),
                        subjects: Object.entries(student.subjects).map(([name, details]: [string, any]) => ({
                          name,
                          examDetails: details.examDetails,
                        })),
                        attendance: {
                          totalDays: student.attendance.totalAttendance,
                          presentDays: student.attendance.presentAttendance,
                        },
                      }))}
                    />
                  }
                  fileName={`Standard_${selectedStandard}_Class_${selectedClass}_Complete_Report.pdf`}
                  buttonText="Download All Reports"
                  loadingText="Generating PDF..."
                  className="flex items-center gap-2"
                />
              </div>
            </CardHeader>
            <CardContent>
              <Accordion type="single" collapsible className="space-y-2">
                {reportData.students.map((student: any) => {
                  const attendancePercentage = getAttendancePercentage(
                    student.attendance.presentAttendance,
                    student.attendance.totalAttendance,
                  )

                  return (
                    <AccordionItem key={student.rollNo} value={student.rollNo} className="border rounded-lg">
                      <AccordionTrigger className="px-6 py-4 hover:no-underline group">
                        <div className="flex items-center justify-between w-full mr-4">
                          <div className="flex items-center gap-4">
                            <div className="relative">
                              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center font-bold text-lg shadow-lg">
                                {student.rollNo}
                              </div>
                              <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white"></div>
                            </div>
                            <div className="text-left">
                              <h3 className="text-xl font-bold text-white group-hover:text-blue-600 transition-colors">
                                {student.name}
                              </h3>
                              <div className="flex items-center gap-2 mt-1">
                                <span className="text-sm text-slate-500">Roll No:</span>
                                <span className="text-sm font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                                  {student.rollNo}
                                </span>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="text-right">
                              <div className="text-sm text-slate-500 mb-1">Attendance Rate</div>
                              <div
                                className={`text-lg font-bold ${
                                  attendancePercentage >= 90
                                    ? "text-emerald-600"
                                    : attendancePercentage >= 75
                                      ? "text-blue-600"
                                      : attendancePercentage >= 60
                                        ? "text-yellow-600"
                                        : "text-red-500"
                                }`}
                              >
                                {attendancePercentage}%
                              </div>
                            </div>
                            <div
                              className={`w-3 h-3 rounded-full ${
                                attendancePercentage >= 90
                                  ? "bg-emerald-500"
                                  : attendancePercentage >= 75
                                    ? "bg-blue-500"
                                    : attendancePercentage >= 60
                                      ? "bg-yellow-500"
                                      : "bg-red-500"
                              }`}
                            ></div>
                          </div>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="px-6 pb-6">
                        <div className="space-y-6">
                          {/* Attendance Section */}
                          <div className="bg-slate-50 rounded-xl p-5 border border-slate-200">
                            <div className="flex items-center gap-3 mb-4">
                              <div className="p-2 bg-blue-100 rounded-lg">
                                <Calendar className="w-5 h-5 text-blue-600" />
                              </div>
                              <div>
                                <h4 className="text-lg font-semibold text-slate-800">Attendance Overview</h4>
                                <p className="text-sm text-slate-500">Monthly attendance tracking</p>
                              </div>
                            </div>

                            <div className="grid grid-cols-4 gap-4 mb-5">
                              <div className="text-center p-4 bg-white rounded-lg border border-slate-200 shadow-sm">
                                <div className="text-2xl font-bold text-slate-700 mb-1">
                                  {student.attendance.totalAttendance}
                                </div>
                                <div className="text-xs font-medium text-slate-500 uppercase tracking-wide">
                                  Total Days
                                </div>
                              </div>
                              <div className="text-center p-4 bg-white rounded-lg border border-slate-200 shadow-sm">
                                <div className="text-2xl font-bold text-emerald-600 mb-1">
                                  {student.attendance.presentAttendance}
                                </div>
                                <div className="text-xs font-medium text-slate-500 uppercase tracking-wide">
                                  Present
                                </div>
                              </div>
                              <div className="text-center p-4 bg-white rounded-lg border border-slate-200 shadow-sm">
                                <div className="text-2xl font-bold text-red-500 mb-1">
                                  {student.attendance.absentAttendance}
                                </div>
                                <div className="text-xs font-medium text-slate-500 uppercase tracking-wide">Absent</div>
                              </div>
                              <div className="text-center p-4 bg-white rounded-lg border border-slate-200 shadow-sm">
                                <div className="text-2xl font-bold text-blue-600 mb-1">{attendancePercentage}%</div>
                                <div className="text-xs font-medium text-slate-500 uppercase tracking-wide">Rate</div>
                              </div>
                            </div>

                            {student.attendance.absentDates.length > 0 && (
                              <div className="bg-white rounded-lg p-4 border border-slate-200">
                                <div className="flex items-center gap-2 mb-3">
                                  <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                                  <h5 className="font-semibold text-slate-700">Absent Dates & Reasons</h5>
                                </div>
                                <div className="space-y-2">
                                  {student.attendance.absentDates.map((absentDate: any, idx: number) => (
                                    <div
                                      key={idx}
                                      className="flex justify-between items-center py-2 px-3 bg-red-50 rounded-lg border-l-4 border-red-200"
                                    >
                                      <span className="font-medium text-slate-700">
                                        {new Date(absentDate.date).toLocaleDateString("en-US", {
                                          weekday: "short",
                                          month: "short",
                                          day: "numeric",
                                        })}
                                      </span>
                                      <span className="text-sm text-slate-600 bg-white px-2 py-1 rounded">
                                        {absentDate.reason}
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>

                          {/* Subjects Section */}
                          {Object.entries(student.subjects).map(([subject, details]: [string, any]) => (
                            <div key={subject} className="bg-slate-50 rounded-xl p-5 border border-slate-200">
                              <div className="flex items-center gap-3 mb-4">
                                <div className="p-2 bg-purple-100 rounded-lg">
                                  <FileText className="w-5 h-5 text-purple-600" />
                                </div>
                                <div>
                                  <h4 className="text-lg font-semibold text-slate-800">{subject} Performance</h4>
                                  <p className="text-sm text-slate-500">Test scores and evaluation</p>
                                </div>
                              </div>

                              <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
                                <div className="overflow-x-auto">
                                  <table className="w-full">
                                    <thead className="bg-slate-100">
                                      <tr>
                                        <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                                          Test Name
                                        </th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                                          Date
                                        </th>
                                        <th className="px-4 py-3 text-center text-xs font-semibold text-slate-600 uppercase tracking-wider">
                                          Score
                                        </th>
                                        <th className="px-4 py-3 text-center text-xs font-semibold text-slate-600 uppercase tracking-wider">
                                          Max Marks
                                        </th>
                                        <th className="px-4 py-3 text-center text-xs font-semibold text-slate-600 uppercase tracking-wider">
                                          Grade
                                        </th>
                                      </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-200">
                                      {details.examDetails.map((exam: any, examIdx: number) => {
                                        const percentage = Math.round((exam.score / exam.maxMarks) * 100)
                                        const getGradeInfo = (perc: number) => {
                                          if (perc >= 90)
                                            return {
                                              grade: "A+",
                                              color: "bg-emerald-100 text-emerald-700 border-emerald-200",
                                            }
                                          if (perc >= 80)
                                            return { grade: "A", color: "bg-blue-100 text-blue-700 border-blue-200" }
                                          if (perc >= 70)
                                            return {
                                              grade: "B+",
                                              color: "bg-indigo-100 text-indigo-700 border-indigo-200",
                                            }
                                          if (perc >= 60)
                                            return {
                                              grade: "B",
                                              color: "bg-yellow-100 text-yellow-700 border-yellow-200",
                                            }
                                          if (perc >= 50)
                                            return {
                                              grade: "C",
                                              color: "bg-orange-100 text-orange-700 border-orange-200",
                                            }
                                          return { grade: "F", color: "bg-red-100 text-red-700 border-red-200" }
                                        }
                                        const gradeInfo = getGradeInfo(percentage)

                                        return (
                                          <tr key={examIdx} className="hover:bg-slate-50">
                                            <td className="px-4 py-3">
                                              <div className="font-medium text-slate-800">{exam.examName}</div>
                                            </td>
                                            <td className="px-4 py-3">
                                              <div className="text-sm text-slate-600">
                                                {new Date(exam.date).toLocaleDateString("en-US", {
                                                  month: "short",
                                                  day: "numeric",
                                                  year: "numeric",
                                                })}
                                              </div>
                                            </td>
                                            <td className="px-4 py-3 text-center">
                                              <span className="text-lg font-bold text-slate-800">{exam.score}</span>
                                            </td>
                                            <td className="px-4 py-3 text-center">
                                              <span className="text-sm text-slate-500">/ {exam.maxMarks}</span>
                                            </td>
                                            <td className="px-4 py-3 text-center">
                                              <div className="flex flex-col items-center gap-1">
                                                <span
                                                  className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${gradeInfo.color}`}
                                                >
                                                  {gradeInfo.grade}
                                                </span>
                                                <span className="text-xs text-slate-500">{percentage}%</span>
                                              </div>
                                            </td>
                                          </tr>
                                        )
                                      })}
                                    </tbody>
                                  </table>
                                </div>
                              </div>
                            </div>
                          ))}

                          {/* Individual PDF Download */}
                          <div className="pt-4 border-t border-slate-200">
                            <PDFLoadingButton
                              document={
                                <StudentReportPDF
                                  month={months[Number.parseInt(selectedMonth)]}
                                  year={selectedYear}
                                  student={{
                                    name: student.name,
                                    rollNo: student.rollNo,
                                    currentStandard: Number.parseInt(selectedStandard),
                                  }}
                                  subjects={Object.entries(student.subjects).map(([name, details]: [string, any]) => ({
                                    name,
                                    examDetails: details.examDetails,
                                  }))}
                                  attendance={{
                                    totalDays: student.attendance.totalAttendance,
                                    presentDays: student.attendance.presentAttendance,
                                  }}
                                />
                              }
                              fileName={`${student.name}_Complete_Report.pdf`}
                              buttonText="Download Individual Report"
                              loadingText="Generating PDF..."
                              className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-medium py-3 rounded-lg shadow-sm transition-all duration-200"
                            />
                          </div>
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  )
                })}
              </Accordion>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
