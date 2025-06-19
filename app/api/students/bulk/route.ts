import { NextResponse } from "next/server"
import prisma from "@/lib/prisma" // Adjust the import path based on your setup

export async function POST(request: Request) {
  try {
    const { students } = await request.json()
    console.log("students",students);
    

    if (!students || !Array.isArray(students)) {
      return NextResponse.json(
        { success: false, error: "Invalid students data. Expected an array." },
        { status: 400 }
      )
    }

    if (students.length === 0) {
      return NextResponse.json(
        { success: false, error: "No students provided." },
        { status: 400 }
      )
    }

    const currentYear = new Date().getFullYear()
    const createdStudents = []
    const errors = []

    // Process each student
    for (let i = 0; i < students.length; i++) {
      const studentData = students[i]
      
      try {
        // Validate required fields
        if (!studentData.name || !studentData.rollNo || !studentData.currentStandard || !studentData.class) {
          errors.push(`Row ${i + 1}: Missing required fields (name, rollNo, standard, class)`)
          continue
        }

        // Check for duplicate roll number in the same class and standard
        const existingStudent = await prisma.student.findFirst({
          where: {
            rollNo: studentData.rollNo,
            currentStandard: parseInt(studentData.currentStandard),
            currentClass: studentData.class,
          },
        })

        if (existingStudent) {
          errors.push(`Row ${i + 1}: Student with roll number ${studentData.rollNo} already exists in Standard ${studentData.standard} Class ${studentData.class}`)
          continue
        }

        // Create student with academic history
        const student = await prisma.student.create({
          data: {
            name: studentData.name.trim(),
            rollNo: studentData.rollNo.toString().trim(),
            currentStandard: parseInt(studentData.currentStandard),
            currentClass: studentData.class.trim(),
            academicHistory: {
              create: {
                year: currentYear,
                standard: parseInt(studentData.currentStandard),
                class: studentData.class.trim(),
              },
            },
          },
        })

        createdStudents.push(student)
      } catch (error) {
        console.error(`Error creating student at row ${i + 1}:`, error)
        errors.push(`Row ${i + 1}: ${error.message || 'Unknown error occurred'}`)
      }
    }

    // Return results
    const response = {
      success: createdStudents.length > 0,
      count: createdStudents.length,
      students: createdStudents,
      errors: errors,
      summary: {
        total: students.length,
        created: createdStudents.length,
        failed: errors.length,
      },
    }

    if (errors.length > 0 && createdStudents.length === 0) {
      return NextResponse.json(
        { ...response, error: "No students were created due to errors." },
        { status: 400 }
      )
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error("Bulk upload error:", error)
    return NextResponse.json(
      { success: false, error: "Internal server error during bulk upload." },
      { status: 500 }
    )
  }finally{
    await prisma.$disconnect()
  }
}
