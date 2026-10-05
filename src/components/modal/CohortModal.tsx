"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Instructor, Level } from "@/types";

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
type ScheduleRow = { day_of_week: number; start_time: string; end_time: string };

export function CohortModal({ levels, instructor }: { levels: Level[]; instructor: Instructor & { profile?: { full_name: string } } }) {
	const router = useRouter();
	const [open, setOpen] = useState(false);
	const [levelId, setLevelId] = useState(levels[0]?.id ?? "");
	const [name, setName] = useState("");
	const [startDate, setStartDate] = useState("");
	const [schedule, setSchedule] = useState<ScheduleRow[]>([{ day_of_week: 0, start_time: "08:00", end_time: "10:00" }]);
	const [error, setError] = useState("");
	const [saving, setSaving] = useState(false);

	function updateRow(index: number, field: keyof ScheduleRow, value: string) {
		setSchedule((rows) => rows.map((row, rowIndex) => rowIndex === index ? { ...row, [field]: field === "day_of_week" ? Number(value) : value } : row));
	}

	async function submit(event: React.FormEvent<HTMLFormElement>) {
		event.preventDefault();
		setSaving(true);
		setError("");
		const response = await fetch("/api/cohorts", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ level_id: levelId, name, start_date: startDate || undefined, instructor_id: instructor.id, schedule }),
		});
		const result = await response.json();
		if (!response.ok) {
			setError(result.error ?? "Unable to create cohort.");
			setSaving(false);
			return;
		}
		setOpen(false);
		setName("");
		setStartDate("");
		setSchedule([{ day_of_week: 0, start_time: "08:00", end_time: "10:00" }]);
		setSaving(false);
		router.refresh();
	}

	return (
		<>
			<button type="button" onClick={() => setOpen(true)} className="rounded-lg bg-brand-700 px-4 py-2 text-sm font-medium text-white hover:bg-brand-800">New cohort</button>
			{open && (
				<div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/50 p-4" role="dialog" aria-modal="true" aria-labelledby="cohort-modal-title">
					<form onSubmit={submit} className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-6 shadow-xl">
						<div className="flex items-start justify-between gap-4"><div><h2 id="cohort-modal-title" className="text-lg font-semibold">Create a new cohort</h2><p className="mt-1 text-sm text-gray-500">Schedule recurring class days for {instructor.profile?.full_name ?? "yourself"}.</p></div><button type="button" onClick={() => setOpen(false)} className="text-2xl leading-none text-gray-400" aria-label="Close">&times;</button></div>
						<div className="mt-6 grid gap-4 sm:grid-cols-2">
							<label className="text-sm font-medium text-gray-700">Level<select value={levelId} onChange={(event) => setLevelId(event.target.value)} required className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 font-normal">{levels.map((level) => <option key={level.id} value={level.id}>{level.name}</option>)}</select></label>
							<label className="text-sm font-medium text-gray-700">Cohort name<input value={name} onChange={(event) => setName(event.target.value)} placeholder="October 2026" required className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 font-normal" /></label>
							<label className="text-sm font-medium text-gray-700">Start date<input type="date" value={startDate} onChange={(event) => setStartDate(event.target.value)} className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 font-normal" /></label>
							<div className="text-sm font-medium text-gray-700">Instructor<div className="mt-1 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 font-normal">{instructor.profile?.full_name ?? "Current instructor"}</div></div>
						</div>
						<div className="mt-6"><div className="flex items-center justify-between"><div><h3 className="text-sm font-semibold">Weekly class schedule</h3><p className="text-xs text-gray-500">Add as many days as this cohort needs.</p></div><button type="button" onClick={() => setSchedule((rows) => [...rows, { day_of_week: 0, start_time: "08:00", end_time: "10:00" }])} className="text-sm font-medium text-brand-700">+ Add day</button></div>
							<div className="mt-3 space-y-3">{schedule.map((row, index) => <div key={`${index}-${row.day_of_week}`} className="grid grid-cols-[1fr_1fr_1fr_auto] items-end gap-2"><label className="text-xs text-gray-500">Day<select value={row.day_of_week} onChange={(event) => updateRow(index, "day_of_week", event.target.value)} className="mt-1 block w-full rounded-lg border border-gray-300 px-2 py-2 text-sm text-gray-900">{DAYS.map((day, dayIndex) => <option key={day} value={dayIndex}>{day}</option>)}</select></label><label className="text-xs text-gray-500">Starts<input type="time" value={row.start_time} onChange={(event) => updateRow(index, "start_time", event.target.value)} required className="mt-1 block w-full rounded-lg border border-gray-300 px-2 py-2 text-sm text-gray-900" /></label><label className="text-xs text-gray-500">Ends<input type="time" value={row.end_time} onChange={(event) => updateRow(index, "end_time", event.target.value)} required className="mt-1 block w-full rounded-lg border border-gray-300 px-2 py-2 text-sm text-gray-900" /></label><button type="button" disabled={schedule.length === 1} onClick={() => setSchedule((rows) => rows.filter((_, rowIndex) => rowIndex !== index))} className="px-2 py-2 text-sm text-gray-500 disabled:opacity-30" aria-label="Remove day">Remove</button></div>)}</div>
						</div>
						{error && <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
						<div className="mt-6 flex justify-end gap-3"><button type="button" onClick={() => setOpen(false)} className="rounded-lg px-4 py-2 text-sm text-gray-600 hover:bg-gray-100">Cancel</button><button type="submit" disabled={saving} className="rounded-lg bg-brand-700 px-4 py-2 text-sm font-medium text-white disabled:opacity-50">{saving ? "Creating..." : "Create cohort"}</button></div>
					</form>
				</div>
			)}
		</>
	);
}
