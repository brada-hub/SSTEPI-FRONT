"use client";

import * as React from "react";
import { useAuthStore } from "@/stores/authStore";
import { type Inpatient } from "@/services/nursingService";
import { descargarEpicrisis, descargarEvolucionClinica } from "@/features/nursing/services/dischargeService";
import { 
  ShieldCheck, 
  FileDown, 
  LogOut, 
  Loader2, 
  AlertCircle, 
  HeartCrack, 
  ArrowRightLeft, 
  AlertTriangle, 
  FileSignature,
  FileCheck
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

interface DischargePanelProps {
  inpatient: Inpatient;
  onAlta: (payload: { tipo_alta: string; observaciones_alta?: string }) => Promise<void>;
  isPending?: boolean;
}

const MOTIVOS_ALTA = [
  { id: "Alta Médica", name: "Alta Médica (Curación o Mejoría)" },
  { id: "Alta Solicitada", name: "Alta Solicitada (Egreso Voluntario)" },
  { id: "Egreso por Traslado o Referencia", name: "Egreso por Traslado o Referencia" },
  { id: "Egreso por Fallecimiento", name: "Egreso por Fallecimiento (Defunción)" },
  { id: "Fuga", name: "Fuga (Abandono no Autorizado)" },
];

export function DischargePanel({ inpatient, onAlta, isPending }: DischargePanelProps) {
  const user = useAuthStore((state) => state.user);
  const hasPermission = useAuthStore((state) => state.hasPermission);
  const [downloadingEpicrisis, setDownloadingEpicrisis] = React.useState(false);
  const [downloadingEvolucion, setDownloadingEvolucion] = React.useState(false);
  const [confirmAlta, setConfirmAlta] = React.useState(false);

  // Form states
  const [tipoAlta, setTipoAlta] = React.useState("Alta Médica");
  const [observaciones, setObservaciones] = React.useState("");
  
  // Conditional form states
  const [centroDestino, setCentroDestino] = React.useState("");
  const [motivoTraslado, setMotivoTraslado] = React.useState("");
  const [horaDeceso, setHoraDeceso] = React.useState(format(new Date(), "HH:mm"));
  const [certificadoDefuncion, setCertificadoDefuncion] = React.useState("");

  // Reset conditional fields on type change
  React.useEffect(() => {
    setCentroDestino("");
    setMotivoTraslado("");
    setCertificadoDefuncion("");
    setObservaciones("");
    if (tipoAlta === "Egreso por Fallecimiento") {
      setHoraDeceso(format(new Date(), "HH:mm"));
    }
  }, [tipoAlta]);

  const isMedico = React.useMemo(() => {
    return (
      hasPermission("acceso.mis-pacientes") ||
      user?.role?.name?.toLowerCase().includes("medico") ||
      user?.role?.name?.toLowerCase().includes("médico")
    );
  }, [user, hasPermission]);

  const handleAltaSubmit = async () => {
    // Basic validation
    if (tipoAlta === "Egreso por Traslado o Referencia" && (!centroDestino.trim() || !motivoTraslado.trim())) {
      toast.error("Por favor complete el centro de destino y el motivo del traslado.");
      return;
    }

    if (tipoAlta === "Egreso por Fallecimiento" && (!certificadoDefuncion.trim() || !horaDeceso.trim())) {
      toast.error("Por favor complete el número de certificado y la hora del deceso.");
      return;
    }

    // Construct structured notes
    let finalObservaciones = observaciones.trim();
    if (tipoAlta === "Egreso por Traslado o Referencia") {
      finalObservaciones = `Centro de Salud Destinatario: ${centroDestino.trim()}. Motivo de Traslado/Referencia: ${motivoTraslado.trim()}.${observaciones.trim() ? " Observaciones Adicionales: " + observaciones.trim() : ""}`;
    } else if (tipoAlta === "Egreso por Fallecimiento") {
      finalObservaciones = `Hora de Deceso: ${horaDeceso.trim()}. Certificado de Defunción N°: ${certificadoDefuncion.trim()}.${observaciones.trim() ? " Observaciones Adicionales: " + observaciones.trim() : ""}`;
    } else if (tipoAlta === "Alta Solicitada") {
      finalObservaciones = `Alta voluntaria solicitada. Documento eximente de responsabilidad legal debidamente firmado por familiares/responsables. ${observaciones.trim()}`;
    } else if (tipoAlta === "Fuga") {
      finalObservaciones = `Paciente abandona el centro médico sin autorización ni alta formal (Fuga). Reporte de ausencia de enfermería oficial anexado a ficha clínica. ${observaciones.trim()}`;
    }

    try {
      await onAlta({
        tipo_alta: tipoAlta,
        observaciones_alta: finalObservaciones || "Egresado sin observaciones particulares de alta.",
      });
      setConfirmAlta(false);
      
      // ✅ Auto-download PDF epicrisis summary
      setDownloadingEpicrisis(true);
      toast.info("Alta registrada con éxito. Descargando Epicrisis PDF...");
      try {
        await descargarEpicrisis(
          inpatient.id,
          inpatient.paciente?.apellidos || "Paciente",
          inpatient.paciente?.ci || "SD"
        );
        toast.success("Epicrisis descargada automáticamente.");
      } catch (err) {
        toast.error("Fallo la descarga automática. Puede descargar el reporte manualmente abajo.");
      } finally {
        setDownloadingEpicrisis(false);
      }
    } catch (error) {
      // toast shown by hook
    }
  };

  const handleDescargarEpicrisis = async () => {
    setDownloadingEpicrisis(true);
    try {
      await descargarEpicrisis(
        inpatient.id,
        inpatient.paciente?.apellidos || "Paciente",
        inpatient.paciente?.ci || "SD"
      );
      toast.success("Epicrisis descargada correctamente.");
    } catch (error) {
      toast.error("Error al descargar la epicrisis.");
    } finally {
      setDownloadingEpicrisis(false);
    }
  };

  const handleDescargarEvolucion = async () => {
    setDownloadingEvolucion(true);
    try {
      await descargarEvolucionClinica(
        inpatient.id,
        inpatient.paciente?.apellidos || "Paciente",
        inpatient.paciente?.ci || "SD"
      );
      toast.success("Evolución clínica descargada correctamente.");
    } catch (error) {
      toast.error("Error al descargar la evolución clínica.");
    } finally {
      setDownloadingEvolucion(false);
    }
  };

  const isAlta = !!inpatient.fecha_alta;

  return (
    <div className="rounded-xl border border-border bg-card p-4 space-y-4 shadow-sm">
      <div className="flex items-center gap-3">
        <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${isAlta ? 'bg-teal-500/10 text-teal-600 dark:text-teal-400' : 'bg-accent-amber/10 text-accent-amber'}`}>
          <ShieldCheck className="h-5 w-5" />
        </div>
        <div className="text-left">
          <h3 className="text-sm font-bold text-foreground">Estado del Alta Médica</h3>
          <p className="text-[11px] text-muted-foreground leading-tight">
            {isAlta
              ? `Dado de alta el ${new Date(inpatient.fecha_alta!).toLocaleString("es-ES")}`
              : "Paciente actualmente internado"}
          </p>
        </div>
      </div>

      {!isAlta ? (
        <div className="space-y-3">
          {confirmAlta ? (
            <div className="rounded-xl border border-border bg-secondary/10 p-3 space-y-3 animate-fadeIn">
              <div className="flex items-start gap-2 text-xs text-muted-foreground border-b border-border/40 pb-2">
                <AlertCircle className="h-4.5 w-4.5 text-accent-amber shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-foreground block">Egreso de Internación</span>
                  Se registrará el egreso formal y se liberará la cama <strong>{inpatient.cama?.codigo || "S/A"}</strong>.
                </div>
              </div>

              {/* Formulario de Alta */}
              <div className="space-y-3 text-left">
                {/* Tipo de Alta */}
                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-muted-foreground uppercase">Motivo o Tipo de Egreso *</label>
                  <select
                    value={tipoAlta}
                    onChange={(e) => setTipoAlta(e.target.value)}
                    className="w-full h-9 rounded-lg border border-border bg-secondary/50 px-2.5 text-xs outline-none focus:border-primary font-semibold"
                  >
                    {MOTIVOS_ALTA.map((m) => (
                      <option key={m.id} value={m.id}>{m.name}</option>
                    ))}
                  </select>
                </div>

                {/* Conditional Fields: Traslado */}
                {tipoAlta === "Egreso por Traslado o Referencia" && (
                  <div className="space-y-2 p-2.5 rounded-lg bg-blue-500/5 border border-blue-500/10 space-y-2.5 animate-fadeIn">
                    <div className="flex items-center gap-1.5 text-xs text-blue-600 dark:text-blue-400 font-bold">
                      <ArrowRightLeft className="h-3.5 w-3.5" />
                      <span>Detalles de Derivación Hospitalaria</span>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] font-bold text-muted-foreground uppercase">Centro de Salud Destinatario *</label>
                      <input
                        type="text"
                        value={centroDestino}
                        onChange={(e) => setCentroDestino(e.target.value)}
                        placeholder="Ej: Hospital de Clínicas de Tercer Nivel"
                        className="w-full h-8 rounded-lg border border-border bg-secondary/40 px-2.5 text-xs outline-none focus:border-primary"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] font-bold text-muted-foreground uppercase">Motivo del Traslado *</label>
                      <input
                        type="text"
                        value={motivoTraslado}
                        onChange={(e) => setMotivoTraslado(e.target.value)}
                        placeholder="Ej: Complejidad técnica cardiológica"
                        className="w-full h-8 rounded-lg border border-border bg-secondary/40 px-2.5 text-xs outline-none focus:border-primary"
                      />
                    </div>
                  </div>
                )}

                {/* Conditional Fields: Fallecimiento */}
                {tipoAlta === "Egreso por Fallecimiento" && (
                  <div className="space-y-2 p-2.5 rounded-lg bg-red-500/5 border border-red-500/10 space-y-2.5 animate-fadeIn">
                    <div className="flex items-center gap-1.5 text-xs text-red-600 dark:text-red-400 font-bold">
                      <HeartCrack className="h-3.5 w-3.5" />
                      <span>Registro de Defunción</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <label className="text-[9px] font-bold text-muted-foreground uppercase">Hora del Deceso *</label>
                        <input
                          type="time"
                          value={horaDeceso}
                          onChange={(e) => setHoraDeceso(e.target.value)}
                          className="w-full h-8 rounded-lg border border-border bg-secondary/40 px-2.5 text-xs outline-none focus:border-primary font-mono"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[9px] font-bold text-muted-foreground uppercase">Certificado Defunción N° *</label>
                        <input
                          type="text"
                          value={certificadoDefuncion}
                          onChange={(e) => setCertificadoDefuncion(e.target.value)}
                          placeholder="Ej: N° 928392"
                          className="w-full h-8 rounded-lg border border-border bg-secondary/40 px-2.5 text-xs outline-none focus:border-primary"
                        />
                      </div>
                    </div>
                    <div className="rounded border border-red-500/20 bg-red-500/5 p-1.5 flex gap-1.5 text-[9px] text-red-600 dark:text-red-400 leading-tight">
                      <AlertTriangle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                      <span>El expediente clínico quedará bloqueado administrativamente y no admitirá nuevas modificaciones clínicas tras guardar.</span>
                    </div>
                  </div>
                )}

                {/* Legal Warning: Alta Solicitada */}
                {tipoAlta === "Alta Solicitada" && (
                  <div className="p-2 rounded bg-amber-500/5 border border-amber-500/15 flex gap-2 text-[10px] text-amber-600 dark:text-amber-400 leading-tight">
                    <FileSignature className="h-4 w-4 shrink-0 mt-0.5" />
                    <span><strong>Nota de Respaldo:</strong> Para continuar, verifique que se haya completado y firmado físicamente el documento eximente de responsabilidad institucional.</span>
                  </div>
                )}

                {/* Legal Warning: Fuga */}
                {tipoAlta === "Fuga" && (
                  <div className="p-2 rounded bg-purple-500/5 border border-purple-500/15 flex gap-2 text-[10px] text-purple-600 dark:text-purple-400 leading-tight">
                    <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                    <span><strong>Acción de Respaldo:</strong> Obliga a la elaboración de un informe de ausencia oficial por enfermería en la estación.</span>
                  </div>
                )}

                {/* Observaciones Generales */}
                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-muted-foreground uppercase">
                    Observaciones y Resumen de Alta
                  </label>
                  <textarea
                    value={observaciones}
                    onChange={(e) => setObservaciones(e.target.value)}
                    rows={3}
                    placeholder="Escriba aquí el estado final clínico, evolución sintomática o detalles pertinentes..."
                    className="w-full rounded-lg border border-border bg-secondary/40 p-2 text-xs outline-none resize-none focus:border-primary placeholder:text-muted-foreground/60"
                  />
                </div>
              </div>

              {/* Confirm Actions */}
              <div className="flex gap-2 justify-end pt-2 border-t border-border/30">
                <button
                  type="button"
                  onClick={() => setConfirmAlta(false)}
                  className="h-8 px-3 rounded-lg border border-border bg-background text-[11px] font-bold text-foreground hover:bg-secondary cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleAltaSubmit}
                  disabled={isPending}
                  className="h-8 px-3.5 rounded-lg bg-destructive hover:bg-destructive/90 text-[11px] font-bold text-white shadow-sm flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  Confirmar Egreso
                </button>
              </div>
            </div>
          ) : (
            <div className="rounded-lg border border-border bg-secondary/10 p-3 space-y-3">
              <div className="flex items-start gap-2.5 text-xs text-muted-foreground">
                <AlertCircle className="h-4 w-4 text-accent-amber shrink-0 mt-0.5" />
                <p className="leading-tight text-left">
                  El alta médica finalizará la internación del paciente, liberará la cama ocupada (<strong>{inpatient.cama?.codigo || "Sin asignar"}</strong>) y generará la epicrisis de egreso.
                </p>
              </div>
              <div className="flex justify-end">
                {isMedico ? (
                  <button
                    type="button"
                    onClick={() => setConfirmAlta(true)}
                    className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-accent-amber px-3.5 text-xs font-bold text-white shadow-sm hover:bg-accent-amber/90 cursor-pointer transition-colors"
                  >
                    <LogOut className="h-3.5 w-3.5" />
                    Registrar Alta / Egreso
                  </button>
                ) : (
                  <p className="text-[10px] text-muted-foreground italic">
                    * Solo médicos autorizados pueden registrar altas de pacientes.
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-3 pt-1">
          {/* Discharge Information Display Box */}
          <div className="p-3 text-left bg-teal-500/5 border border-teal-500/15 rounded-xl space-y-1.5 text-xs">
            <span className="text-[9px] font-extrabold text-teal-600 dark:text-teal-400 uppercase tracking-wider block">
              Ficha de Egreso Hospitalario
            </span>
            <div className="space-y-1 text-foreground">
              <div>
                <strong>Motivo Egreso:</strong>{" "}
                <span className="font-semibold text-teal-600 dark:text-teal-400">{inpatient.tipo_alta || "Alta Médica"}</span>
              </div>
              <div>
                <strong>Detalles:</strong>{" "}
                <p className="text-[11px] text-muted-foreground mt-0.5 italic leading-relaxed">
                  "{inpatient.observaciones_alta || "Egresado sin observaciones particulares de alta."}"
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <button
              type="button"
              onClick={handleDescargarEpicrisis}
              disabled={downloadingEpicrisis}
              className="inline-flex h-9 items-center justify-center gap-2 rounded-lg border border-border bg-secondary/35 text-xs font-bold text-foreground hover:bg-secondary/60 disabled:opacity-50 cursor-pointer"
            >
              {downloadingEpicrisis ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <FileDown className="h-4 w-4 text-teal-600 dark:text-teal-400" />
              )}
              Epicrisis PDF
            </button>
            <button
              type="button"
              onClick={handleDescargarEvolucion}
              disabled={downloadingEvolucion}
              className="inline-flex h-9 items-center justify-center gap-2 rounded-lg border border-border bg-secondary/35 text-xs font-bold text-foreground hover:bg-secondary/60 disabled:opacity-50 cursor-pointer"
            >
              {downloadingEvolucion ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <FileDown className="h-4 w-4 text-teal-600 dark:text-teal-400" />
              )}
              Evolución Clínica PDF
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default DischargePanel;
