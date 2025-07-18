import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  const data = await request.json();
  console.log("data", data);

  const student = await prisma.student.update({
    where: { id: parseInt(params.id) },
    data: {
      name: data.name,
      rollNo: data.rollNo,
      currentStandard: data.currentStandard,
      currentClass: data.class,
      subClass: data.subClass,
    },
  });
  return NextResponse.json(student);
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  // await prisma.academicHistory.deleteMany({
  //   where: { studentId: parseInt(params.id) },
  // });

  await prisma.mark.deleteMany({
    where: {
      studentId: parseInt(params.id),
    },
  });

  await prisma.student.delete({
    where: { id: parseInt(params.id) },
  });

  return NextResponse.json({ message: "Student deleted successfully" });
}

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;
    console.log("id", id);

    // Check if the id is 'batch' to handle multiple students
    if (id === "batch") {
      const { searchParams } = new URL(request.url);
      const ids = searchParams.get("ids")?.split(",").map(Number) || [];

      if (ids.length === 0) {
        return NextResponse.json(
          { error: "No student IDs provided" },
          { status: 400 }
        );
      }

      const students = await prisma.student.findMany({
        where: {
          id: {
            in: ids,
          },
        },
        select: {
          id: true,
          rollNo: true,
          name: true,
          currentStandard: true,
          currentClass: true,
        },
      });

      return NextResponse.json(students);
    } else {
      // Handle single student request
      const student = await prisma.student.findUnique({
        where: { id: Number.parseInt(id) },
        select: {
          id: true,
          rollNo: true,
          name: true,
          currentStandard: true,
          currentClass: true,
        },
      });

      if (!student) {
        return NextResponse.json(
          { message: "Student not found" },
          { status: 404 }
        );
      }

      return NextResponse.json(student);
    }
  } catch (error) {
    console.error("Error fetching student(s):", error);
    return NextResponse.json(
      { message: "Error fetching student(s)" },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
