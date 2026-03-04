export interface CardRule {
  cardName: string;
  categories: { [key: string]: number }; // e.g., 'Groceries': 0.04
  defaultRate: number;
}

const CARDS: CardRule[] = [
  {
    cardName: 'Amex Gold',
    categories: {
      'FOOD AND DRINK': 0.04,
      'GROCERIES': 0.04,
      'TRAVEL': 0.03,
    },
    defaultRate: 0.01,
  },
  {
    cardName: 'Chase Sapphire Preferred',
    categories: {
      'TRAVEL': 0.02,
      'FOOD AND DRINK': 0.03,
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
      'FOOD AND DRINK': 0.03,
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
      'FOOD AND DRINK': 0.03,
      'HEALTHCARE': 0.03, // For Drugstores
    },
    defaultRate: 0.015,
  },
  {
    cardName: 'Capital One SavorOne',
    categories: {
      'FOOD AND DRINK': 0.03,
      'GROCERIES': 0.03,
      'ENTERTAINMENT': 0.03,
      'SERVICE': 0.03, // Often includes Streaming
    },
    defaultRate: 0.01,
  },
  {
    cardName: 'Wells Fargo Autograph',
    categories: {
      'FOOD AND DRINK': 0.03,
      'TRAVEL': 0.03,
      'GAS STATION': 0.03,
      'TRANSPORT': 0.03, // Transit
      'SERVICE': 0.03, // Streaming/Phone
    },
    defaultRate: 0.01,
  },
  {
    cardName: 'Amex Blue Cash Preferred',
    categories: {
      'GROCERIES': 0.06,
      'SERVICE': 0.06, // Streaming
      'TRANSPORT': 0.03, // Transit
      'GAS STATION': 0.03,
    },
    defaultRate: 0.01,
  },
  {
    cardName: 'Amazon Prime Visa',
    categories: {
      'SHOPS': 0.05, // Amazon/Whole Foods mapping
      'FOOD AND DRINK': 0.02,
      'GAS STATION': 0.02,
      'HEALTHCARE': 0.02, // Drugstores
    },
    defaultRate: 0.01,
  },
  {
    cardName: 'Discover it Chrome',
    categories: {
      'FOOD AND DRINK': 0.02,
      'GAS STATION': 0.02,
    },
    defaultRate: 0.01,
  },
];

// Internal helper to find a card in our database by name (fuzzy)
function findDBProps(name: string | undefined | null) {
  if (!name || typeof name !== 'string') return null;
  const lowerU = name.toLowerCase();
  
  return CARDS.find(dbCard => {
    const lowerDB = dbCard.cardName.toLowerCase();
    
    // 1. Direct inclusion
    if (lowerU.includes(lowerDB) || lowerDB.includes(lowerU)) return true;
    
    // 2. Dynamic brand matching
    const words = lowerDB.split(' ');
    if (words.length > 0) {
      const brand = words[0];
      // Only match brands that are at least 4 chars (Chase, Amex, Discover, etc.)
      if (brand.length >= 4 && lowerU.includes(brand)) {
         if (words.length > 1) {
           const identifier = words[1];
           // If we have an identifier (like "Gold" or "Chrome"), it counts as a match if either the brand matches
           // OR both match (more precise). We'll accept brand match as a fallback.
           if (lowerU.includes(identifier)) return true;
         }
         return true; 
      }
    }
    return false;
  });
}

export function analyzeTransaction(transaction: any, userCardNames?: string[], usedCardName?: string, isCreditCard?: boolean) {
  const category = (transaction.category ? transaction.category[0] : 'GENERAL').toUpperCase().replace(/_/g, ' ');
  let bestCard = null;
  let maxRate = -1;

  // STRICTLY limit to user's cards if they are recognized
  let cardsToConsider: CardRule[] = [];
  if (userCardNames && userCardNames.length > 0) {
    cardsToConsider = CARDS.filter(dbCard => 
      userCardNames.some(uName => findDBProps(uName)?.cardName === dbCard.cardName)
    );
  }

  // If we found recognized cards in the user's wallet, use ONLY those.
  // This prevents suggesting "Citi" if the user has "Discover" + "Chase".
  const usingUserPortfolio = cardsToConsider.length > 0;
  if (!usingUserPortfolio) {
    cardsToConsider = CARDS;
  }

  cardsToConsider.forEach((card) => {
    const matchedKey = Object.keys(card.categories).find(c => 
      category.includes(c) || c.includes(category)
    );
    const rate = matchedKey ? (card.categories[matchedKey] || 0) : (card.defaultRate || 0);

    if (rate > maxRate) {
      maxRate = rate;
      bestCard = card.cardName;
    }
  });

  // Calculate what the user actually earned
  let currentRate = 0.0;
  const usedDBProps = findDBProps(usedCardName);
  if (usedDBProps) {
     const matchedKey = Object.keys(usedDBProps.categories).find(c => 
       category.includes(c) || c.includes(category)
     );
     currentRate = matchedKey ? (usedDBProps.categories[matchedKey] || 0) : (usedDBProps.defaultRate || 0);
  } else if (isCreditCard) {
     // If it's a credit card but we don't recognize it, assume a 1% base rate
     currentRate = 0.01;
  }

  const potentialEarnings = (transaction.amount || 0) * (maxRate || 0);
  const isOptimized = currentRate >= maxRate;

  return {
    optimalCard: bestCard || (usingUserPortfolio ? 'Standard Card' : 'Add your cards'),
    potentialEarnings,
    rate: maxRate,
    currentRate,
    isOptimized,
    rewardGap: Math.max(0, (maxRate || 0) - (currentRate || 0))
  };
}

export function getCategoryCoverage(userCardNames: string[]) {
  const commonCategories = [
    'FOOD AND DRINK', 'GROCERIES', 'TRAVEL', 
    'GAS STATION', 'SERVICE', 'SHOPS', 'ENTERTAINMENT'
  ];
  
  return commonCategories.map(cat => {
    // Collect stats for each user card
    const cardStats = userCardNames.map(name => {
      const dbCard = findDBProps(name);
      
      if (!dbCard) {
        return { name, rate: null };
      }
      
      const matchedKey = Object.keys(dbCard.categories).find(c => cat === c || cat.includes(c) || c.includes(cat));
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
export function getBaselineRate(userCardNames: string[]) {
  if (!userCardNames || userCardNames.length === 0) return 0.01;
  
  const userCards = CARDS.filter(dbCard => 
    userCardNames.some(uName => findDBProps(uName)?.cardName === dbCard.cardName)
  );
  
  if (userCards.length === 0) return 0.01;
  
  return Math.max(...userCards.map(c => c.defaultRate));
}
