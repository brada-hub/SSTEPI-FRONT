import * as React from "react";
import { Medicine } from "@/services/pharmacyService";
import { 
  Table, 
  TableHeader, 
  TableBody, 
  TableRow, 
  TableHead, 
  TableCell 
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Pill, Search, ClipboardPlus, Edit, Trash2 } from "lucide-react";

interface MedicineTableProps {
  medicines: Medicine[];
  onOpenDispense: (medicine: Medicine) => void;
  onOpenEdit: (medicine: Medicine) => void;
  onDelete: (id: number) => void;
}

export function MedicineTable({ medicines, onOpenDispense, onOpenEdit, onDelete }: MedicineTableProps) {
  const [searchTerm, setSearchTerm] = React.useState("");

  const filteredMedicines = React.useMemo(() => {
    if (!searchTerm.trim()) return medicines;
    const term = searchTerm.toLowerCase();
    return medicines.filter(
      (m) =>
        m.nombre.toLowerCase().includes(term) ||
        (m.estante && m.estante.toLowerCase().includes(term)) ||
        (m.categoria?.nombre && m.categoria.nombre.toLowerCase().includes(term))
    );
  }, [medicines, searchTerm]);

  return (
    <div className="space-y-4">
      {/* Buscador */}
      <div className="relative flex max-w-sm items-center">
        <Search className="absolute left-3 h-4 w-4 text-muted-foreground" />
        <input
          type="text"
          placeholder="Buscar por fármaco, estante o categoría..."
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
              <TableHead>Fármaco SKU</TableHead>
              <TableHead>Categoría</TableHead>
              <TableHead>Estante / Logística</TableHead>
              <TableHead>Nivel Stock</TableHead>
              <TableHead className="text-right">Acciones Logísticas</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredMedicines.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                  Ningún medicamento registrado en este inventario.
                </TableCell>
              </TableRow>
            ) : (
              filteredMedicines.map((med) => {
                const isCritical = med.stock <= (med.stock_critico ?? 10);
                const isLow = med.stock > (med.stock_critico ?? 10) && med.stock <= (med.stock_critico ?? 10) * 2;
                
                return (
                  <TableRow key={med.id}>
                    {/* Celda Fármaco */}
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-secondary text-primary font-bold text-xs">
                          <Pill className="h-4 w-4" />
                        </div>
                        <div className="flex flex-col">
                          <span className="font-bold text-foreground leading-snug">
                            {med.nombre}
                          </span>
                          <span className="text-[9px] text-muted-foreground font-semibold">
                            ID: {med.id}
                          </span>
                        </div>
                      </div>
                    </TableCell>

                    {/* Celda Categoría */}
                    <TableCell className="font-semibold text-muted-foreground">
                      {med.categoria?.nombre || "General / Insumos"}
                    </TableCell>

                    {/* Celda Estante */}
                    <TableCell className="font-mono text-xs font-semibold text-foreground">
                      {med.estante || "Pasillo A / Estante 1"}
                    </TableCell>

                    {/* Celda Stock */}
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-foreground bg-secondary/50 px-2 py-0.5 rounded-md border border-border/20">
                          {med.stock} uds
                        </span>
                        {isCritical ? (
                          <Badge variant="destructive" className="animate-pulse">Crítico</Badge>
                        ) : isLow ? (
                          <Badge variant="amber">Bajo Stock</Badge>
                        ) : (
                          <Badge variant="teal">Óptimo</Badge>
                        )}
                      </div>
                    </TableCell>

                    {/* Celda Acciones */}
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => onOpenDispense(med)}
                          disabled={med.stock <= 0}
                          className="inline-flex h-7 items-center justify-center gap-1 rounded-md border border-primary/20 bg-primary/5 hover:bg-primary/10 text-primary px-2 text-[10px] font-bold transition-all disabled:opacity-50 cursor-pointer"
                          title="Dispensar medicamento"
                        >
                          <ClipboardPlus className="h-3.5 w-3.5" />
                          Dispensar
                        </button>
                        <button
                          onClick={() => onOpenEdit(med)}
                          className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-border bg-background hover:bg-secondary text-muted-foreground hover:text-foreground transition-all cursor-pointer"
                          title="Editar medicamento"
                        >
                          <Edit className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => {
                            if (window.confirm("¿Está seguro de eliminar este medicamento del inventario?")) {
                              onDelete(med.id);
                            }
                          }}
                          className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-destructive/20 bg-destructive/5 hover:bg-destructive/10 text-destructive transition-all cursor-pointer"
                          title="Eliminar medicamento"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
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
export default MedicineTable;
