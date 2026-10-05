"use client";

import { useState } from "react";
import type { InterviewQuestion } from "@/types";

const DIFFICULTY_STYLE: Record<string, string> = {
  easy: "bg-green-50 text-green-700 border-green-200",
  medium: "bg-orange-50 text-orange-700 border-orange-200",
  hard: "bg-red-50 text-red-700 border-red-200",
};

export function InterviewQuestionList({ questions }: { questions: InterviewQuestion[] }) {
  const [openId, setOpenId] = useState<string | null>(null);

  return (
    <div className="space-y-3">
      {questions.map((q) => (
        <div key={q.id} className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
          <button
            onClick={() => setOpenId(openId === q.id ? null : q.id)}
            className="w-full text-left px-5 py-4 flex items-center justify-between"
          >
            <div>
              <span className="text-xs text-gray-400">{q.category}</span>
              <p className="text-sm font-medium mt-0.5">{q.question}</p>
            </div>
            <span className={`text-xs px-2.5 py-1 rounded-full border capitalize ${DIFFICULTY_STYLE[q.difficulty]}`}>
              {q.difficulty}
            </span>
          </button>
          {openId === q.id && (
            <div className="px-5 pb-4 text-sm text-gray-600 space-y-2 border-t border-gray-100 pt-3">
              {q.tips && <p><span className="font-medium">Tip:</span> {q.tips}</p>}
              {q.expected_answer && <p><span className="font-medium">Key points:</span> {q.expected_answer}</p>}
              {q.explanation && <p className="text-gray-400">{q.explanation}</p>}
            </div>
          )}
        </div>
      ))}
      {questions.length === 0 && <p className="text-sm text-gray-400">No interview questions available yet.</p>}
    </div>
  );
}
