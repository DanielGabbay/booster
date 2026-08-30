import { useEffect, useRef, useState } from "react";
import {
  Camera,
  Coins,
  Download,
  Gift,
  History,
  Images,
  LoaderCircle,
  Plus,
  Trash2,
  Upload,
  Users,
} from "lucide-react";
import { toast, Toaster } from "sonner";
import { Basket, CoinFlyer, type Flyer } from "@/components/basket";
import { Coin } from "@/components/coin";
import { Button, Field, Screen } from "@/components/ui";
import { AVATARS } from "@/lib/avatars";
import { cn } from "@/lib/cn";
import { fileToSquareJpeg, urlToSquareJpeg } from "@/lib/image";
import { makeCustomPrize, importPack } from "@/lib/pack";
import { downloadSave, snapshotOf } from "@/lib/persist";
import { allPrizes } from "@/lib/prizes";
import { basketOpen, coinLand, coinToss, prizeBought, unlockAudio } from "@/lib/sound";
import { useGame } from "@/lib/store";
import type { Kid } from "@/lib/types";

function newKid(): Kid {
  return { id: crypto.randomUUID(), name: "", photo: "" };
}

function PhotoSheet({
  open,
  onClose,
  onPick,
}: {
  open: boolean;
  onClose: () => void;
  onPick: (photo: string) => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const camRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState<string | null>(null);

  async function pickAvatar(src: string) {
    setBusy(src);
    try {
      onPick(await urlToSquareJpeg(src, 320));
      onClose();
    } catch {
      toast.error("לא הצלחתי לטעון את הדיוקן");
    } finally {
      setBusy(null);
    }
  }

  async function pickFile(file?: File) {
    if (!file) return;
    setBusy("file");
    try {
      onPick(await fileToSquareJpeg(file, 320));
      onClose();
    } catch {
      toast.error("לא הצלחתי לקרוא את התמונה");
    } finally {
      setBusy(null);
    }
  }

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-40 flex items-end justify-center bg-ink/40 p-4 pb-[max(1rem,env(safe-area-inset-bottom))]"
      onClick={onClose}
    >
      <div
        className="enter-up w-full max-w-lg rounded-3xl bg-cream p-5 shadow-[var(--shadow-soft)]"
        onClick={(e) => e.stopPropagation()}
      >
        <p className="font-display text-xl font-bold">בחרו תמונה</p>
        <div className="mt-4 grid grid-cols-2 gap-2">
          <Button variant="secondary" disabled={!!busy} onClick={() => camRef.current?.click()}>
            <Camera className="size-5" />
            מצלמה
          </Button>
          <Button variant="secondary" disabled={!!busy} onClick={() => fileRef.current?.click()}>
            <Images className="size-5" />
            הגלריה
          </Button>
        </div>
        <input
          ref={camRef}
          type="file"
          accept="image/*"
          capture="user"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            e.target.value = "";
            void pickFile(f);
          }}
        />
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            e.target.value = "";
            void pickFile(f);
          }}
        />
        <div className="mt-4 grid grid-cols-4 gap-2">
          {AVATARS.map((a) => (
            <button
              key={a.id}
              type="button"
              disabled={!!busy}
              onClick={() => void pickAvatar(a.src)}
              className="flex flex-col items-center gap-1"
            >
              <span className="relative size-16 overflow-hidden rounded-full">
                <img src={a.src} alt={a.label} className="size-full object-cover outline-none" />
                {busy === a.src ? (
                  <span className="absolute inset-0 flex items-center justify-center bg-ink/40">
                    <LoaderCircle className="size-5 animate-spin text-cream" />
                  </span>
                ) : null}
              </span>
              <span className="text-xs text-muted">{a.label}</span>
            </button>
          ))}
        </div>
        <Button variant="ghost" className="mt-4 w-full" onClick={onClose}>
          ביטול
        </Button>
      </div>
    </div>
  );
}

