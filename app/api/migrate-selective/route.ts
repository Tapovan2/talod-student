import { type NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    const {
      studentIds,
      sourceStandard,
      sourceClass,
      destinationStandard,
      destinationClass,
    } = await request.json();

    // Validate input
    if (!studentIds || !Array.isArray(studentIds) || studentIds.length === 0) {
      return NextResponse.json(
        { success: false, error: "No students selected for migration" },
        { status: 400 }
      );
    }

    if (
      !sourceStandard ||
      !sourceClass ||
      !destinationStandard ||
      !destinationClass
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "Source and destination standard/class are required",
        },
        { status: 400 }
      );
    }

    // Get current academic year (you might want to get this from your app's configuration)
    const currentYear = new Date().getFullYear();

    // Start a transaction to ensure data consistency
    const result = await prisma.$transaction(
      async (tx) => {
        // 1. Find all students to migrate
        const students = await tx.student.findMany({
          where: {
            id: { in: studentIds.map(Number) },
            currentStandard: Number(sourceStandard),
            currentClass: sourceClass,
          },
        });

        if (students.length === 0) {
          throw new Error("No matching students found for migration");
        }

        // 2. Create academic history entries in batch (more efficient)
        await tx.academicHistory.createMany({
          data: students.map((student) => ({
            year: currentYear,
            standard: student.currentStandard,
            class: student.currentClass,
            studentId: student.id,
          })),
        });

        // 3. Update students in batch (more efficient)
        await tx.student.updateMany({
          where: {
            id: { in: students.map((s) => s.id) },
          },
          data: {
            currentStandard: Number(destinationStandard),
            currentClass: destinationClass,
          },
        });

        return {
          migratedCount: students.length,
          students: students,
        };
      },
      {
        timeout: 30000, // Increase timeout to 30 seconds
        maxWait: 10000, // Increase max wait to 10 seconds
      }
    );

    return NextResponse.json({
      success: true,
      migratedCount: result.migratedCount,
      message: `Successfully migrated ${result.migratedCount} students from Standard ${sourceStandard} Class ${sourceClass} to Standard ${destinationStandard} Class ${destinationClass}`,
    });
  } catch (error) {
    console.error("Migration error:", error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Internal server error during migration",
      },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
