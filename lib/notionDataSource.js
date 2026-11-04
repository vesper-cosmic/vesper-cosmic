import "server-only";

const cache = new Map();

/**
 * Since Notion API 2025-09-03, queries take a data source id, which differs
 * from the database id shown in the Notion URL. The env vars may hold either,
 * so resolve a database id to its (first) data source id. Cached per id.
 *
 * If neither lookup finds it, Notion's "not found" error is thrown, which
 * usually means the database is not shared with the integration.
 */
export async function resolveDataSourceId(notion, id) {
  if (!id) return "";
  if (cache.has(id)) return cache.get(id);

  let dataSourceId = id;
  try {
    await notion.dataSources.retrieve({ data_source_id: id });
  } catch {
    const database = await notion.databases.retrieve({ database_id: id });
    dataSourceId = database.data_sources?.[0]?.id || id;
  }

  cache.set(id, dataSourceId);
  return dataSourceId;
}
