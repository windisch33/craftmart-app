-- ============================================
-- Add missing PGS stringer pricing
-- ============================================
-- PGS (Material ID 6) stringers should be priced at $3 per riser
-- This was missing from the initial data load

INSERT INTO stair_board_prices (
  brd_typ_id, 
  mat_seq_n, 
  brdlen_min, 
  brdlen_max, 
  brdwid_min, 
  brdwid_max, 
  brdthk_min,
  brdthk_max,
  unit_cost, 
  fulmit_cst,
  len_incr,
  len_cost,
  wid_incr,
  wid_cost,
  begin_date,
  end_date,
  is_active
) VALUES (
  5,           -- Board type 5 = Stringer
  6,           -- Material 6 = PGS
  0,           -- Min length
  999,         -- Max length (any length)
  9,           -- Min width 9"
  12,          -- Max width 12"
  0,           -- Min thickness
  2,           -- Max thickness
  3.00,        -- $3.00 per riser (unit cost)
  0,           -- No full mitre cost
  1,           -- Length increment
  0,           -- No length extra cost
  1,           -- Width increment
  0,           -- No width extra cost
  CURRENT_DATE,-- Begin date
  '2099-12-31',-- End date
  true         -- Active
) ON CONFLICT DO NOTHING;

-- Also ensure we have pricing for narrow landing treads (3.5" width)
-- Add box tread pricing for 3-4" width range if missing
INSERT INTO stair_board_prices (
  brd_typ_id, 
  mat_seq_n, 
  brdlen_min, 
  brdlen_max, 
  brdwid_min, 
  brdwid_max,
  brdthk_min,
  brdthk_max, 
  unit_cost, 
  fulmit_cst,
  len_incr,
  len_cost,
  wid_incr,
  wid_cost,
  begin_date,
  end_date,
  is_active
) 
SELECT 
  1,           -- Board type 1 = Box Tread
  5,           -- Material 5 = Oak (do for each material)
  36.01,       -- Min length 36"
  42,          -- Max length 42"
  3,           -- Min width 3" (for landing treads)
  4,           -- Max width 4"
  0,           -- Min thickness
  2,           -- Max thickness
  34.42,       -- Unit cost for narrow tread
  0,           -- No full mitre cost
  6,           -- Length increment
  5.00,        -- Length extra cost
  1,           -- Width increment
  2.00,        -- Width extra cost
  CURRENT_DATE,-- Begin date
  '2099-12-31',-- End date
  true         -- Active
WHERE NOT EXISTS (
  SELECT 1 FROM stair_board_prices 
  WHERE brd_typ_id = 1 
    AND mat_seq_n = 5 
    AND brdwid_min <= 3.5 
    AND brdwid_max >= 3.5
    AND brdlen_min <= 38
    AND brdlen_max >= 38
);

-- Add similar entries for other common tread lengths with 3.5" width
INSERT INTO stair_board_prices (
  brd_typ_id, mat_seq_n, brdlen_min, brdlen_max, brdwid_min, brdwid_max, brdthk_min, brdthk_max,
  unit_cost, fulmit_cst, len_incr, len_cost, wid_incr, wid_cost, begin_date, end_date, is_active
) VALUES 
  (1, 5, 0, 36, 3, 4, 0, 2, 34.42, 0, 6, 5.00, 1, 2.00, CURRENT_DATE, '2099-12-31', true),
  (1, 5, 42.01, 48, 3, 4, 0, 2, 43.08, 0, 6, 5.00, 1, 2.00, CURRENT_DATE, '2099-12-31', true),
  (1, 5, 48.01, 54, 3, 4, 0, 2, 46.21, 0, 6, 5.00, 1, 2.00, CURRENT_DATE, '2099-12-31', true)
ON CONFLICT DO NOTHING;