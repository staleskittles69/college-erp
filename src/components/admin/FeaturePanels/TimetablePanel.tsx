const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

const PLACEHOLDER_TIMETABLE: Record<string, { time: string; subject: string; teacher: string }[]> = {
  Monday: [
    { time: "9:00 - 10:00", subject: "Mathematics", teacher: "Dr. Sharma" },
    { time: "10:00 - 11:00", subject: "Physics", teacher: "Prof. Gupta" },
    { time: "11:15 - 12:15", subject: "Chemistry", teacher: "Dr. Verma" },
    { time: "2:00 - 3:00", subject: "English", teacher: "Mrs. Singh" },
  ],
  Tuesday: [
    { time: "9:00 - 10:00", subject: "Physics Lab", teacher: "Prof. Gupta" },
    { time: "10:00 - 12:00", subject: "Chemistry Lab", teacher: "Dr. Verma" },
    { time: "2:00 - 3:00", subject: "Mathematics", teacher: "Dr. Sharma" },
  ],
  Wednesday: [
    { time: "9:00 - 10:00", subject: "English", teacher: "Mrs. Singh" },
    { time: "10:00 - 11:00", subject: "Mathematics", teacher: "Dr. Sharma" },
    { time: "11:15 - 12:15", subject: "Physics", teacher: "Prof. Gupta" },
  ],
  Thursday: [
    { time: "9:00 - 11:00", subject: "Computer Lab", teacher: "Mr. Patel" },
    { time: "11:15 - 12:15", subject: "Chemistry", teacher: "Dr. Verma" },
    { time: "2:00 - 3:00", subject: "Mathematics", teacher: "Dr. Sharma" },
  ],
  Friday: [
    { time: "9:00 - 10:00", subject: "Physics", teacher: "Prof. Gupta" },
    { time: "10:00 - 11:00", subject: "English", teacher: "Mrs. Singh" },
    { time: "11:15 - 12:15", subject: "Mathematics", teacher: "Dr. Sharma" },
  ],
  Saturday: [
    { time: "9:00 - 11:00", subject: "Practical / Lab", teacher: "Various" },
    { time: "11:15 - 12:15", subject: "Tutorial", teacher: "Various" },
  ],
};

const SUBJECT_COLORS: Record<string, string> = {
  Mathematics: "bg-indigo-50 border-indigo-200 text-indigo-700",
  Physics: "bg-blue-50 border-blue-200 text-blue-700",
  "Physics Lab": "bg-blue-50 border-blue-200 text-blue-700",
  Chemistry: "bg-purple-50 border-purple-200 text-purple-700",
  "Chemistry Lab": "bg-purple-50 border-purple-200 text-purple-700",
  English: "bg-green-50 border-green-200 text-green-700",
  "Computer Lab": "bg-orange-50 border-orange-200 text-orange-700",
  "Practical / Lab": "bg-gray-50 border-gray-200 text-gray-700",
  Tutorial: "bg-gray-50 border-gray-200 text-gray-700",
};

interface TimetablePanelProps {
  context?: string;
}

export default function TimetablePanel({ context }: TimetablePanelProps) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between gap-4">
        <div>
          <h3 className="font-semibold text-gray-800">Timetable Management</h3>
          {context && <p className="text-xs text-gray-500 mt-0.5">{context}</p>}
        </div>
        <button className="px-4 py-1.5 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700 transition-colors font-medium">
          + Add Slot
        </button>
      </div>

      {/* Day columns */}
      <div className="overflow-x-auto">
        <div className="min-w-[800px] grid grid-cols-6 divide-x divide-gray-100">
          {DAYS.map((day) => (
            <div key={day}>
              {/* Day header */}
              <div className="px-3 py-2.5 bg-gray-50 border-b border-gray-100 text-center">
                <span className="text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  {day}
                </span>
              </div>
              {/* Slots */}
              <div className="p-2 space-y-2 min-h-[200px]">
                {(PLACEHOLDER_TIMETABLE[day] ?? []).map((slot, i) => (
                  <div
                    key={i}
                    className={`border rounded-lg p-2.5 text-xs group relative cursor-default ${
                      SUBJECT_COLORS[slot.subject] ?? "bg-gray-50 border-gray-200 text-gray-700"
                    }`}
                  >
                    <p className="font-semibold leading-snug">{slot.subject}</p>
                    <p className="opacity-70 mt-0.5">{slot.time}</p>
                    <p className="opacity-60 mt-0.5">{slot.teacher}</p>
                    <div className="absolute top-1.5 right-1.5 hidden group-hover:flex gap-1">
                      <button className="text-[9px] text-gray-400 hover:text-gray-600 font-medium">✎</button>
                      <button className="text-[9px] text-gray-400 hover:text-red-500 font-medium">✕</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