function Setup() {
  const kids = useGame((s) => s.kids);
  const saveKids = useGame((s) => s.saveKids);
  const setScreen = useGame((s) => s.setScreen);
  const [draft, setDraft] = useState<Kid[]>(() =>
    kids.length ? kids.map((k) => ({ ...k })) : [newKid(), newKid()],
  );
  const [pickerFor, setPickerFor] = useState<string | null>(null);

  function patch(id: string, part: Partial<Kid>) {
    setDraft((d) => d.map((k) => (k.id === id ? { ...k, ...part } : k)));
  }

  const ready = draft.filter((k) => k.name.trim() && k.photo).length >= 2;

  return (
    <Screen
      title="הילדים"
      onBack={kids.length >= 2 ? () => setScreen("home") : undefined}
      footer={
        <Button
          size="lg"
          className="w-full"
          disabled={!ready}
          onClick={() => {
            const next = draft
              .filter((k) => k.name.trim() && k.photo)
              .map((k) => ({ ...k, name: k.name.trim() }));
            saveKids(next);
          }}
        >
          שמירה והמשך
        </Button>
      }
    >
      <p className="mt-2 text-center text-muted">
        {kids.length >= 2
          ? "לפחות שני ילדים, עם שם ותמונה"
          : "מי משחק? בחרו דיוקן מצויר או העלו תמונה, וכתבו שם. ניצור לכל ילד מטבע זהב."}
      </p>
      <div className="mt-4 flex flex-col gap-3">
        {draft.map((kid) => (
          <div key={kid.id} className="flex items-center gap-3 rounded-[20px] bg-cream p-3 shadow-[var(--shadow-soft)]">
            <button type="button" onClick={() => setPickerFor(kid.id)} aria-label="בחירת תמונה">
              <Coin kid={kid} size="md" />
            </button>
            <Field
              value={kid.name}
              placeholder="שם"
              maxLength={16}
              onChange={(e) => patch(kid.id, { name: e.target.value })}
              className="flex-1"
            />
            <Button variant="ghost" size="icon" onClick={() => setPickerFor(kid.id)} aria-label="תמונה">
              <Camera className="size-5" />
            </Button>
            {draft.length > 2 ? (
              <Button
                variant="ghost"
                size="icon"
                aria-label="מחיקה"
                onClick={() => setDraft((d) => d.filter((k) => k.id !== kid.id))}
              >
                <Trash2 className="size-5" />
              </Button>
            ) : null}
          </div>
        ))}
        <Button variant="secondary" className="w-full" onClick={() => setDraft((d) => [...d, newKid()])}>
          <Plus className="size-5" />
          ילד נוסף
        </Button>
      </div>
      <PhotoSheet
        open={!!pickerFor}
        onClose={() => setPickerFor(null)}
        onPick={(photo) => {
          if (pickerFor) patch(pickerFor, { photo });
        }}
      />
    </Screen>
  );
}

