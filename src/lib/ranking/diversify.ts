// Greedy re-rank that caps how many same-primary-category results can appear
// before later, differently-categorized items get a turn — otherwise a plain
// utility sort can hand back five coffee shops in a row. Preserves the input's
// relative score order within each bucket and never drops an item, so the list
// length is unchanged; over-cap items are just pushed to the tail.
interface Categorized {
  categories: string[]
}

export function diversify<T extends Categorized>(items: T[], maxPerCategory = 2): T[] {
  const counts = new Map<string, number>()
  const kept: T[] = []
  const overflow: T[] = []

  for (const item of items) {
    const category = item.categories[0] ?? ''
    const count = counts.get(category) ?? 0
    if (count < maxPerCategory) {
      kept.push(item)
      counts.set(category, count + 1)
    } else {
      overflow.push(item)
    }
  }

  return [...kept, ...overflow]
}
