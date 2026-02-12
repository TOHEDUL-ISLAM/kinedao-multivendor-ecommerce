-- Approve the most recent pending vendor application
UPDATE vendor_applications
SET status = 'approved'
WHERE status = 'pending'
ORDER BY created_at DESC
LIMIT 1
RETURNING shop_name_en, user_id, vendor_id;
