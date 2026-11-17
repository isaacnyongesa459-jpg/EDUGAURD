const MAX_DYNAMIC_WEBSITE_RULES = 4999;

export function normalizePolicyDomain(raw) {
  const value = String(raw || '').trim().toLowerCase().replace(/^\*\./, '').replace(/\.$/, '');
  if (!value || value.length > 253 || !/^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?)(?:\.(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?))*$/.test(value)) {
    throw new Error(`Invalid policy domain: ${raw}`);
  }
  return value;
}

export function buildDynamicRules(policy) {
  if (!policy || policy.defaultAction !== 'deny' || typeof policy.captureFullUrl !== 'boolean' || !Array.isArray(policy.websiteRules) || !Array.isArray(policy.applicationRules)) {
    throw new Error('Unsupported policy format: expected defaultAction deny, captureFullUrl, websiteRules and applicationRules');
  }
  if (policy.websiteRules.length > MAX_DYNAMIC_WEBSITE_RULES) {
    throw new Error(`Policy exceeds the supported limit of ${MAX_DYNAMIC_WEBSITE_RULES} website rules`);
  }

  const rules = [{
    id: 1,
    priority: 1,
    action: { type: 'redirect', redirect: { extensionPath: '/blocked.html' } },
    condition: { regexFilter: '^https?://', resourceTypes: ['main_frame'] }
  }];
  let id = 10;
  for (const rule of policy.websiteRules) {
    if (!rule || !rule.id || !['allow', 'block'].includes(rule.action) || typeof rule.category !== 'string') {
      throw new Error('Unsupported website rule in policy');
    }
    const host = normalizePolicyDomain(rule.domain);
    rules.push({
      id: id++,
      priority: rule.action === 'block' ? 300 : 200,
      action: rule.action === 'block' ? { type: 'redirect', redirect: { extensionPath: '/blocked.html' } } : { type: 'allow' },
      condition: { urlFilter: `||${host}^`, resourceTypes: ['main_frame'] }
    });
  }
  return rules;
}
