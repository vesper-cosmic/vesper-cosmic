"use client";

import Link from "next/link";
import { staticCategories } from "@/lib/productData";

/**
 * The category list (vertical): parent groups with their sub-categories and
 * counts. Used in the desktop sidebar and in the mobile drawer.
 * `onPick` runs after any selection (the drawer uses it to close itself).
 */
export default function CategoryPanel({
  categoryCounts,
  selectedFilter,
  onToggleGroup,
  onToggleCategory,
  showAbout = false,
  onPick = () => {},
  roomy = false,
}) {
  const pad = roomy ? "py-3" : "py-2";
  const childPad = roomy ? "py-2.5" : "py-1.5";

  return (
    <>
      <nav className="flex flex-col gap-1">
        {staticCategories.map((group) => {
          const isParent = Boolean(group.children);
          const groupCount = isParent
            ? group.children.reduce((sum, child) => sum + (categoryCounts[child.categoryId] || 0), 0)
            : categoryCounts[group.categoryId] || 0;
          const isActive =
            selectedFilter?.type === "group"
              ? selectedFilter.id === group.id
              : selectedFilter?.type === "category" && selectedFilter.id === group.categoryId;

          return (
            <div key={group.id} className="flex w-full flex-col">
              <button
                type="button"
                onClick={() => {
                  onToggleGroup(group);
                  onPick();
                }}
                aria-expanded={isParent ? isActive : undefined}
                className={`flex items-center gap-2 rounded border px-3 ${pad} text-left text-sm font-semibold transition ${
                  isActive
                    ? "border-[#8EB1D1] bg-[#EEF1F4] text-[#1C2B48]"
                    : "border-[#1C2B48]/10 text-[#1C2B48] hover:border-[#8EB1D1] hover:bg-[#EEF1F4]"
                }`}
              >
                <span>{group.title}</span>
                <span className="text-xs font-normal text-[#5B7893]">{groupCount}</span>
              </button>

              {isParent ? (
                <div className="mt-1 flex flex-col gap-1 pl-3">
                  {group.children.map((child) => {
                    const count = child.categoryId ? categoryCounts[child.categoryId] || 0 : 0;
                    const childActive = selectedFilter?.type === "category" && selectedFilter.id === child.categoryId;
                    const isDisabled = !child.categoryId && count === 0;

                    return (
                      <button
                        key={child.id}
                        type="button"
                        onClick={() => {
                          onToggleCategory(child.categoryId);
                          onPick();
                        }}
                        disabled={isDisabled}
                        className={`flex w-full items-center gap-2 rounded border px-2.5 ${childPad} text-left text-xs font-medium transition ${
                          isDisabled
                            ? "cursor-not-allowed border-transparent text-[#5B7893]/60"
                            : childActive
                              ? "border-[#8EB1D1] bg-[#EEF1F4] text-[#1C2B48]"
                              : "border-[#1C2B48]/10 text-[#35506B] hover:border-[#8EB1D1] hover:bg-[#EEF1F4]"
                        }`}
                      >
                        <span>{child.title}</span>
                        <span className="text-xs font-normal text-[#5B7893]">{count}</span>
                      </button>
                    );
                  })}
                </div>
              ) : null}
            </div>
          );
        })}
      </nav>

      {showAbout ? (
        <Link
          href="/about"
          className={`mt-4 flex items-center gap-2 rounded border border-[#1C2B48]/10 px-3 ${pad} text-sm font-semibold text-[#1C2B48] transition hover:border-[#8EB1D1] hover:bg-[#EEF1F4]`}
        >
          <svg aria-hidden="true" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          About
        </Link>
      ) : null}
    </>
  );
}
