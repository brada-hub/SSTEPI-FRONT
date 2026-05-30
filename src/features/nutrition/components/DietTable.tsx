"use client";

import * as React from "react";
import { 
  Table, 
  TableHeader, 
  TableBody, 
  TableRow, 
  TableHead, 
  TableCell 
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Apple, EyeOff, ClipboardList, Search } from "lucide-react";

interface DietTableProps {
  patients: any[];
  onOpenAssign: (inpatient: any) => void;
  onOpenSuspend: (diet: any) => void;
}

export function DietTable({ patients, onOpenAssign, onOpenSuspend }: DietTableProps) {
  const [searchTerm, setSearchTerm] = React.useState("");

  const filteredPatients = React.useMemo(() => {
    if (!Array.isArray(patients)) return [];
    if (!searchTerm.trim()) return patients;
    const term = searchTerm.toLowerCase();
    return patients.filter(
      (p) =>
        (p?.paciente?.nombre?.toLowerCase() ?? "").includes(term) ||
        (p?.paciente?.apellidos?.toLowerCase() ?? "").includes(term) ||
        (p?.cama?.codigo?.toLowerCase() ?? "").includes(term)
    );
  }, [patients, searchTerm]);

  return (
    <div className="space-y-4">
      {/* Buscador */}
      <div className="relative flex max-w-sm items-center">
        <Search className="absolute left-3 h-4 w-4 text-muted-foreground" />
        <input
          type="text"
          placeholder="Buscar paciente o cama..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full h-9 rounded-lg border border-border bg-card pl-10 pr-4 text-xs font-semibold text-foreground outline-none focus:border-primary transition-all placeholder:text-muted-foreground/60"
        />
      </div>

      {/* Roster Table */}
      <div className="rounded-xl border border-border bg-card overflow-hidden shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Cama / Paciente</TableHead>
              <TableHead>Sala Física</TableHead>
              <TableHead>Dieta Activa</TableHead>
              <TableHead>Instrucciones de Alimentación</TableHead>
              <TableHead className="text-right">Acciones de Nutrición</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {!Array.isArray(filteredPatients) || filteredPatients.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                  Ningún paciente encontrado para dietas.
                </TableCell>
              </TableRow>
            ) : (
              filteredPatients.map((item) => {
                if (!item) return null;
                // Encontrar la dieta activa (si existe)
                const activeDiet = item?.dietas && Array.isArray(item.dietas)
                  ? item.dietas.find((d: any) => d?.estado === "activo")
                  : null;

                const camaCodigo = item?.cama?.nombre ?? item?.cama?.codigo ?? "S-C";
                const pacienteNombre = item?.paciente?.nombre ?? "Paciente sin nombre";
                const pacienteApellidos = item?.paciente?.apellidos ?? "";
                const salaNombre = item?.sala?.nombre ?? "Sin Sala";

                return (
                  <TableRow key={item.id}>
                    {/* Celda Cama / Paciente */}
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-secondary text-primary font-bold text-xs">
                          {camaCodigo.slice(0, 2)}
                        </div>
                        <div className="flex flex-col">
                          <span className="font-bold text-foreground leading-snug">
                            {pacienteNombre} {pacienteApellidos}
                          </span>
                          <span className="font-mono text-[9px] text-primary font-bold">
                            Cama: {camaCodigo}
                          </span>
                        </div>
                      </div>
                    </TableCell>

                    {/* Celda Sala */}
                    <TableCell className="font-semibold text-muted-foreground">
                      {salaNombre}
                    </TableCell>

                    {/* Celda Dieta Activa */}
                    <TableCell>
                      {activeDiet ? (
                        <Badge variant={activeDiet.tipo_dieta === "Ayuno absoluto" ? "destructive" : "teal"}>
                          {activeDiet.tipo_dieta}
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-muted-foreground">
                          Sin Asignación
                        </Badge>
                      )}
                    </TableCell>

                    {/* Celda Instrucciones */}
                    <TableCell className="max-w-xs truncate font-medium text-foreground">
                      {activeDiet ? activeDiet.indicaciones : "No se han registrado indicaciones alimenticias."}
                    </TableCell>

                    {/* Celda Acciones */}
                    <TableCell className="text-right">
                      {activeDiet ? (
                        <button
                          onClick={() => onOpenSuspend(activeDiet)}
                          className="inline-flex h-7 items-center justify-center gap-1 rounded-md border border-destructive/20 bg-destructive/5 hover:bg-destructive/10 text-destructive px-2 text-[10px] font-bold transition-all cursor-pointer"
                        >
                          <EyeOff className="h-3 w-3" />
                          Suspender
                        </button>
                      ) : (
                        <button
                          onClick={() => onOpenAssign(item)}
                          className="inline-flex h-7 items-center justify-center gap-1 rounded-md border border-accent-teal/20 bg-accent-teal/5 hover:bg-accent-teal/10 text-accent-teal px-2 text-[10px] font-bold transition-all cursor-pointer"
                        >
                          <Apple className="h-3 w-3" />
                          Asignar Dieta
                        </button>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody></Table>
      </div>
    </div>
  );
}
export default DietTable;
