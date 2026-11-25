// Only a UTC date and a count are stored. The binding is private to this Worker.
export class TutorBudget {
  constructor(ctx, env) {
    this.sql = ctx.storage.sql;
    this.limit = Number(env.DAILY_QUESTIONS || 100);
    this.sql.exec("CREATE TABLE IF NOT EXISTS usage (day TEXT PRIMARY KEY, n INTEGER NOT NULL)");
  }

  async fetch() {
    if (!Number.isInteger(this.limit) || this.limit < 1 || this.limit > 10000) {
      return new Response(null, {status: 503});
    }
    const day = new Date().toISOString().slice(0, 10);
    this.sql.exec("DELETE FROM usage WHERE day < ?", day);
    const rows = this.sql.exec(
      "INSERT INTO usage(day, n) VALUES (?, 1) ON CONFLICT(day) DO UPDATE SET n = n + 1 WHERE n < ? RETURNING n",
      day, this.limit
    ).toArray();
    return new Response(null, {status: rows.length ? 204 : 429});
  }
}
