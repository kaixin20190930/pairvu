-- Synthetic fixture only: reduced unrelated columns, unchanged product/reference constraints.
CREATE TABLE workspaces (id TEXT PRIMARY KEY);
-- statement
CREATE TABLE assets (
  id TEXT PRIMARY KEY, workspace_id TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  kind TEXT NOT NULL, asset_type TEXT NOT NULL, status TEXT NOT NULL, retention_expires_at TEXT
);
-- statement
CREATE TABLE products (
  id TEXT PRIMARY KEY, workspace_id TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  name TEXT NOT NULL, sku_label TEXT, sku_key TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active','archived')), archived_at TEXT,
  created_at TEXT NOT NULL, updated_at TEXT NOT NULL
);
-- statement
CREATE UNIQUE INDEX idx_products_workspace_sku_key ON products(workspace_id,sku_key) WHERE sku_key IS NOT NULL;
-- statement
CREATE TABLE product_reference_versions (
  id TEXT PRIMARY KEY, workspace_id TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  product_id TEXT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  asset_id TEXT NOT NULL REFERENCES assets(id), version_number INTEGER NOT NULL CHECK(version_number>0),
  status TEXT NOT NULL CHECK(status IN ('current','superseded')),
  reference_role TEXT NOT NULL CHECK(reference_role IN ('front','back','left_side','right_side','detail','other')),
  created_at TEXT NOT NULL, promoted_at TEXT NOT NULL,
  UNIQUE(product_id,version_number), UNIQUE(product_id,asset_id)
);
-- statement
CREATE UNIQUE INDEX idx_product_reference_current_role ON product_reference_versions(product_id,reference_role) WHERE status='current';
-- statement
CREATE TABLE batches (id TEXT PRIMARY KEY,workspace_id TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,product_id TEXT REFERENCES products(id) ON DELETE SET NULL);
-- statement
CREATE TABLE batch_items (id TEXT PRIMARY KEY,batch_id TEXT NOT NULL REFERENCES batches(id) ON DELETE CASCADE,workspace_id TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,reference_asset_id TEXT,candidate_asset_id TEXT);
-- statement
CREATE TABLE analyses (id TEXT PRIMARY KEY,workspace_id TEXT REFERENCES workspaces(id) ON DELETE CASCADE,reference_asset_id TEXT,candidate_asset_id TEXT);
