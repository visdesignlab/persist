export const INTENT_TYPES = [
  'Range',
  'Cluster',
  'Outlier',
  'Multivariate Optimization'
] as const;

export type IntentType = (typeof INTENT_TYPES)[number];

export const ALGORITHMS = ['KMeans', 'DBScan', 'BNL', 'DT'];

export type Algorithm = (typeof ALGORITHMS)[number];

export type PredictionStats = {
  ipns: string[];
  isnp: string[];
  matches: string[];
};

export type Prediction = {
  intent: IntentType;
  algorithm: Algorithm;
  info: Record<string, any>;
  dimensions: string[];
  params: Record<string, any>;
  hash: null | string;
  rank_jaccard: number;
  rank_auto_complete: number; // not used, consider bringing back
  rank_nb: number; // not used, consider bringing back
  members: string[];
  membership_stats: PredictionStats; // Update this type according to the actual data structure
};

export type Predictions = Array<Prediction>;

export type Intent = Pick<
  Prediction,
  'intent' | 'algorithm' | 'params' | 'dimensions' | 'info'
>;

export type Intents = Array<Intent>;

export function predictionToIntent(prediction: Prediction): Intent {
  return prediction;
}

export function generatePredictionsArray(): Predictions {
  const getRandomInt = (max: number) => Math.floor(Math.random() * max);

  const getRandomInfo = (): Record<string, any> => {
    return { key: `value_${getRandomInt(100)}` };
  };

  const getRandomParams = (): Record<string, any> => {
    return {
      param1: Math.random() < 0.5,
      param2: `param_${getRandomInt(100)}`
    };
  };

  const getRandomMembers = (): string[] => {
    const members: string[] = [];
    const numMembers = getRandomInt(5) + 1; // Random number of members between 1 and 5
    for (let i = 1; i <= numMembers; i++) {
      members.push(`member${i}`);
    }
    return members;
  };

  const getRandomStats = (): PredictionStats => {
    return {
      ipns: [`item_${getRandomInt(100)}`, `item_${getRandomInt(100)}`],
      isnp: [`item_${getRandomInt(100)}`, `item_${getRandomInt(100)}`],
      matches: [`match_${getRandomInt(100)}`, `match_${getRandomInt(100)}`]
    };
  };

  const predictions: Prediction[] = [];

  for (const intent of INTENT_TYPES) {
    for (const algorithm of ALGORITHMS) {
      const prediction: Prediction = {
        intent,
        algorithm,
        info: getRandomInfo(),
        dimensions: [`dimension_${getRandomInt(3) + 1}`],
        params: getRandomParams(),
        hash: Math.random() < 0.5 ? 'hash_value' : null,
        rank_jaccard: Math.random(),
        rank_auto_complete: -1,
        rank_nb: -1,
        members: getRandomMembers(),
        membership_stats: getRandomStats()
      };
      predictions.push(prediction);
    }
  }

  const preds = predictions
    .filter(f => f.rank_jaccard > 0.5)
    .sort((a, b) => b.rank_jaccard - a.rank_jaccard);

  return preds;
}
