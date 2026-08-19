export type CuePoint = {
  position: number;
  name: string;
  type: "1" | "5";
  startTime: number;
  endTime: number | null;
  color: string;
};

export type Track = {
  id: number;
  userId: string;
  title: string;
  artist: string;
  album: string;
  albumSlug: string;
  genre: string;
  label: string;
  remixer: string;
  bpm: number;
  camelot: string;
  musicalKey: string;
  energy: number;
  danceability: number;
  rating: number;
  duration: number;
  year: number;
  playCount: number;
  comment: string;
  color: string;
  archived: boolean;
  incoming: boolean;
  seed: number;
  waveform: number[];
  cuepoints: CuePoint[];
  tags: string[];
};

export type PlaylistType = "folder" | "playlist" | "smartlist";

export type SmartRule = {
  field: "genre" | "energy" | "rating" | "camelot" | "bpm" | "year" | "tag";
  op: "eq" | "gte" | "lte" | "contains" | "in";
  value: string | number | string[];
};

export type Playlist = {
  id: number;
  userId: string;
  name: string;
  parentId: number | null;
  type: PlaylistType;
  position: number;
  smartlist: SmartRule[] | null;
  trackIds: number[];
};

export type LibrarySnapshot = {
  tracks: Track[];
  playlists: Playlist[];
};

export type ViewId = "library" | "mix" | "plugins" | "api";
