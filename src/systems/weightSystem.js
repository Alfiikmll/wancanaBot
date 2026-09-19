export function getRandomWeight(minWeight, maxWeight) {
  const weight =
    Math.random() * (maxWeight - minWeight) + minWeight;

  return Number(weight.toFixed(2));
}

export function formatWeight(weight) {
  if (weight >= 1000) {
    return `${(weight / 1000).toFixed(2)} ton`;
  }

  return `${weight.toFixed(2)} kg`;
}