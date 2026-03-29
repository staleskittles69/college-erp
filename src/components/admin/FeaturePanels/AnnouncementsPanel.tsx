const PLACEHOLDER_NOTICES = [
  {
    id: 1,
    title: "Mid-Semester Examination Schedule Released",
    body: "The mid-semester examination timetable has been published. Students are advised to check the schedule.",
    date: "2026-03-28",
    pinned: true,
    target: "All",
  },
  {
    id: 2,
    title: "Sports Day Registration Open",
    body: "Students can register for Sports Day events through the admin office by 5th April.",
    date: "2026-03-26",
    pinned: false,
    target: "All",
  },
  {
    id: 3,
    title: "Library Maintenance Notice",
    body: "The library will remain closed on 1st April for maintenance work.",
    date: "2026-03-25",
    pinned: false,
    target: "All",
  },
];

interface AnnouncementsPanelProps {
  context?: string;
}

export default function AnnouncementsPanel({ context }: AnnouncementsPanelProps) {
  return (
    <div className="space-y-5">
      {/* Post New Announcement */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="font-semibold text-gray-800 mb-4">Post New Announcement</h3>
        <div className="space-y-3">
          <input
            type="text"
            placeholder="Announcement title..."
            className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400"
          />
          <textarea
            rows={3}
            placeholder="Write your announcement here..."
            className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400"
          />
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <select className="text-sm border border-gray-200 rounded-lg px-3 py-2 text-gray-600 focus:outline-none">
                <option>Target: All Students</option>
                <option>Target: CSE</option>
                <option>Target: ECE</option>
                <option>Target: MECH</option>
              </select>
              <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
                <input type="checkbox" className="rounded text-indigo-600" />
                Pin announcement
              </label>
            </div>
            <button className="px-5 py-2 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700 transition-colors font-medium">
              Publish
            </button>
          </div>
        </div>
        {context && (
          <p className="mt-3 text-xs text-gray-400">Context: {context}</p>
        )}
      </div>

      {/* Existing Announcements */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h3 className="font-semibold text-gray-800">All Announcements</h3>
        </div>
        <div className="divide-y divide-gray-100">
          {PLACEHOLDER_NOTICES.map((notice) => (
            <div key={notice.id} className="px-6 py-4 hover:bg-gray-50 transition-colors">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    {notice.pinned && (
                      <span className="px-1.5 py-0.5 bg-amber-100 text-amber-700 text-[10px] font-semibold rounded uppercase tracking-wide">
                        Pinned
                      </span>
                    )}
                    <h4 className="font-medium text-gray-800 text-sm">{notice.title}</h4>
                  </div>
                  <p className="text-sm text-gray-500 line-clamp-2">{notice.body}</p>
                  <p className="text-xs text-gray-400 mt-1.5">{notice.date} · {notice.target}</p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button className="text-xs text-indigo-600 hover:text-indigo-800 font-medium">Edit</button>
                  <button className="text-xs text-red-500 hover:text-red-700 font-medium">Delete</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
