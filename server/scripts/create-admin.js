require('dotenv').config();
const bcrypt=require('bcrypt');
const db=require('../src/db');
const eduDomains = [
  'www.google.com', 'classroom.google.com', 'docs.google.com', 'drive.google.com',
  'accounts.google.com', 'gemini.google.com', 'chatgpt.com', 'openai.com',
  'copilot.microsoft.com', 'login.live.com', 'wikipedia.org', 'khanacademy.org',
  'ck12.org', 'openstax.org', 'phet.colorado.edu', 'code.org', 'scratch.mit.edu'
];

(async () => {
  const { SUPER_ADMIN_EMAIL: email, SUPER_ADMIN_NAME: name, SUPER_ADMIN_PASSWORD: password,
    SCHOOL_NAME: schoolName, SCHOOL_SLUG: slug } = process.env;
  if (!email || !name || !password || !schoolName || !slug) {
    throw new Error('Set SUPER_ADMIN_EMAIL, SUPER_ADMIN_NAME, SUPER_ADMIN_PASSWORD, SCHOOL_NAME, and SCHOOL_SLUG');
  }
  if (password.length < 12) throw new Error('SUPER_ADMIN_PASSWORD must be at least 12 characters');
  if (!/^[a-z0-9-]{1,100}$/.test(slug)) throw new Error('SCHOOL_SLUG must contain lowercase letters, digits, and hyphens');
  const c = await db.pool.connect();
  try {
    await c.query('BEGIN');
    let user = await c.query("SELECT id FROM users WHERE lower(email)=lower($1) AND role='SUPER_ADMIN'", [email]);
    if (!user.rowCount) {
      const hash = await bcrypt.hash(password, Number(process.env.BCRYPT_ROUNDS) || 12);
      user = await c.query("INSERT INTO users(email,password_hash,full_name,role) VALUES(lower($1),$2,$3,'SUPER_ADMIN') RETURNING id", [email, hash, name]);
    }
    let school = await c.query('SELECT id FROM schools WHERE slug=$1', [slug]);
    if (!school.rowCount) {
      school = await c.query('INSERT INTO schools(name,slug) VALUES($1,$2) RETURNING id', [schoolName, slug]);
      await c.query('INSERT INTO subscriptions(school_id) VALUES($1)', [school.rows[0].id]);
      for (const domain of eduDomains) {
        await c.query("INSERT INTO website_rules(school_id,domain,category,action,url_match,capture_full_url) VALUES($1,$2,'educational','allow','domain',false) ON CONFLICT DO NOTHING", [school.rows[0].id, domain]);
      }
    }
    await c.query('COMMIT');
    console.log('Bootstrap complete (credentials omitted).');
    console.log('First school received a domain-only education allowlist; YouTube remains denied until supported restrictions are configured.');
  } catch (error) {
    await c.query('ROLLBACK');
    throw error;
  } finally {
    c.release();
    await db.pool.end();
  }
})().catch(error => {
  console.error(error.message);
  process.exit(1);
});
