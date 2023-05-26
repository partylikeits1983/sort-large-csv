-- Create the table
CREATE TABLE csv_data (
  timestamp TIMESTAMPTZ,
  price NUMERIC(10, 2),
  product_id VARCHAR(20),
  customer_id VARCHAR(20),
  cc_number VARCHAR(20),
  store_id VARCHAR(20)
);