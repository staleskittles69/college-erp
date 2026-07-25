"use client";

const BRANCHES = ["CSE", "ECE", "MECH", "CIVIL"];

interface Props {
  selected: string;
  onSelect: (branch: string) => void;
}

export default function BranchSelector({ selected, onSelect }: Props) {
  return (
    <div className="flex gap-2 flex-wrap mb-4">
      {BRANCHES.map((branch) => (
        <button
          key={branch}
          onClick={() => onSelect(branch)}
          className={`px-4 py-1.5 rounded-lg text-sm font-medium border transition-colors ${
            selected === branch
              ? "bg-orange-600 text-white border-orange-600"
              : "bg-white text-gray-700 border-gray-200 hover:border-orange-300 hover:text-orange-700 hover:bg-orange-50"
          }`}
        >
          {branch}
        </button>
      ))}
    </div>
  );
}
