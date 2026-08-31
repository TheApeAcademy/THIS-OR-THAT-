// Shared framer-motion spring presets so interactions feel like one
// consistent system instead of every component inventing its own numbers.
export const SPRING_SNAPPY = { type: "spring", stiffness: 400, damping: 30 } as const;
export const SPRING_SMOOTH = { type: "spring", stiffness: 300, damping: 30 } as const;
export const SPRING_BOUNCY = { type: "spring", stiffness: 550, damping: 14 } as const;
