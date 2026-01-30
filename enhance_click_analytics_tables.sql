-- Enhanced Click Analytics Database Schema
-- This script adds enhanced tracking fields to the affiliate_clicks table

-- Add new columns to affiliate_clicks table for enhanced analytics
ALTER TABLE affiliate_clicks 
ADD COLUMN IF NOT EXISTS device_type VARCHAR(20),
ADD COLUMN IF NOT EXISTS browser VARCHAR(50),
ADD COLUMN IF NOT EXISTS location VARCHAR(100),
ADD COLUMN IF NOT EXISTS utm_source VARCHAR(100),
ADD COLUMN IF NOT EXISTS utm_medium VARCHAR(100),
ADD COLUMN IF NOT EXISTS utm_campaign VARCHAR(100),
ADD COLUMN IF NOT EXISTS page_url TEXT,
ADD COLUMN IF NOT EXISTS session_duration INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS bounce_rate BOOLEAN DEFAULT false;

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_affiliate_clicks_device_type ON affiliate_clicks(device_type);
CREATE INDEX IF NOT EXISTS idx_affiliate_clicks_browser ON affiliate_clicks(browser);
CREATE INDEX IF NOT EXISTS idx_affiliate_clicks_location ON affiliate_clicks(location);
CREATE INDEX IF NOT EXISTS idx_affiliate_clicks_utm_source ON affiliate_clicks(utm_source);
CREATE INDEX IF NOT EXISTS idx_affiliate_clicks_date ON affiliate_clicks(clicked_at);
CREATE INDEX IF NOT EXISTS idx_affiliate_clicks_converted ON affiliate_clicks(converted_to_order);

-- Create a view for enhanced click analytics
CREATE OR REPLACE VIEW enhanced_click_analytics AS
SELECT 
    ac.*,
    p.name as product_name,
    p.price as product_price,
    p.slug as product_slug,
    p.image_url as product_image,
    au.name as affiliate_name,
    au.affiliate_code,
    EXTRACT(HOUR FROM ac.clicked_at) as click_hour,
    EXTRACT(DOW FROM ac.clicked_at) as click_day_of_week,
    DATE(ac.clicked_at) as click_date,
    CASE 
        WHEN ac.converted_to_order THEN 'converted'
        ELSE 'not_converted'
    END as conversion_status
FROM affiliate_clicks ac
LEFT JOIN products p ON ac.product_id = p.id
LEFT JOIN affiliate_users au ON ac.affiliate_id = au.id;

