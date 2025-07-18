import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const standard = searchParams.get("standard");
  const subject = searchParams.get("subject");
  const className = searchParams.get("className");

  try {
    // Build the `where` object dynamically
    const where: Record<string, any> = {};

    if (standard) {
      where.standard = (standard);
    }

    if (className) {
      where.class = className;
    }

    if (subject) {
      where.subject = subject;
    }

    const markEntries = await prisma.markEntry.findMany({ where });

    return NextResponse.json(markEntries);
  } catch (error: any) {
    throw new Error(error);
  } finally {
    await prisma.$disconnect();
  }
}

export async function POST(request: Request) {
  const data = await request.json();

  try {
    // First, find the subject by name

    const markEntry = await prisma.markEntry.create({
      data: {
        name: data.testName,
        date: new Date(data.date),
        Chapter: data.Chapter,
        MaxMarks: parseInt(data.MaxMarks),
        standard: parseInt(data.standard),
        class: data.className,
        subject: data.subject,
      },
    });

    return NextResponse.json(markEntry);
  } catch (e: any) {
    throw new Error(e);
  } finally {
    await prisma.$disconnect();
  }
}

export async function DELETE(request: Request) {
  const { markEntryIds } = await request.json();

  try {
    if (!markEntryIds || markEntryIds.length === 0) {
      return NextResponse.json({ message: "No IDs provided" }, { status: 400 });
    }

    const results = await Promise.all(
      markEntryIds.map(async (id: number) => {
        try {
          // First, delete all related Mark records
          await prisma.mark.deleteMany({
            where: { markEntryId: id },
          });

          // Then, delete the MarkEntry
          await prisma.markEntry.delete({
            where: { id },
          });

          return {
            id,
            deleted: true,
            message: "Mark Entry and related marks deleted successfully",
          };
        } catch (error) {
          console.error(`Error deleting MarkEntry ${id}:`, error);
          return {
            id,
            deleted: false,
            message: `Failed to delete Mark Entry ${id}`,
          };
        }
      })
    );

    const successfulDeletes = results.filter((result) => result.deleted);
    const failedDeletes = results.filter((result) => !result.deleted);

    return NextResponse.json({
      message: `Successfully deleted ${successfulDeletes.length} Mark Entries and their related Marks`,
      successfulDeletes,
      failedDeletes,
    });
  } catch (e: any) {
    console.error("Error in delete operation:", e);
    return NextResponse.json(
      { message: "An error occurred while deleting" },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
