export default function NailShapeIcon({ shape }) {
  const paths = {
    square: "M9 5h18v28H9z",
    squoval: "M10 5h16c2 0 3 1 3 3v22c0 2-1 3-3 3H10c-2 0-3-1-3-3V8c0-2 1-3 3-3z",
    oval: "M18 4c7 0 11 6 11 15v5c0 8-4 12-11 12S7 32 7 24v-5C7 10 11 4 18 4z",
    almond: "M18 3c7 5 10 12 10 22 0 7-4 11-10 11S8 32 8 25C8 15 11 8 18 3z",
    coffin: "M12 5h12l5 20-4 9H11l-4-9 5-20z",
  };

  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 36 40"
      className="h-9 w-9 shrink-0 text-[#8EB1D1]"
      fill="none"
    >
      <path d={paths[shape]} stroke="currentColor" strokeWidth="2" />
    </svg>
  );
}
