// Synthetic fixture implementation of the accepted transaction order, not application code.
import { randomUUID, createHash } from 'node:crypto';
export const NOW = '2026-01-01T00:00:00.000Z';
export const hash = value => createHash('sha256').update(value).digest('hex');
export const statement = (sql, ...params) => ({ sql, params });
export function profile(name = 'Synthetic product', skuLabel = 'SYN-1') {
  return { profileSchemaVersion: 1, name, skuLabel, brand: null, variant: null, capacity: null, packagingVersion: null, criticalAttributes: [], allowedChanges: [] };
}
export function mutation({ action = 'profile', workspaceId = 'w1', productId = 'p1', requestId = randomUUID(), expectedVersion = 0, name = 'Synthetic product', skuLabel = 'SYN-1', assetId = 'a2', role = 'front', status = 'archived', noopProfile = null } = {}) {
  const token = randomUUID(), finalToken = randomUUID(), versionId = randomUUID();
  const payload = action === 'profile' ? profile(name, skuLabel) : action === 'reference' ? { assetId, role } : { status };
  const fingerprint = hash(JSON.stringify({ action, productId, expectedVersion, payload }));
  const requiredStatus = action === 'lifecycle' && status === 'active' ? 'archived' : 'active';
  let predicate = `p.workspace_id=? AND p.id=? AND p.revision=? AND p.status=? AND (p.current_profile_version_id IS NULL OR EXISTS(SELECT 1 FROM product_profile_versions v WHERE v.id=p.current_profile_version_id AND v.workspace_id=p.workspace_id AND v.product_id=p.id))`;
  const conditions = [workspaceId, productId, expectedVersion, requiredStatus];
  if (action === 'reference') {
    predicate += ` AND EXISTS(SELECT 1 FROM assets a WHERE a.id=? AND a.workspace_id=p.workspace_id AND a.kind='reference' AND a.asset_type='image' AND a.status NOT IN ('deleted','failed') AND a.retention_expires_at IS NOT NULL AND a.retention_expires_at>?)`;
    conditions.push(assetId, NOW);
  }
  if (noopProfile) { predicate += ` AND p.current_profile_version_id=? AND EXISTS(SELECT 1 FROM product_profile_versions v WHERE v.id=? AND v.profile_sha256=?)`; conditions.push(noopProfile.id, noopProfile.id, hash(JSON.stringify(payload))); }
  const statements = [statement(`INSERT INTO product_write_guards(token,workspace_id,product_id,ok) SELECT ?,?,?,CASE WHEN EXISTS(SELECT 1 FROM products p WHERE ${predicate}) THEN 1 ELSE 0 END`, token, workspaceId, productId, ...conditions)];
  if (action === 'profile') {
    statements.push(statement(`INSERT INTO product_mutation_requests(workspace_id,product_id,request_id,action,fingerprint,result_revision,result_profile_version_id,result_status,created_at) VALUES(?,?,?,'profile',?,?,?,'active',?)`, workspaceId, productId, requestId, fingerprint, expectedVersion + (noopProfile ? 0 : 1), noopProfile?.id ?? versionId, NOW));
    if (!noopProfile) {
      const json = JSON.stringify(payload);
      statements.push(statement(`INSERT INTO product_profile_versions(id,workspace_id,product_id,version_number,schema_version,profile_json,profile_sha256,source,created_at,created_by_user_id) SELECT ?,?,?,COALESCE(MAX(version_number),0)+1,1,?,?,'user_confirmed',?,'synthetic-user' FROM product_profile_versions WHERE workspace_id=? AND product_id=?`, versionId, workspaceId, productId, json, hash(json), NOW, workspaceId, productId));
      statements.push(statement(`UPDATE products SET name=?,sku_label=?,sku_key=?,current_profile_version_id=?,revision=revision+1,updated_at=? WHERE workspace_id=? AND id=? AND revision=?`, name, skuLabel, skuLabel?.toLocaleLowerCase('en-US') ?? null, versionId, NOW, workspaceId, productId, expectedVersion));
      statements.push(statement(`INSERT INTO product_write_guards(token,workspace_id,product_id,ok) SELECT ?,?,?,CASE WHEN EXISTS(SELECT 1 FROM products WHERE workspace_id=? AND id=? AND revision=? AND current_profile_version_id=?) THEN 1 ELSE 0 END`, finalToken, workspaceId, productId, workspaceId, productId, expectedVersion + 1, versionId));
    }
  } else {
    statements.push(statement(`INSERT INTO product_mutation_requests(workspace_id,product_id,request_id,action,fingerprint,result_revision,result_profile_version_id,result_reference_version_id,result_status,created_at) SELECT ?,?,?,?, ?,?,current_profile_version_id,?,?,? FROM products WHERE workspace_id=? AND id=?`, workspaceId, productId, requestId, action, fingerprint, expectedVersion + 1, action === 'reference' ? versionId : null, action === 'reference' ? 'active' : status, NOW, workspaceId, productId));
    if (action === 'reference') {
      statements.push(statement(`UPDATE product_reference_versions SET status='superseded' WHERE workspace_id=? AND product_id=? AND reference_role=? AND status='current'`, workspaceId, productId, role));
      statements.push(statement(`INSERT INTO product_reference_versions(id,workspace_id,product_id,asset_id,version_number,status,reference_role,created_at,promoted_at) SELECT ?,?,?,?,COALESCE(MAX(version_number),0)+1,'current',?,?,? FROM product_reference_versions WHERE workspace_id=? AND product_id=?`, versionId, workspaceId, productId, assetId, role, NOW, NOW, workspaceId, productId));
      statements.push(statement(`UPDATE products SET revision=revision+1,updated_at=? WHERE workspace_id=? AND id=? AND revision=?`, NOW, workspaceId, productId, expectedVersion));
      statements.push(statement(`INSERT INTO product_write_guards(token,workspace_id,product_id,ok) SELECT ?,?,?,CASE WHEN EXISTS(SELECT 1 FROM products p JOIN product_reference_versions r ON r.product_id=p.id AND r.workspace_id=p.workspace_id WHERE p.id=? AND p.workspace_id=? AND p.revision=? AND r.id=? AND r.status='current') THEN 1 ELSE 0 END`, finalToken, workspaceId, productId, productId, workspaceId, expectedVersion + 1, versionId));
    } else {
      statements.push(statement(`UPDATE products SET status=?,archived_at=?,revision=revision+1,updated_at=? WHERE workspace_id=? AND id=? AND revision=?`, status, status === 'archived' ? NOW : null, NOW, workspaceId, productId, expectedVersion));
      statements.push(statement(`INSERT INTO product_write_guards(token,workspace_id,product_id,ok) SELECT ?,?,?,CASE WHEN EXISTS(SELECT 1 FROM products WHERE workspace_id=? AND id=? AND revision=? AND status=?) THEN 1 ELSE 0 END`, finalToken, workspaceId, productId, workspaceId, productId, expectedVersion + 1, status));
    }
  }
  statements.push(statement(`DELETE FROM product_write_guards WHERE token IN (?,?)`, token, finalToken));
  return { action, workspaceId, productId, requestId, expectedVersion, fingerprint, versionId, statements };
}
