"use client";

import { useRef } from "react";
import { addVehicle } from "./actions";

export function AddVehicleForm() {
  const formRef = useRef<HTMLFormElement>(null);

  async function handleSubmit(formData: FormData) {
    await addVehicle(formData);
    formRef.current?.reset();
  }

  return (
    <form ref={formRef} action={handleSubmit} className="flex flex-col gap-3">
      <div className="grid grid-cols-2 gap-3">
        <label className="flex flex-col gap-1 text-sm font-medium text-zinc-700 dark:text-zinc-300">
          Year
          <input
            name="year"
            type="number"
            min={1900}
            max={new Date().getFullYear() + 1}
            placeholder="2019"
            className="h-11 rounded-lg border border-zinc-300 bg-white px-3 text-base text-zinc-900 outline-none focus:border-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50 dark:focus:border-zinc-400"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm font-medium text-zinc-700 dark:text-zinc-300">
          Make <span className="text-red-500">*</span>
          <input
            name="make"
            type="text"
            required
            placeholder="Toyota"
            className="h-11 rounded-lg border border-zinc-300 bg-white px-3 text-base text-zinc-900 outline-none focus:border-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50 dark:focus:border-zinc-400"
          />
        </label>
      </div>

      <label className="flex flex-col gap-1 text-sm font-medium text-zinc-700 dark:text-zinc-300">
        Model <span className="text-red-500">*</span>
        <input
          name="model"
          type="text"
          required
          placeholder="Camry"
          className="h-11 rounded-lg border border-zinc-300 bg-white px-3 text-base text-zinc-900 outline-none focus:border-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50 dark:focus:border-zinc-400"
        />
      </label>

      <label className="flex flex-col gap-1 text-sm font-medium text-zinc-700 dark:text-zinc-300">
        Nickname
        <input
          name="nickname"
          type="text"
          placeholder="The Daily"
          className="h-11 rounded-lg border border-zinc-300 bg-white px-3 text-base text-zinc-900 outline-none focus:border-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50 dark:focus:border-zinc-400"
        />
      </label>

      <label className="flex flex-col gap-1 text-sm font-medium text-zinc-700 dark:text-zinc-300">
        VIN (optional)
        <input
          name="vin"
          type="text"
          maxLength={17}
          placeholder="1HGBH41JXMN109186"
          className="h-11 rounded-lg border border-zinc-300 bg-white px-3 font-mono text-sm text-zinc-900 outline-none focus:border-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50 dark:focus:border-zinc-400"
        />
      </label>

      <button
        type="submit"
        className="mt-1 h-12 rounded-lg bg-zinc-900 px-4 font-medium text-white transition-colors hover:bg-zinc-700 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
      >
        Add vehicle
      </button>
    </form>
  );
}
