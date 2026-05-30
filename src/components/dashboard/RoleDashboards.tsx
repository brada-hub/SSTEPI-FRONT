"use client";

import * as React from "react";
import { useAuthStore } from "@/stores/authStore";
import { useRoleViewsStore } from "@/stores/roleViewsStore";
import { useDoctorPatients } from "@/features/doctor/hooks/useDoctorPatients";
import { useQuery } from "@tanstack/react-query";
import api from "@/services/api";
import { Loader2 } from "lucide-react";
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
} from "recharts";
import {
  ShieldAlert, UserCheck, Bed, Pill, Activity, Calendar, TrendingUp,
  Heart, Apple, Stethoscope, UserPlus, Syringe, ClipboardList,
  Thermometer, Weight, Clock, AlertTriangle, Package, Bell,
} from "lucide-react";

const CENSO_DATA = [
  { hora: "08:00", camas: 38 }, { hora: "10:00", camas: 42 },
  { hora: "12:00", camas: 45 }, { hora: "14:00", camas: 47 },
  { hora: "16:00", camas: 48 }, { hora: "18:00", camas: 46 },
  { hora: "20:00", camas: 49 }, { hora: "22:00", camas: 51 },
];

function KpiCard({ title, value, desc, icon: Icon, color }: {
  title: string; value: string; desc: string; icon: any; color: string;
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5 transition-all hover:scale-[1.01] duration-300">
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">{title}</span>
        <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${color}`}>
          <Icon className="h-4.5 w-4.5" />
        </div>
      </div>
      <div className="mt-3 flex items-baseline gap-2">
        <span className="font-mono text-2xl font-extrabold text-foreground tracking-tight">{value}</span>
      </div>
      <span className="text-[10px] font-medium text-muted-foreground block mt-1">{desc}</span>
    </div>
  );
}

function OcupacionChart({ data }: { data?: Array<{ especialidad: string; ocupadas: number }> }) {
  const chartData = data && data.length > 0 ? data : [
    { especialidad: "Medicina Interna", ocupadas: 4 },
    { especialidad: "Neumología", ocupadas: 3 },
    { especialidad: "Cirugía General", ocupadas: 2 },
    { especialidad: "Traumatología", ocupadas: 1 },
  ];

  return (
    <div className="rounded-2xl border border-border bg-card p-5 lg:col-span-2 space-y-4 min-w-0">
      <div className="flex items-center justify-between">
        <div className="flex flex-col">
          <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Ocupación por Especialidad</span>
          <span className="text-[10px] text-muted-foreground">Distribución de pacientes en salas clínicas</span>
        </div>
        <div className="flex items-center gap-1 text-xs font-bold text-accent-teal">
          <TrendingUp className="h-4 w-4" /><span>Tiempo Real</span>
        </div>
      </div>
      <div className="w-full min-w-0 pr-4 text-xs">
        <ResponsiveContainer width="100%" height={224} minWidth={0}>
          <AreaChart data={chartData}>
            <defs>
              <linearGradient id="ocupacionGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2} />
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis dataKey="especialidad" stroke="var(--muted-foreground)" fontSize={10} tickLine={false} axisLine={false} />
            <YAxis stroke="var(--muted-foreground)" fontSize={10} tickLine={false} axisLine={false} allowDecimals={false} />
            <Tooltip contentStyle={{ backgroundColor: "var(--card)", borderColor: "var(--border)", borderRadius: "8px", color: "var(--foreground)", fontSize: "11px" }} />
            <Area type="monotone" dataKey="ocupadas" name="Pacientes" stroke="#3b82f6" strokeWidth={2} fillOpacity={1} fill="url(#ocupacionGrad)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function RecientesIngresos({ data }: { data?: Array<{ paciente: string; ci: string; motivo: string; diagnostico: string; cama: string }> }) {
  const list = data || [];
  return (
    <div className="rounded-2xl border border-border bg-card p-5 space-y-4">
      <div className="flex flex-col">
        <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Últimos Ingresos</span>
        <span className="text-[10px] text-muted-foreground">Pacientes recientemente hospitalizados</span>
      </div>
      <div className="space-y-4 overflow-y-auto max-h-56 pr-2">
        {list.length === 0 ? (
          <div className="flex h-32 items-center justify-center text-xs text-muted-foreground">
            Sin ingresos registrados hoy.
          </div>
        ) : (
          list.map((ingreso, idx) => (
            <div key={idx} className="flex gap-3 border-l border-border pl-3 relative">
              <div className="absolute -left-1.5 top-1.5 h-3 w-3 rounded-full border-2 border-card bg-accent-teal" />
              <div className="flex flex-col">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-bold text-foreground">{ingreso.paciente}</span>
                </div>
                <span className="text-[10px] text-muted-foreground mt-0.5">
                  Diagnóstico: {ingreso.diagnostico}
                </span>
                <span className="text-[9px] text-primary/80 font-semibold mt-0.5">
                  Ubicación: {ingreso.cama}
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function WelcomeBanner({ icon: Icon, title, subtitle }: { icon: any; title: string; subtitle: string }) {
  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-white/5 bg-card/40 p-6 backdrop-blur-md sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-unitepc-sso text-white shadow-md">
          <Icon className="h-6 w-6" />
        </div>
        <div className="flex flex-col">
          <h2 className="text-lg font-bold text-foreground">{title}</h2>
          <p className="text-xs text-muted-foreground">{subtitle}</p>
        </div>
      </div>
      <div className="flex items-center gap-2 rounded-lg bg-secondary/50 px-3 py-1.5 text-xs text-muted-foreground border border-border self-start sm:self-auto">
        <Calendar className="h-4 w-4 text-primary" />
        <span className="font-semibold text-foreground">Guardia del 26 de Mayo, 2026</span>
      </div>
    </div>
  );
}

/* ─── DASHBOARD: ADMINISTRADOR ─── */
export function AdminDashboard() {
  const user = useAuthStore((state) => state.user);
  const hospital = useAuthStore((state) => state.hospital);

  const { data: kpisData } = useQuery({
    queryKey: ["dashboard-kpis"],
    queryFn: async () => {
      const response = await api.get<{
        pacientesInternados: number;
        tasaOcupacion: number;
        ingresosHoy: number;
        altasHoy: number;
      }>("/dashboard/kpis");
      return response.data;
    },
  });

  const { data: bedState } = useQuery({
    queryKey: ["dashboard-beds"],
    queryFn: async () => {
      const response = await api.get<{
        disponibles: number;
        ocupadas: number;
        mantenimiento: number;
      }>("/dashboard/estado-camas");
      return response.data;
    },
  });

  const { data: recentAdmissions } = useQuery({
    queryKey: ["dashboard-recent-admissions"],
    queryFn: async () => {
      const response = await api.get<Array<{
        paciente: string;
        ci: string;
        motivo: string;
        diagnostico: string;
        cama: string;
      }>>("/dashboard/ultimos-ingresos");
      return response.data;
    },
  });

  const { data: specialtiesData } = useQuery({
    queryKey: ["dashboard-specialties"],
    queryFn: async () => {
      const response = await api.get<Array<{
        especialidad: string;
        ocupadas: number;
      }>>("/dashboard/ocupacion-especialidad");
      return response.data;
    },
  });

  const kpis = [
    { title: "Pacientes Internados", value: kpisData ? `${kpisData.pacientesInternados}` : "...", desc: "Total activos en salas", icon: Bed, color: "text-primary bg-primary/10" },
    { title: "Tasa de Ocupación", value: kpisData ? `${kpisData.tasaOcupacion}%` : "...", desc: "Camas clínicas ocupadas", icon: ShieldAlert, color: "text-destructive bg-destructive/10" },
    { title: "Camas Disponibles", value: bedState ? `${bedState.disponibles}` : "...", desc: "Camas libres en censo", icon: Pill, color: "text-accent-amber bg-accent-amber/10" },
    { title: "Ingresos Hoy", value: kpisData ? `${kpisData.ingresosHoy}` : "...", desc: "Admisiones registradas hoy", icon: UserCheck, color: "text-accent-teal bg-accent-teal/10" },
  ];

  return (
    <div className="space-y-6">
      <WelcomeBanner icon={Activity} title={`Bienvenido de Guardia, ${user?.name || "Dr. Vegas"}`} subtitle={`${hospital?.name || "Hospital General SSTEPI"} • Unidad de Guardia Médica Activa`} />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {kpis.map((k) => <KpiCard key={k.title} {...k} />)}
      </div>
      <div className="grid gap-6 lg:grid-cols-3 min-w-0">
        <OcupacionChart data={specialtiesData} />
        <RecientesIngresos data={recentAdmissions} />
      </div>
    </div>
  );
}

/* ─── DASHBOARD: MÉDICO ─── */
export function MedicoDashboard() {
  const user = useAuthStore((state) => state.user);
  const { data: myPatients } = useDoctorPatients();

  // Filtrar pacientes internados activos (que no tengan fecha de alta)
  const activePatients = myPatients?.filter((p) => !p.fecha_alta) || [];

  const kpis = [
    { title: "Pacientes a Cargo", value: `${activePatients.length}`, desc: "Activos bajo tu evolución", icon: Stethoscope, color: "text-primary bg-primary/10" },
    { title: "Órdenes Activas", value: "08", desc: "Pendientes por revisar", icon: ClipboardList, color: "text-accent-amber bg-accent-amber/10" },
    { title: "Controles Turno", value: `${activePatients.reduce((sum, p) => sum + (p.controles?.length ?? 0), 0)}`, desc: "Signos vitales registrados", icon: Activity, color: "text-accent-teal bg-accent-teal/10" },
    { title: "Camas Asignadas", value: `${activePatients.filter((p) => p.cama?.codigo || p.cama?.nombre).length}`, desc: "Pacientes con cama activa", icon: UserCheck, color: "text-primary bg-primary/10" },
  ];

  return (
    <div className="space-y-6">
      <WelcomeBanner icon={Stethoscope} title={`Panel Clínico - ${user?.name || "Dr. Vegas"}`} subtitle="Resumen de pacientes a cargo, órdenes y evoluciones" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {kpis.map((k) => <KpiCard key={k.title} {...k} />)}
      </div>
      <div className="rounded-2xl border border-border bg-card p-5 space-y-4">
        <div className="flex flex-col">
          <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Mis Pacientes Asignados</span>
          <span className="text-[10px] text-muted-foreground">Evolución clínica e historial de signos</span>
        </div>
        <div className="overflow-x-auto">
          {activePatients.length === 0 ? (
            <div className="flex h-32 items-center justify-center text-xs text-muted-foreground">
              No tienes pacientes asignados actualmente en este turno.
            </div>
          ) : (
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-border text-muted-foreground font-bold uppercase tracking-wider">
                  <th className="text-left py-2 px-3">Paciente</th>
                  <th className="text-left py-2 px-3">Ubicación</th>
                  <th className="text-left py-2 px-3">Cédula Identidad</th>
                  <th className="text-left py-2 px-3">Diagnóstico de Ingreso</th>
                  <th className="text-left py-2 px-3">Fecha de Ingreso</th>
                </tr>
              </thead>
              <tbody>
                {activePatients.map((p) => (
                  <tr key={p.id} className="border-b border-border/40 hover:bg-secondary/20 transition-colors">
                    <td className="py-2.5 px-3 font-semibold text-foreground">
                      {p.paciente.nombre} {p.paciente.apellidos}
                    </td>
                    <td className="py-2.5 px-3 text-muted-foreground">
                      {p.sala.nombre}, {p.cama.codigo || p.cama.nombre || "Sin Cama"}
                    </td>
                    <td className="py-2.5 px-3 text-muted-foreground font-mono">
                      {p.paciente.ci || "S/N"}
                    </td>
                    <td className="py-2.5 px-3 text-muted-foreground">
                      {p.diagnostico_ingreso}
                    </td>
                    <td className="py-2.5 px-3 text-muted-foreground font-mono">
                      {new Date(p.fecha_ingreso).toLocaleDateString("es-ES")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}

/* ─── DASHBOARD: ENFERMERÍA ─── */
export function EnfermeriaDashboard() {
  const kpis = [
    { title: "Signos Vitales Hoy", value: "18", desc: "Registros de constantes", icon: Thermometer, color: "text-accent-teal bg-accent-teal/10" },
    { title: "Medicación Programada", value: "32", desc: "Dosis del turno", icon: Syringe, color: "text-primary bg-primary/10" },
    { title: "Pacientes en Sala", value: "12", desc: "Bajo cuidado directo", icon: Heart, color: "text-destructive bg-destructive/10" },
    { title: "Alertas Activas", value: "03", desc: "Requieren atención", icon: Bell, color: "text-accent-amber bg-accent-amber/10" },
  ];
  const signos = [
    { hora: "06:00", paciente: "Clara Ortiz", temp: "36.8°C", fc: "72", fr: "16", pa: "120/80", spo2: "98%" },
    { hora: "06:00", paciente: "Marcos Vegas", temp: "37.1°C", fc: "80", fr: "18", pa: "130/85", spo2: "97%" },
    { hora: "08:00", paciente: "José Mamani", temp: "38.2°C", fc: "95", fr: "22", pa: "110/70", spo2: "94%" },
    { hora: "08:00", paciente: "Ana López", temp: "36.5°C", fc: "68", fr: "14", pa: "115/75", spo2: "99%" },
  ];
  return (
    <div className="space-y-6">
      <WelcomeBanner icon={Heart} title="Estación de Enfermería" subtitle="Monitoreo de signos vitales, medicación y cuidados directos" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {kpis.map((k) => <KpiCard key={k.title} {...k} />)}
      </div>
      <div className="rounded-2xl border border-border bg-card p-5 space-y-4">
        <div className="flex flex-col">
          <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Signos Vitales - Último Registro</span>
          <span className="text-[10px] text-muted-foreground">Constantes de pacientes en sala</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-border text-muted-foreground font-bold uppercase tracking-wider">
                <th className="text-left py-2 px-3">Hora</th>
                <th className="text-left py-2 px-3">Paciente</th>
                <th className="text-left py-2 px-3">Temp</th>
                <th className="text-left py-2 px-3">FC</th>
                <th className="text-left py-2 px-3">FR</th>
                <th className="text-left py-2 px-3">PA</th>
                <th className="text-left py-2 px-3">SpO2</th>
              </tr>
            </thead>
            <tbody>
              {signos.map((s, i) => (
                <tr key={i} className="border-b border-border/40 hover:bg-secondary/20 transition-colors">
                  <td className="py-2.5 px-3 font-mono font-bold text-foreground">{s.hora}</td>
                  <td className="py-2.5 px-3 font-semibold text-foreground">{s.paciente}</td>
                  <td className="py-2.5 px-3 text-muted-foreground">{s.temp}</td>
                  <td className="py-2.5 px-3 text-muted-foreground">{s.fc}</td>
                  <td className="py-2.5 px-3 text-muted-foreground">{s.fr}</td>
                  <td className="py-2.5 px-3 text-muted-foreground">{s.pa}</td>
                  <td className="py-2.5 px-3">
                    <span className={`font-bold ${parseInt(s.spo2) < 95 ? "text-destructive" : "text-accent-teal"}`}>
                      {s.spo2}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <div className="grid gap-6 lg:grid-cols-3 min-w-0">
        <OcupacionChart />
        <RecientesIngresos />
      </div>
    </div>
  );
}

/* ─── DASHBOARD: NUTRICIÓN ─── */
export function NutricionDashboard() {
  const kpis = [
    { title: "Dietas Asignadas", value: "24", desc: "Regímenes activos hoy", icon: Apple, color: "text-accent-amber bg-accent-amber/10" },
    { title: "Pacientes Evaluados", value: "15", desc: "Valoración nutricional", icon: ClipboardList, color: "text-primary bg-primary/10" },
    { title: "Dietas Suspendidas", value: "02", desc: "Pendientes de revisión", icon: Weight, color: "text-muted-foreground bg-muted/10" },
    { title: "Alertas Nutricionales", value: "03", desc: "Riesgo de desnutrición", icon: AlertTriangle, color: "text-destructive bg-destructive/10" },
  ];
  const dietas = [
    { paciente: "Clara Ortiz", sala: "A-101", regimen: "Hipocalórica", horario: "08:00 / 12:00 / 18:00", estado: "Activa" },
    { paciente: "Marcos Vegas", sala: "A-102", regimen: "Alta Proteína", horario: "08:00 / 12:00 / 18:00", estado: "Activa" },
    { paciente: "José Mamani", sala: "B-201", regimen: "Nutrición Enteral", horario: "C/4h", estado: "Activa" },
    { paciente: "Ana López", sala: "C-301", regimen: "Hidratación EV", horario: "Continuo", estado: "Suspendida" },
  ];
  return (
    <div className="space-y-6">
      <WelcomeBanner icon={Apple} title="Panel de Nutrición Clínica" subtitle="Gestión de dietas, horarios alimenticios y valoración nutricional" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {kpis.map((k) => <KpiCard key={k.title} {...k} />)}
      </div>
      <div className="rounded-2xl border border-border bg-card p-5 space-y-4">
        <div className="flex flex-col">
          <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Dietas y Horarios Alimenticios</span>
          <span className="text-[10px] text-muted-foreground">Regímenes activos por paciente</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-border text-muted-foreground font-bold uppercase tracking-wider">
                <th className="text-left py-2 px-3">Paciente</th>
                <th className="text-left py-2 px-3">Sala</th>
                <th className="text-left py-2 px-3">Régimen</th>
                <th className="text-left py-2 px-3">Horario</th>
                <th className="text-left py-2 px-3">Estado</th>
              </tr>
            </thead>
            <tbody>
              {dietas.map((d, i) => (
                <tr key={i} className="border-b border-border/40 hover:bg-secondary/20 transition-colors">
                  <td className="py-2.5 px-3 font-semibold text-foreground">{d.paciente}</td>
                  <td className="py-2.5 px-3 text-muted-foreground">{d.sala}</td>
                  <td className="py-2.5 px-3 text-muted-foreground">{d.regimen}</td>
                  <td className="py-2.5 px-3 font-mono text-muted-foreground">{d.horario}</td>
                  <td className="py-2.5 px-3">
                    <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold ${
                      d.estado === "Activa" ? "bg-accent-teal/10 text-accent-teal" : "bg-destructive/10 text-destructive"
                    }`}>{d.estado}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <div className="grid gap-6 lg:grid-cols-3 min-w-0">
        <OcupacionChart />
        <RecientesIngresos />
      </div>
    </div>
  );
}

