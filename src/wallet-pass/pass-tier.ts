export enum PassTier {
  Standard = 'standard',
  Prime = 'prime',
  Mythic = 'mythic',
}

/**
 * `backgroundColor` is the average colour of the tier background, shown while
 * the image loads. Wallet only accepts `rgb()`, so `labelColor` is 70% white
 * pre-blended over that colour.
 */
export const TIER_COLORS: Record<
  PassTier,
  { backgroundColor: string; foregroundColor: string; labelColor: string }
> = {
  [PassTier.Standard]: {
    backgroundColor: 'rgb(78, 101, 101)',
    foregroundColor: 'rgb(255, 255, 255)',
    labelColor: 'rgb(202, 209, 209)',
  },
  [PassTier.Prime]: {
    backgroundColor: 'rgb(43, 93, 64)',
    foregroundColor: 'rgb(255, 255, 255)',
    labelColor: 'rgb(191, 206, 198)',
  },
  [PassTier.Mythic]: {
    backgroundColor: 'rgb(58, 93, 88)',
    foregroundColor: 'rgb(255, 255, 255)',
    labelColor: 'rgb(196, 206, 205)',
  },
};
