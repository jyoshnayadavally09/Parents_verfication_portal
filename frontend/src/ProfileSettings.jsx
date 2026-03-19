import React, { useState, useEffect } from 'react';

export default function ProfileSettings({ student }) {
  const [form, setForm] = useState({
    parentName: 'Parent User',
    parentEmail: 'parent@school.edu',
    parentPhone: '',
    notifyAttendance: true,
    notifyFees: true,
    notifyExams: true,
  });
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (student) {
      setForm((prev) => ({
        ...prev,
        parentPhone: student.parentPhone || '',
      }));
    }
  }, [student]);

  const set = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  const handleSave = (e) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  return (
    <div className="h-full overflow-y-auto px-6 py-6">
      {/* Header */}
      <div className="mb-6">
        <p className="text-[11px] uppercase tracking-widest text-slate-400 font-semibold">
          Settings
        </p>
        <h2 className="text-2xl font-bold text-slate-800 mt-1">Profile Settings</h2>
        <p className="text-sm text-slate-500">Manage your account and notification preferences.</p>
      </div>

      <form onSubmit={handleSave} className="space-y-6 max-w-xl">
        {/* Parent info */}
        <section className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 space-y-4">
          <h3 className="text-sm font-semibold text-slate-700">Parent Information</h3>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Full Name</label>
              <input
                type="text"
                value={form.parentName}
                onChange={(e) => set('parentName', e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-700
                           focus:outline-none focus:ring-2 focus:ring-blue-300 bg-white"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Email</label>
              <input
                type="email"
                value={form.parentEmail}
                onChange={(e) => set('parentEmail', e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-700
                           focus:outline-none focus:ring-2 focus:ring-blue-300 bg-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Phone Number</label>
            <input
              type="tel"
              value={form.parentPhone}
              onChange={(e) => set('parentPhone', e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-700
                         focus:outline-none focus:ring-2 focus:ring-blue-300 bg-white"
            />
          </div>
        </section>

        {/* Linked student */}
        <section className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
          <h3 className="text-sm font-semibold text-slate-700 mb-4">Linked Student</h3>
          <div className="flex items-center gap-4 bg-blue-50 rounded-xl border border-blue-100 px-4 py-3">
            <div className="w-10 h-10 rounded-full bg-blue-200 flex items-center justify-center
                            text-blue-700 font-bold text-base shrink-0">
              {(student?.name ?? 'S').charAt(0)}
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-800">{student?.name ?? '--'}</p>
              <p className="text-xs text-slate-500">Reg No: {student?.regNo ?? '--'}</p>
            </div>
            <span className="ml-auto text-xs font-medium px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-700">
              Active
            </span>
          </div>
        </section>

        {/* Notification preferences */}
        <section className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 space-y-3">
          <h3 className="text-sm font-semibold text-slate-700">Notification Preferences</h3>

          {[
            { key: 'notifyAttendance', label: 'Attendance alerts', desc: 'Get notified when attendance drops below 75%' },
            { key: 'notifyFees',       label: 'Fee reminders',     desc: 'Reminders for upcoming or overdue payments' },
            { key: 'notifyExams',      label: 'Exam notifications', desc: 'Alerts for upcoming exams and results' },
          ].map(({ key, label, desc }) => (
            <div key={key} className="flex items-center justify-between gap-4 py-1">
              <div>
                <p className="text-sm font-medium text-slate-700">{label}</p>
                <p className="text-xs text-slate-400">{desc}</p>
              </div>
              <button
                type="button"
                onClick={() => set(key, !form[key])}
                className={`relative w-11 h-6 rounded-full transition-colors duration-200 shrink-0
                  ${form[key] ? 'bg-blue-600' : 'bg-slate-200'}`}
              >
                <span
                  className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow
                    transition-transform duration-200 ${form[key] ? 'translate-x-5' : 'translate-x-0'}`}
                />
              </button>
            </div>
          ))}
        </section>

        {/* Save */}
        <div className="flex items-center gap-3">
          <button
            type="submit"
            className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium
                       transition-colors duration-150"
          >
            Save Changes
          </button>
          {saved && (
            <span className="text-sm text-emerald-600 font-medium animate-pulse">
              ✓ Saved successfully
            </span>
          )}
        </div>
      </form>
    </div>
  );
}
