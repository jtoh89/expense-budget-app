import postgres from "postgres";

const connectionString = process.env.DATABASE_URL;

export const sql = connectionString
  ? postgres(connectionString)
  : (null as unknown as ReturnType<typeof postgres>);

export default sql;
