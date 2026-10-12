-- No historical backfill. Only separately authorized, reviewed operator imports.
CREATE TABLE analysis_value_classifications (
 id TEXT PRIMARY KEY,
 analysis_id TEXT NOT NULL REFERENCES analyses(id) ON DELETE RESTRICT,
 workspace_id TEXT NOT NULL REFERENCES workspaces(id) ON DELETE RESTRICT,
 revision INTEGER NOT NULL CHECK(revision>0),
 classification TEXT NOT NULL CHECK(classification IN ('business','test','unknown')),
 evidence_ref TEXT NOT NULL CHECK(length(evidence_ref)=73 AND substr(evidence_ref,1,9)='evidence:' AND substr(evidence_ref,10) NOT GLOB '*[^a-f0-9]*'),
 verified_by TEXT NOT NULL CHECK(length(verified_by) BETWEEN 1 AND 128 AND verified_by NOT GLOB '*[^a-zA-Z0-9_-]*'),
 verified_at TEXT NOT NULL CHECK(strftime('%Y-%m-%dT%H:%M:%fZ',verified_at) IS verified_at),
 material_sha256 TEXT NOT NULL CHECK(length(material_sha256)=64 AND material_sha256 NOT GLOB '*[^a-f0-9]*'),
 created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
 UNIQUE(analysis_id,revision)
);
CREATE INDEX value_classifications_scope ON analysis_value_classifications(workspace_id,analysis_id,revision DESC);
CREATE TRIGGER value_classification_append_guard BEFORE INSERT ON analysis_value_classifications
WHEN EXISTS(SELECT 1 FROM analysis_value_classifications WHERE id=NEW.id OR (analysis_id=NEW.analysis_id AND revision=NEW.revision))
 OR NOT EXISTS(SELECT 1 FROM analyses WHERE id=NEW.analysis_id AND workspace_id=NEW.workspace_id)
 OR NEW.revision<>COALESCE((SELECT MAX(revision) FROM analysis_value_classifications WHERE analysis_id=NEW.analysis_id),0)+1
 OR julianday(NEW.verified_at)>julianday('now') OR strftime('%Y-%m-%dT%H:%M:%fZ',NEW.created_at) IS NOT NEW.created_at
 OR julianday(NEW.created_at)>julianday('now')
BEGIN SELECT RAISE(ABORT,'value_classification_scope_or_revision'); END;
CREATE TRIGGER value_classification_update_blocked BEFORE UPDATE ON analysis_value_classifications BEGIN SELECT RAISE(ABORT,'value_classification_immutable'); END;
CREATE TRIGGER value_classification_delete_blocked BEFORE DELETE ON analysis_value_classifications BEGIN SELECT RAISE(ABORT,'value_classification_immutable'); END;
