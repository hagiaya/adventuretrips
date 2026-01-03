import { supabase } from '../lib/supabaseClient';

/**
 * Send WhatsApp message using Fonnte API
 * @param {string} target - Recipient phone number (e.g. 628123456789)
 * @param {string} message - Message content
 */
export const sendWhatsApp = async (target, message) => {
    try {
        // 1. Fetch Fonnte Token from settings
        const { data: settings, error: settingsError } = await supabase
            .from('payment_settings')
            .select('whatsapp_token')
            .single();

        if (settingsError || !settings?.whatsapp_token) {
            console.error("WhatsApp Token not found in settings");
            return { success: false, error: "Token WhatsApp belum diatur di Pengaturan Pembayaran" };
        }

        // 2. Prepare Fonnte Request
        // Ensure phone number starts with 62 or appropriate country code
        let formattedTarget = target.replace(/[^0-9]/g, '');
        if (formattedTarget.startsWith('0')) {
            formattedTarget = '62' + formattedTarget.slice(1);
        }

        const formData = new FormData();
        formData.append('target', formattedTarget);
        formData.append('message', message);
        formData.append('delay', '2'); // Optional: delay between messages if bulk

        const response = await fetch('https://api.fonnte.com/send', {
            method: 'POST',
            headers: {
                'Authorization': settings.whatsapp_token
            },
            body: formData
        });

        const result = await response.json();

        if (result.status) {
            return { success: true, data: result };
        } else {
            return { success: false, error: result.reason || "Gagal mengirim pesan" };
        }
    } catch (error) {
        console.error("WhatsApp API Error:", error);
        return { success: false, error: error.message };
    }
};
