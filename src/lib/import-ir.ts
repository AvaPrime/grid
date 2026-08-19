/**
 * Reserved import intermediate representation.
 * Adapters (Rekordbox XML, CSV, Serato, APIs) land here in M1.
 * Nothing in M0 writes these fields onto Track.
 */
export type GridImportSource = "rekordbox-xml" | "csv" | "serato" | "api";

export type GridImportIR = {
  source: GridImportSource;
  sourceRef: string;
  title: string;
  artist: string;
  album?: string;
  bpm: number;
  camelot: string;
  duration: number;
  energy?: number;
  rating?: number;
  tags?: string[];
};