function Home() {
  const setScreen = useGame((s) => s.setScreen);
  const startGame = useGame((s) => s.startGame);
  const importState = useGame((s) => s.importState);
  const fileRef = useRef<HTMLInputElement>(null);

  async function onImport(file?: File) {
    if (!file) return;
    try {
      const data = JSON.parse(await file.text()) as {
        kids?: Kid[];
        customPrizes?: unknown;
        wallets?: Record<string, number>;
        album?: unknown;
        sessions?: unknown;
      };
      if (!Array.isArray(data.kids)) throw new Error("bad");
      importState(data as Parameters<typeof importState>[0]);
      toast.success("השמירה יובאה");
    } catch {
      toast.error("לא הצלחתי לייבא את הקובץ");
    }
  }

  const links: Array<{ label: string; icon: typeof Gift; screen: "catalog" | "shop" | "album" | "history" }> = [
    { label: "מאגר הפרסים", icon: Gift, screen: "catalog" },
    { label: "בחירת פרסים", icon: Coins, screen: "shop" },
    { label: "האלבום", icon: Images, screen: "album" },
    { label: "משחקים קודמים", icon: History, screen: "history" },
  ];

  return (
    <Screen
      footer={
        <div className="flex gap-2">
          <Button
            variant="secondary"
            className="flex-1"
            onClick={() => downloadSave(snapshotOf(useGame.getState()))}
          >
            <Download className="size-5" />
            ייצוא
          </Button>
          <Button variant="secondary" className="flex-1" onClick={() => fileRef.current?.click()}>
            <Upload className="size-5" />
            ייבוא
          </Button>
        </div>
      }
    >
      <input
        ref={fileRef}
        type="file"
        accept="application/json,.json"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          e.target.value = "";
          void onImport(f);
        }}
      />
      <img src="/art/hero.jpg" alt="" className="mt-2 aspect-[16/10] w-full rounded-[20px] object-cover outline-none" />
      <p className="mt-3 text-center text-muted">משחק עידוד. מטבע לכל ילד שנזרק לסל.</p>
      <Button
        size="xl"
        className="mt-5 w-full"
        onClick={() => {
          unlockAudio();
          startGame();
        }}
      >
        התחלת משחק
      </Button>
      <Button size="lg" variant="secondary" className="mt-3 w-full" onClick={() => setScreen("setup")}>
        <Users className="size-5" />
        הילדים
      </Button>
      <div className="mt-4 grid grid-cols-2 gap-3 pb-2">
        {links.map((item) => (
          <button
            key={item.screen}
            type="button"
            onClick={() => setScreen(item.screen)}
            className="flex min-h-20 flex-col items-start justify-center gap-2 rounded-[20px] bg-cream px-4 py-3 text-right shadow-[var(--shadow-soft)]"
          >
            <item.icon className="size-5 text-muted" />
            <span className="font-medium">{item.label}</span>
          </button>
        ))}
      </div>
    </Screen>
  );
}

function Play() {
  const kids = useGame((s) => s.kids);
  const coins = useGame((s) => s.game.coins);
  const addCoin = useGame((s) => s.addCoin);
  const bumpBasket = useGame((s) => s.bumpBasket);
  const basketBounce = useGame((s) => s.basketBounce);
  const finishGame = useGame((s) => s.finishGame);
  const basketRef = useRef<HTMLDivElement>(null);
  const [flyers, setFlyers] = useState<Flyer[]>([]);
  const [pop, setPop] = useState<string | null>(null);

  function toss(kid: Kid, node: HTMLElement) {
    unlockAudio();
    coinToss();
    const start = node.getBoundingClientRect();
    const end = basketRef.current?.getBoundingClientRect() ?? start;
    setFlyers((f) => [...f, { id: crypto.randomUUID(), kid, start, end }]);
  }

  return (
    <Screen
      title="המשחק"
      footer={
        <Button size="lg" className="w-full" onClick={finishGame}>
          פתיחת הסל
        </Button>
      }
    >
      <p className="mt-1 text-center text-muted">הטילו מטבע לסל</p>
      <div ref={basketRef} className="flex flex-1 items-center justify-center py-4">
        <Basket open={false} bounceKey={basketBounce} piles={[]} />
      </div>
      <div className="mb-2 grid grid-cols-2 gap-3">
        {kids.map((kid) => (
          <button
            key={kid.id}
            type="button"
            onClick={(e) => {
              const coin = e.currentTarget.querySelector("[data-coin]") as HTMLElement | null;
              toss(kid, coin ?? e.currentTarget);
            }}
            className="flex items-center gap-3 rounded-[20px] bg-cream p-3 text-right shadow-[var(--shadow-soft)] transition-transform duration-150 ease-out active:scale-[0.97]"
          >
            <span data-coin>
              <Coin kid={kid} size="md" />
            </span>
            <div>
              <p className="font-medium">{kid.name}</p>
              <p
                className={cn(
                  "font-display text-2xl font-extrabold tabular-nums",
                  pop === kid.id && "num-pop",
                )}
              >
                {coins[kid.id] ?? 0}
                <span className="ms-1 text-sm font-medium text-muted">מטבעות</span>
              </p>
            </div>
          </button>
        ))}
      </div>
      {flyers.map((f) => (
        <CoinFlyer
          key={f.id}
          flyer={f}
          onDone={() => {
            setFlyers((all) => all.filter((x) => x.id !== f.id));
            addCoin(f.kid.id);
            bumpBasket();
            coinLand();
            setPop(f.kid.id);
          }}
        />
      ))}
    </Screen>
  );
}

