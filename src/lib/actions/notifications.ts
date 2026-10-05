"use server";

import { requireProfile } from "@/lib/auth";
import { markNotificationRead as markReadQuery } from "@/lib/data/queries";
import { revalidatePath } from "next/cache";

export async function markNotificationRead(id: string, redirectPath: string) {
  await requireProfile();
  markReadQuery(id);
  revalidatePath(redirectPath);
}
