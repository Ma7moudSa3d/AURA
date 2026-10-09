"use client";
import { useState } from "react";
import { Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

type Pt = { day: string; revenue: number; orders: number };

export default function AdminCharts({ daily, weekly, monthly }: { daily: Pt[]; weekly: Pt[]; monthly: Pt[] }) {
  const [range, setRange] = useState<"daily" | "weekly" | "monthly">("daily");
  const data = { daily, weekly, monthly }[range].map((d) => ({ ...d, revenue: Number(d.revenue) }));
  const axis = { stroke: "#8a8578", fontSize: 11 };
  return (
    <div className="border border-white/5 bg-surface p-5">
      <div className="mb-4 flex gap-2">
        {(["daily", "weekly", "monthly"] as const).map((r) => (
          <button key={r} onClick={() => setRange(r)} className={`px-3 py-1 text-xs uppercase tracking-widest ${range === r ? "bg-gold text-ink" : "border border-white/10"}`}>{r}</button>
        ))}
      </div>
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
