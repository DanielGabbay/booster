import { create } from "zustand";
import { findPrize } from "./prizes";
import { loadState, saveState, snapshotOf } from "./persist";
import type { AlbumEntry, Game, Kid, Prize, Screen, Session } from "./types";

function uid() {
  return crypto.randomUUID();
}

type Store = {
  hydrated: boolean;
  screen: Screen;
  kids: Kid[];
  customPrizes: Prize[];
  wallets: Record<string, number>;
  album: AlbumEntry[];
  sessions: Session[];
  game: Game;
  shopKidId: string | null;
  albumKidId: string | null;
  basketBounce: number;
  hydrate: () => Promise<void>;
  persist: () => void;
  setScreen: (screen: Screen) => void;
  saveKids: (kids: Kid[]) => void;
  addCustomPrize: (prize: Prize) => void;
  addCustomPrizes: (prizes: Prize[]) => void;
  removeCustomPrize: (id: string) => void;
  startGame: () => void;
  addCoin: (kidId: string) => void;
  bumpBasket: () => void;
  finishGame: () => void;
  setShopKid: (id: string) => void;
  setAlbumKid: (id: string) => void;
  buyPrize: (kidId: string, prizeId: string) => boolean;
  importState: (data: {
    kids?: Kid[];
    customPrizes?: Prize[];
    wallets?: Record<string, number>;
    album?: AlbumEntry[];
    sessions?: Session[];
  }) => void;
};

export const useGame = create<Store>((set, get) => ({
  hydrated: false,
  screen: "setup",
  kids: [],
  customPrizes: [],
  wallets: {},
  album: [],
  sessions: [],
  game: { coins: {} },
  shopKidId: null,
  albumKidId: null,
  basketBounce: 0,

  hydrate: async () => {
    const saved = await loadState();
    if (!saved) {
      set({ hydrated: true });
      return;
    }
    const kids = saved.kids ?? [];
    set({
      hydrated: true,
      kids,
      customPrizes: saved.customPrizes ?? [],
      wallets: saved.wallets ?? {},
      album: saved.album ?? [],
      sessions: saved.sessions ?? [],
      screen: kids.length >= 2 ? "home" : "setup",
      shopKidId: kids[0]?.id ?? null,
      albumKidId: kids[0]?.id ?? null,
    });
  },

  persist: () => {
    void saveState(snapshotOf(get()));
  },

  setScreen: (screen) => set({ screen }),

  saveKids: (kids) => {
    set((s) => {
      const wallets = { ...s.wallets };
      for (const kid of kids) wallets[kid.id] ??= 0;
      return {
        kids,
        wallets,
        shopKidId: s.shopKidId ?? kids[0]?.id ?? null,
        albumKidId: s.albumKidId ?? kids[0]?.id ?? null,
        screen: kids.length >= 2 ? "home" : "setup",
      };
    });
    get().persist();
  },

  addCustomPrize: (prize) => {
    set((s) => ({ customPrizes: [...s.customPrizes, prize] }));
    get().persist();
  },

  addCustomPrizes: (prizes) => {
    if (prizes.length === 0) return;
    set((s) => ({ customPrizes: [...s.customPrizes, ...prizes] }));
    get().persist();
  },

  removeCustomPrize: (id) => {
    set((s) => ({ customPrizes: s.customPrizes.filter((p) => p.id !== id) }));
    get().persist();
  },

  startGame: () => {
    const coins: Record<string, number> = {};
    for (const kid of get().kids) coins[kid.id] = 0;
    set({ screen: "play", game: { coins }, basketBounce: 0 });
  },

  addCoin: (kidId) => {
    set((s) => ({
      game: { coins: { ...s.game.coins, [kidId]: (s.game.coins[kidId] ?? 0) + 1 } },
    }));
  },

  bumpBasket: () => set((s) => ({ basketBounce: s.basketBounce + 1 })),

  finishGame: () => {
    const { kids, game, wallets } = get();
    const nextWallets = { ...wallets };
    const coins: Record<string, number> = {};
    for (const kid of kids) {
      const n = game.coins[kid.id] ?? 0;
      coins[kid.id] = n;
      nextWallets[kid.id] = (nextWallets[kid.id] ?? 0) + n;
    }
    const session: Session = { id: uid(), at: Date.now(), coins };
    const shopKidId = kids.find((k) => (coins[k.id] ?? 0) > 0)?.id ?? kids[0]?.id ?? null;
    set((s) => ({
      wallets: nextWallets,
      sessions: [session, ...s.sessions].slice(0, 80),
      screen: "reveal",
      shopKidId,
    }));
    get().persist();
  },

  setShopKid: (id) => set({ shopKidId: id }),
  setAlbumKid: (id) => set({ albumKidId: id }),

  buyPrize: (kidId, prizeId) => {
    const s = get();
    const prize = findPrize(s.customPrizes, prizeId);
    if (!prize) return false;
    const have = s.wallets[kidId] ?? 0;
    if (have < prize.cost) return false;
    const entry: AlbumEntry = { id: uid(), prizeId, kidId, at: Date.now() };
    set({
      wallets: { ...s.wallets, [kidId]: have - prize.cost },
      album: [...s.album, entry],
    });
    get().persist();
    return true;
  },

  importState: (data) => {
    const kids = data.kids ?? [];
    set({
      kids,
      customPrizes: data.customPrizes ?? [],
      wallets: data.wallets ?? {},
      album: data.album ?? [],
      sessions: data.sessions ?? [],
      screen: kids.length >= 2 ? "home" : "setup",
      shopKidId: kids[0]?.id ?? null,
      albumKidId: kids[0]?.id ?? null,
    });
    get().persist();
  },
}));
