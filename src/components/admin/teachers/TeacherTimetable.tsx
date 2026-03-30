const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
const PERIODS = ["9:00 AM", "10:00 AM", "11:00 AM", "12:00 PM", "2:00 PM", "3:00 PM"];

const TIMETABLE: Record<string, string> = {
  "Monday-9:00 AM":    "Data Structures (CSE-A)",
  "Monday-11:00 AM":   "Algorithms (CSE-B)",
  "Tuesday-10:00 AM":  "DBMS (ECE-A)",
  "Wednesday-9:00 AM": "Data Structures (CSE-B)",
  "Wednesday-2:00 PM": "Algorithms (CSE-A)",
  "Thursday-11:00 AM": "DBMS (CSE-A)",
  "Friday-9:00 AM":    "Data Structures (CSE-A)",
  "Friday-3:00 PM":    "Algorithms (ECE-B)",
};

export default function TeacherTimetable() {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <h3 className="text-base font-semibold text-gray-800 mb-4">Timetable</h3>
      <div className="overflow-x-auto">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr>
              <th className="text-left text-xs text-gray-500 font-medium pb-2 pr-4 w-24">Time</th>
              {DAYS.map((d) => (
                <th key={d} className="text-left text-xs text-gray-500 font-medium pb-2 px-2">{d}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {PERIODS.map((period) => (
              <tr key={period} className="border-t border-gray-100">
                <td className="py-2 pr-4 text-xs text-gray-400 whitespace-nowrap">{period}</td>
                {DAYS.map((day) => {
                  const cell = TIMETABLE[`${day}-${period}`];
                  return (
                    <td key={day} className="py-2 px-2">
                      {cell ? (
                        <span className="inline-block bg-indigo-50 text-indigo-700 text-xs rounded-md px-2 py-1 leading-snug">
                          {cell}
                        </span>
                      ) : (
                        <span className="text-gray-200 text-xs">—</span>
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
