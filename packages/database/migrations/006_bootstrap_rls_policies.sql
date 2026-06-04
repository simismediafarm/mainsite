-- packages/database/migrations/006_bootstrap_rls_policies.sql

-- ========================================================
-- COMPOSITE INDEXES FOR SYSTEM CARDINALITY & COHERENCE
-- ========================================================

-- Composite indexing for tenant filtering hot paths
CREATE INDEX IF NOT EXISTS niches_org_created_idx ON niches(organization_id, created_at);
CREATE INDEX IF NOT EXISTS brands_org_niche_idx ON brands(organization_id, niche_id);
CREATE INDEX IF NOT EXISTS sites_org_brand_idx ON sites(organization_id, brand_id);
CREATE INDEX IF NOT EXISTS categories_org_site_idx ON categories(organization_id, site_id);
CREATE INDEX IF NOT EXISTS content_assets_org_site_status_idx ON content_assets(organization_id, site_id, publish_status);
CREATE INDEX IF NOT EXISTS graph_nodes_org_niche_type_idx ON graph_nodes(organization_id, niche_id, entity_type);
CREATE INDEX IF NOT EXISTS graph_edges_org_niche_rel_idx ON graph_edges(organization_id, niche_id, relationship_type);
CREATE INDEX IF NOT EXISTS entity_aliases_org_idx ON entity_aliases(organization_id);
CREATE INDEX IF NOT EXISTS entity_mentions_org_idx ON entity_mentions(organization_id);
CREATE INDEX IF NOT EXISTS workflow_runs_org_started_idx ON workflow_runs(organization_id, started_at);
CREATE INDEX IF NOT EXISTS workflow_steps_org_run_idx ON workflow_steps(organization_id, workflow_run_id);
CREATE INDEX IF NOT EXISTS agent_executions_org_step_idx ON agent_executions(organization_id, workflow_step_id);
CREATE INDEX IF NOT EXISTS dead_letter_events_org_idx ON dead_letter_events(organization_id);
CREATE INDEX IF NOT EXISTS system_alerts_org_sev_resolved_idx ON system_alerts(organization_id, severity, is_resolved);
CREATE INDEX IF NOT EXISTS provider_requests_org_created_idx ON provider_requests(organization_id, created_at);

-- High-performance composite indexes for RLS path optimization
CREATE INDEX IF NOT EXISTS workflow_steps_org_status_lease_idx ON workflow_steps(organization_id, status, lease_expires_at);
CREATE INDEX IF NOT EXISTS entity_mentions_org_entity_idx ON entity_mentions(organization_id, entity_id);
CREATE INDEX IF NOT EXISTS graph_edges_org_updated_idx ON graph_edges(organization_id, updated_at);
CREATE INDEX IF NOT EXISTS providers_org_state_idx ON providers(organization_id, state);

-- Operational lookup indexes
CREATE INDEX IF NOT EXISTS content_assets_site_slug_idx ON content_assets(site_id, slug);
CREATE INDEX IF NOT EXISTS categories_site_slug_idx ON categories(site_id, slug);

-- ========================================================
-- GRANULAR MULTI-TENANT RLS POLICIES (MEMBER/ADMIN/AGENT)
-- ========================================================

-- 1. Users policies
CREATE POLICY users_select ON users FOR SELECT USING (id = auth.uid());
CREATE POLICY users_update ON users FOR UPDATE USING (id = auth.uid());

-- 2. Org Memberships policies
CREATE POLICY members_select ON org_members FOR SELECT USING (user_id = auth.uid());
CREATE POLICY members_all_admin ON org_members FOR ALL USING (organization_id = ANY(get_my_admin_orgs()));

-- 3. Organizations policies
CREATE POLICY org_select ON organizations FOR SELECT USING (id = ANY(get_my_orgs()));
CREATE POLICY org_write_admin ON organizations FOR ALL USING (id = ANY(get_my_admin_orgs()));

-- 4. Niches policies
CREATE POLICY niche_select ON niches FOR SELECT USING (organization_id = ANY(get_my_orgs()));
CREATE POLICY niche_write_admin ON niches FOR ALL USING (organization_id = ANY(get_my_admin_orgs()));

-- 5. Brands policies
CREATE POLICY brand_select ON brands FOR SELECT USING (organization_id = ANY(get_my_orgs()));
CREATE POLICY brand_write_admin ON brands FOR ALL USING (organization_id = ANY(get_my_admin_orgs()));

-- 6. Sites policies
CREATE POLICY site_select ON sites FOR SELECT USING (organization_id = ANY(get_my_orgs()));
CREATE POLICY site_write_admin ON sites FOR ALL USING (organization_id = ANY(get_my_admin_orgs()));

-- 7. Providers policies
CREATE POLICY provider_select ON providers FOR SELECT USING (organization_id = ANY(get_my_orgs()));
CREATE POLICY provider_write_admin ON providers FOR ALL USING (organization_id = ANY(get_my_admin_orgs()));

-- 8. Monetization Configs policies
CREATE POLICY monetization_select ON monetization_configs FOR SELECT USING (organization_id = ANY(get_my_orgs()));
CREATE POLICY monetization_write_admin ON monetization_configs FOR ALL USING (organization_id = ANY(get_my_admin_orgs()));

-- 9. Hardened Secrets Policies (Standard member blocked; Admin & Agent read allowed, Admin-only write)
-- Organization secrets
CREATE POLICY org_secrets_select ON organization_secrets FOR SELECT 
    USING (organization_id = ANY(get_my_admin_orgs()) OR organization_id = ANY(get_my_agent_orgs()));
