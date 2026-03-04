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

export function analyzeTransaction(transaction: any, userCardNames?: string[]) {
  const category = (transaction.category ? transaction.category[0] : 'GENERAL').toUpperCase().replace(/_/g, ' ');
  let bestCard = null;
  let maxRate = 0;

  // If user cards are provided, prioritize them. 
  let cardsToConsider = CARDS;
  if (userCardNames && userCardNames.length > 0) {
    cardsToConsider = CARDS.filter(dbCard => 
      userCardNames.some(uName => {
        const lowerU = uName.toLowerCase();
        const lowerDB = dbCard.cardName.toLowerCase();
        // Check for full name match or specific brand match (to handle "Chase Checking" vs "Chase Sapphire")
        return lowerU.includes(lowerDB) || lowerDB.includes(lowerU) || 
               (lowerU.includes('chase') && lowerDB.includes('chase')) ||
               (lowerU.includes('amex') && lowerDB.includes('amex')) ||
               (lowerU.includes('wells fargo') && lowerDB.includes('wells fargo')) ||
               (lowerU.includes('capital one') && lowerDB.includes('capital one'));
      })
    );
    
    // If none of our DB cards match the user's cards, fall back to all cards
    if (cardsToConsider.length === 0) {
      cardsToConsider = CARDS;
    }
  }

  cardsToConsider.forEach((card) => {
    // Precise uppercase matching or inclusion
    const matchedKey = Object.keys(card.categories).find(c => 
      category.includes(c) || c.includes(category)
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
    'FOOD AND DRINK', 'GROCERIES', 'TRAVEL', 
    'GAS STATION', 'SERVICE', 'SHOPS', 'ENTERTAINMENT'
  ];
  
  return commonCategories.map(cat => {
    // Collect stats for each user card
    const cardStats = userCardNames.map(name => {
      const lowerN = name.toLowerCase();
      const dbCard = CARDS.find(c => {
        const lowerC = c.cardName.toLowerCase();
        return lowerN.includes(lowerC) || lowerC.includes(lowerN) ||
               (lowerN.includes('chase') && lowerC.includes('chase')) ||
               (lowerN.includes('amex') && lowerC.includes('amex')) ||
               (lowerN.includes('wells fargo') && lowerC.includes('wells fargo')) ||
               (lowerN.includes('capital one') && lowerC.includes('capital one'));
      });
      
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
    userCardNames.some(uName => 
      uName.toLowerCase().includes(dbCard.cardName.toLowerCase()) || 
      dbCard.cardName.toLowerCase().includes(uName.toLowerCase())
    )
  );
  
  if (userCards.length === 0) return 0.01;
  
  return Math.max(...userCards.map(c => c.defaultRate));
}
