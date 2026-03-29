-- Team Pulse – Supabase Schema v2 (self-service)
-- Run this in the Supabase SQL Editor

-- ─── Teams ──────────────────────────────────────────────
CREATE TABLE teams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  leader_name TEXT NOT NULL,
  leader_email TEXT NOT NULL,
  token UUID UNIQUE DEFAULT gen_random_uuid(),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'complete')),
  insights TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── Team members (invited via email) ───────────────────
CREATE TABLE team_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  name TEXT,
  token UUID UNIQUE DEFAULT gen_random_uuid(),
  completed BOOLEAN DEFAULT false,
  completed_at TIMESTAMPTZ,
  UNIQUE(team_id, email)
);

-- ─── Survey responses ───────────────────────────────────
CREATE TABLE responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
  member_name TEXT NOT NULL,
  submitted_at TIMESTAMPTZ DEFAULT NOW(),

  -- Dimension 1: Psychological Safety (Edmondson)
  ps_1 INT CHECK (ps_1 BETWEEN 1 AND 7),
  ps_2 INT CHECK (ps_2 BETWEEN 1 AND 7),
  ps_3 INT CHECK (ps_3 BETWEEN 1 AND 7),
  ps_4 INT CHECK (ps_4 BETWEEN 1 AND 7),
  ps_5 INT CHECK (ps_5 BETWEEN 1 AND 7),
  ps_6 INT CHECK (ps_6 BETWEEN 1 AND 7),
  ps_7 INT CHECK (ps_7 BETWEEN 1 AND 7),
  ps_8 INT CHECK (ps_8 BETWEEN 1 AND 7),
  ps_open TEXT,

  -- Dimension 2: Team Roles & Effectiveness (Hackman)
  tr_1 INT CHECK (tr_1 BETWEEN 1 AND 7),
  tr_2 INT CHECK (tr_2 BETWEEN 1 AND 7),
  tr_3 INT CHECK (tr_3 BETWEEN 1 AND 7),
  tr_4 INT CHECK (tr_4 BETWEEN 1 AND 7),
  tr_5 INT CHECK (tr_5 BETWEEN 1 AND 7),
  tr_6 INT CHECK (tr_6 BETWEEN 1 AND 7),
  tr_7 INT CHECK (tr_7 BETWEEN 1 AND 7),
  tr_8 INT CHECK (tr_8 BETWEEN 1 AND 7),
  tr_open TEXT,

  -- Dimension 3: Values & Culture Fit (Schwartz)
  vc_1 INT CHECK (vc_1 BETWEEN 1 AND 7),
  vc_2 INT CHECK (vc_2 BETWEEN 1 AND 7),
  vc_3 INT CHECK (vc_3 BETWEEN 1 AND 7),
  vc_4 INT CHECK (vc_4 BETWEEN 1 AND 7),
  vc_5 INT CHECK (vc_5 BETWEEN 1 AND 7),
  vc_6 INT CHECK (vc_6 BETWEEN 1 AND 7),
  vc_7 INT CHECK (vc_7 BETWEEN 1 AND 7),
  vc_8 INT CHECK (vc_8 BETWEEN 1 AND 7),
  vc_open TEXT,

  -- Dimension 4: Conflict & Communication (Thomas-Kilmann)
  cc_1 INT CHECK (cc_1 BETWEEN 1 AND 7),
  cc_2 INT CHECK (cc_2 BETWEEN 1 AND 7),
  cc_3 INT CHECK (cc_3 BETWEEN 1 AND 7),
  cc_4 INT CHECK (cc_4 BETWEEN 1 AND 7),
  cc_5 INT CHECK (cc_5 BETWEEN 1 AND 7),
  cc_6 INT CHECK (cc_6 BETWEEN 1 AND 7),
  cc_7 INT CHECK (cc_7 BETWEEN 1 AND 7),
  cc_8 INT CHECK (cc_8 BETWEEN 1 AND 7),
  cc_open TEXT,

  -- Dimension 5: Strengths & Growth Focus (VIA)
  sg_1 INT CHECK (sg_1 BETWEEN 1 AND 7),
  sg_2 INT CHECK (sg_2 BETWEEN 1 AND 7),
  sg_3 INT CHECK (sg_3 BETWEEN 1 AND 7),
  sg_4 INT CHECK (sg_4 BETWEEN 1 AND 7),
  sg_5 INT CHECK (sg_5 BETWEEN 1 AND 7),
  sg_6 INT CHECK (sg_6 BETWEEN 1 AND 7),
  sg_7 INT CHECK (sg_7 BETWEEN 1 AND 7),
  sg_8 INT CHECK (sg_8 BETWEEN 1 AND 7),
  sg_open TEXT
);

-- ─── Row Level Security ─────────────────────────────────
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE responses ENABLE ROW LEVEL SECURITY;

-- Teams: public CRUD (token provides access control)
CREATE POLICY "Public read teams" ON teams FOR SELECT USING (true);
CREATE POLICY "Public insert teams" ON teams FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update teams" ON teams FOR UPDATE USING (true);

-- Team members: public CRUD
CREATE POLICY "Public read team_members" ON team_members FOR SELECT USING (true);
CREATE POLICY "Public insert team_members" ON team_members FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update team_members" ON team_members FOR UPDATE USING (true);

-- Responses: public read/insert
CREATE POLICY "Public insert responses" ON responses FOR INSERT WITH CHECK (true);
CREATE POLICY "Public read responses" ON responses FOR SELECT USING (true);
