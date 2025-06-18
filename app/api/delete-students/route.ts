import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST(request: Request) {
  const data = await request.json();
  const { studentIds } = data;

  try {
    // First delete all marks for the selected students
    await prisma.mark.deleteMany({
      where: {
        studentId: { in: studentIds.map((id) => parseInt(id)) },
      },
    });

    // Then delete academic history for all selected students
    await prisma.academicHistory.deleteMany({
      where: {
        studentId: { in: studentIds.map((id) => parseInt(id)) },
      },
    });

    // Finally delete the students
    await prisma.student.deleteMany({
      where: {
        id: { in: studentIds.map((id) => parseInt(id)) },
      },
    });

    return NextResponse.json({ message: "Students deleted successfully" });
  } catch (error) {
    console.error("Error deleting students:", error);
    return NextResponse.json(
      { error: "Error deleting students" },
      { status: 500 }
    );
  }finally{
    await prisma.$disconnect()
  }
}
