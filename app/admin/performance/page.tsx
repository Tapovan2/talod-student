"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { standards } from "@/Data";
import { PDFLoadingButton } from "@/components/PDFLoadingButton";
import { StudentReportPDF } from "@/components/StudentReportPdf";
import { CombinedStudentReportPDF } from "@/components/CombinedStudentReportPDF";

// Dynamically import PDF components with no SSR to prevent them from loading until needed

export default function PerformanceReportPage() {
  const [selectedStandard, setSelectedStandard] = useState<string>("");
  const [selectedClass, setSelectedClass] = useState<string>("");
  const [reportData, setReportData] = useState<any>();
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const [selectedMonth, setSelectedMonth] = useState(
    new Date().getMonth().toString()
  );
  const [selectedYear, setSelectedYear] = useState(
    new Date().getFullYear().toString()
  );

  const handleStandardChange = (value: string) => {
    setSelectedStandard(value);
    setSelectedClass("");
  };

  const STANDARDS = Object.keys(standards);
  const CLASSES = selectedStandard
    ? standards[selectedStandard as keyof typeof standards]?.classes || []
    : [];

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
  ];
  const years = Array.from({ length: 5 }, (_, i) =>
    (new Date().getFullYear() - 2 + i).toString()
  );

  const generateReport = async () => {
    if (
      !selectedStandard ||
      !selectedClass ||
      !selectedMonth ||
      !selectedYear
    ) {
      toast({
        title: "Error",
        description: "Please select standard, class, month, and year.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
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
          `https://t1-api-attendance.vercel.app/api/pattendance?standard=${selectedStandard}&class=${selectedClass}&month=${selectedMonth}&year=${selectedYear}`
        ),
      ]);

      if (!performanceResponse.ok || !attendanceResponse.ok) {
        throw new Error("Failed to generate report");
      }

      const performanceData = await performanceResponse.json();
      const attendanceData = await attendanceResponse.json();

      // Process attendance data
      const processedAttendanceData = attendanceData.reduce(
        (acc: any, curr: any) => {
          if (!acc[curr.studentId]) {
            acc[curr.studentId] = {
              totalAttendance: 0,
              presentAttendance: 0,
              absentAttendance: 0,
              absentDates: [],
            };
          }
          acc[curr.studentId].totalAttendance++;
          if (curr.status === "P") {
            acc[curr.studentId].presentAttendance++;
          } else if (curr.status === "A") {
            acc[curr.studentId].absentAttendance++;
            acc[curr.studentId].absentDates.push({
              date: curr.date,
              reason: curr.reason || "Not specified",
            });
          }
          return acc;
        },
        {}
      );

      // Merge performance and attendance data
      const mergedData = {
        ...performanceData,
        students: performanceData.students.map((student: any) => {
          const studentAttendance = processedAttendanceData[student.studentId];
          if (!studentAttendance) {
            console.warn(
              `No attendance data found for student ID: ${student.studentId}`
            );
          }
          return {
            ...student,
            attendance: studentAttendance || {
              totalAttendance: 0,
              presentAttendance: 0,
              absentAttendance: 0,
              absentDates: [],
            },
          };
        }),
      };

      setReportData(mergedData);
      toast({
        title: "Report Generated",
        description:
          "Complete performance report has been generated successfully.",
      });
    } catch (error) {
      console.error("Error generating report:", error);
      toast({
        title: "Error",
        description: "Failed to generate report. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Student Performance Report</h1>
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
        <Select onValueChange={(value) => setSelectedClass(value)}>
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
              Generating...
            </>
          ) : (
            "Generate Report"
          )}
        </Button>
      </div>
      {reportData && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Student Performance Overview</CardTitle>
            </CardHeader>
            <CardContent>
              <Accordion type="single" collapsible>
                {reportData.students.map((student: any) => (
                  <AccordionItem key={student.rollNo} value={student.rollNo}>
                    <AccordionTrigger>
                      {student.rollNo} - {student.name}
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="space-y-4">
                        <div>
                          <h4 className="font-semibold mt-4">
                            Attendance Overview
                          </h4>
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Total Days</TableHead>
                                <TableHead>Present Days</TableHead>
                                <TableHead>Absent Days</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              <TableRow>
                                <TableCell>
                                  {student.attendance.totalAttendance}
                                </TableCell>
                                <TableCell>
                                  {student.attendance.presentAttendance}
                                </TableCell>
                                <TableCell>
                                  {student.attendance.absentAttendance}
                                </TableCell>
                              </TableRow>
                            </TableBody>
                          </Table>
                          {student.attendance.absentDates.length > 0 && (
                            <>
                              <h5 className="font-semibold mt-2">
                                Absent Dates and Reasons
                              </h5>
                              <ul>
                                {student.attendance.absentDates.map(
                                  (absentDate: any, index: number) => (
                                    <li key={index}>
                                      {new Date(
                                        absentDate.date
                                      ).toLocaleDateString()}
                                      : {absentDate.reason}
                                    </li>
                                  )
                                )}
                              </ul>
                            </>
                          )}
                        </div>
                        {Object.entries(student.subjects).map(
                          ([subject, details]: [string, any]) => (
                            <div key={subject}>
                              <h4 className="font-semibold mt-4">
                                {subject} Test Details
                              </h4>
                              <Table>
                                <TableHeader>
                                  <TableRow>
                                    <TableHead>Test Name</TableHead>
                                    <TableHead>Date</TableHead>
                                    <TableHead>Score</TableHead>
                                    <TableHead>Max Marks</TableHead>
                                  </TableRow>
                                </TableHeader>
                                <TableBody>
                                  {details.examDetails.map(
                                    (exam: any, index: number) => (
                                      <TableRow key={index}>
                                        <TableCell>{exam.examName}</TableCell>
                                        <TableCell>
                                          {new Date(
                                            exam.date
                                          ).toLocaleDateString()}
                                        </TableCell>
                                        <TableCell>{exam.score}</TableCell>
                                        <TableCell>{exam.maxMarks}</TableCell>
                                      </TableRow>
                                    )
                                  )}
                                </TableBody>
                              </Table>
                            </div>
                          )
                        )}
                        <div className="mt-4">
                          <PDFLoadingButton
                            document={
                              <StudentReportPDF
                                month={months[Number.parseInt(selectedMonth)]}
                                year={selectedYear}
                                student={{
                                  name: student.name,
                                  rollNo: student.rollNo,
                                  currentStandard:
                                    Number.parseInt(selectedStandard),
                                }}
                                subjects={Object.entries(student.subjects).map(
                                  ([name, details]: [string, any]) => ({
                                    name,
                                    examDetails: details.examDetails,
                                  })
                                )}
                                attendance={{
                                  totalDays: student.attendance.totalAttendance,
                                  presentDays:
                                    student.attendance.presentAttendance,
                                }}
                              />
                            }
                            fileName={`${student.name}_Complete_Report.pdf`}
                            buttonText="Download Complete Report Card"
                            loadingText="Generating PDF..."
                          />
                        </div>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </CardContent>
          </Card>
          {reportData && (
            <div className="mt-4">
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
                      subjects: Object.entries(student.subjects).map(
                        ([name, details]: [string, any]) => ({
                          name,
                          examDetails: details.examDetails,
                        })
                      ),
                      attendance: {
                        totalDays: student.attendance.totalAttendance,
                        presentDays: student.attendance.presentAttendance,
                      },
                    }))}
                  />
                }
                fileName={`Standard_${selectedStandard}_Class_${selectedClass}_Complete_Report.pdf`}
                buttonText="Download All Student Reports in Single PDF"
                loadingText="Generating Combined PDF..."
                className="w-full"
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
