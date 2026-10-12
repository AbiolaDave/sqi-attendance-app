import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { requireProfile } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import { CohortModel } from "@/models/Cohort";
import { User } from "@/models/User";

type StudentInput = {
  full_name?: unknown;
  email?: unknown;
  phone?: unknown;
  student_id?: unknown;
  password?: unknown;
  total_fee?: unknown;
  amount_paid?: unknown;
};

export async function POST(
  request: Request,
  { params }: { params: { cohortId: string } },
) {
  const profile = await requireProfile(["instructor"]);
  if (!mongoose.isValidObjectId(params.cohortId)) {
    return NextResponse.json({ error: "Cohort not found." }, { status: 404 });
  }

  let body: StudentInput;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const full_name =
    typeof body.full_name === "string" ? body.full_name.trim() : "";
  const email =
    typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  const password = typeof body.password === "string" ? body.password : "";
  const phone = typeof body.phone === "string" ? body.phone.trim() : "";
  const student_id =
    typeof body.student_id === "string" ? body.student_id.trim() : "";
  const total_fee = Number(body.total_fee);
  const amount_paid = Number(body.amount_paid);

  if (!full_name || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json(
      { error: "Enter the student's full name and a valid email address." },
      { status: 400 },
    );
  }
  if (password.length < 8) {
    return NextResponse.json(
      { error: "The initial password must be at least 8 characters." },
      { status: 400 },
    );
  }
  if (
    !Number.isFinite(total_fee) ||
    !Number.isFinite(amount_paid) ||
    total_fee < 0 ||
    amount_paid < 0 ||
    amount_paid > total_fee
  ) {
    return NextResponse.json(
      { error: "Enter valid fees; amount paid cannot exceed the total fee." },
      { status: 400 },
    );
  }

  await connectToDatabase();
  const cohort = await CohortModel.findById(params.cohortId);
  if (!cohort) {
    return NextResponse.json({ error: "Cohort not found." }, { status: 404 });
  }

  const canManage = cohort.instructor_id === profile._id ||
    cohort.instructor_ids.includes(profile._id);
  if (!canManage) {
    return NextResponse.json(
      { error: "You are not assigned to manage this cohort." },
      { status: 403 },
    );
  }
  const instructor = await User.findOne({
    _id: profile._id,
    role: "instructor",
    isActive: true,
    department_id: cohort.department_id,
  }).select("_id");
  if (!instructor) {
    return NextResponse.json(
      { error: "You can only add students to a cohort in your department." },
      { status: 403 },
    );
  }

  if (await User.exists({ email })) {
    return NextResponse.json(
      { error: "An account with this email already exists." },
      { status: 409 },
    );
  }

  try {
    const student = await User.create({
      full_name,
      email,
      phone: phone || undefined,
      role: "student",
      department_id: cohort.department_id,
      cohort_id: String(cohort._id),
      level_id: cohort.level_id,
      student_id: student_id || undefined,
      password,
      total_fee,
      amount_paid,
      isActive: true,
    });
    return NextResponse.json(
      {
        student: {
          id: String(student._id),
          full_name: student.full_name,
          email: student.email,
          phone: student.phone,
          student_id: student.student_id,
          cohort_id: student.cohort_id,
          total_fee: student.total_fee,
          amount_paid: student.amount_paid,
        },
      },
      { status: 201 },
    );
  } catch (error) {
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === 11000
    ) {
      return NextResponse.json(
        { error: "An account with this email already exists." },
        { status: 409 },
      );
    }
    throw error;
  }
}
