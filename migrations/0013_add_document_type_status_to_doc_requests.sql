ALTER TABLE item_document_requests
  ADD COLUMN IF NOT EXISTS document_type varchar(50) DEFAULT 'authenticity_certificate',
  ADD COLUMN IF NOT EXISTS status varchar(20) DEFAULT 'pending';
