export interface CardRule {
  cardName: string;
  categories: { [key: string]: number }; // e.g., 'Groceries': 0.04
  defaultRate: number;
}

const CARDS: CardRule[] = [
  {
    cardName: 'Amex Gold',
    categories: {
      'Food and Drink': 0.04,
      'Groceries': 0.04,
      'Travel': 0.03,
    },
    defaultRate: 0.01,
  },
  {
    cardName: 'Chase Sapphire Preferred',
    categories: {
      'Travel': 0.02,
      'Food and Drink': 0.03,
    },
    defaultRate: 0.01,
  },
  {
    cardName: 'Citi Double Cash',
    categories: {},
    defaultRate: 0.02,
  },
];

export function analyzeTransaction(transaction: any) {
  const category = transaction.category ? transaction.category[0] : 'General';
  let bestCard = null;
  let maxRate = 0;

  CARDS.forEach((card) => {
    // Simple category matching
    const rate = Object.keys(card.categories).find(c => category.includes(c))
      ? card.categories[Object.keys(card.categories).find(c => category.includes(c)) as string]
      : card.defaultRate;

    if (rate > maxRate) {
      maxRate = rate;
      bestCard = card.cardName;
    }
  });

  const potentialEarnings = transaction.amount * maxRate;

  return {
    optimalCard: bestCard,
    potentialEarnings,
    rate: maxRate,
  };
}