-- Create a function to get click analytics summary
CREATE OR REPLACE FUNCTION get_click_analytics_summary(
    p_affiliate_id UUID DEFAULT NULL,
    p_start_date DATE DEFAULT NULL,
    p_end_date DATE DEFAULT NULL
)
RETURNS TABLE (
    total_clicks BIGINT,
    unique_users BIGINT,
    converted_clicks BIGINT,
    conversion_rate NUMERIC,
    top_device VARCHAR,
    top_browser VARCHAR,
    top_location VARCHAR,
    avg_daily_clicks NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    WITH filtered_clicks AS (
        SELECT *
        FROM affiliate_clicks ac
        WHERE 
            (p_affiliate_id IS NULL OR ac.affiliate_id = p_affiliate_id)
            AND (p_start_date IS NULL OR DATE(ac.clicked_at) >= p_start_date)
            AND (p_end_date IS NULL OR DATE(ac.clicked_at) <= p_end_date)
    ),
    summary_stats AS (
        SELECT 
            COUNT(*) as total_clicks,
            COUNT(DISTINCT user_session_id) as unique_users,
            COUNT(*) FILTER (WHERE converted_to_order = true) as converted_clicks,
            CASE 
                WHEN COUNT(*) > 0 THEN 
                    ROUND((COUNT(*) FILTER (WHERE converted_to_order = true)::NUMERIC / COUNT(*)) * 100, 2)
                ELSE 0 
            END as conversion_rate
        FROM filtered_clicks
    ),
    device_stats AS (
        SELECT device_type, COUNT(*) as count
        FROM filtered_clicks
        WHERE device_type IS NOT NULL
        GROUP BY device_type
        ORDER BY count DESC
        LIMIT 1
    ),
    browser_stats AS (
        SELECT browser, COUNT(*) as count
        FROM filtered_clicks
        WHERE browser IS NOT NULL
        GROUP BY browser
        ORDER BY count DESC
        LIMIT 1
    ),
    location_stats AS (
        SELECT location, COUNT(*) as count
        FROM filtered_clicks
        WHERE location IS NOT NULL
        GROUP BY location
        ORDER BY count DESC
        LIMIT 1
    ),
    daily_avg AS (
        SELECT 
            CASE 
                WHEN COUNT(DISTINCT DATE(clicked_at)) > 0 THEN
                    ROUND(COUNT(*)::NUMERIC / COUNT(DISTINCT DATE(clicked_at)), 2)
                ELSE 0
            END as avg_daily_clicks
        FROM filtered_clicks
    )
    SELECT 
        ss.total_clicks,
        ss.unique_users,
        ss.converted_clicks,
        ss.conversion_rate,
        COALESCE(ds.device_type, 'Unknown') as top_device,
        COALESCE(bs.browser, 'Unknown') as top_browser,
        COALESCE(ls.location, 'Unknown') as top_location,
        da.avg_daily_clicks
    FROM summary_stats ss
    CROSS JOIN daily_avg da
    LEFT JOIN device_stats ds ON true
    LEFT JOIN browser_stats bs ON true
    LEFT JOIN location_stats ls ON true;
END;
$$ LANGUAGE plpgsql;

-- Create a function to get hourly click distribution
CREATE OR REPLACE FUNCTION get_hourly_click_distribution(
    p_affiliate_id UUID DEFAULT NULL,
    p_date DATE DEFAULT CURRENT_DATE
)
RETURNS TABLE (
    hour_of_day INTEGER,
    click_count BIGINT,
    conversion_count BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        EXTRACT(HOUR FROM clicked_at)::INTEGER as hour_of_day,
        COUNT(*) as click_count,
        COUNT(*) FILTER (WHERE converted_to_order = true) as conversion_count
    FROM affiliate_clicks
    WHERE 
        (p_affiliate_id IS NULL OR affiliate_id = p_affiliate_id)
        AND DATE(clicked_at) = p_date
    GROUP BY EXTRACT(HOUR FROM clicked_at)
    ORDER BY hour_of_day;
END;
$$ LANGUAGE plpgsql;

-- Create a function to get top performing products
CREATE OR REPLACE FUNCTION get_top_performing_products(
    p_affiliate_id UUID DEFAULT NULL,
    p_limit INTEGER DEFAULT 10
)
RETURNS TABLE (
    product_id UUID,
    product_name VARCHAR,
    product_price NUMERIC,
    total_clicks BIGINT,
    converted_clicks BIGINT,
    conversion_rate NUMERIC,
    revenue_generated NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.id as product_id,
        p.name as product_name,
        p.price as product_price,
        COUNT(ac.id) as total_clicks,
        COUNT(ac.id) FILTER (WHERE ac.converted_to_order = true) as converted_clicks,
        CASE 
            WHEN COUNT(ac.id) > 0 THEN 
                ROUND((COUNT(ac.id) FILTER (WHERE ac.converted_to_order = true)::NUMERIC / COUNT(ac.id)) * 100, 2)
            ELSE 0 
        END as conversion_rate,
        COALESCE(SUM(CASE WHEN ac.converted_to_order THEN p.price ELSE 0 END), 0) as revenue_generated
    FROM products p
    LEFT JOIN affiliate_clicks ac ON p.id = ac.product_id
    WHERE 
        (p_affiliate_id IS NULL OR ac.affiliate_id = p_affiliate_id)
    GROUP BY p.id, p.name, p.price
    HAVING COUNT(ac.id) > 0
    ORDER BY total_clicks DESC, conversion_rate DESC
    LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;

-- Create a materialized view for daily analytics (for better performance)
CREATE MATERIALIZED VIEW IF NOT EXISTS daily_click_analytics AS
SELECT 
    DATE(clicked_at) as analytics_date,
    affiliate_id,
    COUNT(*) as total_clicks,
    COUNT(DISTINCT user_session_id) as unique_users,
    COUNT(*) FILTER (WHERE converted_to_order = true) as conversions,
    COUNT(DISTINCT product_id) as unique_products,
    COUNT(*) FILTER (WHERE device_type = 'mobile') as mobile_clicks,
    COUNT(*) FILTER (WHERE device_type = 'desktop') as desktop_clicks,
    COUNT(*) FILTER (WHERE device_type = 'tablet') as tablet_clicks,
    ROUND(AVG(CASE WHEN session_duration > 0 THEN session_duration END), 2) as avg_session_duration
FROM affiliate_clicks
GROUP BY DATE(clicked_at), affiliate_id;

-- Create index on the materialized view
CREATE UNIQUE INDEX IF NOT EXISTS idx_daily_analytics_date_affiliate 
ON daily_click_analytics(analytics_date, affiliate_id);

-- Create a function to refresh the materialized view
CREATE OR REPLACE FUNCTION refresh_daily_analytics()
RETURNS void AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY daily_click_analytics;
END;
$$ LANGUAGE plpgsql;

-- Create a trigger to automatically update click analytics when orders are placed
CREATE OR REPLACE FUNCTION update_click_conversion()
RETURNS TRIGGER AS $$
BEGIN
    -- Update affiliate clicks when an order is placed
    UPDATE affiliate_clicks 
    SET 
        converted_to_order = true,
        order_id = NEW.id
    WHERE user_session_id IN (
        SELECT user_session_id 
        FROM affiliate_clicks 
        WHERE product_id = ANY(
            SELECT product_id 
            FROM order_items 
            WHERE order_id = NEW.id
        )
        AND converted_to_order = false
        AND clicked_at >= NOW() - INTERVAL '30 days'
    );
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger (only if orders table exists)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'orders') THEN
        DROP TRIGGER IF EXISTS trigger_update_click_conversion ON orders;
        CREATE TRIGGER trigger_update_click_conversion
            AFTER INSERT ON orders
            FOR EACH ROW
            EXECUTE FUNCTION update_click_conversion();
    END IF;
END $$;

-- Grant necessary permissions
GRANT SELECT ON enhanced_click_analytics TO authenticated;
GRANT SELECT ON daily_click_analytics TO authenticated;
GRANT EXECUTE ON FUNCTION get_click_analytics_summary TO authenticated;
GRANT EXECUTE ON FUNCTION get_hourly_click_distribution TO authenticated;
GRANT EXECUTE ON FUNCTION get_top_performing_products TO authenticated;

-- Insert some sample enhanced data (for testing)
-- This would be removed in production
INSERT INTO affiliate_clicks (
    affiliate_id, 
    product_id, 
    user_session_id, 
    ip_address, 
    user_agent, 
    device_type, 
    browser, 
    location, 
    utm_source, 
    utm_medium, 
    utm_campaign,
    clicked_at
) 
SELECT 
    au.id,
    p.id,
    'sess_' || generate_random_uuid()::text,
    '192.168.1.' || (random() * 255)::int,
    'Mozilla/5.0 (compatible; TestBot/1.0)',
    CASE (random() * 3)::int 
        WHEN 0 THEN 'desktop'
        WHEN 1 THEN 'mobile'
        ELSE 'tablet'
    END,
    CASE (random() * 4)::int
        WHEN 0 THEN 'Chrome'
        WHEN 1 THEN 'Firefox'
        WHEN 2 THEN 'Safari'
        ELSE 'Edge'
    END,
    CASE (random() * 5)::int
        WHEN 0 THEN 'Mumbai, India'
        WHEN 1 THEN 'Delhi, India'
        WHEN 2 THEN 'Bangalore, India'
        WHEN 3 THEN 'Chennai, India'
        ELSE 'Kolkata, India'
    END,
    CASE (random() * 3)::int
        WHEN 0 THEN 'google'
        WHEN 1 THEN 'facebook'
        ELSE 'direct'
    END,
    CASE (random() * 3)::int
        WHEN 0 THEN 'cpc'
        WHEN 1 THEN 'social'
        ELSE 'organic'
    END,
    'sample_campaign_' || (random() * 10)::int,
    NOW() - (random() * INTERVAL '30 days')
FROM affiliate_users au
CROSS JOIN products p
WHERE au.is_active = true
LIMIT 100;

-- Refresh the materialized view
SELECT refresh_daily_analytics();

COMMENT ON TABLE affiliate_clicks IS 'Enhanced affiliate click tracking with device, browser, location and UTM data';
COMMENT ON VIEW enhanced_click_analytics IS 'Comprehensive view of click analytics with product and affiliate details';
COMMENT ON MATERIALIZED VIEW daily_click_analytics IS 'Daily aggregated click analytics for performance optimization';
COMMENT ON FUNCTION get_click_analytics_summary IS 'Get comprehensive click analytics summary with filters';
COMMENT ON FUNCTION get_hourly_click_distribution IS 'Get hourly distribution of clicks for a specific date';
COMMENT ON FUNCTION get_top_performing_products IS 'Get top performing products by click and conversion metrics';