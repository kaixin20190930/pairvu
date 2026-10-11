-- Append-only audit: image deletion/expiry retains analysis metadata and audit.
-- No business purge escape hatch. Future hard account deletion requires a separately
-- authorized retention design; restrictive FKs never silently erase decisions.
CREATE TABLE review_write_guards (
 token TEXT PRIMARY KEY, analysis_id TEXT NOT NULL, workspace_id TEXT NOT NULL,
 ok INTEGER NOT NULL CHECK(ok=1)
);
CREATE TABLE review_events (
 id TEXT PRIMARY KEY,
 analysis_id TEXT NOT NULL REFERENCES analyses(id) ON DELETE RESTRICT,
 workspace_id TEXT NOT NULL REFERENCES workspaces(id) ON DELETE RESTRICT,
 actor_id TEXT NOT NULL REFERENCES user(id) ON DELETE RESTRICT,
 request_id TEXT NOT NULL,
 fingerprint TEXT NOT NULL CHECK(length(fingerprint)=64),
 expected_revision INTEGER NOT NULL CHECK(expected_revision>=0),
 revision INTEGER NOT NULL CHECK(revision=expected_revision+1),
 previous_decision_id TEXT REFERENCES review_events(id) ON DELETE RESTRICT,
 action TEXT NOT NULL CHECK(action IN ('approve','reject','revoke')),
 category TEXT NOT NULL CHECK(category IN ('false_positive','false_negative','intentional_change','wrong_reference','insufficient_evidence','other')),
 reason TEXT NOT NULL CHECK(length(trim(reason)) BETWEEN 1 AND 1000),
 note TEXT CHECK(note IS NULL OR length(note)<=2000),
 machine_snapshot_json TEXT NOT NULL CHECK(json_valid(machine_snapshot_json)),
 machine_sha256 TEXT NOT NULL CHECK(length(machine_sha256)=64),
 created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
 UNIQUE(analysis_id,revision), UNIQUE(analysis_id,request_id)
);
CREATE INDEX review_events_owner ON review_events(workspace_id,analysis_id,revision);
CREATE TABLE review_heads (
 analysis_id TEXT PRIMARY KEY REFERENCES analyses(id) ON DELETE RESTRICT,
 workspace_id TEXT NOT NULL REFERENCES workspaces(id) ON DELETE RESTRICT,
 revision INTEGER NOT NULL CHECK(revision>0),
 latest_event_id TEXT NOT NULL REFERENCES review_events(id) ON DELETE RESTRICT
);
CREATE TRIGGER review_event_update_blocked BEFORE UPDATE ON review_events BEGIN SELECT RAISE(ABORT,'review_audit_immutable'); END;
CREATE TRIGGER review_event_delete_blocked BEFORE DELETE ON review_events BEGIN SELECT RAISE(ABORT,'review_audit_immutable'); END;
CREATE TRIGGER review_head_delete_blocked BEFORE DELETE ON review_heads BEGIN SELECT RAISE(ABORT,'review_head_immutable'); END;
CREATE TRIGGER review_event_append_guard BEFORE INSERT ON review_events
WHEN NOT EXISTS(SELECT 1 FROM review_write_guards g WHERE g.analysis_id=NEW.analysis_id AND g.workspace_id=NEW.workspace_id)
 OR EXISTS(SELECT 1 FROM review_events e WHERE e.id=NEW.id OR (e.analysis_id=NEW.analysis_id AND e.request_id=NEW.request_id))
 OR NOT EXISTS(SELECT 1 FROM analyses a JOIN workspaces w ON w.id=a.workspace_id JOIN workspace_memberships m ON m.workspace_id=w.id
 WHERE a.id=NEW.analysis_id AND a.workspace_id=NEW.workspace_id AND a.status='completed' AND w.status='active' AND m.user_id=NEW.actor_id AND m.role='owner'
 AND json_extract(NEW.machine_snapshot_json,'$.verdict') IS a.verdict
 AND json_extract(NEW.machine_snapshot_json,'$.qaEngineVersion') IS a.qa_engine_version
 AND json_extract(NEW.machine_snapshot_json,'$.riskPolicyVersion') IS a.risk_policy_version
 AND json_extract(NEW.machine_snapshot_json,'$.modelPolicyVersion') IS a.model_policy_version)
 OR NEW.expected_revision<>COALESCE((SELECT revision FROM review_heads WHERE analysis_id=NEW.analysis_id AND workspace_id=NEW.workspace_id),0)
 OR NEW.previous_decision_id IS NOT (SELECT latest_event_id FROM review_heads WHERE analysis_id=NEW.analysis_id AND workspace_id=NEW.workspace_id)
 OR (NEW.action='revoke' AND NOT EXISTS(SELECT 1 FROM review_heads h JOIN review_events e ON e.id=h.latest_event_id WHERE h.analysis_id=NEW.analysis_id AND e.action IN ('approve','reject')))
BEGIN SELECT RAISE(ABORT,'review_append_guard'); END;
CREATE TRIGGER review_head_insert_guard BEFORE INSERT ON review_heads
WHEN EXISTS(SELECT 1 FROM review_heads WHERE analysis_id=NEW.analysis_id) OR NEW.revision<>1 OR NOT EXISTS(SELECT 1 FROM review_events e JOIN review_write_guards g ON g.analysis_id=e.analysis_id AND g.workspace_id=e.workspace_id
 WHERE e.id=NEW.latest_event_id AND e.analysis_id=NEW.analysis_id AND e.workspace_id=NEW.workspace_id AND e.revision=NEW.revision AND e.previous_decision_id IS NULL)
BEGIN SELECT RAISE(ABORT,'review_head_guard'); END;
CREATE TRIGGER review_head_update_guard BEFORE UPDATE ON review_heads
WHEN NEW.analysis_id<>OLD.analysis_id OR NEW.workspace_id<>OLD.workspace_id OR NEW.revision<>OLD.revision+1
 OR NOT EXISTS(SELECT 1 FROM review_events e JOIN review_write_guards g ON g.analysis_id=e.analysis_id AND g.workspace_id=e.workspace_id
 WHERE e.id=NEW.latest_event_id AND e.analysis_id=NEW.analysis_id AND e.workspace_id=NEW.workspace_id AND e.revision=NEW.revision AND e.previous_decision_id=OLD.latest_event_id)
BEGIN SELECT RAISE(ABORT,'review_head_guard'); END;
