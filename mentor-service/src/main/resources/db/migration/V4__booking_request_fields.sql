ALTER TABLE mentorship_bookings ADD COLUMN request_type VARCHAR(32);
ALTER TABLE mentorship_bookings ADD COLUMN request_message VARCHAR(1000);
ALTER TABLE mentorship_bookings ADD COLUMN premium_learner BOOLEAN DEFAULT FALSE NOT NULL;
