"use client";
import { useState } from "react";
import { Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

type Pt = { day: string; revenue: number; orders: number };

export default function AdminCharts({ daily, weekly, monthly }: { daily: Pt[]; weekly: Pt[]; monthly: Pt[] }) {
  const [range, setRange] = useState<"daily" | "weekly" | "monthly">("daily");
  // days with no orders are missing from the SQL result; fill them with zeros so the chart shows the real timeline
  const filled = (() => {
    const by = new Map(daily.map((d) => [d.day, d]));
    const out: Pt[] = [];
    for (let i = 29; i >= 0; i--) {
      const key = new Date(Date.now() - i * 86400000).toLocaleDateString("en-CA", { timeZone: "Africa/Cairo" }).slice(5);
      out.push(by.get(key) ?? { day: key, revenue: 0, orders: 0 });
    }
    return out;
  })();
  const data = { daily: filled, weekly, monthly }[range].map((d) => ({ ...d, revenue: Number(d.revenue) }));
  const empty = data.every((d) => !d.revenue && !d.orders);
  const axis = { stroke: "#8a8578", fontSize: 11 };
  return (
    <div className="border border-white/5 bg-surface p-5">
      <div className="mb-4 flex gap-2">
        {(["daily", "weekly", "monthly"] as const).map((r) => (
          <button key={r} onClick={() => setRange(r)} className={`px-3 py-1 text-xs uppercase tracking-widest ${range === r ? "bg-gold text-ink" : "border border-white/10 text-cream/70 hover:border-gold/50"}`}>{r}</button>
        ))}
      </div>
      {empty && <p className="mb-3 text-sm text-cream/50">No orders in this period yet.</p>}
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="h-64">
          <p className="mb-2 text-xs uppercase tracking-widest text-cream/50">Revenue (EGP)</p>
          <ResponsiveContainer width="100%" height="90%"><LineChart data={data}><CartesianGrid stroke="#222" /><XAxis dataKey="day" {...axis} /><YAxis {...axis} />
            <Tooltip contentStyle={{ background: "#121214", border: "1px solid #B88A3B" }} /><Line type="monotone" dataKey="revenue" stroke="#D6B25E" strokeWidth={2} dot={false} /></LineChart></ResponsiveContainer>
        </div>
        <div className="h-64">
          <p className="mb-2 text-xs uppercase tracking-widest text-cream/50">Orders</p>
          <ResponsiveContainer width="100%" height="90%"><BarChart data={data}><CartesianGrid stroke="#222" /><XAxis dataKey="day" {...axis} /><YAxis allowDecimals={false} {...axis} />
            <Tooltip contentStyle={{ background: "#121214", border: "1px solid #B88A3B" }} /><Bar dataKey="orders" fill="#B88A3B" /></BarChart></ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
