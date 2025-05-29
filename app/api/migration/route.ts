import { type NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    const { currentStandard, nextStandard } = await request.json();

    // Validate input
    if (!currentStandard || !nextStandard) {
      return NextResponse.json(
        { success: false, error: "Current and next standard are required" },
        { status: 400 }
      );
    }

    // Get current academic year
    const currentYear = new Date().getFullYear();

    // Start a transaction to ensure data consistency
    const result = await prisma.$transaction(
      async (tx) => {
        // 1. Find all students in the current standard
        const students = await tx.student.findMany({
          where: {
            currentStandard: Number(currentStandard),
          },
        });

        if (students.length === 0) {
          throw new Error(`No students found in Standard ${currentStandard}`);
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

        // 3. Update all students in batch (more efficient)
        await tx.student.updateMany({
          where: {
            currentStandard: Number(currentStandard),
          },
          data: {
            currentStandard: Number(nextStandard),
            // Note: This keeps their current class name
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
      message: `Successfully migrated ${result.migratedCount} students from Standard ${currentStandard} to Standard ${nextStandard}`,
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
