import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { orderData, couponCode } = await req.json()

    // Validate required fields
    if (!orderData || !orderData.total_amount) {
      return new Response(
        JSON.stringify({ error: 'Invalid order data' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    let affiliateId = null
    let discountAmount = 0
    let discountType = ''

    // Validate and apply coupon if provided
    if (couponCode) {
      const { data: couponValidation, error: couponError } = await supabaseClient
        .rpc('validate_and_apply_coupon', {
          coupon_code_param: couponCode,
          order_amount: orderData.total_amount
        })

      if (couponError) {
        return new Response(
          JSON.stringify({ error: 'Failed to validate coupon' }),
          { 
            status: 400, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        )
      }

      const validation = couponValidation[0]
      if (!validation.is_valid) {
        return new Response(
          JSON.stringify({ error: validation.error_message }),
          { 
            status: 400, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        )
      }

      affiliateId = validation.affiliate_id
      discountAmount = validation.discount_amount
      discountType = validation.discount_type

      // Update coupon usage count
      await supabaseClient
        .from('affiliate_coupons')
        .update({ used_count: supabaseClient.sql`used_count + 1` })
        .eq('coupon_code', couponCode)
    }

    // Generate invoice number
    const invoiceNumber = await generateInvoiceNumber(supabaseClient)

    // Create the order with affiliate tracking
    const orderInsertData = {
      ...orderData,
      invoice_number: invoiceNumber,
      coupon_code: couponCode || null,
      affiliate_id: affiliateId,
      discount_type: discountType || null,
      coupon_discount: discountAmount,
      total_amount: orderData.total_amount - discountAmount,
      status: 'pending'
    }

    const { data: order, error: orderError } = await supabaseClient
      .from('orders')
      .insert(orderInsertData)
      .select()
      .single()

    if (orderError) {
      console.error('Error creating order:', orderError)
      return new Response(
        JSON.stringify({ error: 'Failed to create order' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Update affiliate click conversion if applicable
    if (affiliateId && couponCode) {
      await supabaseClient
        .from('affiliate_clicks')
        .update({ 
          converted: true, 
          order_id: order.id 
        })
        .eq('affiliate_id', affiliateId)
        .eq('coupon_code', couponCode)
        .is('order_id', null)
        .order('clicked_at', { ascending: false })
        .limit(1)
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        order: order,
        message: 'Order created successfully'
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Error in process-order function:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})

async function generateInvoiceNumber(supabaseClient: any): Promise<string> {
  const today = new Date()
  const year = today.getFullYear()
  const month = String(today.getMonth() + 1).padStart(2, '0')
  const prefix = `INV-${year}${month}-`

  // Get the last invoice number for this month
  const { data: lastOrder } = await supabaseClient
    .from('orders')
    .select('invoice_number')
    .like('invoice_number', `${prefix}%`)
    .order('created_at', { ascending: false })
    .limit(1)

  let nextNumber = 1
  if (lastOrder && lastOrder.length > 0) {
    const lastNumber = parseInt(lastOrder[0].invoice_number.split('-')[2])
    nextNumber = lastNumber + 1
  }

  return `${prefix}${String(nextNumber).padStart(4, '0')}`
}