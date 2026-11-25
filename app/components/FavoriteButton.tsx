import { useFavorites } from "~/lib/favorites";
import { HeartIcon } from "./Icons";

export function FavoriteButton({
  photoId,
  label,
  variant = "card",
}: {
  photoId: string;
  /** Short description of the photo for the screen-reader label. */
  label: string;
  variant?: "card" | "dark";
}) {
  const { has, toggle } = useFavorites();
  const active = has(photoId);
  const base =
    variant === "dark"
      ? "icon-btn text-white hover:!bg-white/15"
      : "icon-btn bg-card/90 shadow-sm hover:!bg-card";
  return (
    <button
      type="button"
      className={`${base} ${active ? "!text-rose" : ""}`}
      aria-pressed={active}
      aria-label={active ? `Remove “${label}” from favorites` : `Add “${label}” to favorites`}
      onClick={(e) => {
        e.stopPropagation();
        toggle(photoId);
      }}
    >
      <HeartIcon filled={active} size={21} className={active ? "text-[#c98e80]" : ""} />
    </button>
  );
}
