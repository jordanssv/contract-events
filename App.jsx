
import React, { useState } from "react";
import { MetricsDashboard } from "./components/MetricsDashboard";
import abi from "./abi.json";
import blacklist from "./blacklist.json";

export default function App() {
  const [submitted, setSubmitted] = useState(false);
  const [blacklistEnabled, setBlacklistEnabled] = useState(true);

  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center p-4">
      <h1 className="text-2xl font-bold mb-4 mt-6">bApp Contract Metrics Dashboard</h1>
      <div className="w-full max-w-md mb-4 flex flex-row items-center justify-end">
        <label className="flex items-center gap-2 text-sm font-semibold select-none">
            {/* <input
            type="checkbox"
            checked={blacklistEnabled}
            onChange={() => setBlacklistEnabled(b => !b)}
            className="w-4 h-4 accent-blue-600"
          />
          Enable blacklist (hide events from internal addresses)
        </label>*/}
      </div>
      {!submitted ? (
        <form
          onSubmit={handleSubmit}
          className="w-full max-w-md bg-white rounded-2xl shadow-md p-6 space-y-4"
        >
          <div className="text-gray-700">
            To begin, click continue.
          </div>
          <button
            type="submit"
            className="w-full py-2 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition"
          >
            Continue
          </button>
        </form>
      ) : (
        <MetricsDashboard
          abi={JSON.stringify(abi)}
          blacklist={blacklist}
          blacklistEnabled={blacklistEnabled}
        />
      )}
    </div>
  );
}