function Reveal() {
  const kids = useGame((s) => s.kids);
  const coins = useGame((s) => s.game.coins);
  const setScreen = useGame((s) => s.setScreen);

  useEffect(() => {
    basketOpen();
  }, []);

  const piles = kids.map((kid) => ({ kid, count: coins[kid.id] ?? 0 }));

  return (
    <Screen
      title="הסל נפתח"
      footer={
        <Button size="lg" className="w-full" onClick={() => setScreen("shop")}>
          בחירת פרסים
        </Button>
      }
    >
      <p className="mt-1 text-center text-muted">המטבעות שנאספו במשחק הזה</p>
      <div className="enter-up flex flex-1 flex-col items-center justify-center py-4">
        <Basket open piles={piles} />
      </div>
      <div className="mb-2 grid grid-cols-2 gap-3">
        {kids.map((kid, i) => (
          <div
            key={kid.id}
            className="enter-up flex items-center gap-3 rounded-[20px] bg-cream p-3 shadow-[var(--shadow-soft)]"
            style={{ animationDelay: `${120 + i * 70}ms` }}
          >
            <Coin kid={kid} size="md" />
            <div>
              <p className="font-medium">{kid.name}</p>
              <p className="font-display text-2xl font-extrabold tabular-nums">
                {coins[kid.id] ?? 0}
                <span className="ms-1 text-sm font-medium text-muted">מטבעות</span>
              </p>
            </div>
          </div>
        ))}
      </div>
    </Screen>
  );
}

