import { Flower, Star } from "./Decorations";

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
    <div className="relative mx-auto my-10 max-w-md paper-card px-6 py-10 text-center rotate-[-0.6deg]">
      <Star className="absolute -top-3 -left-3" />
      <Flower className="absolute -bottom-4 -right-3" />
      <h2 className="text-2xl">{title}</h2>
      <p className="hand mt-2 text-xl text-ink-soft">{message}</p>
      {action && <div className="mt-6 flex flex-wrap justify-center gap-3">{action}</div>}
    </div>
  );
}
