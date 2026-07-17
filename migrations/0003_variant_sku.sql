-- SKU per variant: the style-number stem is how a customer or floor associate
-- finds the piece in-store; per-size availability drives the fitting list.
ALTER TABLE variants ADD COLUMN sku TEXT;
