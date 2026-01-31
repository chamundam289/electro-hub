-- Create notification logs table for tracking sent notifications
CREATE TABLE IF NOT EXISTS public.notification_logs (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    type VARCHAR(20) NOT NULL CHECK (type IN ('email', 'sms', 'push', 'whatsapp')),
    recipient VARCHAR(255) NOT NULL,
    subject VARCHAR(500),
    message TEXT NOT NULL,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed', 'delivered', 'bounced')),
    
    -- Metadata
    template VARCHAR(100),
    data JSONB,
    error_message TEXT,
    
    -- Tracking
    sent_at TIMESTAMP WITH TIME ZONE,
    delivered_at TIMESTAMP WITH TIME ZONE,
    opened_at TIMESTAMP WITH TIME ZONE,
    clicked_at TIMESTAMP WITH TIME ZONE,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_notification_logs_type ON public.notification_logs(type);
CREATE INDEX IF NOT EXISTS idx_notification_logs_recipient ON public.notification_logs(recipient);
CREATE INDEX IF NOT EXISTS idx_notification_logs_status ON public.notification_logs(status);
CREATE INDEX IF NOT EXISTS idx_notification_logs_sent_at ON public.notification_logs(sent_at);
CREATE INDEX IF NOT EXISTS idx_notification_logs_template ON public.notification_logs(template);

-- Disable RLS for development
ALTER TABLE public.notification_logs DISABLE ROW LEVEL SECURITY;

-- Grant permissions
GRANT ALL ON public.notification_logs TO authenticated, anon, service_role;

-- Add some sample notification logs
INSERT INTO public.notification_logs (
    type, recipient, subject, message, status, template, sent_at
) VALUES 
(
    'email', 
    'customer@example.com', 
    '🎉 Special Coupon Just for You: WELCOME50',
    'Dear Valued Customer, You have received a special coupon...',
    'sent',
    'coupon_distribution',
    now()
),
(
    'sms',
    '+91XXXXXXXXXX',
    NULL,
    '🎉 Special Coupon for You! Code: SAVE20 Get 20% OFF on orders ₹1000+',
    'sent',
    'coupon_distribution',
    now()
),
(
    'email',
    'vip@example.com',
    'Order Confirmed: #INV-2024-001',
    'Thank you for your order! Order Details: Order ID: INV-2024-001...',
    'delivered',
    'order_confirmation',
    now() - interval '1 day'
) ON CONFLICT DO NOTHING;

COMMENT ON TABLE public.notification_logs IS 'Logs all notifications sent to customers via email, SMS, push, etc.';
COMMENT ON COLUMN public.notification_logs.type IS 'Type of notification: email, sms, push, whatsapp';
COMMENT ON COLUMN public.notification_logs.recipient IS 'Email address or phone number of recipient';
COMMENT ON COLUMN public.notification_logs.template IS 'Template used for the notification';
COMMENT ON COLUMN public.notification_logs.data IS 'Additional data passed to the notification template';