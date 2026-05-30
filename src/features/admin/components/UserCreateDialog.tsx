"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription, 
  DialogFooter 
} from "@/components/ui/dialog";
import { Role, User } from "@/stores/authStore";
import { generateWhatsAppLink } from "@/lib/clinical";
import { UserPlus, ShieldCheck, Copy, Send, CopyCheck } from "lucide-react";
import { toast } from "sonner";

const userSchema = z.object({
  name: z.string().min(2, "Mínimo 2 caracteres"),
  username: z.string().min(3, "Mínimo 3 caracteres"),
  email: z.string().email("Correo electrónico inválido"),
  role_id: z.coerce.number().min(1, "Debe seleccionar un rol"),
  telefono: z.string().regex(/^[67]\d{7}$/, "Debe ser un número celular de Bolivia válido (8 dígitos, inicia con 6 o 7)"),
});

type UserFormValues = z.infer<typeof userSchema>;

interface UserCreateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  roles: Role[];
  onSubmitSuccess: (data: any) => Promise<any>;
  userToEdit?: User | null;
}

export function UserCreateDialog({
  open,
  onOpenChange,
  roles,
  onSubmitSuccess,
  userToEdit,
}: UserCreateDialogProps) {
  const [createdCredentials, setCreatedCredentials] = React.useState<{
    name: string;
    user: string;
    pass: string;
    phone: string;
  } | null>(null);

  const [copied, setCopied] = React.useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<any>({
    resolver: zodResolver(userSchema),
    defaultValues: {
      name: "",
      username: "",
      email: "",
      role_id: 1,
      telefono: "",
    },
  });

  React.useEffect(() => {
    if (open) {
      if (userToEdit) {
        reset({
          name: userToEdit.name,
          username: userToEdit.username,
          email: userToEdit.email,
          role_id: userToEdit.role?.id ?? 1,
          telefono: (userToEdit as any).telefono ?? "70000000", // Celular por defecto para Bolivia si falta
        });
      } else {
        reset({
          name: "",
          username: "",
          email: "",
          role_id: 1,
          telefono: "",
        });
      }
      setCreatedCredentials(null);
      setCopied(false);
    }
  }, [open, userToEdit, reset]);

  const handleFormSubmit = async (values: UserFormValues) => {
    try {
      if (userToEdit) {
        // Enviar actualización
        await onSubmitSuccess({
          ...values,
          role_id: Number(values.role_id),
        });
        toast.success("Expediente del profesional actualizado.");
        onOpenChange(false);
      } else {
        const generatedPass = "Sstepi." + Math.floor(1000 + Math.random() * 9000);
        
        await onSubmitSuccess({
          ...values,
          role_id: Number(values.role_id),
          password: generatedPass,
        });

        // Rellenar credenciales dispensadas
        setCreatedCredentials({
          name: values.name,
          user: values.username,
          pass: generatedPass,
          phone: values.telefono,
        });

        toast.success("Profesional registrado e inventariado con éxito.");
      }
    } catch (error) {
      toast.error("Fallo al guardar profesional en la base de datos.");
    }
  };

  const copyToClipboard = () => {
    if (!createdCredentials) return;
    const text = `SSTEPI ACCESO:\nUsuario: ${createdCredentials.user}\nContraseña: ${createdCredentials.pass}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success("Credenciales copiadas al portapapeles.");
    setTimeout(() => setCopied(false), 2000);
  };

  const whatsAppText = createdCredentials 
    ? `SSTEPI - NUEVAS CREDENCIALES DE GUARDIA:\n\n` +
      `Estimado/a ${createdCredentials.name},\n` +
      `Te damos la bienvenida al portal clínico SSTEPI. Tus credenciales de guardia son:\n` +
      `• Usuario: ${createdCredentials.user}\n` +
      `• Contraseña temporal: ${createdCredentials.pass}\n\n` +
      `Por favor, cambia tu contraseña al iniciar sesión por primera vez.`
    : "";

  const waLink = createdCredentials 
    ? generateWhatsAppLink(createdCredentials.phone, whatsAppText) 
    : "";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent maxWidthClass="max-w-md" onClose={() => onOpenChange(false)}>
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <UserPlus className="h-4.5 w-4.5" />
            </div>
            <div className="flex flex-col text-left">
              <DialogTitle>
                {userToEdit ? "Modificar Profesional Clínico" : "Registrar Profesional Clínico"}
              </DialogTitle>
              <DialogDescription>
                {userToEdit ? "Modifique el rol o datos demográficos del profesional." : "Ingresa al personal en la base de censo y credenciales."}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* Panel de Dispensador de Credenciales si ya se creó */}
        {createdCredentials ? (
          <div className="my-4 space-y-4 text-xs text-left">
            <div className="rounded-xl border border-accent-teal/20 bg-accent-teal/5 p-4 space-y-3">
              <span className="text-[10px] font-bold text-accent-teal uppercase tracking-wider block">
                Dispensador de Credenciales Clínicas
              </span>
              
              <div className="rounded-lg border border-border bg-card p-3 space-y-2 font-mono text-[11px]">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Usuario:</span>
                  <span className="font-bold text-foreground">{createdCredentials.user}</span>
                </div>
                <div className="flex justify-between border-t border-border/45 pt-2">
                  <span className="text-muted-foreground">Contraseña:</span>
                  <span className="font-bold text-foreground">{createdCredentials.pass}</span>
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={copyToClipboard}
                  className="flex-1 inline-flex h-9 items-center justify-center gap-1.5 rounded-lg border border-border bg-background px-3 text-[11px] font-bold text-foreground hover:bg-secondary transition-all cursor-pointer"
                >
                  {copied ? <CopyCheck className="h-3.5 w-3.5 text-accent-teal" /> : <Copy className="h-3.5 w-3.5" />}
                  {copied ? "Copiado" : "Copiar Credenciales"}
                </button>
                
                <a
                  href={waLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg bg-[#25d366] px-3.5 text-[11px] font-bold text-white hover:bg-[#20ba5a] transition-all"
                >
                  <Send className="h-3.5 w-3.5 fill-white" />
                  Enviar WhatsApp
                </a>
              </div>
            </div>

            <button
              onClick={() => onOpenChange(false)}
              className="w-full inline-flex h-9 items-center justify-center rounded-lg border border-border bg-background px-4 text-xs font-bold text-foreground hover:bg-secondary transition-all cursor-pointer"
            >
              Finalizar Registro
            </button>
          </div>
        ) : (
          /* Formulario de Creación Estándar */
          <form onSubmit={handleSubmit(handleFormSubmit)} className="my-4 space-y-3.5 text-left">
            <div className="grid gap-3 grid-cols-2">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-muted-foreground uppercase">Nombre Completo</label>
                <input type="text" {...register("name")} className="w-full h-9 rounded-lg border border-border bg-secondary/50 px-3 text-xs outline-none" />
                {errors.name?.message && <span className="text-[9px] text-destructive block">{String(errors.name.message)}</span>}
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-muted-foreground uppercase">Usuario Acceso</label>
                <input type="text" placeholder="ej: dr.ortiz" {...register("username")} className="w-full h-9 rounded-lg border border-border bg-secondary/50 px-3 text-xs outline-none" />
                {errors.username?.message && <span className="text-[9px] text-destructive block">{String(errors.username.message)}</span>}
              </div>
            </div>

            <div className="grid gap-3 grid-cols-2">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-muted-foreground uppercase">Correo Corporativo</label>
                <input type="email" placeholder="dr.ortiz@sstepi.com" {...register("email")} className="w-full h-9 rounded-lg border border-border bg-secondary/50 px-3 text-xs outline-none" />
                {errors.email?.message && <span className="text-[9px] text-destructive block">{String(errors.email.message)}</span>}
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-muted-foreground uppercase">Celular Bolivia</label>
                <input type="text" placeholder="ej: 76543210" {...register("telefono")} className="w-full h-9 rounded-lg border border-border bg-secondary/50 px-3 text-xs outline-none" />
                {errors.telefono?.message && <span className="text-[9px] text-destructive block">{String(errors.telefono.message)}</span>}
              </div>
            </div>

            {/* Selector de Rol */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-muted-foreground uppercase">Rol del Profesional</label>
              <select
                {...register("role_id", { valueAsNumber: true })}
                className="w-full h-9 rounded-lg border border-border bg-secondary/50 px-3 text-xs outline-none cursor-pointer"
              >
                {roles.map((r) => (
                  <option key={r.id} value={r.id}>{r.name}</option>
                ))}
              </select>
            </div>

            {/* Footer */}
            <DialogFooter>
              <button type="button" onClick={() => onOpenChange(false)} className="inline-flex h-9 items-center justify-center rounded-lg border border-border bg-background px-4 text-xs font-bold text-foreground hover:bg-secondary cursor-pointer">
                Cancelar
              </button>
              <button
                type="submit"
                onClick={handleSubmit(handleFormSubmit)}
                disabled={isSubmitting}
                className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg bg-primary px-4 text-xs font-bold text-white shadow-sm hover:bg-primary/95 disabled:opacity-50 cursor-pointer"
              >
                {isSubmitting ? "Sincronizando..." : <><ShieldCheck className="h-4 w-4" /> {userToEdit ? "Guardar Cambios" : "Registrar & Dispensar"}</>}
              </button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
export default UserCreateDialog;