CREATE POLICY org_secrets_write ON organization_secrets FOR ALL 
    USING (organization_id = ANY(get_my_admin_orgs()));

-- Provider secrets
CREATE POLICY provider_secrets_select ON provider_secrets FOR SELECT 
    USING (organization_id = ANY(get_my_admin_orgs()) OR organization_id = ANY(get_my_agent_orgs()));
CREATE POLICY provider_secrets_write ON provider_secrets FOR ALL 
    USING (organization_id = ANY(get_my_admin_orgs()));

-- Site secrets
CREATE POLICY site_secrets_select ON site_secrets FOR SELECT 
    USING (organization_id = ANY(get_my_admin_orgs()) OR organization_id = ANY(get_my_agent_orgs()));
CREATE POLICY site_secrets_write ON site_secrets FOR ALL 
    USING (organization_id = ANY(get_my_admin_orgs()));

-- Campaign secrets
CREATE POLICY campaign_secrets_select ON campaign_secrets FOR SELECT 
    USING (organization_id = ANY(get_my_admin_orgs()) OR organization_id = ANY(get_my_agent_orgs()));
CREATE POLICY campaign_secrets_write ON campaign_secrets FOR ALL 
    USING (organization_id = ANY(get_my_admin_orgs()));

-- 10. Categories policies
CREATE POLICY category_select ON categories FOR SELECT USING (organization_id = ANY(get_my_orgs()));
CREATE POLICY category_write_admin_agent ON categories FOR ALL USING (organization_id = ANY(get_my_admin_orgs()) OR organization_id = ANY(get_my_agent_orgs()));

-- 11. Content Assets policies
CREATE POLICY content_select ON content_assets FOR SELECT USING (organization_id = ANY(get_my_orgs()));
CREATE POLICY content_write_admin_agent ON content_assets FOR ALL USING (organization_id = ANY(get_my_admin_orgs()) OR organization_id = ANY(get_my_agent_orgs()));

-- 12. Subscribers policies
CREATE POLICY subscriber_select ON subscribers FOR SELECT USING (organization_id = ANY(get_my_orgs()));
CREATE POLICY subscriber_insert_all ON subscribers FOR INSERT WITH CHECK (organization_id = ANY(get_my_orgs()) OR auth.uid() IS NOT NULL);
CREATE POLICY subscriber_write_admin_agent ON subscribers FOR ALL USING (organization_id = ANY(get_my_admin_orgs()) OR organization_id = ANY(get_my_agent_orgs()));

-- 13. Workflow Runs policies
CREATE POLICY workflow_run_select ON workflow_runs FOR SELECT USING (organization_id = ANY(get_my_orgs()));
CREATE POLICY workflow_run_write ON workflow_runs FOR ALL USING (organization_id = ANY(get_my_orgs()));

-- 14. Workflow Steps policies
CREATE POLICY workflow_step_select ON workflow_steps FOR SELECT USING (organization_id = ANY(get_my_orgs()));
CREATE POLICY workflow_step_write ON workflow_steps FOR ALL USING (organization_id = ANY(get_my_orgs()));

-- 15. Agent Executions policies
CREATE POLICY agent_execution_select ON agent_executions FOR SELECT USING (organization_id = ANY(get_my_orgs()));
CREATE POLICY agent_execution_write ON agent_executions FOR ALL USING (organization_id = ANY(get_my_orgs()));

-- 16. Dead-Letter Queue Events policies
CREATE POLICY dlq_select ON dead_letter_events FOR SELECT USING (organization_id = ANY(get_my_orgs()));
CREATE POLICY dlq_write ON dead_letter_events FOR ALL USING (organization_id = ANY(get_my_orgs()));

-- 17. System Alerts policies
CREATE POLICY alert_select ON system_alerts FOR SELECT USING (organization_id = ANY(get_my_orgs()));
CREATE POLICY alert_write ON system_alerts FOR ALL USING (organization_id = ANY(get_my_orgs()));

-- 18. Provider Requests Telemetry policies
CREATE POLICY request_telemetry_select ON provider_requests FOR SELECT USING (organization_id = ANY(get_my_orgs()));
CREATE POLICY request_telemetry_write ON provider_requests FOR ALL USING (organization_id = ANY(get_my_orgs()));

-- 19. Graph Nodes policies
CREATE POLICY graph_node_select ON graph_nodes FOR SELECT USING (organization_id = ANY(get_my_orgs()));
CREATE POLICY graph_node_write ON graph_nodes FOR ALL USING (organization_id = ANY(get_my_admin_orgs()) OR organization_id = ANY(get_my_agent_orgs()));

-- 20. Graph Edges policies
CREATE POLICY graph_edge_select ON graph_edges FOR SELECT USING (organization_id = ANY(get_my_orgs()));
CREATE POLICY graph_edge_write ON graph_edges FOR ALL USING (organization_id = ANY(get_my_admin_orgs()) OR organization_id = ANY(get_my_agent_orgs()));

-- 21. Entity Aliases policies
CREATE POLICY entity_alias_select ON entity_aliases FOR SELECT USING (organization_id = ANY(get_my_orgs()));
CREATE POLICY entity_alias_write ON entity_aliases FOR ALL USING (organization_id = ANY(get_my_admin_orgs()) OR organization_id = ANY(get_my_agent_orgs()));

-- 22. Entity Mentions policies
CREATE POLICY entity_mention_select ON entity_mentions FOR SELECT USING (organization_id = ANY(get_my_orgs()));
CREATE POLICY entity_mention_write ON entity_mentions FOR ALL USING (organization_id = ANY(get_my_admin_orgs()) OR organization_id = ANY(get_my_agent_orgs()));
