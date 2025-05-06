// src/components/UserSearchWindow.jsx
import React from "react";

export default function UserSearchWindow({
  searchTerm,
  onSearchChange,
  users,
  loading,
  onFollowToggle,
}) {
  return (
    <div className="flex justify-center bg-gray-50 min-h-screen py-8">
      <div className="w-full max-w-md">
        {/* Search bar */}
        <div className="relative mb-6">
          <span className="absolute inset-y-0 left-4 flex items-center text-gray-500">
            🔍
          </span>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search"
            className="w-full bg-gray-100 rounded-full pl-12 pr-10 py-2 text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
          />
          {searchTerm && (
            <button
              onClick={() => onSearchChange("")}
              className="absolute inset-y-0 right-4 flex items-center text-gray-500"
            >
              ×
            </button>
          )}
        </div>

        {/* Loading & no‑results */}
        {loading && <p className="text-center text-gray-500">Loading…</p>}
        {!loading && searchTerm.trim() && users.length === 0 && (
          <p className="text-center text-gray-500">No users found.</p>
        )}

        {/* Results */}
        {!loading && users.length > 0 && (
          <div className="space-y-3">
            {users.map((u) => (
              <div
                key={u.id}
                className="bg-white rounded-lg shadow flex items-center justify-between p-3 hover:bg-gray-50 transition"
              >
                <div className="flex items-center">
                  <img
                    src={u.avatarUrl}
                    alt={`${u.username} avatar`}
                    className="w-8 h-8 rounded-full object-cover"
                    style={{ width: 32, height: 32 }}
                  />
                  <div className="ml-4">
                    <p className="text-sm font-semibold text-gray-900">
                      @{u.username}
                    </p>
                    <p className="text-xs text-gray-500">{u.fullName}</p>
                  </div>
                </div>
                <button
                  onClick={() => onFollowToggle(u.id, !u.following)}
                  className={`text-sm font-semibold px-4 py-1 rounded-full transition ${
                    u.following
                      ? "bg-white border border-gray-300 text-gray-700 hover:bg-gray-100"
                      : "bg-blue-600 text-white hover:bg-blue-700"
                  }`}
                >
                  {u.following ? "Unfollow" : "Follow"}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}