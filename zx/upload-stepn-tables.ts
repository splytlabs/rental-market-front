#!/usr/bin/env -S pnpm ts-node
import 'zx/globals';
import dedent from 'ts-dedent';
import sql from './lib/sql';
import supabase from './lib/supabase';

$.verbose = false;
const jsonPath = `${__dirname}/data/stepn-nft-infos.json`;

const DDL_VERSION = 0;

void (async function () {
  await dropTables();
  const ddl = createDDL();
  const ddlResult = await sql(ddl);
  console.log('ddlResult', ddlResult);
  const rawData = await fs.readJSON(jsonPath);
  await insertNFTInfos(rawData);
  await insertRentalInfos(rawData);
})();

async function insertRows(tableName: string, rows: unknown[], chunkSize = 100) {
  console.log(`insertRows(${tableName}) started !!`);
  for (let i = 0; i < rows.length; i += chunkSize) {
    const chunk = rows.slice(i, i + chunkSize);
    const result = await supabase.from(tableName).insert(chunk).then();
    console.log(
      `[${i} - ${i + chunk.length}] insert result:`,
      result.statusText
    );
  }
  console.log(`insertRows(${tableName}) finished !!`);
}

async function insertNFTInfos(rawData: Record<string, unknown>[]) {
  const { nftInfos } = tableNames();
  const rows = [] as unknown[];
  for (const info of rawData) {
    const attrs = {} as Record<string, unknown>;
    (info.attributes as unknown[]).forEach((x) => {
      const attr = x as Record<string, string>;
      if (!attr.trait_type) {
        return;
      }
      let value = attr.value ?? '';
      if (attr.trait_type === 'Optimal Speed') {
        const [min, max] = value.replace('km/h', '').split('-');
        value = `[${min}, ${max}]`;
      } else if (attr.trait_type === 'Sneaker quality') {
        const quality = ['Common', 'Uncommon', 'Rare', 'Epic', 'Legendary'];
        const index = quality.findIndex((x) => x === value);
        value = `${index < 0 ? 0 : index}`;
      } else if (attr.trait_type === 'Shoe-minting Count') {
        value = value.split('/')[0] ?? '0';
      } else if (attr.trait_type === 'Durability') {
        value = value.split('/')[0] ?? '0';
      }
      attrs[attr.trait_type] = value;
    });
    const row = {
      token_uid: info.id,
      image: info.img,
      name: info.title,
      ...attrs,
    };
    rows.push(row);
  }
  await insertRows(nftInfos, rows);
}

async function insertRentalInfos(rawData: Record<string, unknown>[]) {
  const { rentalInfos } = tableNames();
  const rows = [] as unknown[];
  for (const info of rawData) {
    const price = Number(info.price) || 1;
    const row = {
      token_uid: info.id,
      owner: info.owner,
      days_min: price > 5 ? 1 : price > 2 ? 3 : 7,
      days_max: price > 5 ? 7 : price > 2 ? 14 : 28,
      price: Math.round(price * 1_000_000),
    };
    rows.push(row);
  }
  await insertRows(rentalInfos, rows);
}

function tableNames() {
  const prefix = 'stepn_';
  const suffix = !DDL_VERSION ? '' : `_${Math.floor(Math.abs(DDL_VERSION))}`;
  return {
    nftInfos: `${prefix}nft_infos${suffix}`,
    rentalInfos: `${prefix}rental_infos${suffix}`,
  };
}

async function dropTables() {
  const { nftInfos, rentalInfos } = tableNames();
  try {
    await sql(`
      DROP VIEW ${rentalInfos}_view;
      DROP TABLE ${rentalInfos};
      DROP TABLE ${nftInfos};
    `);
  } catch {}
}

function createDDL() {
  const { nftInfos, rentalInfos } = tableNames();

  return dedent`
    CREATE TABLE ${nftInfos}
    (
      id bigint NOT NULL GENERATED ALWAYS AS IDENTITY,
      token_uid varchar NOT NULL,
      image varchar NOT NULL,
      name varchar NOT NULL,
      "Sneaker type" varchar NOT NULL,
      "Sneaker quality" integer NOT NULL,
      "Level" integer NOT NULL,
      "Optimal Speed" numrange NOT NULL,
      "Shoe-minting Count" integer NOT NULL,
      "Efficiency" numeric NOT NULL,
      "Luck" numeric NOT NULL,
      "Comfortability" numeric NOT NULL,
      "Resilience" numeric NOT NULL,
      "Durability" integer NOT NULL,
      "Socket 1" varchar,
      "Socket 2" varchar,
      "Socket 3" varchar,
      "Socket 4" varchar,
      "Badge" varchar,
      CONSTRAINT ${nftInfos}_pkey PRIMARY KEY (id),
      CONSTRAINT ${rentalInfos}_token_uid_key UNIQUE (token_uid)
    );
    CREATE TABLE ${rentalInfos}
    (
      id bigint NOT NULL GENERATED ALWAYS AS IDENTITY,
      token_uid varchar NOT NULL,
      owner varchar NOT NULL,
      days_min integer NOT NULL,
      days_max integer NOT NULL,
      price bigint NOT NULL,
      CONSTRAINT ${rentalInfos}_pkey PRIMARY KEY (id),
      CONSTRAINT ${rentalInfos}_token_uid_fkey
      FOREIGN KEY (token_uid) REFERENCES ${nftInfos} (token_uid)
    );
    ${createTablePolicy(nftInfos)}
    ${createTablePolicy(rentalInfos)}
    CREATE OR REPLACE VIEW ${rentalInfos}_view
    AS SELECT ${nftInfos}.*,
      ${rentalInfos}.owner,
      ${rentalInfos}.days_min,
      ${rentalInfos}.days_max,
      ${rentalInfos}.price
    FROM ${nftInfos} LEFT JOIN ${rentalInfos}
    ON ${nftInfos}.token_uid = ${rentalInfos}.token_uid;
  `;
}

function createTablePolicy(tableName: string) {
  return dedent`
    ALTER TABLE IF EXISTS ${tableName}
        ENABLE ROW LEVEL SECURITY;

    CREATE POLICY "Enable read access for all users"
        ON ${tableName}
        AS PERMISSIVE
        FOR SELECT
        TO public
        USING (true);

  `;
}
