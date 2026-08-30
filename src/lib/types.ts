export type Screen =
  | "home"
  | "setup"
  | "play"
  | "reveal"
  | "shop"
  | "album"
  | "catalog"
  | "history";

export type Kid = {
  id: string;
  name: string;
  photo: string;
};

export type Prize = {
  id: string;
  name: string;
  image: string;
  cost: number;
  builtin: boolean;
};

export type AlbumEntry = {
  id: string;
  prizeId: string;
  kidId: string;
  at: number;
};

export type Session = {
  id: string;
  at: number;
  coins: Record<string, number>;
};

export type Persisted = {
  version: 1;
  kids: Kid[];
  customPrizes: Prize[];
  wallets: Record<string, number>;
  album: AlbumEntry[];
  sessions: Session[];
};

export type Game = {
  coins: Record<string, number>;
};
