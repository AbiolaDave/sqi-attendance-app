import { connectToDatabase } from "@/lib/mongodb";
import { seedAdmin } from "./seedAdmin";

export async function connectDb() {
  await connectToDatabase();
  await seedAdmin();
}
