import db from "../config/db.js";

const TABLE_NAME = "app_settings";

const isTransaction = (client) => Boolean(client) && client.isTransaction === true;

const normalizeSettingValue = (value) => {
  if (value === null || value === undefined) {
    return null;
  }

  return String(value);
};

export const getSetting = (key, client = db) => {
  return client(TABLE_NAME).where({ key }).first();
};

const upsertSettingInternal = async (client, key, value) => {
  const existing = await client(TABLE_NAME).where({ key }).first();
  const normalizedValue = normalizeSettingValue(value);

  if (existing) {
    await client(TABLE_NAME)
      .where({ key })
      .update({ value: normalizedValue, updatedAt: client.fn.now() });
  } else {
    await client(TABLE_NAME).insert({ key, value: normalizedValue });
  }

  return client(TABLE_NAME).where({ key }).first();
};

export const upsertSetting = async (key, value, client = db) => {
  if (isTransaction(client)) {
    return upsertSettingInternal(client, key, value);
  }

  if (client && typeof client.transaction === "function" && client !== db) {
    return client.transaction((trx) => upsertSettingInternal(trx, key, value));
  }

  return db.transaction((trx) => upsertSettingInternal(trx, key, value));
};
