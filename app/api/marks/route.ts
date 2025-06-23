import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { redis } from "@/lib/redis";
import { CHANNELS, publishEvent } from "@/lib/notificationService";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const markEntryId = searchParams.get("markEntryId");


  if (!markEntryId) {
    return NextResponse.json(
      { error: "Mark entry ID is required" },
      { status: 400 }
    );
  }

  try{

  const marks = await prisma.mark.findMany({
    where: {
      markEntryId: parseInt(markEntryId),
    },
    include: {
      student: true,

      markEntry: true,
    },
  });
  console.log("length",marks.length);
  

  return NextResponse.json(marks);
}catch(e:any){
  console.log("error",e);
  throw new Error(e)
 
  
}finally{
  await prisma.$disconnect();
}
}


export async function POST(request: Request) {
  const data = await request.json()

  try {
    // let updatedNotificationSent = false
    // let createdNotificationSent = false
    // let updatedNotificationData = {}
    // let createdNotificationData = {}

    const marks = await Promise.all(
      data.map(
        async (mark: {
          student: any
          subject: any
          score: any
          academicYear: any
          markEntryId: any
        }) => {
          const student = await prisma.student.findUnique({
            where: { id: mark.student },
          })

          const markEntry = await prisma.markEntry.findUnique({
            where: { id: mark.markEntryId },
          })

          if (!student || !markEntry) {
            throw new Error("Student or Mark Entry not found")
          }

          // Check if the mark already exists for the student and mark entry
          const existingMark = await prisma.mark.findUnique({
            where: {
              studentId_markEntryId: {
                studentId: student.id,
                markEntryId: markEntry.id,
              },
            },
          })

          if (existingMark) {
            // If the mark already exists, update it
            // if (!updatedNotificationSent) {
            //   updatedNotificationData = {
            //     standard: markEntry.standard,
            //     class: markEntry.class,
            //     subject: markEntry.subject,
            //   }
            //   updatedNotificationSent = true
            // }
            return prisma.mark.update({
              where: {
                studentId_markEntryId: {
                  studentId: student.id,
                  markEntryId: markEntry.id,
                },
              },
              data: {
                score: mark.score,
                academicYear: mark.academicYear,
              },
            })
          } else {
            // // If the mark doesn't exist, create a new one
            // if (!createdNotificationSent) {
            //   createdNotificationData = {
            //     standard: markEntry.standard,
            //     class: markEntry.class,
            //     subject: markEntry.subject,
            //   }
            //   createdNotificationSent = true
            // }
            return prisma.mark.create({
              data: {
                student: { connect: { id: student.id } },
                markEntry: { connect: { id: markEntry.id } },
                score: mark.score,
                academicYear: mark.academicYear,
              },
            })
          }
        },
      ),
    )

    // Send notifications after processing all marks
    // if (updatedNotificationSent) {
    //   await publishEvent(CHANNELS.MARK_UPDATED, JSON.stringify(updatedNotificationData))
    // }

    // if (createdNotificationSent) {
    //   await publishEvent(CHANNELS.MARK_CREATED, JSON.stringify(createdNotificationData))
    // }

    return NextResponse.json(marks)
  } catch (e: any) {
    throw new Error(e)
  } finally {
    await prisma.$disconnect()
  }
}


