"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { publishPracticeQuizAction } from "@/app/instructor/practice/actions";

export function PracticePublishButton({
  practiceId,
  published,
}: {
  practiceId: string;
  published: boolean;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState("");

  function toggle() {
    const formData = new FormData();
    formData.set("practice_id", practiceId);
    formData.set("published", String(!published));
    setError("");
    startTransition(async () => {
      const result = await publishPracticeQuizAction(formData);
      if (!result.success) {
        setError(result.message);
        return;
      }
      router.refresh();
    });
  }

  return (
    <div>
      <button
        type="button"
        onClick={toggle}
        disabled={isPending}
        className={`rounded-lg px-3 py-2 text-sm font-medium disabled:opacity-60 ${
          published
            ? "border border-gray-200 text-gray-600 hover:bg-gray-50"
            : "bg-brand-500 text-white hover:bg-brand-600"
        }`}
      >
        {isPending ? "Saving…" : published ? "Unpublish" : "Publish"}
      </button>
      {error && (
        <p role="alert" className="mt-1 text-xs text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}
