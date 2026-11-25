import { type RouteConfig, index, layout, prefix, route } from "@react-router/dev/routes";

export default [
  index("routes/home.tsx"),
  route("albums", "routes/albums.tsx"),
  route("albums/:slug", "routes/album.tsx"),
  route("favorites", "routes/favorites.tsx"),
  route("upload", "routes/upload.tsx"),

  // Resource routes (no UI)
  route("img/:id/:variant", "routes/img.ts"),
  route("api/photos", "routes/api.photos.ts"),
  route("api/upload-pass", "routes/api.upload-pass.ts"),

  // Owner area
  ...prefix("admin", [
    route("login", "routes/admin/login.tsx"),
    route("logout", "routes/admin/logout.ts"),
    layout("routes/admin/layout.tsx", [
      index("routes/admin/index.tsx"),
      route("albums/:id", "routes/admin/album.tsx"),
      route("upload", "routes/admin/upload.tsx"),
    ]),
  ]),
] satisfies RouteConfig;
