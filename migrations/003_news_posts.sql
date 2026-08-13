CREATE TABLE IF NOT EXISTS news_posts (
  id VARCHAR(64) PRIMARY KEY,
  title VARCHAR(500) NOT NULL,
  body TEXT,
  link_url TEXT,
  emoji VARCHAR(16) DEFAULT '📢',
  season_id VARCHAR(64),
  is_active TINYINT(1) DEFAULT 1,
  react_fire INT DEFAULT 0,
  react_thumb INT DEFAULT 0,
  published_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
