import { supabase } from '../lib/supabaseClient';
import { sendWhatsApp } from './whatsapp';

/**
 * Request a balance withdrawal
 */
export const requestWithdrawal = async (userId, amount, bankData) => {
    try {
        // 1. Check current balance
        const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('balance, full_name, phone')
            .eq('id', userId)
            .single();

        if (profileError) throw profileError;

        if (profile.balance < amount) {
            return { success: false, error: "Saldo tidak mencukupi." };
        }

        // 2. Create withdrawal record
        const { data: withdrawal, error: withdrawError } = await supabase
            .from('withdrawals')
            .insert([{
                user_id: userId,
                amount: amount,
                bank_name: bankData.bank_name,
                account_number: bankData.account_number,
                account_holder: bankData.account_holder,
                status: 'pending'
            }])
            .select()
            .single();

        if (withdrawError) throw withdrawError;

        // 3. Deduct balance from profile immediately
        const { error: updateError } = await supabase
            .from('profiles')
            .update({ balance: profile.balance - amount })
            .eq('id', userId);

        if (updateError) throw updateError;

        // 4. Send WhatsApp Notification to User
        const waMessage = `Halo ${profile.full_name}! 👋\n\nPermintaan penarikan saldo kamu sebesar *Rp ${amount.toLocaleString('id-ID')}* sedang kami proses.\n\nMohon tunggu dalam 1x24 jam untuk verifikasi admin. Kami akan menginfokan kembali jika penarikan telah berhasil dicairkan.\n\nTerima kasih! 🙏`;

        // Use profile phone if available
        if (profile.phone) {
            await sendWhatsApp(profile.phone, waMessage);
        }

        return { success: true, data: withdrawal };
    } catch (error) {
        console.error("Withdrawal Request Error:", error);
        return { success: false, error: error.message };
    }
};

/**
 * Approve withdrawal (Admin)
 */
export const approveWithdrawal = async (withdrawalId) => {
    try {
        const { data: withdrawal, error: fetchError } = await supabase
            .from('withdrawals')
            .select('*, profiles(full_name, phone)')
            .eq('id', withdrawalId)
            .single();

        if (fetchError) throw fetchError;

        // Update status
        const { error: updateError } = await supabase
            .from('withdrawals')
            .update({ status: 'completed', updated_at: new Date() })
            .eq('id', withdrawalId);

        if (updateError) throw updateError;

        // Send WhatsApp Notification
        const waMessage = `Halo ${withdrawal.profiles.full_name}! ✅\n\nKabar gembira! Pencairan saldo kamu sebesar *Rp ${withdrawal.amount.toLocaleString('id-ID')}* telah *BERHASIL* dicairkan.\n\nSilakan cek rekening Anda secara berkala. Terima kasih telah menggunakan layanan kami! 🙏`;

        if (withdrawal.profiles.phone) {
            await sendWhatsApp(withdrawal.profiles.phone, waMessage);
        }

        return { success: true };
    } catch (error) {
        console.error("Approve Withdrawal Error:", error);
        return { success: false, error: error.message };
    }
};

/**
 * Cancel/Reject withdrawal (Admin)
 */
export const rejectWithdrawal = async (withdrawalId, note) => {
    try {
        const { data: withdrawal, error: fetchError } = await supabase
            .from('withdrawals')
            .select('*')
            .eq('id', withdrawalId)
            .single();

        if (fetchError) throw fetchError;

        // Restore balance to user
        const { data: profile } = await supabase.from('profiles').select('balance').eq('id', withdrawal.user_id).single();
        await supabase.from('profiles').update({ balance: (profile?.balance || 0) + withdrawal.amount }).eq('id', withdrawal.user_id);

        // Update status
        const { error: updateError } = await supabase
            .from('withdrawals')
            .update({ status: 'cancelled', admin_note: note, updated_at: new Date() })
            .eq('id', withdrawalId);

        if (updateError) throw updateError;

        return { success: true };
    } catch (error) {
        console.error("Reject Withdrawal Error:", error);
        return { success: false, error: error.message };
    }
};
