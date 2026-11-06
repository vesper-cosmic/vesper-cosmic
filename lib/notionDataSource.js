import "server-only";

const cache = new Map();
const ensured = new Map();
const schemas = new Map();

/** Type of a column ("email", "rich_text", …) seen at the last schema check. */
export function getPropertyType(dataSourceId, name) {
  return schemas.get(dataSourceId)?.[name]?.type || "";
}

/**
 * Since Notion API 2025-09-03, queries take a data source id, which differs
 * from the database id shown in the Notion URL. The env vars may hold either,
 * so resolve a database id to its (first) data source id. Cached per id.
 *
 * If neither lookup finds it, Notion's "not found" error is thrown, which
 * usually means the database is not shared with the integration.
 *
 * Pass `schema` ({ title, properties }) to also make sure the columns the
 * code writes to exist (see ensureDataSourceSchema). That runs once per
 * server instance.
 */
export async function resolveDataSourceId(notion, id, schema) {
  if (!id) return "";

  let dataSourceId = cache.get(id);
  if (!dataSourceId) {
    dataSourceId = id;
    try {
      await notion.dataSources.retrieve({ data_source_id: id });
    } catch {
      const database = await notion.databases.retrieve({ database_id: id });
      dataSourceId = database.data_sources?.[0]?.id || id;
    }
    cache.set(id, dataSourceId);
  }

  if (schema) await ensureDataSourceSchema(notion, dataSourceId, schema);
  return dataSourceId;
}

/**
 * Add any columns the code expects but the Notion data source lacks, and
 * rename the title column to `schema.title` if it has another name.
 *
 * Only adds — existing columns are never changed or retyped, so data in
 * Notion is never touched. Failures are logged, not thrown, so a schema
 * problem never blocks a request that might still work.
 */
export async function ensureDataSourceSchema(notion, dataSourceId, schema) {
  if (ensured.has(dataSourceId)) return ensured.get(dataSourceId);

  const run = (async () => {
    try {
      const dataSource = await notion.dataSources.retrieve({
        data_source_id: dataSourceId,
      });
      const existing = dataSource.properties || {};
      const updates = {};

      if (schema.title && !existing[schema.title]) {
        const titleEntry = Object.entries(existing).find(
          ([, property]) => property.type === "title"
        );
        if (titleEntry) updates[titleEntry[0]] = { name: schema.title };
      }

      for (const [name, definition] of Object.entries(schema.properties || {})) {
        // A data source has exactly one title column; handled above.
        if (definition.title) continue;
        if (!existing[name]) {
          updates[name] = definition;
        } else if (existing[name].type !== Object.keys(definition)[0]) {
          console.warn(
            `[notion] Column "${name}" is ${existing[name].type} but the site expects ${
              Object.keys(definition)[0]
            }. Left unchanged; writes to it may fail.`
          );
        }
      }

      const known = { ...existing };
      for (const [name, definition] of Object.entries(updates)) {
        if (!definition.name) known[name] = { type: Object.keys(definition)[0] };
      }
      schemas.set(dataSourceId, known);

      if (Object.keys(updates).length > 0) {
        await notion.dataSources.update({
          data_source_id: dataSourceId,
          properties: updates,
        });
        console.log("[notion] Added/renamed columns:", Object.keys(updates));
      }
      return true;
    } catch (error) {
      console.error("[notion] Schema check failed:", error.message || error);
      ensured.delete(dataSourceId); // retry on the next request
      return false;
    }
  })();

  ensured.set(dataSourceId, run);
  return run;
}
