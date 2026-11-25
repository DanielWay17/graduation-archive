/** A reference to a photo used as an image somewhere else (e.g. an album cover). */
export type ImageRef = {
  photoId: string;
  thumbnailUrl: string;
  imageUrl: string;
  width: number;
  height: number;
  altText: string;
};

export type Album = {
  id: string;
  title: string;
  slug: string;
  description: string;
  /** Short handwritten tag shown on the card, e.g. "the big day". */
  label: string;
  coverImage: ImageRef | null;
  /** The chosen cover photo, if the owner picked one (null = first published photo). */
  coverPhotoId: string | null;
  /** Published photos only. */
  photoCount: number;
  /** Unpublished photos; only filled for the owner. */
  draftCount: number;
  createdAt: string;
  updatedAt: string;
  sortOrder: number;
};

export type Photo = {
  id: string;
  albumId: string;
  albumTitle: string;
  albumSlug: string;
  imageUrl: string;
  thumbnailUrl: string;
  width: number;
  height: number;
  caption: string;
  altText: string;
  /** YYYY-MM-DD or null. */
  photoDate: string | null;
  uploaderName: string;
  createdAt: string;
  sortOrder: number;
  published: boolean;
};

export type UploadResult =
  | { ok: true; photo: Photo }
  | { ok: false; error: string; code?: "duplicate" | "rate_limited" | "invalid" | "storage_full" | "unauthorized" };
