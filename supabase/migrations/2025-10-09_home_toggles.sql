-- Toggle keys for homepage sections
insert into settings (key, value) values
  ('home_show_featured', 'true'),
  ('home_show_most_liked', 'true')
on conflict (key) do update set value = excluded.value;
