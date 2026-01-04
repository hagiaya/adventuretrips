-- Update profiles to verified if they have any completed withdrawals
UPDATE profiles
SET kyc_status = 'verified', is_verified = true
FROM withdrawals
WHERE profiles.id = withdrawals.user_id
AND withdrawals.status = 'completed';
