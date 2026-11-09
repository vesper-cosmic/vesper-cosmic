"use client";

import {
  nailSizeChart,
  nailSizeFingers,
  nailSizeKeys,
  standardNailSizes,
} from "@/lib/formOptions";

/**
 * Custom press-on nails: choose a standard size (XS–L) OR enter your own
 * nail widths. Controlled: onChange(patch) with sizeMode / standardSize /
 * measurements.
 */
export default function NailSizePicker({ sizeMode, standardSize, measurements = {}, errors = {}, onChange }) {
  return (
    <div className="space-y-3">
      <p className="text-sm font-semibold text-[#1C2B48]">Nail Size</p>
      <div className="grid gap-2 sm:grid-cols-2">
        <ModeOption
          active={sizeMode === "standard"}
          onSelect={() => onChange({ sizeMode: "standard" })}
          title="Choose a standard size"
          subtitle="XS, S, M or L"
        />
        <ModeOption
          active={sizeMode === "custom"}
          onSelect={() => onChange({ sizeMode: "custom" })}
          title="Enter my own nail widths"
          subtitle="Measure each nail in mm for a custom fit"
        />
      </div>
      {errors.sizeMode ? <p className="text-xs text-red-500">{errors.sizeMode}</p> : null}

      {sizeMode === "standard" ? (
        <div className="space-y-3">
          <div className="flex flex-wrap gap-2">
            {standardNailSizes.map((size) => (
              <button
                key={size}
                type="button"
                onClick={() => onChange({ standardSize: size })}
                aria-pressed={standardSize === size}
                className={`min-w-[3.5rem] rounded border px-4 py-2 text-sm font-bold transition ${
                  standardSize === size
                    ? "border-[#1C2B48] bg-[#1C2B48] text-white"
                    : "border-[#8EB1D1]/50 bg-white text-[#1C2B48] hover:bg-[#C4D8E5]"
                }`}
              >
                {size}
              </button>
            ))}
          </div>
          {errors.standardSize ? <p className="text-xs text-red-500">{errors.standardSize}</p> : null}
          <NailSizeChart highlight={standardSize} />
        </div>
      ) : null}

      {sizeMode === "custom" ? (
        <div className="space-y-3">
          <p className="text-xs leading-5 text-[#5B7893]">
            Measure the widest part of each nail in millimeters. If you&apos;re between sizes, size up.
          </p>
          {[
            ["Left Hand", nailSizeKeys.slice(0, 5)],
            ["Right Hand", nailSizeKeys.slice(5)],
          ].map(([title, keys]) => (
            <div key={title}>
              <p className="mb-1 text-xs font-semibold uppercase tracking-[0.1em] text-[#5B7893]">{title}</p>
              <div className="grid grid-cols-5 gap-2">
                {keys.map(([key, label]) => (
                  <label key={key} className="block">
                    <span className="mb-1 block text-[11px] text-[#5B7893]">{label}</span>
                    <input
                      type="number"
                      min="5"
                      max="25"
                      step="0.5"
                      inputMode="decimal"
                      value={measurements[key] || ""}
                      onChange={(event) =>
                        onChange({ measurements: { ...measurements, [key]: event.target.value } })
                      }
                      placeholder="mm"
                      className={`w-full rounded border bg-white px-2 py-2 text-sm text-[#1C2B48] outline-none focus:border-[#8EB1D1] ${
                        errors[key] ? "border-red-400" : "border-[#8EB1D1]/40"
                      }`}
                    />
                  </label>
                ))}
              </div>
            </div>
          ))}
          {nailSizeKeys.some(([key]) => errors[key]) ? (
            <p className="text-xs text-red-500">Please fill in every nail width.</p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

function ModeOption({ active, onSelect, title, subtitle }) {
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={active}
      className={`rounded border p-3 text-left transition ${
        active
          ? "border-[#1C2B48] bg-white shadow-sm"
          : "border-[#8EB1D1]/40 bg-white/60 hover:bg-white"
      }`}
    >
      <span className="flex items-center gap-2 text-sm font-semibold text-[#1C2B48]">
        <span
          aria-hidden="true"
          className={`h-3.5 w-3.5 rounded-full border-2 ${
            active ? "border-[#1C2B48] bg-[#1C2B48]" : "border-[#8EB1D1]"
          }`}
        />
        {title}
      </span>
      <span className="mt-1 block pl-5 text-xs text-[#5B7893]">{subtitle}</span>
    </button>
  );
}

/** Size chart: nail widths (mm) per standard size. */
export function NailSizeChart({ highlight }) {
  return (
    <div className="overflow-x-auto rounded border border-[#8EB1D1]/25 bg-white/70">
      <table className="w-full min-w-[320px] text-center text-xs text-[#35506B]">
        <thead className="bg-[#E8ECEF] text-[11px] uppercase tracking-[0.06em] text-[#5B7893]">
          <tr>
            <th className="px-2 py-1.5 text-left">Size (mm)</th>
            {nailSizeFingers.map((finger) => (
              <th key={finger} className="px-2 py-1.5">
                {finger}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {standardNailSizes.map((size) => (
            <tr key={size} className={highlight === size ? "bg-[#C4D8E5] font-semibold text-[#1C2B48]" : ""}>
              <td className="px-2 py-1.5 text-left font-semibold">{size}</td>
              {nailSizeChart[size].map((width, index) => (
                <td key={index} className="px-2 py-1.5">
                  {width}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
