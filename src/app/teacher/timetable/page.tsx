"use client";

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
const SLOTS = ['09:00', '10:00', '11:00', '12:00', '01:00', '02:00', '03:00', '04:00'];

// null = free slot
const TIMETABLE: Record<string, Record<string, { subject: string; section: string } | null>> = {
  '09:00': { Monday: { subject: 'Data Structures', section: 'CS-A' }, Tuesday: null, Wednesday: { subject: 'Algorithms', section: 'CS-B' }, Thursday: null, Friday: { subject: 'Data Structures', section: 'CS-A' } },
  '10:00': { Monday: null, Tuesday: { subject: 'Database Systems', section: 'CS-A' }, Wednesday: null, Thursday: { subject: 'Data Structures', section: 'CS-A' }, Friday: null },
  '11:00': { Monday: { subject: 'Algorithms', section: 'CS-B' }, Tuesday: null, Wednesday: { subject: 'Database Systems', section: 'CS-A' }, Thursday: null, Friday: { subject: 'Operating Systems', section: 'IT-A' } },
  '12:00': { Monday: null, Tuesday: { subject: 'Operating Systems', section: 'IT-A' }, Wednesday: null, Thursday: { subject: 'Algorithms', section: 'CS-B' }, Friday: null },
  '01:00': { Monday: null, Tuesday: null, Wednesday: null, Thursday: null, Friday: null },
  '02:00': { Monday: { subject: 'Database Systems', section: 'CS-A' }, Tuesday: null, Wednesday: { subject: 'Data Structures', section: 'CS-A' }, Thursday: null, Friday: { subject: 'Algorithms', section: 'CS-B' } },
  '03:00': { Monday: null, Tuesday: { subject: 'Algorithms', section: 'CS-B' }, Wednesday: null, Thursday: { subject: 'Operating Systems', section: 'IT-A' }, Friday: null },
  '04:00': { Monday: { subject: 'Operating Systems', section: 'IT-A' }, Tuesday: null, Wednesday: null, Thursday: { subject: 'Database Systems', section: 'CS-A' }, Friday: null },
};

const SUBJECT_COLORS: Record<string, string> = {
  'Data Structures':   'bg-blue-50 text-blue-700 border-blue-200',
  'Algorithms':        'bg-green-50 text-green-700 border-green-200',
  'Database Systems':  'bg-purple-50 text-purple-700 border-purple-200',
  'Operating Systems': 'bg-amber-50 text-amber-700 border-amber-200',
};

export default function TimetablePage() {
  return (
    <div className="space-y-6">

      {/* Hero */}
      <div className="rounded-2xl bg-gradient-to-br from-[#0a1f44] to-[#1a56db] px-8 py-6 text-white shadow-lg">
        <h1 className="text-xl font-bold">Timetable</h1>
        <p className="text-blue-200 text-sm mt-1">Your weekly teaching schedule</p>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-3">
        {Object.entries(SUBJECT_COLORS).map(([subject, cls]) => (
          <span key={subject} className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium ${cls}`}>
            {subject}
          </span>
        ))}
      </div>

      {/* Grid */}
      <div className="rounded-xl border border-gray-200 bg-white overflow-x-auto">
        <table className="w-full text-sm min-w-[640px]">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50">
              <th className="text-left px-4 py-3 font-medium text-gray-500 w-20">Time</th>
              {DAYS.map((day) => (
                <th key={day} className="text-center px-3 py-3 font-medium text-gray-700">{day}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {SLOTS.map((slot, i) => (
              <tr key={slot} className={i !== SLOTS.length - 1 ? 'border-b border-gray-100' : ''}>
                <td className="px-4 py-3 text-xs font-mono text-gray-400 align-middle">{slot}</td>
                {DAYS.map((day) => {
                  const cell = TIMETABLE[slot]?.[day] ?? null;
                  const colorClass = cell ? (SUBJECT_COLORS[cell.subject] ?? 'bg-gray-50 text-gray-700 border-gray-200') : '';
                  return (
                    <td key={day} className="px-2 py-2 text-center align-middle">
                      {cell ? (
                        <div className={`rounded-lg border px-2 py-2 ${colorClass}`}>
                          <p className="font-medium text-xs leading-tight">{cell.subject}</p>
                          <p className="text-xs opacity-70 mt-0.5">{cell.section}</p>
                        </div>
                      ) : (
                        <div className="text-gray-200 text-lg">—</div>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
