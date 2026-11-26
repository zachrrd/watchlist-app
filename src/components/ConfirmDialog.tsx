import { AlertTriangle, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

export interface ConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "danger" | "default";
  isLoading?: boolean;
  error?: string | null;
  onConfirm: () => void | Promise<void>;
}

export default function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = "Delete",
  cancelLabel = "Cancel",
  variant = "danger",
  isLoading = false,
  error = null,
  onConfirm,
}: ConfirmDialogProps) {
  const isDanger = variant === "danger";

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!isLoading) {
          onOpenChange(nextOpen);
        }
      }}
    >
      <DialogContent
        showCloseButton={!isLoading}
        className="w-[calc(100vw-2rem)] max-w-md gap-0 overflow-hidden rounded-2xl border border-white/[0.08] bg-[#101116] p-0 text-zinc-100 shadow-[0_24px_64px_-12px_rgba(0,0,0,0.85)]"
      >
        <DialogHeader className="px-6 pt-6 pb-4">
          <div className="flex items-start gap-3.5">
            <div
              className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border ${
                isDanger
                  ? "border-rose-500/20 bg-rose-500/10 text-rose-400"
                  : "border-indigo-500/20 bg-indigo-500/10 text-indigo-400"
              }`}
            >
              <AlertTriangle className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1 space-y-1.5 text-left">
              <DialogTitle className="text-base font-semibold tracking-tight text-white">
                {title}
              </DialogTitle>
              <DialogDescription className="text-sm leading-relaxed text-zinc-400">
                {description}
              </DialogDescription>
            </div>
          </div>

          {error && (
            <div className="mt-4 rounded-xl border border-rose-500/25 bg-rose-500/10 px-3.5 py-2.5 text-xs text-rose-300">
              {error}
            </div>
          )}
        </DialogHeader>

        <DialogFooter className="m-0 flex flex-row items-center justify-end gap-2.5 border-t border-white/[0.07] bg-[#0c0d11] px-6 py-3.5">
          <Button
            type="button"
            variant="ghost"
            disabled={isLoading}
            onClick={() => onOpenChange(false)}
            className="h-9 rounded-lg border border-white/[0.08] bg-white/[0.03] px-4 text-xs font-medium text-zinc-300 hover:bg-white/[0.07] hover:text-white cursor-pointer"
          >
            {cancelLabel}
          </Button>
          <Button
            type="button"
            disabled={isLoading}
            onClick={onConfirm}
            className={`h-9 gap-1.5 rounded-lg px-4 text-xs font-semibold shadow-sm transition-all cursor-pointer ${
              isDanger
                ? "bg-rose-600 text-white hover:bg-rose-500 active:scale-[0.98]"
                : "bg-indigo-600 text-white hover:bg-indigo-500 active:scale-[0.98]"
            }`}
          >
            {isLoading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            <span>{isLoading ? "Deleting..." : confirmLabel}</span>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
