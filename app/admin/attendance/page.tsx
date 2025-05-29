"use client";

import { useState, useEffect } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { standards } from "@/Data";
import * as XLSX from "xlsx";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";

type MergedAttendanceRecord = {
  id: number;
  date: string;
  studentId: string;
  rollNo: string;
  studentName: string;
  status: string;
  standard: string;
  class: string;
};

type Holiday = {
  date: string;
  reason: string;
};

type AttendanceRecord = {
  id: number;
  date: string;
  status: string;
  reason?: string;
};

const formSchema = z.object({
  status: z.enum(["P", "A"]),
});

export default function AttendanceViewer() {
  const [currentStandard, setCurrentStandard] = useState<string>("");
  const [currentClass, setCurrentClass] = useState<string>("");

  const [selectedMonth, setSelectedMonth] = useState(
    new Date().getMonth().toString()
  );
  const [selectedYear, setSelectedYear] = useState(
    new Date().getFullYear().toString()
  );
  const [attendanceData, setAttendanceData] = useState<
    MergedAttendanceRecord[]
  >([]);
  const [isLoading, setIsLoading] = useState(false);
  const [classes, setClasses] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [holidays, setHolidays] = useState<Map<string, string>>(new Map());
  const [allFieldsSelected, setAllFieldsSelected] = useState(false);
  const [showAbsentOnly, setShowAbsentOnly] = useState(false);
  const [selectedStudentId, setSelectedStudentId] = useState("");
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedRecord, setSelectedRecord] = useState<AttendanceRecord | null>(
    null
  );
  const [updateLoading, setIsUpdateLoading] = useState(false);

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

  useEffect(() => {
    if (currentStandard) {
      setClasses([
        ...standards[currentStandard as keyof typeof standards].classes,
      ]);
    }
  }, [currentStandard]);

  const fetchAttendanceData = async () => {
    const response = await fetch(
      `https://t1-api-attendance.vercel.app/api/attendance?standard=${currentStandard}&class=${currentClass}&month=${Number.parseInt(
        selectedMonth
      )}&year=${Number.parseInt(selectedYear)}${
        showAbsentOnly ? "&status=A" : ""
      }`
    );

    if (!response.ok) {
      throw new Error("Failed to fetch attendance data");
    }
    const data = await response.json();

    return data;
  };

  const fetchHolidays = async () => {
    const response = await fetch(
      `https://t1-api-attendance.vercel.app/api/holiday?year=${Number.parseInt(
        selectedYear
      )}`
    );
    if (!response.ok) {
      throw new Error("Failed to fetch holidays data");
    }
    return response.json();
  };

  useEffect(() => {
    setAllFieldsSelected(
      currentStandard !== "" &&
        currentClass !== "" &&
        selectedMonth !== "" &&
        selectedYear !== ""
    );
  }, [currentStandard, currentClass, selectedMonth, selectedYear]);

  const handleFind = async () => {
    if (!allFieldsSelected) return;
    setIsLoading(true);
    setError(null);
    setShowAbsentOnly(false); // Reset showAbsentOnly
    try {
      const [fetchedAttendance, fetchedHolidays] = await Promise.all([
        fetchAttendanceData(),
        fetchHolidays(),
      ]);
      setAttendanceData(fetchedAttendance);
      setHolidays(
        new Map(
          fetchedHolidays.map((h: Holiday) => [h.date.split("T")[0], h.reason])
        )
      );
    } catch (err) {
      setError("Failed to fetch data. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const daysInMonth = new Date(
    Number.parseInt(selectedYear),
    Number.parseInt(selectedMonth) + 1,
    0
  ).getDate();

  const studentAttendance = attendanceData.reduce((acc, record) => {
    if (!acc[record.studentId]) {
      acc[record.studentId] = {
        id: record.rollNo,
        name: record.studentName,
        attendance: {},
      };
    }

    const day = new Date(record.date).getDate();
    acc[record.studentId].attendance[day] = {
      status: record.status === "A" ? "A" : "P",
      id: record.id,
    };
    return acc;
  }, {} as Record<string, { id: string; name: string; attendance: Record<number, { status: string; id: number }> }>);

  const sortedStudents = Object.values(studentAttendance).sort((a, b) => {
    const rollA = Number.parseInt(a.id.replace(/\D/g, "")) || 0;
    const rollB = Number.parseInt(b.id.replace(/\D/g, "")) || 0;
    return rollA - rollB;
  });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      status: "P" as "P" | "A",
    },
  });

  if (error) return <div>{error}</div>;

  const isHoliday = (day: number) => {
    const date = new Date(
      Number.parseInt(selectedYear),
      Number.parseInt(selectedMonth),
      day
    )
      .toISOString()
      .split("T")[0];
    return (
      holidays.has(date) ||
      new Date(
        Number.parseInt(selectedYear),
        Number.parseInt(selectedMonth),
        day
      ).getDay() === 0
    );
  };

  const getHolidayReason = (day: number) => {
    const date = new Date(
      Number.parseInt(selectedYear),
      Number.parseInt(selectedMonth),
      day
    )
      .toISOString()
      .split("T")[0];
    return holidays.get(date) || "Sunday";
  };

  const handleExportToExcel = () => {
    if (!attendanceData.length) return;

    const wsData = [
      // Headers
      [
        "Roll No",
        "Name",
        ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
      ],
    ];

    // Add student data
    sortedStudents.forEach((student) => {
      const row = [
        student.id,
        student.name,
        ...Array.from({ length: daysInMonth }, (_, i) => {
          const day = i + 1;
          if (isHoliday(day)) return "H";
          return student.attendance[day] ? student.attendance[day].status : "-";
        }),
      ];
      wsData.push(row);
    });

    // Create workbook and worksheet
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(wsData);

    // Set column widths
    const colWidths = [
      { wch: 10 }, // Roll No
      { wch: 20 }, // Name
      ...Array(daysInMonth).fill({ wch: 5 }), // Days
    ];
    ws["!cols"] = colWidths;

    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(
      wb,
      ws,
      `Attendance_${months[Number.parseInt(selectedMonth)]}_${selectedYear}`
    );

    // Generate Excel file
    XLSX.writeFile(
      wb,
      `Attendance_${currentStandard}_${currentClass}_${
        months[Number.parseInt(selectedMonth)]
      }_${selectedYear}.xlsx`
    );
  };

  const handleOpenEditDialog = (record: AttendanceRecord) => {
    setSelectedRecord(record);
    form.reset({
      status: record.status as "P" | "A",
    });
  };

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setIsUpdateLoading(true);
    if (!selectedRecord) return;

    const updateData = {
      standard: currentStandard,
      className: currentClass,
      id: selectedRecord.id,
      status: values.status,
    };

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_API}/update-attendance`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(updateData),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to update attendance");
      }

      // Refresh attendance data
      setIsUpdateLoading(false);
      handleFind();
      setSelectedRecord(null);
    } catch (err) {
      setIsUpdateLoading(false);
      setError("Failed to update attendance. Please try again.");
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Attendance Report</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
          <Select onValueChange={setCurrentStandard}>
            <SelectTrigger>
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
          <Select onValueChange={setCurrentClass}>
            <SelectTrigger>
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
          <Select value={selectedMonth} onValueChange={setSelectedMonth}>
            <SelectTrigger>
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
            <SelectTrigger>
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
        </div>
        <div className="mt-4 flex justify-between items-center">
          <Button
            onClick={handleFind}
            disabled={!allFieldsSelected || isLoading}
          >
            {isLoading ? (
              <>
                <span className="mr-2">Searching..</span>
                <svg
                  className="animate-spin h-5 w-5"
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
              </>
            ) : (
              "Search"
            )}
          </Button>
          {attendanceData.length > 0 && (
            <Button
              variant="outline"
              onClick={handleExportToExcel}
              className="flex items-center gap-2"
            >
              <Download className="h-4 w-4" />
              Export to Excel
            </Button>
          )}
        </div>
        {!allFieldsSelected && (
          <div className="mt-4 text-center text-gray-500">
            Please select all fields to view attendance data.
          </div>
        )}
        {allFieldsSelected && attendanceData.length > 0 && (
          <>
            <div className="overflow-x-auto mt-2">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className=" shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">
                      Roll No
                    </TableHead>
                    <TableHead className="shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">
                      Name
                    </TableHead>
                    {Array.from({ length: daysInMonth }, (_, i) => i + 1).map(
                      (day) => (
                        <TableHead key={day} className="px-2 text-center">
                          {day}
                        </TableHead>
                      )
                    )}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedStudents.map((student) => (
                    <TableRow key={student.id}>
                      <TableCell className="shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">
                        {student.id}
                      </TableCell>
                      <TableCell className=" shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">
                        {student.name}
                      </TableCell>
                      {Array.from({ length: daysInMonth }, (_, i) => i + 1).map(
                        (day) => {
                          const holiday = isHoliday(day);
                          const date = new Date(
                            Number.parseInt(selectedYear),
                            Number.parseInt(selectedMonth),
                            day
                          )
                            .toISOString()
                            .split("T")[0];
                          const attendanceInfo = student.attendance[day] || {
                            status: "-",
                            id: 0,
                          };
                          return (
                            <TableCell
                              key={day}
                              className={`px-2 text-center ${
                                holiday
                                  ? "bg-slate-900/40 border-x border-slate-800"
                                  : ""
                              }`}
                              title={
                                holiday ? getHolidayReason(day) : undefined
                              }
                            >
                              {!holiday && (
                                <Dialog>
                                  <DialogTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      className="p-0 h-auto font-normal"
                                      onClick={() =>
                                        handleOpenEditDialog({
                                          id: attendanceInfo.id,
                                          date,
                                          status: attendanceInfo.status,
                                        })
                                      }
                                    >
                                      {attendanceInfo.status}
                                    </Button>
                                  </DialogTrigger>
                                  <DialogContent>
                                    <DialogHeader>
                                      <DialogTitle>Edit Attendance</DialogTitle>
                                    </DialogHeader>
                                    <Form {...form}>
                                      <form
                                        onSubmit={form.handleSubmit(onSubmit)}
                                        className="space-y-8"
                                      >
                                        <FormField
                                          control={form.control}
                                          name="status"
                                          render={({ field }) => (
                                            <FormItem>
                                              <FormLabel>Status</FormLabel>
                                              <Select
                                                onValueChange={field.onChange}
                                                defaultValue={field.value}
                                              >
                                                <FormControl>
                                                  <SelectTrigger>
                                                    <SelectValue placeholder="Select status" />
                                                  </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                  <SelectItem value="P">
                                                    Present
                                                  </SelectItem>
                                                  <SelectItem value="A">
                                                    Absent
                                                  </SelectItem>
                                                </SelectContent>
                                              </Select>
                                              <FormMessage />
                                            </FormItem>
                                          )}
                                        />
                                        <Button
                                          className="text-white"
                                          type="submit"
                                          disabled={updateLoading}
                                        >
                                          {updateLoading ? (
                                            <>
                                              <span className="mr-2">
                                                Saving...
                                              </span>
                                              <svg
                                                className="animate-spin h-5 w-5"
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
                                            </>
                                          ) : (
                                            "Save Changes"
                                          )}
                                        </Button>
                                      </form>
                                    </Form>
                                  </DialogContent>
                                </Dialog>
                              )}
                              {holiday && "H"}
                            </TableCell>
                          );
                        }
                      )}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            <div className="mt-4 text-sm">
              <p>
                <strong>Legend:</strong> P - Present, A - Absent, H - Holiday
                (Sunday), - - No Data
              </p>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
