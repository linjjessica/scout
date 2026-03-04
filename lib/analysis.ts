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
  {
    cardName: 'Plaid Business Credit Card',
    categories: {
      'Food and Drink': 0.03,
    },
    defaultRate: 0.02,
  },
  {
    cardName: 'Plaid Credit Card',
    categories: {},
    defaultRate: 0.02,
  },
  {
    cardName: 'Chase Freedom Unlimited',
    categories: {
      'Food and Drink': 0.03,
      'Healthcare': 0.03, // For Drugstores
    },
    defaultRate: 0.015,
  },
  {
    cardName: 'Capital One SavorOne',
    categories: {
      'Food and Drink': 0.03,
      'Groceries': 0.03,
      'Entertainment': 0.03,
      'Service': 0.03, // Often includes Streaming
    },
    defaultRate: 0.01,
  },
  {
    cardName: 'Wells Fargo Autograph',
    categories: {
      'Food and Drink': 0.03,
      'Travel': 0.03,
      'Gas Station': 0.03,
      'Transport': 0.03, // Transit
      'Service': 0.03, // Streaming/Phone
    },
    defaultRate: 0.01,
  },
  {
    cardName: 'Amex Blue Cash Preferred',
    categories: {
      'Groceries': 0.06,
      'Service': 0.06, // Streaming
      'Transport': 0.03, // Transit
      'Gas Station': 0.03,
    },
    defaultRate: 0.01,
  },
  {
    cardName: 'Amazon Prime Visa',
    categories: {
      'Shops': 0.05, // Amazon/Whole Foods mapping
      'Food and Drink': 0.02,
      'Gas Station': 0.02,
      'Healthcare': 0.02, // Drugstores
    },
    defaultRate: 0.01,
  },
  {
    cardName: 'Discover it Chrome',
    categories: {
      'Food and Drink': 0.02,
      'Gas Station': 0.02,
    },
    defaultRate: 0.01,
  },
];

export function analyzeTransaction(transaction: any, userCardNames?: string[]) {
  const category = (transaction.category ? transaction.category[0] : 'General').toLowerCase();
  let bestCard = null;
  let maxRate = 0;

  // If user cards are provided, prioritize them. 
  // Otherwise, use all cards to show what the user *could* be earning (or fallback to user cards if they exist)
  let cardsToConsider = CARDS;
  if (userCardNames && userCardNames.length > 0) {
    cardsToConsider = CARDS.filter(dbCard => 
      userCardNames.some(uName => 
        uName.toLowerCase().includes(dbCard.cardName.toLowerCase()) || 
        dbCard.cardName.toLowerCase().includes(uName.toLowerCase())
      )
    );
    
    // If none of our DB cards match the user's cards, fall back to all cards so we still show *something* 
    // but ideally we'd want to know their card's baseline.
    if (cardsToConsider.length === 0) {
      cardsToConsider = CARDS;
    }
  }

  cardsToConsider.forEach((card) => {
    // Case-insensitive category matching
    const matchedKey = Object.keys(card.categories).find(c => 
      category.includes(c.toLowerCase()) || c.toLowerCase().includes(category)
    );
    
    const rate = matchedKey ? card.categories[matchedKey] : card.defaultRate;

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

export function getCategoryCoverage(userCardNames: string[]) {
  const commonCategories = [
    'Food and Drink', 'Groceries', 'Travel', 
    'Gas Station', 'Service', 'Shops', 'Entertainment'
  ];
  
  return commonCategories.map(cat => {
    // Collect stats for each user card
    const cardStats = userCardNames.map(name => {
      // Very basic fuzzy search for the DB card to tolerate slight name variations
      const dbCard = CARDS.find(c => name.toLowerCase().includes(c.cardName.toLowerCase()) || c.cardName.toLowerCase().includes(name.toLowerCase()));
      
      if (!dbCard) {
        return { name, rate: null };
      }
      
      const matchedKey = Object.keys(dbCard.categories).find(c => cat.includes(c));
      const rate = matchedKey ? dbCard.categories[matchedKey] : dbCard.defaultRate;
      
      return { name, rate };
    });
    
    const knownCards = cardStats.filter(c => c.rate !== null);
    const unknownCards = cardStats.filter(c => c.rate === null).map(c => c.name);
    
    let bestRate = 0;
    let optimalCards: string[] = [];
    
    if (knownCards.length > 0) {
      bestRate = Math.max(...knownCards.map(c => c.rate as number));
      optimalCards = knownCards.filter(c => c.rate === bestRate).map(c => c.name);
    }
    
    return {
      category: cat,
      optimalCards,
      bestRate,
      unknownCards,
      // Consider it a 'bonus coverage' if the best rate is > 2% (higher than standard base)
      hasBonusCoverage: bestRate > 0.02
    };
  });
}
