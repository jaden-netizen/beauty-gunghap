-- beauty_gunghap DB 초기화
-- psql -U postgres -f init_db.sql 으로 실행

CREATE DATABASE beauty_gunghap;

\c beauty_gunghap

CREATE TABLE IF NOT EXISTS hospitals (
  id              SERIAL PRIMARY KEY,
  name            VARCHAR(200) NOT NULL,
  license_date    DATE NOT NULL,
  address         VARCHAR(300),
  district        VARCHAR(20),
  zip_code        VARCHAR(10),
  phone           VARCHAR(30),
  institution_type VARCHAR(50),
  specialties     VARCHAR(200),
  doctor_count    INT DEFAULT 0,
  area            FLOAT,
  coord_x         FLOAT,
  coord_y         FLOAT,
  naver_map_url   VARCHAR(500),
  naver_place_id  VARCHAR(50),
  created_at      TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_hospitals_district    ON hospitals(district);
CREATE INDEX IF NOT EXISTS idx_hospitals_specialties ON hospitals(specialties);
CREATE INDEX IF NOT EXISTS idx_hospitals_license     ON hospitals(license_date);
CREATE INDEX IF NOT EXISTS idx_hospitals_name        ON hospitals USING gin(to_tsvector('simple', name));
