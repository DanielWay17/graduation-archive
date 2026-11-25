import { ImageIcon } from "./Icons";

export function EmptyState({
  title,
  message,
  action,
}: {
  title: string;
  message: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="mx-auto my-10 max-w-md rounded-2xl border border-line bg-card px-6 py-12 text-center">
      <span aria-hidden="true" className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-paper-2 text-ink-soft">
        <ImageIcon size={26} />
      </span>
      <h2 className="mt-5 text-2xl">{title}</h2>
      <p className="mt-2 text-ink-soft">{message}</p>
      {action && <div className="mt-7 flex flex-wrap justify-center gap-3">{action}</div>}
    </div>
  );
}