/* ─── DASHBOARD: FARMACIA ─── */
export function FarmaciaDashboard() {
  const kpis = [
    { title: "Dispensaciones Hoy", value: "28", desc: "Medicamentos entregados", icon: Pill, color: "text-accent-violet bg-accent-violet/10" },
    { title: "Stock Crítico", value: "06", desc: "Fármacos por reabastecer", icon: AlertTriangle, color: "text-destructive bg-destructive/10" },
    { title: "Órdenes Pendientes", value: "12", desc: "Por validar y surtir", icon: ClipboardList, color: "text-accent-amber bg-accent-amber/10" },
    { title: "Inventario Total", value: "1,284", desc: "Unidades en almacén", icon: Package, color: "text-primary bg-primary/10" },
  ];
  const medicamentos = [
    { nombre: "Paracetamol 500mg", stock: 240, min: 100, estado: "Normal" },
    { nombre: "Amoxicilina 500mg", stock: 45, min: 80, estado: "Crítico" },
    { nombre: "Omeprazol 20mg", stock: 180, min: 50, estado: "Normal" },
    { nombre: "Morfina 10mg", stock: 12, min: 30, estado: "Crítico" },
    { nombre: "Solución Salina 500ml", stock: 30, min: 40, estado: "Crítico" },
    { nombre: "Insulina NPH", stock: 8, min: 15, estado: "Crítico" },
  ];
  return (
    <div className="space-y-6">
      <WelcomeBanner icon={Pill} title="Panel de Farmacia" subtitle="Dispensación, inventario y control de stock de medicamentos" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {kpis.map((k) => <KpiCard key={k.title} {...k} />)}
      </div>
      <div className="rounded-2xl border border-border bg-card p-5 space-y-4">
        <div className="flex flex-col">
          <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Estado de Inventario</span>
          <span className="text-[10px] text-muted-foreground">Stock actual de fármacos en almacén</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-border text-muted-foreground font-bold uppercase tracking-wider">
                <th className="text-left py-2 px-3">Medicamento</th>
                <th className="text-left py-2 px-3">Stock</th>
                <th className="text-left py-2 px-3">Stock Mínimo</th>
                <th className="text-left py-2 px-3">Estado</th>
              </tr>
            </thead>
            <tbody>
              {medicamentos.map((m, i) => (
                <tr key={i} className="border-b border-border/40 hover:bg-secondary/20 transition-colors">
                  <td className="py-2.5 px-3 font-semibold text-foreground">{m.nombre}</td>
                  <td className="py-2.5 px-3 font-mono font-bold text-foreground">{m.stock}</td>
                  <td className="py-2.5 px-3 font-mono text-muted-foreground">{m.min}</td>
                  <td className="py-2.5 px-3">
                    <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold ${
                      m.estado === "Normal" ? "bg-accent-teal/10 text-accent-teal" : "bg-destructive/10 text-destructive animate-pulse"
                    }`}>{m.estado}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <div className="grid gap-6 lg:grid-cols-3 min-w-0">
        <OcupacionChart />
        <RecientesIngresos />
      </div>
    </div>
  );
}

/* ─── DASHBOARD: ADMISIÓN ─── */
export function AdmisionDashboard() {
  const kpis = [
    { title: "Ingresos Hoy", value: "08", desc: "Pacientes admitidos", icon: UserPlus, color: "text-sky-500 bg-sky-500/10" },
    { title: "Triajes Pendientes", value: "03", desc: "Por clasificar", icon: ClipboardList, color: "text-accent-amber bg-accent-amber/10" },
    { title: "Camas Disponibles", value: "11", desc: "De 60 totales", icon: Bed, color: "text-accent-teal bg-accent-teal/10" },
    { title: "Altas del Día", value: "05", desc: "Pacientes dados de alta", icon: UserCheck, color: "text-primary bg-primary/10" },
  ];
  const ingresos = [
    { hora: "08:30", paciente: "Pedro García", triage: "Naranja", sala: "B-202", aseguradora: "IPS" },
    { hora: "10:15", paciente: "Luisa Martínez", triage: "Amarillo", sala: "A-104", aseguradora: "Pública" },
    { hora: "11:00", paciente: "Carlos Sánchez", triage: "Rojo", sala: "B-201", aseguradora: "Privada" },
    { hora: "13:45", paciente: "María Flores", triage: "Verde", sala: "C-302", aseguradora: "IPS" },
  ];
  return (
    <div className="space-y-6">
      <WelcomeBanner icon={UserPlus} title="Panel de Admisión" subtitle="Registro de ingresos, triaje y asignación de camas" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {kpis.map((k) => <KpiCard key={k.title} {...k} />)}
      </div>
      <div className="rounded-2xl border border-border bg-card p-5 space-y-4">
        <div className="flex flex-col">
          <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Ingresos del Día</span>
          <span className="text-[10px] text-muted-foreground">Pacientes admitidos con clasificación de triaje</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-border text-muted-foreground font-bold uppercase tracking-wider">
                <th className="text-left py-2 px-3">Hora</th>
                <th className="text-left py-2 px-3">Paciente</th>
                <th className="text-left py-2 px-3">Triaje</th>
                <th className="text-left py-2 px-3">Sala</th>
                <th className="text-left py-2 px-3">Aseguradora</th>
              </tr>
            </thead>
            <tbody>
              {ingresos.map((i, idx) => (
                <tr key={idx} className="border-b border-border/40 hover:bg-secondary/20 transition-colors">
                  <td className="py-2.5 px-3 font-mono font-bold text-foreground">{i.hora}</td>
                  <td className="py-2.5 px-3 font-semibold text-foreground">{i.paciente}</td>
                  <td className="py-2.5 px-3">
                    <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold ${
                      i.triage === "Rojo" ? "bg-destructive/10 text-destructive" :
                      i.triage === "Naranja" ? "bg-accent-amber/10 text-accent-amber" :
                      i.triage === "Amarillo" ? "bg-yellow-500/10 text-yellow-500" : "bg-accent-teal/10 text-accent-teal"
                    }`}>{i.triage}</span>
                  </td>
                  <td className="py-2.5 px-3 text-muted-foreground">{i.sala}</td>
                  <td className="py-2.5 px-3 text-muted-foreground">{i.aseguradora}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <div className="grid gap-6 lg:grid-cols-3 min-w-0">
        <OcupacionChart />
        <RecientesIngresos />
      </div>
    </div>
  );
}
