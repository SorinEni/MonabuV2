import Plan from "#models/Plan";

const DEFAULT_PLANS = [
  {
    name: "free",
    displayName: "Free",
    activeTagLimit: 3,
    archivedTagLimit: 3,
    subtagLimit: 2,
    analyticsDays: 30,
    isLifetime: true,
    features: [],
    order: 1,
  },
  {
    name: "pro",
    displayName: "Pro",
    activeTagLimit: 999,
    archivedTagLimit: 999,
    subtagLimit: 10,
    analyticsDays: null,
    isLifetime: false,
    features: ["heatmap", "gif_avatar", "full_analytics"],
    order: 2,
  },
  {
    name: "pro+",
    displayName: "Pro+",
    activeTagLimit: 999,
    archivedTagLimit: 999,
    subtagLimit: 10,
    analyticsDays: null,
    isLifetime: true,
    features: ["heatmap", "gif_avatar", "full_analytics"],
    order: 3,
  },
  {
    name: "team",
    displayName: "Team",
    activeTagLimit: 999,
    archivedTagLimit: 999,
    subtagLimit: 10,
    analyticsDays: null,
    isLifetime: false,
    features: ["heatmap", "gif_avatar", "full_analytics"],
    order: 4,
  },
  {
    name: "earlyaccess",
    displayName: "Early Access",
    activeTagLimit: 999,
    archivedTagLimit: 999,
    subtagLimit: 10,
    analyticsDays: null,
    isLifetime: true,
    features: ["heatmap", "gif_avatar", "full_analytics"],
    order: 0,
  },
];

export async function seedPlans() {
  let created = 0;
  let updated = 0;

  for (const def of DEFAULT_PLANS) {
    const existing = await Plan.findOne({ name: def.name }).lean();
    if (existing) {
      await Plan.updateOne({ name: def.name }, { $set: def });
      updated++;
    } else {
      await Plan.create(def);
      created++;
    }
  }

  console.log(
    `[seedPlans] ${created} created, ${updated} updated out of ${DEFAULT_PLANS.length} plans.`,
  );
}
