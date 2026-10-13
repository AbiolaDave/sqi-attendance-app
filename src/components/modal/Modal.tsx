"use client";
import React from "react";
import {
  Dialog,
  DialogHeader,
  DialogBody,
  DialogFooter,
} from "@material-tailwind/react";
import type { Cohort, DepartmentType, Level } from "@/types";

type ModalProps = {
  departments: DepartmentType[];
  levels: Level[];
  cohorts: Cohort[];
};

const inputClassName =
  "mt-1 w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm text-blue-500 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-100";
const labelClassName = "text-sm font-medium text-blue-600";

const Modal = ({ departments, levels, cohorts }: ModalProps) => {
  const SafeDialog = Dialog as React.ComponentType<any>;
  const SafeDialogHeader = DialogHeader as React.ComponentType<any>;
  const SafeDialogBody = DialogBody as React.ComponentType<any>;
  const SafeDialogFooter = DialogFooter as React.ComponentType<any>;

  const [open, setOpen] = React.useState(false);
  const [departmentId, setDepartmentId] = React.useState("");
  const [levelId, setLevelId] = React.useState("");
  const [submitted, setSubmitted] = React.useState(false);

  const handleOpen = () => {
    setOpen((current) => !current);
    setSubmitted(false);
  };

  const availableCohorts = cohorts.filter(
    (cohort) =>
      (!departmentId || cohort.department_id === departmentId) &&
      (!levelId || cohort.level_id === levelId),
  );

  const handleDepartmentChange = (
    event: React.ChangeEvent<HTMLSelectElement>,
  ) => {
    setDepartmentId(event.target.value);
    setLevelId("");
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitted(true);
  };

  return (
    <>
      <button
        type="button"
        onClick={handleOpen}
        className="rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white transition hover:bg-brand-600"
      >
        + Add New Student
      </button>
      <SafeDialog
        open={open}
        handler={handleOpen}
        className="max-h-[90vh] w-[calc(100%-2rem)] max-w-2xl overflow-y-auto mx-auto mt-20 border border-gray-500 shadow-2xl shadow-gray-600 rounded-2xl bg-white"
      >
        <SafeDialogHeader className="border-b  border-gray-100 px-6 py-5 mx-auto">
          <div>
            <h2 className="text-lg font-semibold text-blue-600">
              Add new student
            </h2>
            <p className="mt-1 text-sm font-normal text-gray-600">
              Create a student profile and assign their academic placement.
            </p>
          </div>
        </SafeDialogHeader>
        <SafeDialogBody className="px-6 py-5">
          <form
            id="add-student-form"
            onSubmit={handleSubmit}
            className="space-y-5"
          >
            <div>
              <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-blue-500">
                Personal details
              </p>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <label className={labelClassName}>
                  Full name
                  <input
                    name="full_name"
                    type="text"
                    required
                    placeholder="e.g. Ada Lovelace"
                    className={inputClassName}
                  />
                </label>
                <label className={labelClassName}>
                  Email address
                  <input
                    name="email"
                    type="email"
                    required
                    placeholder="student@example.com"
                    className={inputClassName}
                  />
                </label>
                <label className={labelClassName}>
                  Phone number
                  <input
                    name="phone"
                    type="tel"
                    placeholder="+234 800 000 0000"
                    className={inputClassName}
                  />
                </label>
                <label className={labelClassName}>
                  Student ID
                  <input
                    name="student_id"
                    type="text"
                    placeholder="Assigned automatically"
                    disabled
                    className={`${inputClassName} bg-gray-50 text-gray-400`}
                  />
                </label>
              </div>
            </div>
            <div>
              <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-400">
                Academic placement
              </p>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <label className={labelClassName}>
                  Department
                  <select
                    name="department_id"
                    required
                    value={departmentId}
                    onChange={handleDepartmentChange}
                    className={inputClassName}
                  >
                    <option value="">Select department</option>
                    {departments.map((department) => (
                      <option key={department.id} value={department.id}>
                        {department.department}
                      </option>
                    ))}
                  </select>
                </label>
                <label className={labelClassName}>
                  Level
                  <select
                    name="level_id"
                    required
                    value={levelId}
                    onChange={(event) => setLevelId(event.target.value)}
                    className={inputClassName}
                  >
                    <option value="">Select level</option>
                    {levels.map((level) => (
                      <option key={level.id} value={level.id}>
                        {level.name}
                      </option>
                    ))}
                  </select>
                </label>
                <label className={labelClassName}>
                  Cohort
                  <select
                    name="cohort_id"
                    required
                    disabled={!departmentId || !levelId}
                    className={inputClassName}
                  >
                    <option value="">
                      {departmentId && levelId
                        ? "Select cohort"
                        : "Choose department and level"}
                    </option>
                    {availableCohorts.map((cohort) => (
                      <option key={cohort.id} value={cohort.id}>
                        {cohort.name}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
            </div>
            <div>
              <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-400">
                Fees
              </p>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <label className={labelClassName}>
                  Total fee
                  <input
                    name="total_fee"
                    type="number"
                    min="0"
                    step="0.01"
                    defaultValue="0"
                    required
                    className={inputClassName}
                  />
                </label>
                <label className={labelClassName}>
                  Amount paid
                  <input
                    name="amount_paid"
                    type="number"
                    min="0"
                    step="0.01"
                    defaultValue="0"
                    required
                    className={inputClassName}
                  />
                </label>
              </div>
            </div>
            {submitted && (
              <p className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800">
                The form is ready. Connect the submit action to your
                student/auth provider to create the record.
              </p>
            )}
          </form>
        </SafeDialogBody>
        <SafeDialogFooter className="border-t border-gray-100 px-6 py-4">
          <button
            type="button"
            onClick={handleOpen}
            className="rounded-lg px-6 py-2 bg-red-500 text-sm font-medium text-white mr-10 hover:bg-red-700"
          >
            Cancel
          </button>
          <button
            type="submit"
            form="add-student-form"
            className="rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white hover:bg-brand-600"
          >
            Add student
          </button>
        </SafeDialogFooter>
      </SafeDialog>
    </>
  );
};

export default Modal;
