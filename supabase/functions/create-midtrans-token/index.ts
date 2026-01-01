
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
            // Supabase API URL - Env var automatically populated by Supabase
            Deno.env.get('SUPABASE_URL') ?? '',
            // Supabase Anon Key - Env var automatically populated by Supabase
            Deno.env.get('SUPABASE_ANON_KEY') ?? '',
            // Create client with Auth context of the user that called the function
            { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
        )

        // Get request body
        const { orderId, grossAmount, items, customerDetails, paymentSettings } = await req.json()

        // Validate inputs
        if (!orderId || !grossAmount || !paymentSettings) {
            throw new Error('Missing required fields: orderId, grossAmount, paymentSettings')
        }

        // Determine Server Key based on mode
        const serverKey = paymentSettings.mode === 'sandbox'
            ? paymentSettings.sandbox_server_key
            : paymentSettings.prod_server_key;

        if (!serverKey) {
            throw new Error('Server Key not found for the selected mode');
        }

        // Midtrans API URL
        const isSandbox = paymentSettings.mode === 'sandbox';
        const apiUrl = isSandbox
            ? 'https://app.sandbox.midtrans.com/snap/v1/transactions'
            : 'https://app.midtrans.com/snap/v1/transactions';

        // Create Payload
        const payload = {
            transaction_details: {
                order_id: orderId,
                gross_amount: Math.round(grossAmount), // Ensure integer
            },
            credit_card: {
                secure: true
            },
            item_details: items,
            customer_details: customerDetails,
            expiry: {
                unit: "minutes",
                duration: 60
            }
        };

        // Call Midtrans API
        const authString = btoa(serverKey + ':');
        const midtransResponse = await fetch(apiUrl, {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                'Authorization': `Basic ${authString}`
            },
            body: JSON.stringify(payload)
        });

        const midtransData = await midtransResponse.json();

        if (!midtransResponse.ok) {
            console.error('Midtrans Error:', midtransData);
            throw new Error(midtransData.error_messages ? midtransData.error_messages[0] : 'Failed to create transaction');
        }

        // Return the token
        return new Response(
            JSON.stringify({ token: midtransData.token, redirect_url: midtransData.redirect_url }),
            {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 200,
            }
        )

    } catch (error) {
        console.error(error)
        return new Response(
            JSON.stringify({ error: error.message }),
            {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 400,
            }
        )
    }
})
