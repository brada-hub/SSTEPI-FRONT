"use client";

import * as React from "react";
import { Patient } from "@/services/patientService";
import { 
  Table, 
  TableHeader, 
  TableBody, 
  TableRow, 
  TableHead, 
  TableCell 
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { formatBoliviaCI, calculateAge } from "@/lib/clinical";
import { Eye, UserCheck, MessageSquare, Search, Stethoscope, History } from "lucide-react";
import Link from "next/link";

interface PatientTableProps {
  patients: Patient[];
  onOpenDossier: (patient: Patient) => void;
  onOpenEdit: (patient: Patient) => void;
  onOpenHistory: (patient: Patient) => void;
}

export function PatientTable({ patients, onOpenDossier, onOpenEdit, onOpenHistory }: PatientTableProps) {
  const [searchTerm, setSearchTerm] = React.useState("");

  const filteredPatients = React.useMemo(() => {
    if (!searchTerm.trim()) return patients;
    const term = searchTerm.toLowerCase();
    return patients.filter(
      (p) =>
        p.nombre.toLowerCase().includes(term) ||
        p.apellidos.toLowerCase().includes(term) ||
        p.ci.includes(term)
    );
  }, [patients, searchTerm]);

  return (
    <div className="space-y-4">
      {/* Buscador Integrado */}
      <div className="relative flex max-w-sm items-center">
        <Search className="absolute left-3 h-4 w-4 text-muted-foreground" />
        <input
          type="text"
          placeholder="Buscar por nombre, apellidos o CI..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full h-9 rounded-lg border border-border bg-card pl-10 pr-4 text-xs font-semibold text-foreground outline-none focus:border-primary transition-all placeholder:text-muted-foreground/60"
        />
      </div>

      {/* Grid de Tabla */}
      <div className="rounded-xl border border-border bg-card overflow-hidden shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Paciente</TableHead>
              <TableHead>Cédula de Identidad</TableHead>
              <TableHead>Edad / Género</TableHead>
              <TableHead>Estado Clínico</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredPatients.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                  No se encontraron expedientes demográficos registrados.
                </TableCell>
              </TableRow>
            ) : (
              filteredPatients.map((patient) => {
                const age = calculateAge(patient.fecha_nacimiento);
                const isInterned = !!patient.active_internacion;
                
                return (
                  <TableRow key={patient.id}>
                    {/* Celda del Paciente */}
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-secondary text-primary font-bold text-xs">
                          {patient.nombre.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex flex-col">
                          <span className="font-bold text-foreground leading-snug">
                            {patient.nombre} {patient.apellidos}
                          </span>
                          <span className="text-[9px] text-muted-foreground font-medium">
                            ID: {patient.id}
                          </span>
                        </div>
                      </div>
                    </TableCell>

                    {/* Celda del CI */}
                    <TableCell className="font-mono text-xs font-semibold text-foreground">
                      {patient.ci}
                    </TableCell>

                    {/* Celda de Edad / Género */}
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold">{age} años</span>
                        <Badge variant={patient.genero === "masculino" ? "teal" : patient.genero === "femenino" ? "violet" : "secondary"} className="px-1.5 py-0">
                          {patient.genero === "masculino" ? "M" : patient.genero === "femenino" ? "F" : "O"}
                        </Badge>
                      </div>
                    </TableCell>

                    {/* Celda de Estado Clínico */}
                    <TableCell>
                      <div className="flex items-center gap-1.5">
                        <span className={`inline-block h-2 w-2 rounded-full ${
                          isInterned ? "bg-accent-teal animate-pulse" : "bg-muted-foreground/50"
                        }`} />
                        <span className="text-[10px] font-bold uppercase tracking-wider text-foreground">
                          {isInterned ? "Internado Activo" : "Ambulatorio"}
                        </span>
                      </div>
                    </TableCell>

                    {/* Celda de Acciones */}
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {isInterned && patient.active_internacion && (
                          <Link
                            href={`/pacientes/${patient.active_internacion.id}/panel`}
                            className="flex h-7 items-center gap-1 rounded-md bg-primary px-2 text-[10px] font-bold text-white shadow-sm hover:bg-primary/90 transition-all"
                            title="Ver Panel de Internación"
                          >
                            <Stethoscope className="h-3 w-3" />
                            Panel
                          </Link>
                        )}
                        <button
                          onClick={() => onOpenHistory(patient)}
                          className="flex h-7 w-7 items-center justify-center rounded-md border border-border bg-background hover:bg-secondary text-foreground transition-all"
                          title="Ver Historial de Internaciones"
                        >
                          <History className="h-3.5 w-3.5 text-muted-foreground" />
                        </button>
                        <button
                          onClick={() => onOpenDossier(patient)}
                          className="flex h-7 w-7 items-center justify-center rounded-md border border-border bg-background hover:bg-secondary text-foreground transition-all"
                          title="Ver Dossier Clínico"
                        >
                          <Eye className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => onOpenEdit(patient)}
                          className="flex h-7 w-7 items-center justify-center rounded-md border border-border bg-background hover:bg-secondary text-foreground transition-all text-xs font-semibold px-2"
                        >
                          Editar
                        </button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
