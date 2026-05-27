import Plan from "#models/Plan";

let PLAN_CACHE = new Map();

export async function refreshPlanCache() {
  const plans = await Plan.find().lean();
  const map = new Map();
  for (const p of plans) {
    map.set(p.name, {
      name: p.name,
      displayName: p.displayName,
      activeTagLimit: p.activeTagLimit,
      archivedTagLimit: p.archivedTagLimit,
      subtagLimit: p.subtagLimit,
      analyticsDays: p.analyticsDays,
      isLifetime: p.isLifetime,
      features: p.features ?? [],
      order: p.order,
    });
  }
  PLAN_CACHE = map;
  console.log(`[plans] Cached ${map.size} plan configs.`);
}

export function getPlanConfigSync(name) {
  return PLAN_CACHE.get(name) ?? null;
}

export function getCachedPlans() {
  return Array.from(PLAN_CACHE.values());
}
