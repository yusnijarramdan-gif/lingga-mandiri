-- ========================================================================
-- SKEMA DATABASE LINGGA MANDIRI FARM (SUPABASE / POSTGRESQL)
-- Sistem Manajemen Usaha Peternakan Ayam Petelur & Konversi Modal Otomatis
-- ========================================================================

-- Enable UUID extension jika belum aktif
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ------------------------------------------------------------------------
-- 1. TABEL: farms (Profil Peternakan)
-- ------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.farms (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL DEFAULT 'Lingga Mandiri Farm',
    owner_name VARCHAR(255) NOT NULL DEFAULT 'H. Sudirman',
    location TEXT NOT NULL DEFAULT 'Blitar, Jawa Timur',
    initial_stock NUMERIC(12, 2) NOT NULL DEFAULT 305.00, -- Stok telur awal dalam KG
    productive_chickens INTEGER NOT NULL DEFAULT 920,      -- Standar populasi ayam bertelur
    total_chickens INTEGER NOT NULL DEFAULT 1000,          -- Total populasi ayam kandang
    logo_url TEXT,                                         -- URL atau base64 logo peternakan
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ------------------------------------------------------------------------
-- 2. TABEL: chickens (Populasi Ayam)
-- ------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.chickens (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    farm_id UUID NOT NULL REFERENCES public.farms(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    quantity INTEGER NOT NULL,               -- Total populasi hari itu
    productive_quantity INTEGER NOT NULL,    -- Ayam produktif (aktif bertelur)
    dead_quantity INTEGER NOT NULL DEFAULT 0, -- Ayam mati
    culled_quantity INTEGER NOT NULL DEFAULT 0, -- Ayam afkir / dipisahkan
    incoming_quantity INTEGER NOT NULL DEFAULT 0, -- Ayam baru masuk (bibit)
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_chickens_farm_date ON public.chickens(farm_id, date DESC);

-- ------------------------------------------------------------------------
-- 3. TABEL: egg_harvests (Panen Telur: Grade A, B, Reject & Total)
-- ------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.egg_harvests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    farm_id UUID NOT NULL REFERENCES public.farms(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    productive_chickens INTEGER NOT NULL, -- Ayam produktif saat panen
    grade_a_weight NUMERIC(10, 2) DEFAULT 0.00,  -- Telur Grade A (KG)
    grade_b_weight NUMERIC(10, 2) DEFAULT 0.00,  -- Telur Grade B (KG)
    reject_weight NUMERIC(10, 2) DEFAULT 0.00,   -- Telur retak / rusak / reject (KG)
    total_weight NUMERIC(10, 2) NOT NULL,        -- Total berat panen telur (KG)
    unit VARCHAR(20) NOT NULL DEFAULT 'KG',
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_harvests_farm_date ON public.egg_harvests(farm_id, date DESC);

-- ------------------------------------------------------------------------
-- 4. TABEL: sales (Transaksi Penjualan Telur)
-- ------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.sales (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    farm_id UUID NOT NULL REFERENCES public.farms(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    customer_name VARCHAR(255),              -- Opsional jika ada
    quantity NUMERIC(10, 2) NOT NULL,        -- Jumlah telur yang dijual (KG)
    unit VARCHAR(20) NOT NULL DEFAULT 'KG',
    unit_price NUMERIC(12, 2) NOT NULL,      -- Harga satuan (Rp / KG)
    total NUMERIC(14, 2) NOT NULL,           -- Total nilai penjualan (quantity * unit_price)
    payment_status VARCHAR(50) NOT NULL DEFAULT 'Lunas', -- 'Lunas', 'Belum Lunas', 'Sebagian'
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sales_farm_date ON public.sales(farm_id, date DESC);

-- ------------------------------------------------------------------------
-- 5. TABEL: expenses (Pengeluaran Operasional)
-- ------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.expenses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    farm_id UUID NOT NULL REFERENCES public.farms(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    category VARCHAR(100) NOT NULL, -- 'Pakan', 'Pembelian Ayam', 'Upah', 'Listrik', 'Air', 'Vitamin', 'Vaksin', 'Transportasi', 'Perawatan', 'Lainnya'
    description TEXT NOT NULL,
    amount NUMERIC(14, 2) NOT NULL, -- Nominal pengeluaran (Rp)
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_expenses_farm_date ON public.expenses(farm_id, date DESC);

-- ------------------------------------------------------------------------
-- 6. TABEL: profit_allocations (Alokasi Modal Operasional dari Keuntungan)
-- ------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.profit_allocations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    farm_id UUID NOT NULL REFERENCES public.farms(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    profit NUMERIC(14, 2) NOT NULL,           -- Total keuntungan yang dikonversi (Rp)
    feed_amount NUMERIC(14, 2) NOT NULL,       -- Alokasi Pakan (63%)
    chicken_amount NUMERIC(14, 2) NOT NULL,    -- Alokasi Pembelian Ayam (20%)
    labor_amount NUMERIC(14, 2) NOT NULL,      -- Alokasi Upah Tenaga Kerja (12%)
    electricity_amount NUMERIC(14, 2) NOT NULL,-- Alokasi Listrik (0.5%)
    water_amount NUMERIC(14, 2) NOT NULL,      -- Alokasi Air (1%)
    vitamin_amount NUMERIC(14, 2) NOT NULL,    -- Alokasi Vitamin & Vaksin (3.5%)
    feed_percentage NUMERIC(5, 2) NOT NULL DEFAULT 63.00,
    chicken_percentage NUMERIC(5, 2) NOT NULL DEFAULT 20.00,
    labor_percentage NUMERIC(5, 2) NOT NULL DEFAULT 12.00,
    electricity_percentage NUMERIC(5, 2) NOT NULL DEFAULT 0.50,
    water_percentage NUMERIC(5, 2) NOT NULL DEFAULT 1.00,
    vitamin_percentage NUMERIC(5, 2) NOT NULL DEFAULT 3.50,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_allocations_farm_date ON public.profit_allocations(farm_id, date DESC);

-- ------------------------------------------------------------------------
-- 7. TABEL: allocation_settings (Persentase Default Alokasi Modal)
-- ------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.allocation_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    farm_id UUID NOT NULL REFERENCES public.farms(id) ON DELETE CASCADE UNIQUE,
    feed_percentage NUMERIC(5, 2) NOT NULL DEFAULT 63.00,        -- Pakan: 63%
    chicken_percentage NUMERIC(5, 2) NOT NULL DEFAULT 20.00,     -- Ayam: 20%
    labor_percentage NUMERIC(5, 2) NOT NULL DEFAULT 12.00,       -- Upah: 12%
    electricity_percentage NUMERIC(5, 2) NOT NULL DEFAULT 0.50,  -- Listrik: 0.5%
    water_percentage NUMERIC(5, 2) NOT NULL DEFAULT 1.00,        -- Air: 1%
    vitamin_percentage NUMERIC(5, 2) NOT NULL DEFAULT 3.50,      -- Vitamin & Vaksin: 3.5%
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_total_percentage CHECK (
        feed_percentage + chicken_percentage + labor_percentage +
        electricity_percentage + water_percentage + vitamin_percentage = 100.00
    )
);

-- ========================================================================
-- VIEW KALKULASI REAL-TIME: STOK TELUR & SALDO KEUNTUNGAN
-- ========================================================================

-- View Stok Telur Real-Time
CREATE OR REPLACE VIEW public.v_realtime_egg_stock AS
SELECT 
    f.id AS farm_id,
    f.name AS farm_name,
    f.initial_stock,
    COALESCE(SUM(h.total_weight), 0) AS total_harvest_kg,
    COALESCE(SUM(s.quantity), 0) AS total_sold_kg,
    GREATEST(0, f.initial_stock + COALESCE(SUM(h.total_weight), 0) - COALESCE(SUM(s.quantity), 0)) AS current_stock_kg
FROM public.farms f
LEFT JOIN public.egg_harvests h ON f.id = h.farm_id
LEFT JOIN public.sales s ON f.id = s.farm_id
GROUP BY f.id, f.name, f.initial_stock;

-- View Saldo Keuntungan & Modal Real-Time
CREATE OR REPLACE VIEW public.v_realtime_profit_balance AS
SELECT
    f.id AS farm_id,
    f.name AS farm_name,
    COALESCE((SELECT SUM(total) FROM public.sales WHERE farm_id = f.id), 0) AS total_omzet,
    COALESCE((SELECT SUM(amount) FROM public.expenses WHERE farm_id = f.id), 0) AS total_expenses,
    (COALESCE((SELECT SUM(total) FROM public.sales WHERE farm_id = f.id), 0) - 
     COALESCE((SELECT SUM(amount) FROM public.expenses WHERE farm_id = f.id), 0)) AS total_net_profit,
    COALESCE((SELECT SUM(profit) FROM public.profit_allocations WHERE farm_id = f.id), 0) AS total_allocated_to_capital,
    GREATEST(0, 
        (COALESCE((SELECT SUM(total) FROM public.sales WHERE farm_id = f.id), 0) - 
         COALESCE((SELECT SUM(amount) FROM public.expenses WHERE farm_id = f.id), 0)) - 
        COALESCE((SELECT SUM(profit) FROM public.profit_allocations WHERE farm_id = f.id), 0)
    ) AS remaining_profit_balance
FROM public.farms f;

-- ========================================================================
-- SEED DATA AWAL (Lingga Mandiri Farm)
-- ========================================================================
INSERT INTO public.farms (id, name, owner_name, location, initial_stock, productive_chickens, total_chickens)
VALUES ('00000000-0000-0000-0000-000000000001', 'Lingga Mandiri Farm', 'H. Sudirman', 'Blitar, Jawa Timur', 305.00, 920, 1000)
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.allocation_settings (farm_id, feed_percentage, chicken_percentage, labor_percentage, electricity_percentage, water_percentage, vitamin_percentage)
VALUES ('00000000-0000-0000-0000-000000000001', 63.00, 20.00, 12.00, 0.50, 1.00, 3.50)
ON CONFLICT (farm_id) DO NOTHING;
