import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST(request: Request) {
  const { markEntryIds, standard, class: className } = await request.json();

  const students = await prisma.student.findMany({
    where: {
      currentStandard: standard,
      currentClass: className,
    },
    orderBy: {
      rollNo: "asc",
    },
  });

  const markEntries = await prisma.markEntry.findMany({
    where: {
      id: { in: markEntryIds },
    },
    include: {
      marks: true,
    },
    orderBy: {
      date: "asc",
    },
  });

  // Custom sorting function for roll numbers
  const sortRollNumbers = (a: string, b: string) => {
    const aNum = parseInt(a.replace(/\D/g, ""));
    const bNum = parseInt(b.replace(/\D/g, ""));
    return aNum - bNum;
  };

  // Sort students by roll number
  students.sort((a, b) => sortRollNumbers(a.rollNo, b.rollNo));

  const excelData = students.map((student, index) => {
    const rowData: any = {
      "Sr No": index + 1,
      "Roll No": student.rollNo,
      Name: student.name,
    };

    markEntries.forEach((entry) => {
      const mark = entry.marks.find((m) => m.studentId === student.id);
      const columnName = `${
        entry.name
      } (${entry.date.toLocaleDateString()}) - ${entry.subject}`;
      rowData[columnName] = mark ? mark.score : "AB";
    });

    return rowData;
  });

  return NextResponse.json(excelData);
}
