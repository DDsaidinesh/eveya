import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface VerifyCardRequest {
  cardNumber: string;
}

interface RechargeCardRequest {
  cardId: string;
  amount: number;
  paymentMethod: string;
  paymentReference?: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Create Supabase client with service role for secure operations
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    const url = new URL(req.url);
    const operation = url.searchParams.get("operation");

    switch (operation) {
      case "verify": {
        const { cardNumber }: VerifyCardRequest = await req.json();
        
        // Verify RFID card exists and get details
        const { data: card, error } = await supabaseClient
          .from("rfid_cards")
          .select("*")
          .eq("card_number", cardNumber)
          .eq("status", "active")
          .maybeSingle();

        if (error) {
          return new Response(
            JSON.stringify({ error: "Database error", details: error.message }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        if (!card) {
          return new Response(
            JSON.stringify({ 
              verified: false, 
              message: "Card not found or inactive" 
            }),
            { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        return new Response(
          JSON.stringify({
            verified: true,
            card: {
              id: card.id,
              cardNumber: card.card_number,
              billId: card.bill_id,
              balance: card.balance,
              status: card.status,
            }
          }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      case "recharge": {
        const { cardId, amount, paymentMethod, paymentReference }: RechargeCardRequest = await req.json();

        // Get current card details
        const { data: card, error: cardError } = await supabaseClient
          .from("rfid_cards")
          .select("*")
          .eq("id", cardId)
          .eq("status", "active")
          .maybeSingle();

        if (cardError || !card) {
          return new Response(
            JSON.stringify({ error: "Card not found or inactive" }),
            { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        const balanceBefore = card.balance || 0;
        const balanceAfter = balanceBefore + amount;

        // Start transaction
        const { data: transaction, error: transactionError } = await supabaseClient
          .from("rfid_transactions")
          .insert({
            rfid_card_id: cardId,
            user_id: card.user_id,
            transaction_type: "recharge",
            amount: amount,
            balance_before: balanceBefore,
            balance_after: balanceAfter,
            description: `Recharge via ${paymentMethod}`,
            payment_method: paymentMethod,
            payment_reference: paymentReference,
          })
          .select()
          .single();

        if (transactionError) {
          return new Response(
            JSON.stringify({ error: "Failed to create transaction", details: transactionError.message }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        // Update card balance
        const { error: updateError } = await supabaseClient
          .from("rfid_cards")
          .update({
            balance: balanceAfter,
            last_transaction_date: new Date().toISOString(),
          })
          .eq("id", cardId);

        if (updateError) {
          return new Response(
            JSON.stringify({ error: "Failed to update card balance", details: updateError.message }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        return new Response(
          JSON.stringify({
            success: true,
            transaction: {
              id: transaction.id,
              amount: amount,
              balanceBefore: balanceBefore,
              balanceAfter: balanceAfter,
              paymentMethod: paymentMethod,
              createdAt: transaction.created_at,
            }
          }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      case "issue": {
        // Get authenticated user from request
        const authHeader = req.headers.get("Authorization");
        if (!authHeader) {
          return new Response(
            JSON.stringify({ error: "Authentication required" }),
            { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        const token = authHeader.replace("Bearer ", "");
        const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
        
        if (userError || !userData.user) {
          return new Response(
            JSON.stringify({ error: "Invalid authentication" }),
            { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        // Generate unique card number and bill ID
        const cardNumber = `RFID${Date.now()}${Math.floor(Math.random() * 1000)}`;
        const billId = `qr_${Date.now()}_${Math.floor(Math.random() * 10000)}`;

        // Create new RFID card
        const { data: newCard, error: createError } = await supabaseClient
          .from("rfid_cards")
          .insert({
            user_id: userData.user.id,
            card_number: cardNumber,
            bill_id: billId,
            balance: 0,
            status: "active",
          })
          .select()
          .single();

        if (createError) {
          return new Response(
            JSON.stringify({ error: "Failed to create card", details: createError.message }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        return new Response(
          JSON.stringify({
            success: true,
            card: {
              id: newCard.id,
              cardNumber: newCard.card_number,
              billId: newCard.bill_id,
              balance: newCard.balance,
              status: newCard.status,
            }
          }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      default:
        return new Response(
          JSON.stringify({ error: "Invalid operation" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    }
  } catch (error) {
    console.error("Error in rfid-operations function:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error", details: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});