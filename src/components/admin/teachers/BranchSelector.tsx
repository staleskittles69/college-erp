"use client";

const BRANCHES = ["CSE", "ECE", "MECH", "CIVIL"];

interface Props {
  selected: string;
  onSelect: (branch: string) => void;
}

export default function BranchSelector({ selected, onSelect }: Props) {
  return (
    <div className="flex gap-2 flex-wrap mb-4">
      {BRANCHES.map((b) => (
        <button
          key={b}
          onClick={() => onSelect(b)}
          className={`px-4 py-1.5 rounded-lg text-sm font-medium border transition-colors ${
            selected === b
              ? "bg-indigo-600 text-white border-indigo-600"
              : "bg-white text-gray-700 border-gray-200 hover:border-indigo-300 hover:text-indigo-700 hover:bg-indigo-50"
          }`}
        >
          {b}
        </button>
      ))}
    </div>
  );
}
