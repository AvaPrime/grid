-- GRID DJ library
create table if not exists tracks (
  id serial primary key,
  user_id text not null,
  title text not null,
  artist text not null,
  album text not null default '',
  album_slug text not null default '',
  genre text not null default '',
  label text not null default '',
  remixer text not null default '',
  bpm double precision not null default 120,
  camelot text not null default '8A',
  musical_key text not null default 'Am',
  energy integer not null default 5,
  danceability integer not null default 5,
  rating integer not null default 0,
  duration double precision not null default 360,
  year integer not null default 2024,
  play_count integer not null default 0,
  comment text not null default '',
  color text not null default '#8fa3b0',
  archived boolean not null default false,
  incoming boolean not null default false,
  seed integer not null default 1,
  waveform_json text not null default '[]',
  cuepoints_json text not null default '[]',
  tags_json text not null default '[]',
  created_at timestamptz not null default now()
);
create index if not exists tracks_user_id_idx on tracks (user_id);

create table if not exists playlists (
  id serial primary key,
  user_id text not null,
  name text not null,
  parent_id integer,
  type text not null default 'playlist',
  position integer not null default 0,
  smartlist_json text,
  created_at timestamptz not null default now()
);
create index if not exists playlists_user_id_idx on playlists (user_id);

create table if not exists playlist_tracks (
  playlist_id integer not null,
  track_id integer not null,
  position integer not null default 0,
  primary key (playlist_id, track_id)
);
