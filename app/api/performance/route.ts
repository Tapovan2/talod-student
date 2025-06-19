import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { redis } from "@/lib/redis";

export const dynamic = "force-dynamic";

const date = new Date();

const formatedDate = date.toLocaleDateString("en-US", {
  day: "2-digit",
  month: "2-digit",
  year: "2-digit",
});

interface ExamDetail {
  examName: string;
  date: Date;
  score: string;
  maxMarks: number;
}

interface SubjectDetails {
  examDetails: ExamDetail[];
}

interface Subjects {
  [subject: string]: SubjectDetails;
}

export async function POST(request: Request) {
  const { standard, classParam, month, year } = await request.json();
  console.log(standard,classParam,month,year);
  

  if (!standard || !classParam) {
    return NextResponse.json(
      { error: "Standard and class are required" },
      { status: 400 }
    );
  }

  const startDate = new Date(Number(year), Number(month), 1);
  startDate.setUTCHours(0, 0, 0, 0); // Set absolute UTC midnight

  const endDate = new Date(Number(year), Number(month) + 1, 0);
  endDate.setUTCHours(0, 0, 0, 0); // Set absolute UTC midnight

  console.log("startDate", startDate);
  console.log("endDate", endDate);

  // const cacheKey = `report-${standard}-${classParam}-${formatedDate}`;

  // const cachedData = await redis.get(cacheKey);

  // if (cachedData) {
  //   return NextResponse.json(cachedData);
  // }

  try {
    const standardInt = Number.parseInt(standard);

    const studentsWithMarks = await prisma.student.findMany({
      where: {
        currentStandard: standardInt,
        currentClass: classParam,
      },

      select: {
        id: true,

        rollNo: true,
        name: true,
        marks: {
          select: {
            studentId: true,
            score: true,
            markEntry: {
              select: {
                name: true,
                date: true,
                subject: true,
                MaxMarks: true,
              },
            },
          },
          where: {
            markEntry: {
              date: {
                gte: startDate,
                lt: endDate,
              },
            },
          },
        },
      },

      orderBy: { rollNo: "asc" },
    });

  
   
   

    if (!studentsWithMarks.length) {
      return NextResponse.json({ message: "No Data Found" }, { status: 404 });
    }
    const reportData = studentsWithMarks.map((student) => {
      const subjects: Subjects = {};
      const studentId = student.marks[0]?.studentId;

      student.marks.forEach((mark) => {
        const subject = mark.markEntry.subject;

        if (!subjects[subject]) {
          subjects[subject] = { examDetails: [] };
        }

        subjects[subject].examDetails.push({
          examName: mark.markEntry.name,
          date: mark.markEntry.date,
          score: mark.score,
          maxMarks: mark.markEntry.MaxMarks,
        });
      });

      return {
        studentId,
        rollNo: student.rollNo,
        name: student.name,
        subjects,
      };
    });

    reportData.sort((a, b) => Number(a.rollNo) - Number(b.rollNo));

    const response = {
      students: reportData,
      standard,
      class: classParam,
    };

    // await redis.set(cacheKey, JSON.stringify(response));

    return NextResponse.json(response);
  } catch (error) {
    console.error("Error generating complete report:", error);
    return NextResponse.json(
      { error: "Failed to generate complete report" },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
