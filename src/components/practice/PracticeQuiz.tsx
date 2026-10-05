"use client";

import { useState } from "react";
import type { PracticeQuestion } from "@/types";
import { submitPracticeAnswer } from "@/app/student/practice/actions";

export function PracticeQuiz({ questions }: { questions: PracticeQuestion[] }) {
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [revealed, setRevealed] = useState(false);

  const question = questions[index % questions.length];
  const isCorrect = selected === question.correct_answer;

  async function handleCheck() {
    if (!selected) return;
    setRevealed(true);
    await submitPracticeAnswer(isCorrect);
  }

  function handleNext() {
    setIndex((i) => i + 1);
    setSelected(null);
    setRevealed(false);
  }

  return (
    <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-6 space-y-4">
      <div className="flex items-center justify-between">
        <span className="text-xs uppercase tracking-wide text-gray-400">{question.topic}</span>
        <span className="text-xs text-gray-400">Question {(index % questions.length) + 1} of {questions.length}</span>
      </div>

      <p className="font-medium text-sm">{question.prompt}</p>

      <div className="space-y-2">
        {question.options?.map((opt) => {
          const isSelected = selected === opt;
          const showState = revealed && (opt === question.correct_answer || isSelected);
          return (
            <button
              key={opt}
              disabled={revealed}
              onClick={() => setSelected(opt)}
              className={`w-full text-left text-sm px-3 py-2 rounded-lg border transition ${
                showState
                  ? opt === question.correct_answer
                    ? "bg-green-50 border-green-300 text-green-700"
                    : "bg-red-50 border-red-300 text-red-700"
                  : isSelected
                  ? "border-brand-500 bg-brand-50"
                  : "border-gray-200 hover:border-gray-300"
              }`}
            >
              {opt}
            </button>
          );
        })}
      </div>

      {revealed && question.explanation && (
        <p className="text-xs text-gray-500 bg-gray-50 rounded-lg p-3">{question.explanation}</p>
      )}

      <div className="flex gap-2">
        {!revealed ? (
          <button onClick={handleCheck} disabled={!selected} className="rounded-lg bg-brand-500 text-white px-4 py-2 text-sm font-medium hover:bg-brand-600 disabled:opacity-50">
            Check Answer
          </button>
        ) : (
          <button onClick={handleNext} className="rounded-lg bg-brand-500 text-white px-4 py-2 text-sm font-medium hover:bg-brand-600">
            Next Question →
          </button>
        )}
      </div>
    </div>
  );
}