function Shop() {
  const kids = useGame((s) => s.kids);
  const customPrizes = useGame((s) => s.customPrizes);
  const wallets = useGame((s) => s.wallets);
  const shopKidId = useGame((s) => s.shopKidId);
  const setShopKid = useGame((s) => s.setShopKid);
  const buyPrize = useGame((s) => s.buyPrize);
  const setScreen = useGame((s) => s.setScreen);
  const [pop, setPop] = useState<string | null>(null);
  const prizes = allPrizes(customPrizes);
  const kid = kids.find((k) => k.id === shopKidId) ?? kids[0];
  const coins = kid ? (wallets[kid.id] ?? 0) : 0;

  return (
    <Screen
      title="בחירת פרסים"
      onBack={() => setScreen("home")}
      footer={
        <Button variant="secondary" size="lg" className="w-full" onClick={() => setScreen("album")}>
          לאלבום המדבקות
        </Button>
      }
    >
      <div className="mt-2 flex gap-2 overflow-x-auto pb-1">
        {kids.map((k) => {
          const on = k.id === kid?.id;
          return (
            <button
              key={k.id}
              type="button"
              onClick={() => setShopKid(k.id)}
              className={cn(
                "flex min-w-28 items-center gap-2 rounded-full px-3 py-2 transition-colors duration-150",
                on ? "bg-ink text-cream" : "bg-cream text-ink shadow-[var(--shadow-soft)]",
              )}
            >
              <Coin kid={k} size="sm" />
              <span className="truncate font-medium">{k.name}</span>
            </button>
          );
        })}
      </div>
      {kid ? (
        <p className="mt-4 text-center text-muted">
          ל{kid.name} נשארו{" "}
          <span className="font-display text-xl font-extrabold text-ink tabular-nums">{coins}</span> מטבעות
        </p>
      ) : null}
      <div className="mt-4 grid grid-cols-2 gap-3 pb-4">
        {prizes.map((p) => {
          const can = coins >= p.cost;
          return (
            <button
              key={p.id}
              type="button"
              disabled={!kid || !can}
              onClick={() => {
                if (!kid) return;
                if (!buyPrize(kid.id, p.id)) {
                  toast.error("אין מספיק מטבעות");
                  return;
                }
                prizeBought();
                setPop(p.id);
                toast.success(`${p.name} נשמר באלבום של ${kid.name}`);
              }}
              className={cn(
                "overflow-hidden rounded-xl bg-cream text-right shadow-[var(--shadow-soft)] transition-transform duration-150 ease-out active:not-disabled:scale-[0.97] disabled:opacity-45",
                pop === p.id && "sticker-pop",
              )}
            >
              <img src={p.image} alt="" className="aspect-square w-full object-cover outline-none" />
              <div className="flex items-center justify-between gap-2 px-3 py-2">
                <span className="font-medium">{p.name}</span>
                <span className="inline-flex items-center gap-1 rounded-full bg-paper px-2 py-0.5 text-sm text-muted tabular-nums">
                  <Coins className="size-3.5" />
                  {p.cost}
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </Screen>
  );
}

function Album() {
  const kids = useGame((s) => s.kids);
  const customPrizes = useGame((s) => s.customPrizes);
  const album = useGame((s) => s.album);
  const albumKidId = useGame((s) => s.albumKidId);
  const setAlbumKid = useGame((s) => s.setAlbumKid);
  const setScreen = useGame((s) => s.setScreen);
  const prizes = allPrizes(customPrizes);
  const kid = kids.find((k) => k.id === albumKidId) ?? kids[0];
  const entries = album.filter((e) => e.kidId === kid?.id).slice().reverse();

  return (
    <Screen title="האלבום" onBack={() => setScreen("home")}>
      <div className="mt-2 flex gap-2 overflow-x-auto pb-1">
        {kids.map((k) => {
          const on = k.id === kid?.id;
          return (
            <button
              key={k.id}
              type="button"
              onClick={() => setAlbumKid(k.id)}
              className={cn(
                "flex min-w-28 items-center gap-2 rounded-full px-3 py-2 transition-colors duration-150",
                on ? "bg-ink text-cream" : "bg-cream text-ink shadow-[var(--shadow-soft)]",
              )}
            >
              <Coin kid={k} size="sm" />
              <span className="truncate font-medium">{k.name}</span>
            </button>
          );
        })}
      </div>
      {entries.length === 0 ? (
        <div className="mt-16 text-center">
          <p className="font-display text-xl font-bold">עדיין אין מדבקות</p>
          <p className="mt-2 text-muted">שחקו, אספו מטבעות ובחרו פרסים</p>
        </div>
      ) : (
        <div className="mt-5 grid grid-cols-2 gap-3 pb-6">
          {entries.map((e) => {
            const prize = prizes.find((p) => p.id === e.prizeId);
            if (!prize) return null;
            return (
              <div key={e.id} className="overflow-hidden rounded-[20px] bg-cream shadow-[var(--shadow-soft)]">
                <img src={prize.image} alt={prize.name} className="aspect-square w-full object-cover outline-none" />
                <div className="px-3 py-2">
                  <p className="font-medium">{prize.name}</p>
                  <p className="text-xs text-muted">{new Date(e.at).toLocaleDateString("he-IL")}</p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </Screen>
  );
}

function stickerName(file: File, index: number) {
  const base = file.name.replace(/\.[^.]+$/, "").replace(/[_-]+/g, " ").trim();
  if (base && !/^(img|dscn?|pxl|photo|image|screenshot|pic)\s*\d*$/i.test(base)) {
    return base.slice(0, 16);
  }
  return `מדבקה ${index + 1}`;
}

type PrizeDraft = { id: string; name: string; cost: number; image: string };

const MAX_PRIZE_BATCH = 24;

function CostPicks({
  value,
  onChange,
}: {
  value: number;
  onChange: (n: number) => void;
}) {
  return (
    <div className="flex gap-2">
      {[1, 2, 3].map((n) => (
        <button
          key={n}
          type="button"
          onClick={() => onChange(n)}
          className={
            n === value
              ? "h-11 flex-1 rounded-md bg-ink font-medium text-cream"
              : "h-11 flex-1 rounded-md bg-surface font-medium text-ink shadow-[0_0_0_1px_var(--color-border)]"
          }
        >
          {n}
        </button>
      ))}
    </div>
  );
}

function Catalog() {
  const customPrizes = useGame((s) => s.customPrizes);
  const addCustomPrizes = useGame((s) => s.addCustomPrizes);
  const removeCustomPrize = useGame((s) => s.removeCustomPrize);
  const setScreen = useGame((s) => s.setScreen);
  const packRef = useRef<HTMLInputElement>(null);
  const photosRef = useRef<HTMLInputElement>(null);
  const [drafts, setDrafts] = useState<PrizeDraft[]>([]);
  const [cost, setCost] = useState(1);
  const [importing, setImporting] = useState(false);
  const [busy, setBusy] = useState(false);
  const prizes = allPrizes(customPrizes);

  async function onImages(picked?: ArrayLike<File> | null) {
    if (!picked || picked.length === 0) return;
    const list = Array.from(picked).filter(
      (f) => f.type.startsWith("image/") || /\.(jpe?g|png|webp|gif|heic|heif|avif)$/i.test(f.name),
    );
    if (list.length === 0) {
      toast.error("לא נבחרו תמונות");
      return;
    }
    const used = drafts.length;
    const room = MAX_PRIZE_BATCH - used;
    if (room <= 0) {
      toast.error("אפשר עד 24 תמונות בבת אחת");
      return;
    }
    const slice = list.slice(0, room);
    if (list.length > room) toast.message(`נוספו ${room} תמונות (המגבלה היא 24)`);
    setBusy(true);
    try {
      const results = await Promise.all(
        slice.map(async (file, i) => {
          try {
            const image = await fileToSquareJpeg(file, 480);
            const draft: PrizeDraft = {
              id: crypto.randomUUID(),
              name: stickerName(file, used + i),
              cost,
              image,
            };
            return draft;
          } catch {
            return null;
          }
        }),
      );
      const next = results.filter((d): d is PrizeDraft => d !== null);
      if (next.length === 0) {
        toast.error("לא הצלחתי לקרוא את התמונות");
        return;
      }
      setDrafts((d) => [...d, ...next]);
      const failed = results.length - next.length;
      if (failed) toast.error(`${failed} תמונות לא נקראו`);
      else toast.success(next.length === 1 ? "התמונה נטענה" : `${next.length} תמונות נטענו`);
    } finally {
      setBusy(false);
    }
  }

  function applyCost(n: number) {
    setCost(n);
    setDrafts((d) => d.map((item) => ({ ...item, cost: n })));
  }

  function saveDrafts() {
    if (drafts.length === 0) {
      toast.error("בחרו לפחות תמונה אחת");
      return;
    }
    addCustomPrizes(drafts.map((d) => makeCustomPrize(d.name, d.cost, d.image)));
    toast.success(drafts.length === 1 ? "הפרס נוסף למאגר" : `${drafts.length} פרסים נוספו למאגר`);
    setDrafts([]);
    setCost(1);
  }

  async function onPack(file?: File) {
    if (!file) return;
    setImporting(true);
    try {
      const next = await importPack(file);
      addCustomPrizes(next);
      toast.success(`${next.length} מדבקות נוספו למאגר`);
    } catch {
      toast.error("לא הצלחתי לייבא את החבילה");
    } finally {
      setImporting(false);
    }
  }

  const editing = drafts.length > 0;
  const footer = editing ? (
    <Button size="lg" className="w-full" disabled={busy} onClick={saveDrafts}>
      {drafts.length === 1 ? "שמירת הפרס" : `שמירת ${drafts.length} פרסים`}
    </Button>
  ) : (
    <div className="flex flex-col gap-2">
      <Button size="lg" className="w-full" disabled={importing || busy} onClick={() => photosRef.current?.click()}>
        {busy ? <LoaderCircle className="size-5 animate-spin" /> : <Images className="size-5" />}
        העלאת תמונות
      </Button>
      <Button
        size="lg"
        variant="secondary"
        className="w-full"
        disabled={importing || busy}
        onClick={() => packRef.current?.click()}
      >
        {importing ? <LoaderCircle className="size-5 animate-spin" /> : <Upload className="size-5" />}
        ייבוא חבילה
      </Button>
    </div>
  );

  return (
    <Screen title="מאגר הפרסים" onBack={() => setScreen("home")} footer={footer}>
      <input
        ref={packRef}
        type="file"
        accept=".zip,application/zip,application/json,.json"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          e.target.value = "";
          void onPack(f);
        }}
      />
      <input
        id="prize-photos"
        ref={photosRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => {
          const files = Array.from(e.target.files ?? []);
          e.target.value = "";
          void onImages(files);
        }}
      />
      {busy && !editing ? (
        <div className="mt-16 flex flex-col items-center gap-3 text-muted">
          <LoaderCircle className="size-8 animate-spin" />
          <p>מעבד תמונות…</p>
        </div>
      ) : editing ? (
        <div className="enter-up mt-4 space-y-3 rounded-xl bg-cream p-4 shadow-[var(--shadow-soft)]">
          <p className="font-display text-lg font-bold">
            {drafts.length === 1 ? "פרס אחד" : `${drafts.length} תמונות`}
          </p>
          <label className="block text-sm font-medium text-muted">
            {drafts.length === 1 ? "מחיר במטבעות" : "מחיר לכולם"}
          </label>
          <CostPicks value={cost} onChange={applyCost} />
          {drafts.length === 1 ? (
            <>
              <label className="block text-sm font-medium text-muted">שם המדבקה</label>
              <Field
                value={drafts[0].name}
                onChange={(e) => setDrafts([{ ...drafts[0], name: e.target.value.slice(0, 20) }])}
                maxLength={20}
              />
              <div className="overflow-hidden rounded-lg bg-surface shadow-[0_0_0_1px_var(--color-border)]">
                <img src={drafts[0].image} alt="" className="aspect-square w-full object-cover outline-none" />
              </div>
            </>
          ) : (
            <ul className="space-y-3">
              {drafts.map((d) => (
                <li key={d.id} className="flex gap-3 rounded-lg bg-surface p-2 shadow-[0_0_0_1px_var(--color-border)]">
                  <img src={d.image} alt="" className="size-16 shrink-0 rounded-md object-cover outline-none" />
                  <div className="min-w-0 flex-1 space-y-2">
                    <Field
                      value={d.name}
                      onChange={(e) =>
                        setDrafts((all) =>
                          all.map((item) => (item.id === d.id ? { ...item, name: e.target.value.slice(0, 20) } : item)),
                        )
                      }
                      maxLength={20}
                      className="h-11"
                    />
                    <div className="flex gap-1.5">
                      {[1, 2, 3].map((n) => (
                        <button
                          key={n}
                          type="button"
                          onClick={() =>
                            setDrafts((all) => all.map((item) => (item.id === d.id ? { ...item, cost: n } : item)))
                          }
                          className={
                            n === d.cost
                              ? "h-11 flex-1 rounded-md bg-ink text-sm font-medium text-cream"
                              : "h-11 flex-1 rounded-md bg-cream text-sm font-medium text-ink shadow-[0_0_0_1px_var(--color-border)]"
                          }
                        >
                          {n}
                        </button>
                      ))}
                    </div>
                  </div>
                  <button
                    type="button"
                    aria-label="הסרה"
                    className="flex size-11 shrink-0 items-center justify-center self-start rounded-md text-ink"
                    onClick={() => setDrafts((all) => all.filter((item) => item.id !== d.id))}
                  >
                    <Trash2 className="size-4" />
                  </button>
                </li>
              ))}
            </ul>
          )}
          <Button variant="secondary" className="w-full" disabled={busy} onClick={() => photosRef.current?.click()}>
            {busy ? <LoaderCircle className="size-5 animate-spin" /> : <Plus className="size-5" />}
            עוד תמונות
          </Button>
          <Button variant="ghost" className="w-full" onClick={() => setDrafts([])}>
            ביטול
          </Button>
        </div>
      ) : (
        <p className="mt-3 text-center text-sm text-muted">בחרו כמה תמונות ביחד מהגלריה, או ייבאו חבילת zip.</p>
      )}
      <div className="mt-5 grid grid-cols-2 gap-3 pb-6">
        {prizes.map((p) => (
          <div key={p.id} className="relative overflow-hidden rounded-xl bg-cream shadow-[var(--shadow-soft)]">
            <img src={p.image} alt="" className="aspect-square w-full object-cover outline-none" />
            <div className="flex items-center justify-between px-3 py-2">
              <span className="font-medium">{p.name}</span>
              <span className="text-sm text-muted tabular-nums">{p.cost}</span>
            </div>
            {p.builtin ? null : (
              <button
                type="button"
                aria-label="מחיקה"
                className="absolute top-2 left-2 flex size-9 items-center justify-center rounded-full bg-surface/90 text-ink"
                onClick={() => {
                  removeCustomPrize(p.id);
                  toast.success("הוסר מהמאגר");
                }}
              >
                <Trash2 className="size-4" />
              </button>
            )}
          </div>
        ))}
      </div>
    </Screen>
  );
}

function HistoryScreen() {
  const kids = useGame((s) => s.kids);
  const sessions = useGame((s) => s.sessions);
  const setScreen = useGame((s) => s.setScreen);

  return (
    <Screen title="משחקים קודמים" onBack={() => setScreen("home")}>
      {sessions.length === 0 ? (
        <div className="mt-16 text-center">
          <p className="font-display text-xl font-bold">עדיין אין משחקים</p>
          <p className="mt-2 text-muted">כל סל שנפתח יישמר כאן</p>
        </div>
      ) : (
        <ul className="mt-4 flex flex-col gap-3 pb-6">
          {sessions.map((session) => {
            const total = Object.values(session.coins).reduce((a, b) => a + b, 0);
            return (
              <li key={session.id} className="rounded-[20px] bg-cream p-4 shadow-[var(--shadow-soft)]">
                <div className="flex items-baseline justify-between">
                  <p className="font-medium">
                    {new Date(session.at).toLocaleString("he-IL", {
                      day: "numeric",
                      month: "short",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                  <p className="text-muted tabular-nums">{total} מטבעות</p>
                </div>
                <div className="mt-3 flex flex-wrap gap-3">
                  {kids.map((kid) => (
                    <div key={kid.id} className="flex items-center gap-2">
                      <Coin kid={kid} size="sm" />
                      <span className="text-sm">
                        {kid.name} · <span className="font-medium tabular-nums">{session.coins[kid.id] ?? 0}</span>
                      </span>
                    </div>
                  ))}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </Screen>
  );
}

export function App() {
  const screen = useGame((s) => s.screen);
  const hydrate = useGame((s) => s.hydrate);

  useEffect(() => {
    void hydrate();
  }, [hydrate]);

  useEffect(() => {
    const persist = () => useGame.getState().persist();
    const onVis = () => {
      if (document.visibilityState === "hidden") persist();
    };
    document.addEventListener("visibilitychange", onVis);
    window.addEventListener("pagehide", persist);
    return () => {
      document.removeEventListener("visibilitychange", onVis);
      window.removeEventListener("pagehide", persist);
    };
  }, []);

  return (
    <main className="min-h-dvh">
      {screen === "home" && <Home />}
      {screen === "setup" && <Setup />}
      {screen === "play" && <Play />}
      {screen === "reveal" && <Reveal />}
      {screen === "shop" && <Shop />}
      {screen === "album" && <Album />}
      {screen === "catalog" && <Catalog />}
      {screen === "history" && <HistoryScreen />}
      <Toaster
        position="top-center"
        dir="rtl"
        toastOptions={{ className: "!bg-surface !text-ink !border-border font-[Heebo,sans-serif]" }}
      />
    </main>
  );
}
