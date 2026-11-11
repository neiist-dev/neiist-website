-- Game domain
-- Depends on: 10_users (users)

-- ===== TABLES =====

-- GAME SCORE
CREATE TABLE neiist.game_score (
  user_istid VARCHAR(10) PRIMARY KEY REFERENCES neiist.users(istid),
  best_score INT NOT NULL CHECK (best_score >= 0),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ===== INDEXES =====

CREATE INDEX idx_game_score_leaderboard ON neiist.game_score(best_score DESC);

-- ===== FUNCTIONS =====

-- Get Game Best Score for User
CREATE OR REPLACE FUNCTION neiist.get_game_best_score(
  p_user_istid VARCHAR(10)
) RETURNS INT LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT COALESCE(
    (SELECT best_score FROM neiist.game_score WHERE user_istid = p_user_istid),
    0
  );
$$;

-- Submit Game Best Score
CREATE OR REPLACE FUNCTION neiist.submit_game_score(
  p_user_istid VARCHAR(10),
  p_score INT
) RETURNS INT LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO neiist.game_score (user_istid, best_score)
  VALUES (p_user_istid, p_score)
  ON CONFLICT (user_istid) DO UPDATE
    SET best_score = EXCLUDED.best_score,
        updated_at = NOW()
    WHERE EXCLUDED.best_score > neiist.game_score.best_score;

  RETURN neiist.get_game_best_score(p_user_istid);
END;
$$;
