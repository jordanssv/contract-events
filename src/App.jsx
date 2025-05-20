
import React, { useState } from "react";
import { MetricsDashboard } from "./components/MetricsDashboard";
import abi from "./abi.json";

export default function App() {
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center p-4">
      <h1 className="text-2xl font-bold mb-4 mt-6">Ethereum Contract Metrics Dashboard</h1>
      {!submitted ? (
        <form
          onSubmit={handleSubmit}
          className="w-full max-w-md bg-white rounded-2xl shadow-md p-6 space-y-4"
        >
          <div className="text-gray-700">
            To begin, click continue. <br />
            <b>Note:</b> Your API secrets are <span className="text-green-700 font-semibold">secured in backend</span>.
          </div>
          <button
            type="submit"
            className="w-full py-2 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition"
          >
            Continue
          </button>
        </form>
      ) : (
        <MetricsDashboard abi={JSON.stringify(abi)} />
      )}
    </div>
  );
}
