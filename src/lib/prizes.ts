import type { Prize } from "./types";

export const BUILTIN_PRIZES: Prize[] = [
  { id: "star", name: "כוכב", image: "/prizes/star.jpg", cost: 1, builtin: true },
  { id: "butterfly", name: "פרפר", image: "/prizes/butterfly.jpg", cost: 1, builtin: true },
  { id: "icecream", name: "גלידה", image: "/prizes/icecream.jpg", cost: 1, builtin: true },
  { id: "heart", name: "לב", image: "/prizes/heart.jpg", cost: 1, builtin: true },
  { id: "flower", name: "פרח", image: "/prizes/flower.jpg", cost: 1, builtin: true },
  { id: "rainbow", name: "קשת", image: "/prizes/rainbow.jpg", cost: 2, builtin: true },
  { id: "puppy", name: "גור", image: "/prizes/puppy.jpg", cost: 2, builtin: true },
  { id: "kitten", name: "חתול", image: "/prizes/kitten.jpg", cost: 2, builtin: true },
  { id: "balloon", name: "בלון", image: "/prizes/balloon.jpg", cost: 2, builtin: true },
  { id: "candy", name: "סוכריה", image: "/prizes/candy.jpg", cost: 2, builtin: true },
  { id: "soccer", name: "כדור", image: "/prizes/soccer.jpg", cost: 2, builtin: true },
  { id: "robot", name: "רובוט", image: "/prizes/robot.jpg", cost: 2, builtin: true },
  { id: "rocket", name: "טיל", image: "/prizes/rocket.jpg", cost: 2, builtin: true },
  { id: "crown", name: "כתר", image: "/prizes/crown.jpg", cost: 3, builtin: true },
  { id: "dino", name: "דינוזאור", image: "/prizes/dino.jpg", cost: 3, builtin: true },
  { id: "dragon", name: "דרקון", image: "/prizes/dragon.jpg", cost: 3, builtin: true },
  { id: "treasure", name: "אוצר", image: "/prizes/treasure.jpg", cost: 3, builtin: true },
  { id: "unicorn", name: "חד־קרן", image: "/prizes/unicorn.jpg", cost: 3, builtin: true },
  { id: "spaceship", name: "חללית", image: "/prizes/spaceship.jpg", cost: 3, builtin: true },
  { id: "trophy", name: "גביע", image: "/prizes/trophy.jpg", cost: 3, builtin: true },
];

export function allPrizes(custom: Prize[]) {
  return [...BUILTIN_PRIZES, ...custom];
}

export function findPrize(custom: Prize[], id: string) {
  return allPrizes(custom).find((p) => p.id === id);
}
