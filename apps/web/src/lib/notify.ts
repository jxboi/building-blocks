import { toast as sonnerToast } from "sonner";

/**
 * The sanctioned toast surface. Product code imports `notify` and never `sonner`
 * directly (enforced by the `no-raw-toast` lint rule), so toast usage stays
 * consistent: transient feedback about an action just taken, never persistent
 * conditions (those are banners or inline alerts — see the messaging hierarchy).
 */
export const notify = {
  /** Confirms a durable change succeeded. */
  success(message: string, description?: string) {
    return sonnerToast.success(message, description ? { description } : undefined);
  },
  /** Reports a failure; surfaces the correlation ID so support can find the log line. */
  error(message: string, options?: { description?: string; correlationId?: string }) {
    const parts = [options?.description, options?.correlationId ? `Ref: ${options.correlationId}` : undefined].filter(Boolean);
    return sonnerToast.error(message, parts.length ? { description: parts.join(" · ") } : undefined);
  },
  /** Feedback for a reversible action, with an inline undo. */
  undo(message: string, options: { onUndo: () => void; label?: string; description?: string }) {
    return sonnerToast(message, {
      description: options.description,
      action: { label: options.label ?? "Undo", onClick: options.onUndo },
    });
  },
  /** Neutral acknowledgement. */
  info(message: string, description?: string) {
    return sonnerToast(message, description ? { description } : undefined);
  },
};
