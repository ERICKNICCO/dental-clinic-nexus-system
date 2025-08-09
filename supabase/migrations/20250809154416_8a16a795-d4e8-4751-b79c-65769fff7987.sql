-- Update doctor names to full names in various tables
UPDATE users SET name = 'Dr. Shabbir Mohammedali' WHERE name ILIKE '%shabbir%' OR name ILIKE '%mohammed%';
UPDATE users SET name = 'Dr. Israel Kombole' WHERE name ILIKE '%israel%' OR name ILIKE '%kombole%';
UPDATE users SET name = 'Dr. Rashid Qurban' WHERE name ILIKE '%rashid%' OR name ILIKE '%qurban%';

-- Update doctor names in appointments table
UPDATE appointments SET dentist = 'Dr. Shabbir Mohammedali' WHERE dentist ILIKE '%shabbir%' OR dentist ILIKE '%mohammed%';
UPDATE appointments SET dentist = 'Dr. Israel Kombole' WHERE dentist ILIKE '%israel%' OR dentist ILIKE '%kombole%';
UPDATE appointments SET dentist = 'Dr. Rashid Qurban' WHERE dentist ILIKE '%rashid%' OR dentist ILIKE '%qurban%';

-- Update doctor names in consultations table
UPDATE consultations SET doctor_name = 'Dr. Shabbir Mohammedali' WHERE doctor_name ILIKE '%shabbir%' OR doctor_name ILIKE '%mohammed%';
UPDATE consultations SET doctor_name = 'Dr. Israel Kombole' WHERE doctor_name ILIKE '%israel%' OR doctor_name ILIKE '%kombole%';
UPDATE consultations SET doctor_name = 'Dr. Rashid Qurban' WHERE doctor_name ILIKE '%rashid%' OR doctor_name ILIKE '%qurban%';

-- Update doctor names in medical_history table
UPDATE medical_history SET doctor = 'Dr. Shabbir Mohammedali' WHERE doctor ILIKE '%shabbir%' OR doctor ILIKE '%mohammed%';
UPDATE medical_history SET doctor = 'Dr. Israel Kombole' WHERE doctor ILIKE '%israel%' OR doctor ILIKE '%kombole%';
UPDATE medical_history SET doctor = 'Dr. Rashid Qurban' WHERE doctor ILIKE '%rashid%' OR doctor ILIKE '%qurban%';

-- Update doctor names in treatment_notes table
UPDATE treatment_notes SET doctor = 'Dr. Shabbir Mohammedali' WHERE doctor ILIKE '%shabbir%' OR doctor ILIKE '%mohammed%';
UPDATE treatment_notes SET doctor = 'Dr. Israel Kombole' WHERE doctor ILIKE '%israel%' OR doctor ILIKE '%kombole%';
UPDATE treatment_notes SET doctor = 'Dr. Rashid Qurban' WHERE doctor ILIKE '%rashid%' OR doctor ILIKE '%qurban%';

-- Update doctor names in schedule_notes table  
UPDATE schedule_notes SET doctor_name = 'Dr. Shabbir Mohammedali' WHERE doctor_name ILIKE '%shabbir%' OR doctor_name ILIKE '%mohammed%';
UPDATE schedule_notes SET doctor_name = 'Dr. Israel Kombole' WHERE doctor_name ILIKE '%israel%' OR doctor_name ILIKE '%kombole%';
UPDATE schedule_notes SET doctor_name = 'Dr. Rashid Qurban' WHERE doctor_name ILIKE '%rashid%' OR doctor_name ILIKE '%qurban%';