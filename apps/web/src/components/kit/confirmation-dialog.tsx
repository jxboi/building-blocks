"use client";

import { Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function ConfirmationDialog({
  title,
  description,
  triggerLabel,
  confirmationText,
  onConfirm,
}: {
  title: string;
  description: string;
  triggerLabel: string;
  confirmationText?: string;
  onConfirm?: () => void;
}) {
  const [value, setValue] = useState("");
  const t = useTranslations("common");
  const allowed = !confirmationText || value === confirmationText;

  return (
    <AlertDialog onOpenChange={(open) => !open && setValue("")}>
      <AlertDialogTrigger asChild>
        <Button variant="destructive">
          <Trash2 className="size-4" />
          {triggerLabel}
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogMedia>
            <Trash2 className="size-5 text-destructive" aria-hidden="true" />
          </AlertDialogMedia>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        {confirmationText ? (
          <div className="grid gap-2">
            <Label htmlFor="confirmation-text">{t("typeToConfirm", { value: confirmationText })}</Label>
            <Input
              id="confirmation-text"
              value={value}
              onChange={(event) => setValue(event.target.value)}
              autoComplete="off"
            />
          </div>
        ) : null}
        <AlertDialogFooter>
          <AlertDialogCancel>{t("cancel")}</AlertDialogCancel>
          <AlertDialogAction variant="destructive" disabled={!allowed} onClick={onConfirm}>
            {t("confirm")}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
