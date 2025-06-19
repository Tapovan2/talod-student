"use client";
import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Loader2 } from "lucide-react";
import { useStudents } from "@/hooks/useStudents";

export default function AttendancePage() {
  const params = useParams();
  const standard = params.standard as string;
  const classParam = params.class as string;
  const subject = params.subject as string;
  const [date, setDate] = useState<Date | undefined>(undefined);
  const [attendance, setAttendance] = useState<{ [key: string]: string }>({});
  const { students, isLoading: isLoadingStudents } = useStudents(
    standard,
    classParam,
    subject
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSunday, setIsSunday] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (date) {
      setIsSunday(date.getDay() === 0);
    }
  }, [date]);

  const handleAttendanceChange = (studentId: string, value: string) => {
    setAttendance((prev) => ({ ...prev, [studentId]: value }));
  };

  const handleSubmitAttendance = async () => {
    if (!date) {
      alert("Please select a date for attendance submission");
      return;
    }
    if (isSunday) {
      alert("You can't submit attendance on Sunday");
      return;
    }
    setIsSubmitting(true);
    try {
      const attendanceData = students.map((student: any) => ({
        studentId: student.id,
        status: attendance[student.id] || "P", // Default to "P" if not explicitly marked
      }));

      // Add one day to the selected date
      const adjustedDate = new Date(date);
      adjustedDate.setDate(adjustedDate.getDate() + 1);

      const response = await fetch(
        `https://t1-api-attendance.vercel.app/api/attendance`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            date: adjustedDate.toISOString().split("T")[0], // Send adjusted date as YYYY-MM-DD
            standard: standard,
            class: classParam,
            attendance: attendanceData,
          }),
        }
      );
      
      if (!response.ok) {
        throw new Error("Failed to mark attendance");
      }
      const data = await response.json();
      console.log("data",data);
      
      if (data.success) {
        alert("Attendance marked successfully");
        toast({
          title: "Success",
          description: "Attendance marked successfully",
        });
      } else {
        alert("Failed to mark attendance");
        throw new Error("Failed to mark attendance");
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to mark attendance",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">
          Attendance - Standard {standard} Class {classParam}
        </h1>
      </div>
      <div className="grid md:grid-cols-[300px,1fr] gap-6">
        <Card className="md:sticky md:top-6 h-fit">
          <CardHeader>
            <CardTitle>Select Date</CardTitle>
          </CardHeader>
          <CardContent>
            <Calendar
              mode="single"
              selected={date}
              onDayClick={(day) => {
                const adjustedDate = new Date(day.setHours(0, 0, 0, 0));
                setDate(adjustedDate);
              }}
              className="rounded-md border"
              modifiers={{
                dummy: (day) =>
                  !date && day.toDateString() === new Date().toDateString(),
              }}
              modifiersStyles={{
                dummy: {
                  color: "lightgray",
                  fontWeight: "normal",
                },
                selected: {
                  backgroundColor: "blue",
                  color: "white",
                  fontWeight: "bold",
                },
              }}
            />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Mark Attendance</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoadingStudents ? (
              <div className="flex justify-center items-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : isSunday ? (
              <div className="flex justify-center items-center h-64">
                <p className="text-xl font-semibold text-red-500">
                  You can't submit attendance on Sunday
                </p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-20">Roll No</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead className="w-[200px]">Attendance</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {students.map((student: any) => (
                    <TableRow key={student.id}>
                      <TableCell className="font-medium">
                        {student.rollNo}
                      </TableCell>
                      <TableCell>{student.name}</TableCell>
                      <TableCell>
                        <RadioGroup
                          defaultValue="P"
                          onValueChange={(value) =>
                            handleAttendanceChange(student.id.toString(), value)
                          }
                          className="flex space-x-4"
                        >
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem
                              value="P"
                              id={`present-${student.id}`}
                            />
                            <Label
                              htmlFor={`present-${student.id}`}
                              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                            >
                              P
                            </Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem
                              value="A"
                              id={`absent-${student.id}`}
                            />
                            <Label
                              htmlFor={`absent-${student.id}`}
                              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                            >
                              A
                            </Label>
                          </div>
                        </RadioGroup>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
      <div className="flex items-center justify-center">
        <Button
          onClick={handleSubmitAttendance}
          disabled={isSubmitting || isLoadingStudents || isSunday || !date}
        >
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Submitting...
            </>
          ) : (
            "Submit Attendance"
          )}
        </Button>
      </div>
    </div>
  );
}
