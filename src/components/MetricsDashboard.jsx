
import React, { useEffect, useState } from "react";
import { ethers } from "ethers";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend as ChartLegend,
  ResponsiveContainer,
} from "recharts";

const FILTERS = [
  { label: "1 Day", value: "1d" },
  { label: "7 Days", value: "7d" },
  { label: "30 Days", value: "30d" },
  { label: "All Time", value: "all" },
];

const COLORS = [
  "#2563eb", "#16a34a", "#dc2626", "#ea580c", "#9333ea", "#eab308", "#14b8a6", "#f43f5e"
];

function formatEventType(type) {
  if (!type) return "Unknown";
  if (typeof type === "string") return type;
  return "Unknown";
}

function getEventColor(idx) {
  return COLORS[idx % COLORS.length];
}

export function MetricsDashboard({ abi }) {
  const [endBlock, setEndBlock] = useState(null);
  const [logs, setLogs] = useState([]);
  const [filter, setFilter] = useState("7d");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [eventTypes, setEventTypes] = useState([]);
  const [iface, setIface] = useState(null);
  const [topicNameMap, setTopicNameMap] = useState({});

  // Parse ABI and setup ethers Interface and topic->name map
  useEffect(() => {
    setError("");
    try {
      const parsedAbi = JSON.parse(abi);
      const ifaceObj = new ethers.Interface(parsedAbi);
      setIface(ifaceObj);
      // Build topic to event name map
      const map = {};
      parsedAbi
        .filter((x) => x.type === "event")
        .forEach((event) => {
          const sig = `${event.name}(${event.inputs.map(i => i.type).join(",")})`;
          const topic = ethers.id(sig);
          map[topic] = event.name;
        });
      setTopicNameMap(map);
    } catch (err) {
      setError("Failed to parse ABI: " + err.message);
    }
  }, [abi]);

  // Fetch logs from serverless function
  useEffect(() => {
    async function fetchLogs() {
      setLoading(true);
      setError("");
      try {
        const resp = await fetch("/api/fetch-events", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({}),
        });
        const data = await resp.json();
        if (!data.logs) throw new Error("Failed to get logs");
        setLogs(data.logs);
        setEndBlock(data.endBlock);
      } catch (e) {
        setError("Failed to fetch logs.");
      }
      setLoading(false);
    }
    fetchLogs();
  }, [iface]);

  // Parse logs with topic-to-name fallback
  const parsedEvents = React.useMemo(() => {
    if (!logs.length || !iface) return [];
    return logs.map(log => {
      let eventObj = { ...log };
      let parsed;
      try {
        parsed = iface.parseLog({
          topics: log.topics,
          data: log.data,
        });
        eventObj.event = parsed.name;
        eventObj.args = parsed.args;
      } catch {
        // Fallback: use topic-to-name map
        const topic0 = log.topics?.[0]?.toLowerCase();
        eventObj.event = (topic0 && topicNameMap[topic0]) ? topicNameMap[topic0] : (topic0 || "Unknown");
        eventObj.args = {};
      }
      eventObj.blockNumber = parseInt(log.blockNumber, 16);
      eventObj.timeStamp = parseInt(log.timeStamp, 16) * 1000;
      return eventObj;
    });
  }, [logs, iface, topicNameMap]);

  // Get unique event types
  useEffect(() => {
    const types = Array.from(
      new Set(parsedEvents.map(ev => formatEventType(ev.event)))
    );
    setEventTypes(types);
  }, [parsedEvents]);

  // Filter by time
  const filteredEvents = React.useMemo(() => {
    if (!parsedEvents.length) return [];
    if (filter === "all") return parsedEvents;
    const now = Date.now();
    let window = 7 * 24 * 60 * 60 * 1000;
    if (filter === "1d") window = 24 * 60 * 60 * 1000;
    if (filter === "30d") window = 30 * 24 * 60 * 60 * 1000;
    return parsedEvents.filter(ev => now - ev.timeStamp <= window);
  }, [parsedEvents, filter]);

  // Chart data: events per day, grouped by type
  const chartData = React.useMemo(() => {
    if (!filteredEvents.length || !eventTypes.length) return [];
    const dayMap = {};
    filteredEvents.forEach(ev => {
      const d = new Date(ev.timeStamp);
      const key = d.toISOString().slice(0, 10);
      if (!dayMap[key]) dayMap[key] = {};
      eventTypes.forEach(type => {
        if (!dayMap[key][type]) dayMap[key][type] = 0;
      });
      dayMap[key][formatEventType(ev.event)] += 1;
    });
    return Object.entries(dayMap)
      .map(([date, values]) => ({ date, ...values }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }, [filteredEvents, eventTypes]);

  // Totals by event type
  const typeTotals = React.useMemo(() => {
    const counts = {};
    eventTypes.forEach(type => (counts[type] = 0));
    filteredEvents.forEach(ev => {
      counts[formatEventType(ev.event)] += 1;
    });
    return counts;
  }, [filteredEvents, eventTypes]);

  return (
    <div className="w-full max-w-5xl mx-auto bg-white mt-8 rounded-2xl shadow-xl p-6">
      <div className="flex flex-col md:flex-row md:justify-between md:items-end mb-4 gap-4">
        <div>
          <h2 className="text-lg font-bold">Contract Event Metrics</h2>
          <div className="flex flex-wrap gap-3 mt-2">
            {Object.entries(typeTotals).map(([type, count], idx) => (
              <span
                key={type}
                className="inline-flex items-center rounded-lg px-3 py-1 text-sm font-semibold"
                style={{
                  backgroundColor: "#f3f4f6",
                  color: getEventColor(idx),
                  border: `1px solid ${getEventColor(idx)}`
                }}
              >
                <span
                  className="w-3 h-3 rounded-full inline-block mr-2"
                  style={{ background: getEventColor(idx) }}
                ></span>
                {type}: {count}
              </span>
            ))}
          </div>
        </div>
        <div className="flex gap-2">
          {FILTERS.map(f => (
            <button
              key={f.value}
              onClick={() => setFilter(f.value)}
              className={`px-3 py-1 rounded-xl font-semibold ${
                filter === f.value ? "bg-blue-600 text-white" : "bg-gray-100"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>
      {loading ? (
        <div className="text-center py-8 text-lg">Loading events...</div>
      ) : error ? (
        <div className="text-red-600 font-bold text-center">{error}</div>
      ) : (
        <>
          <div className="mb-6">
            <ResponsiveContainer width="100%" height={350}>
              <LineChart
                data={chartData}
                margin={{ top: 10, right: 40, left: 0, bottom: 10 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <ChartLegend />
                {eventTypes.map((type, idx) => (
                  <Line
                    key={type}
                    type="monotone"
                    dataKey={type}
                    stroke={getEventColor(idx)}
                    name={type}
                    connectNulls
                    dot={false}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div>
            <h3 className="font-semibold mb-2">Event Log (all for period)</h3>
            <div className="overflow-x-auto max-h-96">
              <table className="min-w-full table-auto border">
                <thead>
                  <tr>
                    <th className="p-2 border">Block</th>
                    <th className="p-2 border">Event</th>
                    <th className="p-2 border">Timestamp</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredEvents
                    .slice()
                    .reverse()
                    .map((ev, idx) => (
                      <tr key={idx}>
                        <td className="p-2 border">{ev.blockNumber}</td>
                        <td className="p-2 border">
                          {formatEventType(ev.event)}
                        </td>
                        <td className="p-2 border">
                          {new Date(ev.timeStamp).toLocaleString()}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
