CREATE OR REPLACE FUNCTION public.guard_order_payment_fields()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  -- Only server-side (service role) code may set payment state. Customers never can.
  IF coalesce(auth.role(), '') NOT IN ('authenticated', 'anon') THEN
    RETURN NEW;
  END IF;

  IF TG_OP = 'INSERT' THEN
    NEW.payment_status := 'unpaid';
    NEW.deposit_paid := false;
    NEW.paid_at := NULL;
    NEW.status := 'Order placed';
    NEW.youcanpay_token_id := NULL;
    NEW.youcanpay_transaction_id := NULL;
    IF NEW.payment_method NOT IN ('card_youcanpay', 'deposit_50_cod', 'bank_transfer_50') THEN
      NEW.payment_method := 'card_youcanpay';
    END IF;
    RETURN NEW;
  END IF;

  IF NEW.payment_status IS DISTINCT FROM OLD.payment_status
    OR NEW.payment_method IS DISTINCT FROM OLD.payment_method
    OR NEW.deposit_amount IS DISTINCT FROM OLD.deposit_amount
    OR NEW.balance_amount IS DISTINCT FROM OLD.balance_amount
    OR NEW.deposit_paid IS DISTINCT FROM OLD.deposit_paid
    OR NEW.paid_at IS DISTINCT FROM OLD.paid_at
    OR NEW.total IS DISTINCT FROM OLD.total
    OR NEW.subtotal IS DISTINCT FROM OLD.subtotal
    OR NEW.delivery IS DISTINCT FROM OLD.delivery
    OR NEW.status IS DISTINCT FROM OLD.status
    OR NEW.youcanpay_token_id IS DISTINCT FROM OLD.youcanpay_token_id
    OR NEW.youcanpay_transaction_id IS DISTINCT FROM OLD.youcanpay_transaction_id
  THEN
    RAISE EXCEPTION 'Payment fields can only be changed by Primple staff';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER orders_guard_payment_fields
BEFORE INSERT OR UPDATE ON public.orders
FOR EACH ROW EXECUTE FUNCTION public.guard_order_payment_fields();