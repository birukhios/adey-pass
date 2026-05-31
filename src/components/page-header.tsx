import { ButtonLink } from "@/components/ui";

export function PageHeader({
  title,
  description,
  actionHref,
  actionLabel,
}: {
  title: string;
  description: string;
  actionHref?: string;
  actionLabel?: string;
}) {
  void title;
  void description;
  return (
    <div className="mb-4 flex justify-end">
      {actionHref && actionLabel ? <ButtonLink href={actionHref}>{actionLabel}</ButtonLink> : null}
    </div>
  );
}
