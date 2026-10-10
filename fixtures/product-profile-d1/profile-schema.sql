-- Synthetic realization of UPG-03A design; this is not a production migration.
ALTER TABLE products ADD COLUMN revision INTEGER NOT NULL DEFAULT 0 CHECK(revision>=0);
-- statement
ALTER TABLE products ADD COLUMN current_profile_version_id TEXT;
-- statement
CREATE UNIQUE INDEX idx_products_workspace_id ON products(workspace_id,id);
-- statement
CREATE TABLE product_profile_versions (
  id TEXT PRIMARY KEY,workspace_id TEXT NOT NULL,product_id TEXT NOT NULL,
  version_number INTEGER NOT NULL CHECK(version_number>0),schema_version INTEGER NOT NULL CHECK(schema_version=1),
  profile_json TEXT NOT NULL CHECK(json_valid(profile_json)),profile_sha256 TEXT NOT NULL CHECK(length(profile_sha256)=64),
  source TEXT NOT NULL CHECK(source='user_confirmed'),created_at TEXT NOT NULL,created_by_user_id TEXT NOT NULL,
  FOREIGN KEY(workspace_id,product_id) REFERENCES products(workspace_id,id) ON DELETE CASCADE,
  UNIQUE(product_id,version_number),UNIQUE(workspace_id,product_id,id)
);
-- statement
CREATE INDEX idx_profile_history ON product_profile_versions(workspace_id,product_id,version_number DESC);
-- statement
CREATE TABLE product_mutation_requests (
  workspace_id TEXT NOT NULL,product_id TEXT NOT NULL,request_id TEXT NOT NULL,
  action TEXT NOT NULL CHECK(action IN ('profile','reference','lifecycle')),fingerprint TEXT NOT NULL CHECK(length(fingerprint)=64),
  result_revision INTEGER NOT NULL,result_profile_version_id TEXT,result_reference_version_id TEXT,
  result_status TEXT NOT NULL CHECK(result_status IN ('active','archived')),created_at TEXT NOT NULL,
  PRIMARY KEY(workspace_id,product_id,request_id),
  FOREIGN KEY(workspace_id,product_id) REFERENCES products(workspace_id,id) ON DELETE CASCADE
);
-- statement
CREATE TABLE product_write_guards (token TEXT PRIMARY KEY,workspace_id TEXT NOT NULL,product_id TEXT NOT NULL,ok INTEGER NOT NULL CHECK(ok=1));
-- statement
CREATE TRIGGER product_guard_update BEFORE UPDATE ON products
WHEN OLD.current_profile_version_id IS NOT NULL AND NOT EXISTS (
  SELECT 1 FROM product_write_guards g WHERE g.workspace_id=OLD.workspace_id AND g.product_id=OLD.id AND g.ok=1
) BEGIN SELECT RAISE(ABORT,'legacy_write_blocked'); END;
-- statement
CREATE TRIGGER product_pointer_scope BEFORE UPDATE OF current_profile_version_id ON products
WHEN NEW.current_profile_version_id IS NOT NULL AND NOT EXISTS (
  SELECT 1 FROM product_profile_versions v WHERE v.id=NEW.current_profile_version_id AND v.workspace_id=NEW.workspace_id AND v.product_id=NEW.id
) BEGIN SELECT RAISE(ABORT,'profile_pointer_scope'); END;
-- statement
CREATE TRIGGER profile_immutable BEFORE UPDATE ON product_profile_versions BEGIN SELECT RAISE(ABORT,'profile_immutable'); END;
-- statement
CREATE TRIGGER reference_immutable BEFORE UPDATE ON product_reference_versions
WHEN NEW.id IS NOT OLD.id OR NEW.workspace_id IS NOT OLD.workspace_id OR NEW.product_id IS NOT OLD.product_id
 OR NEW.asset_id IS NOT OLD.asset_id OR NEW.version_number IS NOT OLD.version_number
 OR NEW.reference_role IS NOT OLD.reference_role OR NEW.created_at IS NOT OLD.created_at OR NEW.promoted_at IS NOT OLD.promoted_at
BEGIN SELECT RAISE(ABORT,'reference_immutable'); END;
-- statement
CREATE TRIGGER reference_guard_insert BEFORE INSERT ON product_reference_versions
WHEN EXISTS(SELECT 1 FROM products p WHERE p.id=NEW.product_id AND p.current_profile_version_id IS NOT NULL)
 AND NOT EXISTS(SELECT 1 FROM product_write_guards g WHERE g.workspace_id=NEW.workspace_id AND g.product_id=NEW.product_id AND g.ok=1)
BEGIN SELECT RAISE(ABORT,'legacy_write_blocked'); END;
-- statement
CREATE TRIGGER reference_guard_status BEFORE UPDATE OF status ON product_reference_versions
WHEN EXISTS(SELECT 1 FROM products p WHERE p.id=OLD.product_id AND p.current_profile_version_id IS NOT NULL)
 AND NOT EXISTS(SELECT 1 FROM product_write_guards g WHERE g.workspace_id=OLD.workspace_id AND g.product_id=OLD.product_id AND g.ok=1)
BEGIN SELECT RAISE(ABORT,'legacy_write_blocked'); END;
-- statement
CREATE TABLE batch_product_snapshots (
  batch_id TEXT PRIMARY KEY REFERENCES batches(id) ON DELETE CASCADE,
  workspace_id TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  product_id TEXT NOT NULL,product_revision INTEGER NOT NULL,profile_version_id TEXT NOT NULL,reference_version_id TEXT NOT NULL,
  snapshot_json TEXT NOT NULL CHECK(json_valid(snapshot_json)),snapshot_sha256 TEXT NOT NULL CHECK(length(snapshot_sha256)=64),bound_at TEXT NOT NULL
);
-- statement
CREATE TABLE analysis_product_snapshots (
  analysis_id TEXT PRIMARY KEY REFERENCES analyses(id) ON DELETE CASCADE,
  workspace_id TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  product_id TEXT NOT NULL,product_revision INTEGER NOT NULL,profile_version_id TEXT NOT NULL,reference_version_id TEXT NOT NULL,
  snapshot_json TEXT NOT NULL CHECK(json_valid(snapshot_json)),snapshot_sha256 TEXT NOT NULL CHECK(length(snapshot_sha256)=64),bound_at TEXT NOT NULL,
  source_batch_id TEXT
);
-- statement
CREATE TRIGGER batch_snapshot_immutable BEFORE UPDATE ON batch_product_snapshots BEGIN SELECT RAISE(ABORT,'snapshot_immutable'); END;
-- statement
CREATE TRIGGER analysis_snapshot_immutable BEFORE UPDATE ON analysis_product_snapshots BEGIN SELECT RAISE(ABORT,'snapshot_immutable'); END;
