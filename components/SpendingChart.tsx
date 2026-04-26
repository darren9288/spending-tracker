"use client";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";

type Entry = { name: string; amount: number; color: string };

type Props = {
  data: Entry[];
  type?: "pie" | "bar";
};

export default function SpendingChart({ data, type = "pie" }: Props) {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-40 text-slate-600 text-sm">
        No data yet
      </div>
    );
  }

  if (type === "bar") {
    return (
      <ResponsiveContainer width="100%" height={180}>
        <BarChart data={data} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
          <XAxis
            dataKey="name"
            tick={{ fill: "#64748b", fontSize: 11 }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tick={{ fill: "#64748b", fontSize: 11 }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip
            contentStyle={{ backgroundColor: "#1e293b", border: "1px solid #334155", borderRadius: 8 }}
            labelStyle={{ color: "#f1f5f9", fontSize: 12 }}
            itemStyle={{ color: "#94a3b8", fontSize: 12 }}
            formatter={(v) => [`RM ${Number(v).toFixed(2)}`, ""]}
          />
          <Bar dataKey="amount" radius={[4, 4, 0, 0]}>
            {data.map((entry, i) => (
              <Cell key={i} fill={entry.color} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    );
  }

  return (
    <div className="flex flex-col items-center">
      <ResponsiveContainer width="100%" height={200}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={50}
            outerRadius={85}
            dataKey="amount"
            paddingAngle={2}
          >
            {data.map((entry, i) => (
              <Cell key={i} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{ backgroundColor: "#1e293b", border: "1px solid #334155", borderRadius: 8 }}
            formatter={(v) => [`RM ${Number(v).toFixed(2)}`, ""]}
          />
        </PieChart>
      </ResponsiveContainer>
      <div className="flex flex-wrap justify-center gap-x-4 gap-y-1 mt-2">
        {data.map((entry) => (
          <div key={entry.name} className="flex items-center gap-1.5 text-xs text-slate-400">
            <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: entry.color }} />
            {entry.name}
          </div>
        ))}
      </div>
    </div>
  );
}
