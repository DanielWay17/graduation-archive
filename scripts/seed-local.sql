-- DEVELOPMENT ONLY: placeholder photos so the gallery has something to show locally.
-- Run with `npm run db:seed:local`. Never run against the production database.
DELETE FROM photos WHERE id LIKE 'ph_sample_%';
INSERT INTO photos (id, album_id, image_key, thumb_key, image_type, width, height, bytes, caption, alt_text, photo_date, uploader_name, published, sort_order) VALUES
  ('ph_sample_01','alb_graduation_day','placeholder:1','placeholder:1','image/svg+xml',1600,1200,0,'Sample photo — front steps','Placeholder image, replace with a real photo','2026-11-11','',1,1),
  ('ph_sample_02','alb_graduation_day','placeholder:2','placeholder:2','image/svg+xml',1200,1200,0,'Sample photo — the whole class','Placeholder image, replace with a real photo','2026-11-12','',1,2),
  ('ph_sample_03','alb_graduation_day','placeholder:3','placeholder:3','image/svg+xml',1200,1800,0,'Sample photo — with mom & dad','Placeholder image, replace with a real photo','2026-11-13','',1,3),
  ('ph_sample_04','alb_graduation_day','placeholder:4','placeholder:4','image/svg+xml',1600,1067,0,'Sample photo — library corner','Placeholder image, replace with a real photo','2026-11-14','',1,4),
  ('ph_sample_05','alb_graduation_day','placeholder:5','placeholder:5','image/svg+xml',1080,1350,0,'Sample photo — lab coats on','Placeholder image, replace with a real photo','2026-11-15','',1,5),
  ('ph_sample_06','alb_graduation_day','placeholder:6','placeholder:6','image/svg+xml',1200,1600,0,'Sample photo — first diploma photo','Placeholder image, replace with a real photo','2026-11-16','',1,6),
  ('ph_sample_07','alb_friends','placeholder:7','placeholder:7','image/svg+xml',1600,1200,0,'Sample photo — golden hour','Placeholder image, replace with a real photo','2026-11-17','',1,1),
  ('ph_sample_08','alb_friends','placeholder:8','placeholder:8','image/svg+xml',1200,1200,0,'Sample photo — the gate','Placeholder image, replace with a real photo','2026-11-18','',1,2),
  ('ph_sample_09','alb_friends','placeholder:9','placeholder:9','image/svg+xml',1200,1800,0,'Sample photo — last lecture','Placeholder image, replace with a real photo','2026-11-19','',1,3),
  ('ph_sample_10','alb_friends','placeholder:10','placeholder:10','image/svg+xml',1600,1067,0,'Sample photo — outtake #1','Placeholder image, replace with a real photo','2026-11-20','',1,4),
  ('ph_sample_11','alb_friends','placeholder:11','placeholder:11','image/svg+xml',1080,1350,0,'Sample photo — group hug','Placeholder image, replace with a real photo','2026-11-21','',1,5),
  ('ph_sample_12','alb_family','placeholder:12','placeholder:12','image/svg+xml',1200,1600,0,'Sample photo — cap toss','Placeholder image, replace with a real photo','2026-11-10','',1,1),
  ('ph_sample_13','alb_family','placeholder:13','placeholder:13','image/svg+xml',1600,1200,0,'Sample photo — front steps','Placeholder image, replace with a real photo','2026-11-11','',1,2),
  ('ph_sample_14','alb_family','placeholder:14','placeholder:14','image/svg+xml',1200,1200,0,'Sample photo — the whole class','Placeholder image, replace with a real photo','2026-11-12','',1,3),
  ('ph_sample_15','alb_family','placeholder:15','placeholder:15','image/svg+xml',1200,1800,0,'Sample photo — with mom & dad','Placeholder image, replace with a real photo','2026-11-13','',1,4),
  ('ph_sample_16','alb_campus','placeholder:16','placeholder:16','image/svg+xml',1600,1067,0,'Sample photo — library corner','Placeholder image, replace with a real photo','2026-11-14','',1,1),
  ('ph_sample_17','alb_campus','placeholder:17','placeholder:17','image/svg+xml',1080,1350,0,'Sample photo — lab coats on','Placeholder image, replace with a real photo','2026-11-15','',1,2),
  ('ph_sample_18','alb_campus','placeholder:18','placeholder:18','image/svg+xml',1200,1600,0,'Sample photo — first diploma photo','Placeholder image, replace with a real photo','2026-11-16','',1,3),
  ('ph_sample_19','alb_campus','placeholder:19','placeholder:19','image/svg+xml',1600,1200,0,'Sample photo — golden hour','Placeholder image, replace with a real photo','2026-11-17','',1,4),
  ('ph_sample_20','alb_campus','placeholder:20','placeholder:20','image/svg+xml',1200,1200,0,'Sample photo — the gate','Placeholder image, replace with a real photo','2026-11-18','',1,5),
  ('ph_sample_21','alb_behind','placeholder:21','placeholder:21','image/svg+xml',1200,1800,0,'Sample photo — last lecture','Placeholder image, replace with a real photo','2026-11-19','',1,1),
  ('ph_sample_22','alb_behind','placeholder:22','placeholder:22','image/svg+xml',1600,1067,0,'Sample photo — outtake #1','Placeholder image, replace with a real photo','2026-11-20','',1,2),
  ('ph_sample_23','alb_behind','placeholder:23','placeholder:23','image/svg+xml',1080,1350,0,'Sample photo — group hug','Placeholder image, replace with a real photo','2026-11-21','',1,3),
  ('ph_sample_24','alb_behind','placeholder:24','placeholder:24','image/svg+xml',1200,1600,0,'Sample photo — cap toss','Placeholder image, replace with a real photo','2026-11-10','',1,4);
