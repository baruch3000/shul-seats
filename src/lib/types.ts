export type SectionSlug = "men" | "women";

export type SeatStatus = "available" | "reserved" | "blocked";

export type PublicSeatStatus = "available" | "reserved" | "blocked" | "yours";

export interface SeatLayout {
  number: number;
  x: number;
  y: number;
}

export interface BenchLayout {
  section: SectionSlug;
  row: number;
  seats: SeatLayout[];
}

export interface PillarLayout {
  section: SectionSlug;
  cx: number;
  cy: number;
  r: number;
}

export interface BlockedAreaLayout {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface LandmarkLayout {
  type: "aron" | "bima" | "entrance" | "mechitza";
  section?: SectionSlug;
  x?: number;
  y?: number;
  x1?: number;
  y1?: number;
  x2?: number;
  y2?: number;
  label: string;
  width?: number;
  height?: number;
}

export interface PublicSeat {
  id: string;
  section: SectionSlug;
  seatNumber: number;
  x: number;
  y: number;
  status: PublicSeatStatus;
}

export interface AdminSeat extends PublicSeat {
  reservedName?: string;
  reservedEmail?: string;
  userId?: string;
}

export interface Reservation {
  id: string;
  seatId: string;
  userId: string;
  reservedName: string;
  reservedAt: string;
  section: SectionSlug;
  seatNumber: number;
}

export interface AppUser {
  id: string;
  email: string;
  displayName: string;
  googleId?: string;
}

export interface AdminSession {
  email: string;
  name: string;
}

export interface Stats {
  total: number;
  available: number;
  reserved: number;
  blocked: number;
}
