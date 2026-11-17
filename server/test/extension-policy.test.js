const { test } = require('node:test');
const assert = require('node:assert/strict');

const policy = {
  defaultAction: 'deny',
  captureFullUrl: false,
  applicationRules: [],
  websiteRules: [
    { id: 'rule-allow', domain: 'example.org', action: 'allow', category: 'learning' },
    { id: 'rule-block', domain: 'blocked.example', action: 'block', category: 'restricted' }
  ]
};

test('dynamic website policy rules use DNR URL-filter syntax, not regex syntax', async () => {
  const { buildDynamicRules } = await import('../../extension/policy-rules.mjs');
  const rules = buildDynamicRules(policy);
  assert.equal(rules[1].condition.urlFilter, '||example.org^');
  assert.equal(rules[2].condition.urlFilter, '||blocked.example^');
  assert.equal('regexFilter' in rules[1].condition, false);
  assert.equal(rules[1].action.type, 'allow');
  assert.equal(rules[2].action.type, 'redirect');
  assert.equal(rules[0].priority, 1);
});

test('policy domains are normalized and reject URL injection syntax', async () => {
  const { normalizePolicyDomain } = await import('../../extension/policy-rules.mjs');
  assert.equal(normalizePolicyDomain('*.Example.ORG.'), 'example.org');
  assert.throws(() => normalizePolicyDomain('example.org@attacker.test'), /Invalid policy domain/);
  assert.throws(() => normalizePolicyDomain('example.org/path'), /Invalid policy domain/);
});

test('policy builder rejects malformed and oversized policies before browser updates', async () => {
  const { buildDynamicRules } = await import('../../extension/policy-rules.mjs');
  assert.throws(() => buildDynamicRules({ ...policy, defaultAction: 'allow' }), /Unsupported policy format/);
  assert.throws(() => buildDynamicRules({ ...policy, websiteRules: [{ ...policy.websiteRules[0], domain: 'bad domain' }] }), /Invalid policy domain/);
  assert.throws(() => buildDynamicRules({ ...policy, websiteRules: Array(5000).fill(policy.websiteRules[0]) }), /supported limit/);
});
