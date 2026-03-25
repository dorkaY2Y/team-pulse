-- Team Pulse by Y2Y – Supabase Schema
-- Run this in the Supabase SQL Editor

-- Table: teams
CREATE TABLE teams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  admin_note TEXT
);

-- Table: responses
CREATE TABLE responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID REFERENCES teams(id),
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

  -- Dimension 4: Conflict & Communication Style (Thomas-Kilmann)
  cc_1 INT CHECK (cc_1 BETWEEN 1 AND 7),
  cc_2 INT CHECK (cc_2 BETWEEN 1 AND 7),
  cc_3 INT CHECK (cc_3 BETWEEN 1 AND 7),
  cc_4 INT CHECK (cc_4 BETWEEN 1 AND 7),
  cc_5 INT CHECK (cc_5 BETWEEN 1 AND 7),
  cc_6 INT CHECK (cc_6 BETWEEN 1 AND 7),
  cc_7 INT CHECK (cc_7 BETWEEN 1 AND 7),
  cc_8 INT CHECK (cc_8 BETWEEN 1 AND 7),
  cc_open TEXT,

  -- Dimension 5: Strengths & Growth Focus (VIA / Strengths-based)
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

-- Enable Row Level Security
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE responses ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read teams (needed for survey link to resolve team name)
CREATE POLICY "Public read teams" ON teams FOR SELECT USING (true);

-- Allow anyone to insert responses (survey submissions)
CREATE POLICY "Public insert responses" ON responses FOR INSERT WITH CHECK (true);

-- Allow anyone to read responses (admin reads via anon key – protected by password in JS)
CREATE POLICY "Public read responses" ON responses FOR SELECT USING (true);

-- Allow anyone to insert teams (admin creates teams)
CREATE POLICY "Public insert teams" ON teams FOR INSERT WITH CHECK (true);
