--
-- PostgreSQL database dump
--

-- Dumped from database version 15.13 (Debian 15.13-1.pgdg120+1)
-- Dumped by pg_dump version 15.13 (Debian 15.13-1.pgdg120+1)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: calculate_stair_price_simple(integer, integer, numeric, numeric, integer, boolean); Type: FUNCTION; Schema: public; Owner: craftmart_user
--

CREATE FUNCTION public.calculate_stair_price_simple(p_board_type_id integer, p_material_id integer, p_length numeric, p_width numeric, p_quantity integer DEFAULT 1, p_full_mitre boolean DEFAULT false) RETURNS TABLE(base_price numeric, length_charge numeric, width_charge numeric, material_multiplier numeric, mitre_charge numeric, unit_price numeric, total_price numeric)
    LANGUAGE plpgsql
    AS $$
DECLARE
    v_pricing RECORD;
    v_material RECORD;
    v_base NUMERIC := 0;
    v_length_extra NUMERIC := 0;
    v_width_extra NUMERIC := 0;
    v_mitre NUMERIC := 0;
    v_multiplier NUMERIC := 1.0;
    v_unit NUMERIC := 0;
    v_total NUMERIC := 0;
BEGIN
    -- Get pricing rule
    SELECT * INTO v_pricing
    FROM stair_pricing_simple
    WHERE board_type_id = p_board_type_id
      AND is_active = true
    LIMIT 1;
    
    -- Get material multiplier
    SELECT * INTO v_material
    FROM material_multipliers
    WHERE material_id = p_material_id
      AND is_active = true
    LIMIT 1;
    
    IF v_pricing.id IS NOT NULL THEN
        v_base := v_pricing.base_price;
        v_multiplier := COALESCE(v_material.multiplier, 1.0);
        
        -- Calculate length increment charge (per increment over base length)
        IF p_length > v_pricing.base_length AND v_pricing.length_increment_price > 0 THEN
            v_length_extra := CEIL((p_length - v_pricing.base_length) / v_pricing.length_increment_size) * v_pricing.length_increment_price;
        END IF;
        
        -- Calculate width increment charge (per increment over base width)
        IF p_width > v_pricing.base_width AND v_pricing.width_increment_price > 0 THEN
            v_width_extra := CEIL((p_width - v_pricing.base_width) / v_pricing.width_increment_size) * v_pricing.width_increment_price;
        END IF;
        
        -- Calculate mitre charge
        IF p_full_mitre AND v_pricing.mitre_price > 0 THEN
            v_mitre := v_pricing.mitre_price;
        END IF;
        
        -- Calculate unit price: (Base + Length + Width) × Material + Mitre
        v_unit := (v_base + v_length_extra + v_width_extra) * v_multiplier + v_mitre;
        v_total := v_unit * p_quantity;
    END IF;
    
    RETURN QUERY SELECT 
        v_base,
        v_length_extra,
        v_width_extra,
        v_multiplier,
        v_mitre,
        v_unit,
        v_total;
END;
$$;


ALTER FUNCTION public.calculate_stair_price_simple(p_board_type_id integer, p_material_id integer, p_length numeric, p_width numeric, p_quantity integer, p_full_mitre boolean) OWNER TO craftmart_user;

--
-- Name: FUNCTION calculate_stair_price_simple(p_board_type_id integer, p_material_id integer, p_length numeric, p_width numeric, p_quantity integer, p_full_mitre boolean); Type: COMMENT; Schema: public; Owner: craftmart_user
--

COMMENT ON FUNCTION public.calculate_stair_price_simple(p_board_type_id integer, p_material_id integer, p_length numeric, p_width numeric, p_quantity integer, p_full_mitre boolean) IS 'Current stair pricing function using simplified formula';


--
-- Name: check_allocation_total(); Type: FUNCTION; Schema: public; Owner: craftmart_user
--

CREATE FUNCTION public.check_allocation_total() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
DECLARE
  total_allocated DECIMAL(10,2);
  deposit_amount DECIMAL(10,2);
BEGIN
  SELECT total_amount INTO deposit_amount
  FROM deposits
  WHERE id = NEW.deposit_id
  FOR UPDATE;

  IF deposit_amount IS NULL THEN
    RAISE EXCEPTION 'Deposit % not found', NEW.deposit_id
      USING ERRCODE = '23503';
  END IF;

  SELECT COALESCE(SUM(amount), 0) INTO total_allocated
  FROM deposit_allocations
  WHERE deposit_id = NEW.deposit_id
    AND (TG_OP <> 'UPDATE' OR id <> NEW.id);

  IF total_allocated + NEW.amount > deposit_amount THEN
    RAISE EXCEPTION 'Total allocations (%) would exceed deposit amount (%)',
      total_allocated + NEW.amount, deposit_amount
      USING ERRCODE = '23514';
  END IF;

  RETURN NEW;
END;
$$;


ALTER FUNCTION public.check_allocation_total() OWNER TO craftmart_user;

--
-- Name: check_item_allocation_total(); Type: FUNCTION; Schema: public; Owner: craftmart_user
--

CREATE FUNCTION public.check_item_allocation_total() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
DECLARE
  has_total_col BOOLEAN;
  item_total DECIMAL(10,2);
  total_allocated DECIMAL(10,2);
BEGIN
  -- Verify column existence (optional feature)
  SELECT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'job_items' AND column_name = 'total_amount'
  ) INTO has_total_col;

  IF NOT has_total_col THEN
    RETURN NEW;
  END IF;

  -- Fetch the item's total amount
  SELECT total_amount INTO item_total
  FROM job_items
  WHERE id = NEW.job_item_id;

  -- If total is NULL or not positive, skip enforcement
  IF item_total IS NULL OR item_total <= 0 THEN
    RETURN NEW;
  END IF;

  -- Sum existing allocations for this item (exclude current row on UPDATE)
  SELECT COALESCE(SUM(amount), 0) INTO total_allocated
  FROM deposit_allocations
  WHERE job_item_id = NEW.job_item_id
    AND (TG_OP <> 'UPDATE' OR id <> NEW.id);

  IF total_allocated + NEW.amount > item_total THEN
    RAISE EXCEPTION 'Item allocations (%) would exceed item total (%) for job_item %',
      total_allocated + NEW.amount, item_total, NEW.job_item_id
      USING ERRCODE = '23514';
  END IF;

  RETURN NEW;
END;
$$;


ALTER FUNCTION public.check_item_allocation_total() OWNER TO craftmart_user;

--
-- Name: set_invoice_dates(); Type: FUNCTION; Schema: public; Owner: craftmart_user
--

CREATE FUNCTION public.set_invoice_dates() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  -- On INSERT
  IF TG_OP = 'INSERT' THEN
    IF NEW.status = 'invoice' THEN
      IF NEW.invoice_date IS NULL THEN
        NEW.invoice_date := CURRENT_DATE;
      END IF;
      IF NEW.due_date IS NULL THEN
        NEW.due_date := NEW.invoice_date + COALESCE(NEW.net_terms_days, 30);
      END IF;
    END IF;
    RETURN NEW;
  END IF;

  -- On UPDATE: detect transition to 'invoice'
  IF TG_OP = 'UPDATE' THEN
    IF NEW.status = 'invoice' AND (OLD.status IS DISTINCT FROM 'invoice') THEN
      IF NEW.invoice_date IS NULL THEN
        NEW.invoice_date := CURRENT_DATE;
      END IF;
    END IF;
    -- Maintain due_date if invoice_date/terms present and due_date missing
    IF NEW.status = 'invoice' AND NEW.due_date IS NULL THEN
      NEW.due_date := COALESCE(NEW.invoice_date, CURRENT_DATE) + COALESCE(NEW.net_terms_days, 30);
    END IF;
    RETURN NEW;
  END IF;

  RETURN NEW;
END;
$$;


ALTER FUNCTION public.set_invoice_dates() OWNER TO craftmart_user;

--
-- Name: update_job_deposit_totals(); Type: FUNCTION; Schema: public; Owner: craftmart_user
--

CREATE FUNCTION public.update_job_deposit_totals() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
DECLARE
  old_job_id INTEGER;
  new_job_id INTEGER;
  has_totals_column BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'jobs' AND column_name = 'total_deposits'
  ) INTO has_totals_column;

  IF NOT has_totals_column THEN
    RETURN COALESCE(NEW, OLD);
  END IF;

  IF TG_OP = 'UPDATE' THEN
    old_job_id := OLD.job_id;
    new_job_id := NEW.job_id;
  ELSIF TG_OP = 'INSERT' THEN
    old_job_id := NULL;
    new_job_id := NEW.job_id;
  ELSIF TG_OP = 'DELETE' THEN
    old_job_id := OLD.job_id;
    new_job_id := NULL;
  END IF;

  IF old_job_id IS NOT NULL THEN
    UPDATE jobs
    SET total_deposits = (
      SELECT COALESCE(SUM(amount), 0)
      FROM deposit_allocations
      WHERE job_id = old_job_id
    )
    WHERE id = old_job_id;
  END IF;

  IF new_job_id IS NOT NULL AND (old_job_id IS NULL OR new_job_id <> old_job_id) THEN
    UPDATE jobs
    SET total_deposits = (
      SELECT COALESCE(SUM(amount), 0)
      FROM deposit_allocations
      WHERE job_id = new_job_id
    )
    WHERE id = new_job_id;
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$$;


ALTER FUNCTION public.update_job_deposit_totals() OWNER TO craftmart_user;

--
-- Name: update_projects_updated_at(); Type: FUNCTION; Schema: public; Owner: craftmart_user
--

CREATE FUNCTION public.update_projects_updated_at() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$;


ALTER FUNCTION public.update_projects_updated_at() OWNER TO craftmart_user;

--
-- Name: update_updated_at_column(); Type: FUNCTION; Schema: public; Owner: craftmart_user
--

CREATE FUNCTION public.update_updated_at_column() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$;


ALTER FUNCTION public.update_updated_at_column() OWNER TO craftmart_user;

--
-- Name: validate_deposit_allocation_links(); Type: FUNCTION; Schema: public; Owner: craftmart_user
--

CREATE FUNCTION public.validate_deposit_allocation_links() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
DECLARE
  item_job_id INTEGER;
BEGIN
  SELECT job_id INTO item_job_id FROM job_items WHERE id = NEW.job_item_id;

  IF item_job_id IS NULL THEN
    RAISE EXCEPTION 'Job item % does not exist', NEW.job_item_id
      USING ERRCODE = '23514';
  END IF;

  IF item_job_id <> NEW.job_id THEN
    RAISE EXCEPTION 'Job item % does not belong to job %', NEW.job_item_id, NEW.job_id
      USING ERRCODE = '23514';
  END IF;

  RETURN NEW;
END;
$$;


ALTER FUNCTION public.validate_deposit_allocation_links() OWNER TO craftmart_user;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: customers; Type: TABLE; Schema: public; Owner: craftmart_user
--

CREATE TABLE public.customers (
    id integer NOT NULL,
    name character varying(255) NOT NULL,
    address text,
    city character varying(100),
    state character varying(50),
    zip_code character varying(20),
    phone character varying(20),
    mobile character varying(20),
    fax character varying(20),
    email character varying(255),
    accounting_email character varying(255),
    notes text,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    last_visited_at timestamp without time zone
);


ALTER TABLE public.customers OWNER TO craftmart_user;

--
-- Name: customers_id_seq; Type: SEQUENCE; Schema: public; Owner: craftmart_user
--

CREATE SEQUENCE public.customers_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.customers_id_seq OWNER TO craftmart_user;

--
-- Name: customers_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: craftmart_user
--

ALTER SEQUENCE public.customers_id_seq OWNED BY public.customers.id;


--
-- Name: deposit_allocations; Type: TABLE; Schema: public; Owner: craftmart_user
--

CREATE TABLE public.deposit_allocations (
    id integer NOT NULL,
    deposit_id integer NOT NULL,
    job_id integer NOT NULL,
    job_item_id integer NOT NULL,
    amount numeric(10,2) NOT NULL,
    allocation_date timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    notes text,
    created_by integer NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT deposit_allocations_amount_check CHECK ((amount > (0)::numeric))
);


ALTER TABLE public.deposit_allocations OWNER TO craftmart_user;

--
-- Name: deposit_allocations_id_seq; Type: SEQUENCE; Schema: public; Owner: craftmart_user
--

CREATE SEQUENCE public.deposit_allocations_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.deposit_allocations_id_seq OWNER TO craftmart_user;

--
-- Name: deposit_allocations_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: craftmart_user
--

ALTER SEQUENCE public.deposit_allocations_id_seq OWNED BY public.deposit_allocations.id;


--
-- Name: deposits; Type: TABLE; Schema: public; Owner: craftmart_user
--

CREATE TABLE public.deposits (
    id integer NOT NULL,
    customer_id integer NOT NULL,
    payment_method character varying(20) DEFAULT 'check'::character varying NOT NULL,
    reference_number character varying(100),
    payment_date date,
    total_amount numeric(10,2) NOT NULL,
    deposit_date timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    notes text,
    created_by integer,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT deposits_payment_method_check CHECK (((payment_method)::text = ANY ((ARRAY['check'::character varying, 'cash'::character varying, 'credit_card'::character varying, 'ach'::character varying, 'wire'::character varying, 'other'::character varying])::text[]))),
    CONSTRAINT deposits_total_amount_check CHECK ((total_amount > (0)::numeric))
);


ALTER TABLE public.deposits OWNER TO craftmart_user;

--
-- Name: deposits_id_seq; Type: SEQUENCE; Schema: public; Owner: craftmart_user
--

CREATE SEQUENCE public.deposits_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.deposits_id_seq OWNER TO craftmart_user;

--
-- Name: deposits_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: craftmart_user
--

ALTER SEQUENCE public.deposits_id_seq OWNED BY public.deposits.id;


--
-- Name: deposits_with_balance; Type: VIEW; Schema: public; Owner: craftmart_user
--

CREATE VIEW public.deposits_with_balance AS
SELECT
    NULL::integer AS id,
    NULL::integer AS customer_id,
    NULL::character varying(20) AS payment_method,
    NULL::character varying(100) AS reference_number,
    NULL::date AS payment_date,
    NULL::numeric(10,2) AS total_amount,
    NULL::timestamp without time zone AS deposit_date,
    NULL::text AS notes,
    NULL::integer AS created_by,
    NULL::timestamp without time zone AS created_at,
    NULL::timestamp without time zone AS updated_at,
    NULL::numeric AS unallocated_amount;


ALTER TABLE public.deposits_with_balance OWNER TO craftmart_user;

--
-- Name: handrail_products; Type: TABLE; Schema: public; Owner: craftmart_user
--

CREATE TABLE public.handrail_products (
    id integer NOT NULL,
    product_id integer,
    cost_per_6_inches numeric(8,2) NOT NULL,
    CONSTRAINT handrail_products_cost_per_6_inches_check CHECK ((cost_per_6_inches >= (0)::numeric))
);


ALTER TABLE public.handrail_products OWNER TO craftmart_user;

--
-- Name: handrail_products_id_seq; Type: SEQUENCE; Schema: public; Owner: craftmart_user
--

CREATE SEQUENCE public.handrail_products_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.handrail_products_id_seq OWNER TO craftmart_user;

--
-- Name: handrail_products_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: craftmart_user
--

ALTER SEQUENCE public.handrail_products_id_seq OWNED BY public.handrail_products.id;


--
-- Name: job_items; Type: TABLE; Schema: public; Owner: craftmart_user
--

CREATE TABLE public.job_items (
    id integer NOT NULL,
    customer_id integer,
    title character varying(255) NOT NULL,
    description text,
    status character varying(50) DEFAULT 'quote'::character varying,
    quote_amount numeric(10,2),
    order_amount numeric(10,2),
    invoice_amount numeric(10,2),
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    salesman_id integer,
    delivery_date date,
    job_location text,
    order_designation character varying(100),
    model_name character varying(255),
    installer character varying(255),
    terms character varying(255),
    show_line_pricing boolean DEFAULT true,
    subtotal numeric(10,2) DEFAULT 0.00,
    labor_total numeric(10,2) DEFAULT 0.00,
    tax_rate numeric(5,4) DEFAULT 0.00,
    tax_amount numeric(10,2) DEFAULT 0.00,
    total_amount numeric(10,2) DEFAULT 0.00,
    shops_run boolean DEFAULT false,
    shops_run_date timestamp without time zone,
    job_id integer NOT NULL,
    invoice_date date,
    net_terms_days integer DEFAULT 30,
    due_date date,
    po_number character varying(100),
    CONSTRAINT jobs_status_check CHECK (((status)::text = ANY ((ARRAY['quote'::character varying, 'order'::character varying, 'invoice'::character varying])::text[])))
);


ALTER TABLE public.job_items OWNER TO craftmart_user;

--
-- Name: COLUMN job_items.shops_run; Type: COMMENT; Schema: public; Owner: craftmart_user
--

COMMENT ON COLUMN public.job_items.shops_run IS 'Indicates if shop cut sheets have been generated for this job';


--
-- Name: COLUMN job_items.shops_run_date; Type: COMMENT; Schema: public; Owner: craftmart_user
--

COMMENT ON COLUMN public.job_items.shops_run_date IS 'Timestamp when shops were last generated for this job';


--
-- Name: COLUMN job_items.job_id; Type: COMMENT; Schema: public; Owner: craftmart_user
--

COMMENT ON COLUMN public.job_items.job_id IS 'Required reference to projects table. Jobs inherit customer from their project.';


--
-- Name: salesmen; Type: TABLE; Schema: public; Owner: craftmart_user
--

CREATE TABLE public.salesmen (
    id integer NOT NULL,
    first_name character varying(100) NOT NULL,
    last_name character varying(100) NOT NULL,
    email character varying(255),
    phone character varying(20),
    commission_rate numeric(5,2) DEFAULT 0.00,
    is_active boolean DEFAULT true,
    notes text,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT salesmen_commission_rate_check CHECK ((commission_rate >= (0)::numeric))
);


ALTER TABLE public.salesmen OWNER TO craftmart_user;

--
-- Name: invoices_view; Type: VIEW; Schema: public; Owner: craftmart_user
--

CREATE VIEW public.invoices_view AS
 WITH base AS (
         SELECT ji.id AS invoice_id,
            ('INV-'::text || (ji.id)::text) AS invoice_number,
            ji.id AS order_id,
            ('ORD-'::text || (ji.id)::text) AS order_number,
            COALESCE(ji.po_number, ji.order_designation) AS po_number,
            COALESCE(ji.title, (('Job Item '::text || (ji.id)::text))::character varying) AS job_title,
            ji.customer_id,
            c.name AS customer_name,
            ji.salesman_id,
            (((s.first_name)::text || ' '::text) || (s.last_name)::text) AS salesman_name,
            c.state,
            COALESCE(ji.subtotal, (0)::numeric) AS subtotal,
            COALESCE(ji.labor_total, (0)::numeric) AS labor_total,
            COALESCE(ji.tax_amount, (0)::numeric) AS tax_amount,
            COALESCE(ji.total_amount, (0)::numeric) AS total_amount,
            COALESCE(ji.invoice_date, (ji.created_at)::date) AS invoice_date,
            COALESCE(ji.due_date, (COALESCE(ji.invoice_date, (ji.created_at)::date) + COALESCE(ji.net_terms_days, 30))) AS due_date
           FROM ((public.job_items ji
             LEFT JOIN public.customers c ON ((c.id = ji.customer_id)))
             LEFT JOIN public.salesmen s ON ((s.id = ji.salesman_id)))
          WHERE ((ji.status)::text = 'invoice'::text)
        ), paid_totals AS (
         SELECT da.job_item_id,
            sum(da.amount) AS paid_amount
           FROM public.deposit_allocations da
          GROUP BY da.job_item_id
        ), paid_dates AS (
         SELECT r.job_item_id,
            min(r.paid_component_date) FILTER (WHERE ((r.running_alloc >= bt.total_amount) AND (bt.total_amount IS NOT NULL))) AS paid_date
           FROM (( SELECT a.job_item_id,
                    COALESCE(d.payment_date, (a.allocation_date)::date) AS paid_component_date,
                    a.amount,
                    sum(a.amount) OVER (PARTITION BY a.job_item_id ORDER BY COALESCE((d.payment_date)::timestamp without time zone, a.allocation_date), a.id ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW) AS running_alloc
                   FROM (public.deposit_allocations a
                     JOIN public.deposits d ON ((d.id = a.deposit_id)))) r
             JOIN ( SELECT b_1.invoice_id,
                    b_1.total_amount
                   FROM base b_1) bt ON ((bt.invoice_id = r.job_item_id)))
          GROUP BY r.job_item_id
        )
 SELECT b.invoice_id,
    b.invoice_number,
    b.order_id,
    b.order_number,
    b.po_number,
    b.job_title,
    b.customer_id,
    b.customer_name,
    b.salesman_id,
    b.salesman_name,
    b.state,
    b.subtotal,
    b.subtotal AS taxable_amount,
    b.labor_total,
    b.tax_amount,
    b.total_amount,
    b.invoice_date,
    b.due_date,
    COALESCE(pt.paid_amount, (0)::numeric) AS paid_amount,
    COALESCE(pd.paid_date, NULL::date) AS paid_date,
    (b.total_amount - COALESCE(pt.paid_amount, (0)::numeric)) AS open_balance
   FROM ((base b
     LEFT JOIN paid_totals pt ON ((pt.job_item_id = b.invoice_id)))
     LEFT JOIN paid_dates pd ON ((pd.job_item_id = b.invoice_id)));


ALTER TABLE public.invoices_view OWNER TO craftmart_user;

--
-- Name: job_sections; Type: TABLE; Schema: public; Owner: craftmart_user
--

CREATE TABLE public.job_sections (
    id integer NOT NULL,
    job_item_id integer,
    name character varying(100) NOT NULL,
    display_order integer DEFAULT 0,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.job_sections OWNER TO craftmart_user;

--
-- Name: job_sections_id_seq; Type: SEQUENCE; Schema: public; Owner: craftmart_user
--

CREATE SEQUENCE public.job_sections_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.job_sections_id_seq OWNER TO craftmart_user;

--
-- Name: job_sections_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: craftmart_user
--

ALTER SEQUENCE public.job_sections_id_seq OWNED BY public.job_sections.id;


--
-- Name: jobs; Type: TABLE; Schema: public; Owner: craftmart_user
--

CREATE TABLE public.jobs (
    id integer NOT NULL,
    customer_id integer NOT NULL,
    name character varying(255) NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    shops_run boolean DEFAULT false,
    shops_run_date timestamp without time zone
);


ALTER TABLE public.jobs OWNER TO craftmart_user;

--
-- Name: TABLE jobs; Type: COMMENT; Schema: public; Owner: craftmart_user
--

COMMENT ON TABLE public.jobs IS 'Projects table: Groups jobs by customer and project name. All jobs must belong to a project.';


--
-- Name: jobs_id_seq; Type: SEQUENCE; Schema: public; Owner: craftmart_user
--

CREATE SEQUENCE public.jobs_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.jobs_id_seq OWNER TO craftmart_user;

--
-- Name: jobs_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: craftmart_user
--

ALTER SEQUENCE public.jobs_id_seq OWNED BY public.job_items.id;


--
-- Name: landing_tread_products; Type: TABLE; Schema: public; Owner: craftmart_user
--

CREATE TABLE public.landing_tread_products (
    id integer NOT NULL,
    product_id integer,
    cost_per_6_inches numeric(8,2) NOT NULL,
    labor_install_cost numeric(8,2) NOT NULL,
    CONSTRAINT landing_tread_products_cost_per_6_inches_check CHECK ((cost_per_6_inches >= (0)::numeric)),
    CONSTRAINT landing_tread_products_labor_install_cost_check CHECK ((labor_install_cost >= (0)::numeric))
);


ALTER TABLE public.landing_tread_products OWNER TO craftmart_user;

--
-- Name: landing_tread_products_id_seq; Type: SEQUENCE; Schema: public; Owner: craftmart_user
--

CREATE SEQUENCE public.landing_tread_products_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.landing_tread_products_id_seq OWNER TO craftmart_user;

--
-- Name: landing_tread_products_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: craftmart_user
--

ALTER SEQUENCE public.landing_tread_products_id_seq OWNED BY public.landing_tread_products.id;


--
-- Name: material_multipliers; Type: TABLE; Schema: public; Owner: craftmart_user
--

CREATE TABLE public.material_multipliers (
    material_id integer NOT NULL,
    material_name character varying(50) NOT NULL,
    abbreviation character varying(5),
    multiplier numeric(5,2) DEFAULT 1.0 NOT NULL,
    is_active boolean DEFAULT true,
    display_order integer DEFAULT 100,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.material_multipliers OWNER TO craftmart_user;

--
-- Name: TABLE material_multipliers; Type: COMMENT; Schema: public; Owner: craftmart_user
--

COMMENT ON TABLE public.material_multipliers IS 'Material pricing multipliers for stair components (replaced stair_materials)';


--
-- Name: materials; Type: TABLE; Schema: public; Owner: craftmart_user
--

CREATE TABLE public.materials (
    id integer NOT NULL,
    name character varying(255) NOT NULL,
    multiplier numeric(5,3) NOT NULL,
    description text,
    is_active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT materials_multiplier_check CHECK ((multiplier > (0)::numeric))
);


ALTER TABLE public.materials OWNER TO craftmart_user;

--
-- Name: materials_id_seq; Type: SEQUENCE; Schema: public; Owner: craftmart_user
--

CREATE SEQUENCE public.materials_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.materials_id_seq OWNER TO craftmart_user;

--
-- Name: materials_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: craftmart_user
--

ALTER SEQUENCE public.materials_id_seq OWNED BY public.materials.id;


--
-- Name: products; Type: TABLE; Schema: public; Owner: craftmart_user
--

CREATE TABLE public.products (
    id integer NOT NULL,
    name character varying(255) NOT NULL,
    product_type character varying(50) NOT NULL,
    is_active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT products_product_type_check CHECK (((product_type)::text = ANY ((ARRAY['handrail'::character varying, 'newel'::character varying, 'baluster'::character varying, 'landing_tread'::character varying, 'rail_parts'::character varying, 'stair'::character varying, 'other'::character varying])::text[])))
);


ALTER TABLE public.products OWNER TO craftmart_user;

--
-- Name: products_id_seq; Type: SEQUENCE; Schema: public; Owner: craftmart_user
--

CREATE SEQUENCE public.products_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.products_id_seq OWNER TO craftmart_user;

--
-- Name: products_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: craftmart_user
--

ALTER SEQUENCE public.products_id_seq OWNED BY public.products.id;


--
-- Name: projects_id_seq; Type: SEQUENCE; Schema: public; Owner: craftmart_user
--

CREATE SEQUENCE public.projects_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.projects_id_seq OWNER TO craftmart_user;

--
-- Name: projects_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: craftmart_user
--

ALTER SEQUENCE public.projects_id_seq OWNED BY public.jobs.id;


--
-- Name: quote_items; Type: TABLE; Schema: public; Owner: craftmart_user
--

CREATE TABLE public.quote_items (
    id integer NOT NULL,
    job_item_id integer,
    product_id integer,
    product_type character varying(50) NOT NULL,
    product_name character varying(255) NOT NULL,
    length_inches integer,
    material_id integer,
    material_name character varying(255),
    material_multiplier numeric(5,3),
    include_labor boolean DEFAULT false,
    unit_cost numeric(8,2),
    labor_cost numeric(8,2),
    total_cost numeric(10,2),
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    section_id integer,
    part_number character varying(100),
    description text,
    quantity numeric(8,2) DEFAULT 1,
    unit_price numeric(8,2),
    line_total numeric(10,2),
    is_taxable boolean DEFAULT true,
    stair_config_id integer,
    CONSTRAINT quote_items_length_inches_check CHECK ((length_inches > 0))
);


ALTER TABLE public.quote_items OWNER TO craftmart_user;

--
-- Name: quote_items_id_seq; Type: SEQUENCE; Schema: public; Owner: craftmart_user
--

CREATE SEQUENCE public.quote_items_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.quote_items_id_seq OWNER TO craftmart_user;

--
-- Name: quote_items_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: craftmart_user
--

ALTER SEQUENCE public.quote_items_id_seq OWNED BY public.quote_items.id;


--
-- Name: rail_parts_products; Type: TABLE; Schema: public; Owner: craftmart_user
--

CREATE TABLE public.rail_parts_products (
    id integer NOT NULL,
    product_id integer,
    base_price numeric(8,2) NOT NULL,
    labor_install_cost numeric(8,2) NOT NULL,
    CONSTRAINT rail_parts_products_base_price_check CHECK ((base_price >= (0)::numeric)),
    CONSTRAINT rail_parts_products_labor_install_cost_check CHECK ((labor_install_cost >= (0)::numeric))
);


ALTER TABLE public.rail_parts_products OWNER TO craftmart_user;

--
-- Name: rail_parts_products_id_seq; Type: SEQUENCE; Schema: public; Owner: craftmart_user
--

CREATE SEQUENCE public.rail_parts_products_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.rail_parts_products_id_seq OWNER TO craftmart_user;

--
-- Name: rail_parts_products_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: craftmart_user
--

ALTER SEQUENCE public.rail_parts_products_id_seq OWNED BY public.rail_parts_products.id;


--
-- Name: salesmen_id_seq; Type: SEQUENCE; Schema: public; Owner: craftmart_user
--

CREATE SEQUENCE public.salesmen_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.salesmen_id_seq OWNER TO craftmart_user;

--
-- Name: salesmen_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: craftmart_user
--

ALTER SEQUENCE public.salesmen_id_seq OWNED BY public.salesmen.id;


--
-- Name: shop_jobs; Type: TABLE; Schema: public; Owner: craftmart_user
--

CREATE TABLE public.shop_jobs (
    id integer NOT NULL,
    shop_id integer NOT NULL,
    job_id integer NOT NULL,
    job_title character varying(255),
    customer_name character varying(255),
    job_location character varying(255),
    delivery_date date,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.shop_jobs OWNER TO craftmart_user;

--
-- Name: shop_jobs_id_seq; Type: SEQUENCE; Schema: public; Owner: craftmart_user
--

CREATE SEQUENCE public.shop_jobs_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.shop_jobs_id_seq OWNER TO craftmart_user;

--
-- Name: shop_jobs_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: craftmart_user
--

ALTER SEQUENCE public.shop_jobs_id_seq OWNED BY public.shop_jobs.id;


--
-- Name: shops; Type: TABLE; Schema: public; Owner: craftmart_user
--

CREATE TABLE public.shops (
    id integer NOT NULL,
    job_item_id integer,
    cut_sheets jsonb,
    notes text,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    shop_number character varying(50),
    status character varying(50) DEFAULT 'generated'::character varying,
    generated_date timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT shops_status_check CHECK (((status)::text = ANY ((ARRAY['generated'::character varying, 'in_progress'::character varying, 'completed'::character varying])::text[])))
);


ALTER TABLE public.shops OWNER TO craftmart_user;

--
-- Name: shops_id_seq; Type: SEQUENCE; Schema: public; Owner: craftmart_user
--

CREATE SEQUENCE public.shops_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.shops_id_seq OWNER TO craftmart_user;

--
-- Name: shops_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: craftmart_user
--

ALTER SEQUENCE public.shops_id_seq OWNED BY public.shops.id;


--
-- Name: stair_board_types; Type: TABLE; Schema: public; Owner: craftmart_user
--

CREATE TABLE public.stair_board_types (
    id integer NOT NULL,
    brd_typ_id integer NOT NULL,
    brdtyp_des character varying(100) NOT NULL,
    purpose text,
    pric_riser boolean DEFAULT false,
    pric_bxris boolean DEFAULT false,
    pric_opris boolean DEFAULT false,
    pric_doris boolean DEFAULT false,
    is_active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.stair_board_types OWNER TO craftmart_user;

--
-- Name: TABLE stair_board_types; Type: COMMENT; Schema: public; Owner: craftmart_user
--

COMMENT ON TABLE public.stair_board_types IS 'Types of boards used in stair construction with pricing flags';


--
-- Name: stair_board_types_id_seq; Type: SEQUENCE; Schema: public; Owner: craftmart_user
--

CREATE SEQUENCE public.stair_board_types_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.stair_board_types_id_seq OWNER TO craftmart_user;

--
-- Name: stair_board_types_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: craftmart_user
--

ALTER SEQUENCE public.stair_board_types_id_seq OWNED BY public.stair_board_types.id;


--
-- Name: stair_config_items; Type: TABLE; Schema: public; Owner: craftmart_user
--

CREATE TABLE public.stair_config_items (
    id integer NOT NULL,
    config_id integer,
    item_type character varying(50) NOT NULL,
    riser_number integer,
    tread_type character varying(50),
    width numeric(6,2),
    length numeric(6,2),
    board_type_id integer,
    material_id integer,
    special_part_id integer,
    quantity numeric(10,2) DEFAULT 1,
    unit_price numeric(10,2),
    labor_price numeric(10,2),
    total_price numeric(10,2),
    notes text,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.stair_config_items OWNER TO craftmart_user;

--
-- Name: TABLE stair_config_items; Type: COMMENT; Schema: public; Owner: craftmart_user
--

COMMENT ON TABLE public.stair_config_items IS 'Individual items within a stair configuration';


--
-- Name: stair_config_items_id_seq; Type: SEQUENCE; Schema: public; Owner: craftmart_user
--

CREATE SEQUENCE public.stair_config_items_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.stair_config_items_id_seq OWNER TO craftmart_user;

--
-- Name: stair_config_items_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: craftmart_user
--

ALTER SEQUENCE public.stair_config_items_id_seq OWNED BY public.stair_config_items.id;


--
-- Name: stair_configurations; Type: TABLE; Schema: public; Owner: craftmart_user
--

CREATE TABLE public.stair_configurations (
    id integer NOT NULL,
    job_item_id integer,
    config_name character varying(255),
    floor_to_floor numeric(8,2) NOT NULL,
    num_risers integer NOT NULL,
    riser_height numeric(6,3) GENERATED ALWAYS AS ((floor_to_floor / (num_risers)::numeric)) STORED,
    tread_material_id integer,
    riser_material_id integer,
    tread_size character varying(100),
    nose_size numeric(6,3),
    stringer_type character varying(100),
    stringer_material_id integer,
    num_stringers integer DEFAULT 2,
    center_horses integer DEFAULT 0,
    full_mitre boolean DEFAULT false,
    bracket_type character varying(100),
    subtotal numeric(10,2),
    labor_total numeric(10,2),
    tax_amount numeric(10,2),
    total_amount numeric(10,2),
    special_notes text,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    rough_cut_width numeric(6,3),
    left_stringer_width numeric(6,3),
    left_stringer_thickness numeric(6,3),
    left_stringer_material_id integer,
    right_stringer_width numeric(6,3),
    right_stringer_thickness numeric(6,3),
    right_stringer_material_id integer,
    center_stringer_width numeric(6,3),
    center_stringer_thickness numeric(6,3),
    center_stringer_material_id integer,
    CONSTRAINT chk_nose_size CHECK (((nose_size >= 0.25) AND (nose_size <= 3.0))),
    CONSTRAINT chk_rough_cut_width CHECK (((rough_cut_width >= 6.0) AND (rough_cut_width <= 24.0)))
);


ALTER TABLE public.stair_configurations OWNER TO craftmart_user;

--
-- Name: TABLE stair_configurations; Type: COMMENT; Schema: public; Owner: craftmart_user
--

COMMENT ON TABLE public.stair_configurations IS 'Complete stair configurations linked to jobs';


--
-- Name: COLUMN stair_configurations.tread_size; Type: COMMENT; Schema: public; Owner: craftmart_user
--

COMMENT ON COLUMN public.stair_configurations.tread_size IS 'Legacy combined tread size string (maintained for compatibility)';


--
-- Name: COLUMN stair_configurations.nose_size; Type: COMMENT; Schema: public; Owner: craftmart_user
--

COMMENT ON COLUMN public.stair_configurations.nose_size IS 'Overhang/bullnose size in inches';


--
-- Name: COLUMN stair_configurations.rough_cut_width; Type: COMMENT; Schema: public; Owner: craftmart_user
--

COMMENT ON COLUMN public.stair_configurations.rough_cut_width IS 'Width of rough cut tread lumber in inches (before nose is added)';


--
-- Name: stair_configurations_id_seq; Type: SEQUENCE; Schema: public; Owner: craftmart_user
--

CREATE SEQUENCE public.stair_configurations_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.stair_configurations_id_seq OWNER TO craftmart_user;

--
-- Name: stair_configurations_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: craftmart_user
--

ALTER SEQUENCE public.stair_configurations_id_seq OWNED BY public.stair_configurations.id;


--
-- Name: stair_pricing_simple; Type: TABLE; Schema: public; Owner: craftmart_user
--

CREATE TABLE public.stair_pricing_simple (
    id integer NOT NULL,
    board_type_id integer NOT NULL,
    base_price numeric(10,2) NOT NULL,
    length_increment_price numeric(10,2) DEFAULT 1.50,
    width_increment_price numeric(10,2) DEFAULT 2.25,
    mitre_price numeric(10,2) DEFAULT 0,
    base_length integer DEFAULT 36,
    base_width integer DEFAULT 9,
    length_increment_size numeric(10,2) DEFAULT 6,
    is_active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    width_increment_size numeric(10,2) DEFAULT 1,
    CONSTRAINT chk_increment_sizes_positive CHECK (((length_increment_size > (0)::numeric) AND (width_increment_size > (0)::numeric)))
);


ALTER TABLE public.stair_pricing_simple OWNER TO craftmart_user;

--
-- Name: TABLE stair_pricing_simple; Type: COMMENT; Schema: public; Owner: craftmart_user
--

COMMENT ON TABLE public.stair_pricing_simple IS 'Simplified stair pricing with base + increment formula (replaced stair_board_prices)';


--
-- Name: COLUMN stair_pricing_simple.length_increment_size; Type: COMMENT; Schema: public; Owner: craftmart_user
--

COMMENT ON COLUMN public.stair_pricing_simple.length_increment_size IS 'Increment size in inches for length pricing (supports decimal values like 0.25)';


--
-- Name: COLUMN stair_pricing_simple.width_increment_size; Type: COMMENT; Schema: public; Owner: craftmart_user
--

COMMENT ON COLUMN public.stair_pricing_simple.width_increment_size IS 'Increment size in inches for width pricing (supports decimal values like 0.25)';


--
-- Name: stair_pricing_simple_id_seq; Type: SEQUENCE; Schema: public; Owner: craftmart_user
--

CREATE SEQUENCE public.stair_pricing_simple_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.stair_pricing_simple_id_seq OWNER TO craftmart_user;

--
-- Name: stair_pricing_simple_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: craftmart_user
--

ALTER SEQUENCE public.stair_pricing_simple_id_seq OWNED BY public.stair_pricing_simple.id;


--
-- Name: stair_special_parts; Type: TABLE; Schema: public; Owner: craftmart_user
--

CREATE TABLE public.stair_special_parts (
    id integer NOT NULL,
    stpart_id integer NOT NULL,
    stpar_desc character varying(100) NOT NULL,
    mat_seq_n integer,
    "position" character varying(10),
    unit_cost numeric(10,2) NOT NULL,
    labor_cost numeric(10,2) DEFAULT 0,
    is_active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.stair_special_parts OWNER TO craftmart_user;

--
-- Name: TABLE stair_special_parts; Type: COMMENT; Schema: public; Owner: craftmart_user
--

COMMENT ON TABLE public.stair_special_parts IS 'Special stair components like bull nose, brackets, etc.';


--
-- Name: stair_special_parts_id_seq; Type: SEQUENCE; Schema: public; Owner: craftmart_user
--

CREATE SEQUENCE public.stair_special_parts_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.stair_special_parts_id_seq OWNER TO craftmart_user;

--
-- Name: stair_special_parts_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: craftmart_user
--

ALTER SEQUENCE public.stair_special_parts_id_seq OWNED BY public.stair_special_parts.id;


--
-- Name: tax_rates; Type: TABLE; Schema: public; Owner: craftmart_user
--

CREATE TABLE public.tax_rates (
    id integer NOT NULL,
    state_code character varying(2) NOT NULL,
    rate numeric(5,4) NOT NULL,
    effective_date date DEFAULT CURRENT_DATE NOT NULL,
    is_active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT tax_rates_rate_check CHECK ((rate >= (0)::numeric))
);


ALTER TABLE public.tax_rates OWNER TO craftmart_user;

--
-- Name: tax_rates_id_seq; Type: SEQUENCE; Schema: public; Owner: craftmart_user
--

CREATE SEQUENCE public.tax_rates_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.tax_rates_id_seq OWNER TO craftmart_user;

--
-- Name: tax_rates_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: craftmart_user
--

ALTER SEQUENCE public.tax_rates_id_seq OWNED BY public.tax_rates.id;


--
-- Name: users; Type: TABLE; Schema: public; Owner: craftmart_user
--

CREATE TABLE public.users (
    id integer NOT NULL,
    email character varying(255) NOT NULL,
    password_hash character varying(255) NOT NULL,
    first_name character varying(100) NOT NULL,
    last_name character varying(100) NOT NULL,
    role character varying(50) DEFAULT 'employee'::character varying,
    is_active boolean DEFAULT true,
    last_login timestamp without time zone,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT users_role_check CHECK (((role)::text = ANY ((ARRAY['admin'::character varying, 'employee'::character varying])::text[])))
);


ALTER TABLE public.users OWNER TO craftmart_user;

--
-- Name: users_id_seq; Type: SEQUENCE; Schema: public; Owner: craftmart_user
--

CREATE SEQUENCE public.users_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.users_id_seq OWNER TO craftmart_user;

--
-- Name: users_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: craftmart_user
--

ALTER SEQUENCE public.users_id_seq OWNED BY public.users.id;


--
-- Name: customers id; Type: DEFAULT; Schema: public; Owner: craftmart_user
--

ALTER TABLE ONLY public.customers ALTER COLUMN id SET DEFAULT nextval('public.customers_id_seq'::regclass);


--
-- Name: deposit_allocations id; Type: DEFAULT; Schema: public; Owner: craftmart_user
--

ALTER TABLE ONLY public.deposit_allocations ALTER COLUMN id SET DEFAULT nextval('public.deposit_allocations_id_seq'::regclass);


--
-- Name: deposits id; Type: DEFAULT; Schema: public; Owner: craftmart_user
--

ALTER TABLE ONLY public.deposits ALTER COLUMN id SET DEFAULT nextval('public.deposits_id_seq'::regclass);


--
-- Name: handrail_products id; Type: DEFAULT; Schema: public; Owner: craftmart_user
--

ALTER TABLE ONLY public.handrail_products ALTER COLUMN id SET DEFAULT nextval('public.handrail_products_id_seq'::regclass);


--
-- Name: job_items id; Type: DEFAULT; Schema: public; Owner: craftmart_user
--

ALTER TABLE ONLY public.job_items ALTER COLUMN id SET DEFAULT nextval('public.jobs_id_seq'::regclass);


--
-- Name: job_sections id; Type: DEFAULT; Schema: public; Owner: craftmart_user
--

ALTER TABLE ONLY public.job_sections ALTER COLUMN id SET DEFAULT nextval('public.job_sections_id_seq'::regclass);


--
-- Name: jobs id; Type: DEFAULT; Schema: public; Owner: craftmart_user
--

ALTER TABLE ONLY public.jobs ALTER COLUMN id SET DEFAULT nextval('public.projects_id_seq'::regclass);


--
-- Name: landing_tread_products id; Type: DEFAULT; Schema: public; Owner: craftmart_user
--

ALTER TABLE ONLY public.landing_tread_products ALTER COLUMN id SET DEFAULT nextval('public.landing_tread_products_id_seq'::regclass);


--
-- Name: materials id; Type: DEFAULT; Schema: public; Owner: craftmart_user
--

ALTER TABLE ONLY public.materials ALTER COLUMN id SET DEFAULT nextval('public.materials_id_seq'::regclass);


--
-- Name: products id; Type: DEFAULT; Schema: public; Owner: craftmart_user
--

ALTER TABLE ONLY public.products ALTER COLUMN id SET DEFAULT nextval('public.products_id_seq'::regclass);


--
-- Name: quote_items id; Type: DEFAULT; Schema: public; Owner: craftmart_user
--

ALTER TABLE ONLY public.quote_items ALTER COLUMN id SET DEFAULT nextval('public.quote_items_id_seq'::regclass);


--
-- Name: rail_parts_products id; Type: DEFAULT; Schema: public; Owner: craftmart_user
--

ALTER TABLE ONLY public.rail_parts_products ALTER COLUMN id SET DEFAULT nextval('public.rail_parts_products_id_seq'::regclass);


--
-- Name: salesmen id; Type: DEFAULT; Schema: public; Owner: craftmart_user
--

ALTER TABLE ONLY public.salesmen ALTER COLUMN id SET DEFAULT nextval('public.salesmen_id_seq'::regclass);


--
-- Name: shop_jobs id; Type: DEFAULT; Schema: public; Owner: craftmart_user
--

ALTER TABLE ONLY public.shop_jobs ALTER COLUMN id SET DEFAULT nextval('public.shop_jobs_id_seq'::regclass);


--
-- Name: shops id; Type: DEFAULT; Schema: public; Owner: craftmart_user
--

ALTER TABLE ONLY public.shops ALTER COLUMN id SET DEFAULT nextval('public.shops_id_seq'::regclass);


--
-- Name: stair_board_types id; Type: DEFAULT; Schema: public; Owner: craftmart_user
--

ALTER TABLE ONLY public.stair_board_types ALTER COLUMN id SET DEFAULT nextval('public.stair_board_types_id_seq'::regclass);


--
-- Name: stair_config_items id; Type: DEFAULT; Schema: public; Owner: craftmart_user
--

ALTER TABLE ONLY public.stair_config_items ALTER COLUMN id SET DEFAULT nextval('public.stair_config_items_id_seq'::regclass);


--
-- Name: stair_configurations id; Type: DEFAULT; Schema: public; Owner: craftmart_user
--

ALTER TABLE ONLY public.stair_configurations ALTER COLUMN id SET DEFAULT nextval('public.stair_configurations_id_seq'::regclass);


--
-- Name: stair_pricing_simple id; Type: DEFAULT; Schema: public; Owner: craftmart_user
--

ALTER TABLE ONLY public.stair_pricing_simple ALTER COLUMN id SET DEFAULT nextval('public.stair_pricing_simple_id_seq'::regclass);


--
-- Name: stair_special_parts id; Type: DEFAULT; Schema: public; Owner: craftmart_user
--

ALTER TABLE ONLY public.stair_special_parts ALTER COLUMN id SET DEFAULT nextval('public.stair_special_parts_id_seq'::regclass);


--
-- Name: tax_rates id; Type: DEFAULT; Schema: public; Owner: craftmart_user
--

ALTER TABLE ONLY public.tax_rates ALTER COLUMN id SET DEFAULT nextval('public.tax_rates_id_seq'::regclass);


--
-- Name: users id; Type: DEFAULT; Schema: public; Owner: craftmart_user
--

ALTER TABLE ONLY public.users ALTER COLUMN id SET DEFAULT nextval('public.users_id_seq'::regclass);


--
-- Name: customers customers_pkey; Type: CONSTRAINT; Schema: public; Owner: craftmart_user
--

ALTER TABLE ONLY public.customers
    ADD CONSTRAINT customers_pkey PRIMARY KEY (id);


--
-- Name: deposit_allocations deposit_allocations_pkey; Type: CONSTRAINT; Schema: public; Owner: craftmart_user
--

ALTER TABLE ONLY public.deposit_allocations
    ADD CONSTRAINT deposit_allocations_pkey PRIMARY KEY (id);


--
-- Name: deposits deposits_pkey; Type: CONSTRAINT; Schema: public; Owner: craftmart_user
--

ALTER TABLE ONLY public.deposits
    ADD CONSTRAINT deposits_pkey PRIMARY KEY (id);


--
-- Name: handrail_products handrail_products_pkey; Type: CONSTRAINT; Schema: public; Owner: craftmart_user
--

ALTER TABLE ONLY public.handrail_products
    ADD CONSTRAINT handrail_products_pkey PRIMARY KEY (id);


--
-- Name: handrail_products handrail_products_product_id_key; Type: CONSTRAINT; Schema: public; Owner: craftmart_user
--

ALTER TABLE ONLY public.handrail_products
    ADD CONSTRAINT handrail_products_product_id_key UNIQUE (product_id);


--
-- Name: job_sections job_sections_pkey; Type: CONSTRAINT; Schema: public; Owner: craftmart_user
--

ALTER TABLE ONLY public.job_sections
    ADD CONSTRAINT job_sections_pkey PRIMARY KEY (id);


--
-- Name: job_items jobs_pkey; Type: CONSTRAINT; Schema: public; Owner: craftmart_user
--

ALTER TABLE ONLY public.job_items
    ADD CONSTRAINT jobs_pkey PRIMARY KEY (id);


--
-- Name: landing_tread_products landing_tread_products_pkey; Type: CONSTRAINT; Schema: public; Owner: craftmart_user
--

ALTER TABLE ONLY public.landing_tread_products
    ADD CONSTRAINT landing_tread_products_pkey PRIMARY KEY (id);


--
-- Name: landing_tread_products landing_tread_products_product_id_key; Type: CONSTRAINT; Schema: public; Owner: craftmart_user
--

ALTER TABLE ONLY public.landing_tread_products
    ADD CONSTRAINT landing_tread_products_product_id_key UNIQUE (product_id);


--
-- Name: material_multipliers material_multipliers_pkey; Type: CONSTRAINT; Schema: public; Owner: craftmart_user
--

ALTER TABLE ONLY public.material_multipliers
    ADD CONSTRAINT material_multipliers_pkey PRIMARY KEY (material_id);


--
-- Name: materials materials_pkey; Type: CONSTRAINT; Schema: public; Owner: craftmart_user
--

ALTER TABLE ONLY public.materials
    ADD CONSTRAINT materials_pkey PRIMARY KEY (id);


--
-- Name: products products_pkey; Type: CONSTRAINT; Schema: public; Owner: craftmart_user
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_pkey PRIMARY KEY (id);


--
-- Name: jobs projects_pkey; Type: CONSTRAINT; Schema: public; Owner: craftmart_user
--

ALTER TABLE ONLY public.jobs
    ADD CONSTRAINT projects_pkey PRIMARY KEY (id);


--
-- Name: quote_items quote_items_pkey; Type: CONSTRAINT; Schema: public; Owner: craftmart_user
--

ALTER TABLE ONLY public.quote_items
    ADD CONSTRAINT quote_items_pkey PRIMARY KEY (id);


--
-- Name: rail_parts_products rail_parts_products_pkey; Type: CONSTRAINT; Schema: public; Owner: craftmart_user
--

ALTER TABLE ONLY public.rail_parts_products
    ADD CONSTRAINT rail_parts_products_pkey PRIMARY KEY (id);


--
-- Name: rail_parts_products rail_parts_products_product_id_key; Type: CONSTRAINT; Schema: public; Owner: craftmart_user
--

ALTER TABLE ONLY public.rail_parts_products
    ADD CONSTRAINT rail_parts_products_product_id_key UNIQUE (product_id);


--
-- Name: salesmen salesmen_pkey; Type: CONSTRAINT; Schema: public; Owner: craftmart_user
--

ALTER TABLE ONLY public.salesmen
    ADD CONSTRAINT salesmen_pkey PRIMARY KEY (id);


--
-- Name: shop_jobs shop_jobs_pkey; Type: CONSTRAINT; Schema: public; Owner: craftmart_user
--

ALTER TABLE ONLY public.shop_jobs
    ADD CONSTRAINT shop_jobs_pkey PRIMARY KEY (id);


--
-- Name: shop_jobs shop_jobs_shop_id_job_id_key; Type: CONSTRAINT; Schema: public; Owner: craftmart_user
--

ALTER TABLE ONLY public.shop_jobs
    ADD CONSTRAINT shop_jobs_shop_id_job_id_key UNIQUE (shop_id, job_id);


--
-- Name: shops shops_pkey; Type: CONSTRAINT; Schema: public; Owner: craftmart_user
--

ALTER TABLE ONLY public.shops
    ADD CONSTRAINT shops_pkey PRIMARY KEY (id);


--
-- Name: stair_board_types stair_board_types_brd_typ_id_key; Type: CONSTRAINT; Schema: public; Owner: craftmart_user
--

ALTER TABLE ONLY public.stair_board_types
    ADD CONSTRAINT stair_board_types_brd_typ_id_key UNIQUE (brd_typ_id);


--
-- Name: stair_board_types stair_board_types_pkey; Type: CONSTRAINT; Schema: public; Owner: craftmart_user
--

ALTER TABLE ONLY public.stair_board_types
    ADD CONSTRAINT stair_board_types_pkey PRIMARY KEY (id);


--
-- Name: stair_config_items stair_config_items_pkey; Type: CONSTRAINT; Schema: public; Owner: craftmart_user
--

ALTER TABLE ONLY public.stair_config_items
    ADD CONSTRAINT stair_config_items_pkey PRIMARY KEY (id);


--
-- Name: stair_configurations stair_configurations_pkey; Type: CONSTRAINT; Schema: public; Owner: craftmart_user
--

ALTER TABLE ONLY public.stair_configurations
    ADD CONSTRAINT stair_configurations_pkey PRIMARY KEY (id);


--
-- Name: stair_pricing_simple stair_pricing_simple_board_type_id_key; Type: CONSTRAINT; Schema: public; Owner: craftmart_user
--

ALTER TABLE ONLY public.stair_pricing_simple
    ADD CONSTRAINT stair_pricing_simple_board_type_id_key UNIQUE (board_type_id);


--
-- Name: stair_pricing_simple stair_pricing_simple_pkey; Type: CONSTRAINT; Schema: public; Owner: craftmart_user
--

ALTER TABLE ONLY public.stair_pricing_simple
    ADD CONSTRAINT stair_pricing_simple_pkey PRIMARY KEY (id);


--
-- Name: stair_special_parts stair_special_parts_pkey; Type: CONSTRAINT; Schema: public; Owner: craftmart_user
--

ALTER TABLE ONLY public.stair_special_parts
    ADD CONSTRAINT stair_special_parts_pkey PRIMARY KEY (id);


--
-- Name: tax_rates tax_rates_pkey; Type: CONSTRAINT; Schema: public; Owner: craftmart_user
--

ALTER TABLE ONLY public.tax_rates
    ADD CONSTRAINT tax_rates_pkey PRIMARY KEY (id);


--
-- Name: users users_email_key; Type: CONSTRAINT; Schema: public; Owner: craftmart_user
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key UNIQUE (email);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: craftmart_user
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: idx_customers_email; Type: INDEX; Schema: public; Owner: craftmart_user
--

CREATE INDEX idx_customers_email ON public.customers USING btree (email);


--
-- Name: idx_customers_last_visited; Type: INDEX; Schema: public; Owner: craftmart_user
--

CREATE INDEX idx_customers_last_visited ON public.customers USING btree (last_visited_at DESC);


--
-- Name: idx_deposit_allocations_deposit_id; Type: INDEX; Schema: public; Owner: craftmart_user
--

CREATE INDEX idx_deposit_allocations_deposit_id ON public.deposit_allocations USING btree (deposit_id);


--
-- Name: idx_deposit_allocations_job_id; Type: INDEX; Schema: public; Owner: craftmart_user
--

CREATE INDEX idx_deposit_allocations_job_id ON public.deposit_allocations USING btree (job_id);


--
-- Name: idx_deposit_allocations_job_item_date; Type: INDEX; Schema: public; Owner: craftmart_user
--

CREATE INDEX idx_deposit_allocations_job_item_date ON public.deposit_allocations USING btree (job_item_id, allocation_date);


--
-- Name: idx_deposit_allocations_job_item_id; Type: INDEX; Schema: public; Owner: craftmart_user
--

CREATE INDEX idx_deposit_allocations_job_item_id ON public.deposit_allocations USING btree (job_item_id);


--
-- Name: idx_deposits_customer_check_number; Type: INDEX; Schema: public; Owner: craftmart_user
--

CREATE UNIQUE INDEX idx_deposits_customer_check_number ON public.deposits USING btree (customer_id, reference_number) WHERE (((payment_method)::text = 'check'::text) AND (reference_number IS NOT NULL));


--
-- Name: idx_deposits_customer_id; Type: INDEX; Schema: public; Owner: craftmart_user
--

CREATE INDEX idx_deposits_customer_id ON public.deposits USING btree (customer_id);


--
-- Name: idx_deposits_deposit_date; Type: INDEX; Schema: public; Owner: craftmart_user
--

CREATE INDEX idx_deposits_deposit_date ON public.deposits USING btree (deposit_date);


--
-- Name: idx_deposits_payment_date; Type: INDEX; Schema: public; Owner: craftmart_user
--

CREATE INDEX idx_deposits_payment_date ON public.deposits USING btree (payment_date);


--
-- Name: idx_deposits_payment_method; Type: INDEX; Schema: public; Owner: craftmart_user
--

CREATE INDEX idx_deposits_payment_method ON public.deposits USING btree (payment_method);


--
-- Name: idx_deposits_reference_number; Type: INDEX; Schema: public; Owner: craftmart_user
--

CREATE INDEX idx_deposits_reference_number ON public.deposits USING btree (reference_number);


--
-- Name: idx_handrail_products_product_id; Type: INDEX; Schema: public; Owner: craftmart_user
--

CREATE INDEX idx_handrail_products_product_id ON public.handrail_products USING btree (product_id);


--
-- Name: idx_job_items_created_at; Type: INDEX; Schema: public; Owner: craftmart_user
--

CREATE INDEX idx_job_items_created_at ON public.job_items USING btree (created_at DESC);


--
-- Name: idx_job_items_customer_id; Type: INDEX; Schema: public; Owner: craftmart_user
--

CREATE INDEX idx_job_items_customer_id ON public.job_items USING btree (customer_id);


--
-- Name: idx_job_items_delivery_date; Type: INDEX; Schema: public; Owner: craftmart_user
--

CREATE INDEX idx_job_items_delivery_date ON public.job_items USING btree (delivery_date);


--
-- Name: idx_job_items_due_date; Type: INDEX; Schema: public; Owner: craftmart_user
--

CREATE INDEX idx_job_items_due_date ON public.job_items USING btree (due_date);


--
-- Name: idx_job_items_invoice_date; Type: INDEX; Schema: public; Owner: craftmart_user
--

CREATE INDEX idx_job_items_invoice_date ON public.job_items USING btree (invoice_date);


--
-- Name: idx_job_items_job_id; Type: INDEX; Schema: public; Owner: craftmart_user
--

CREATE INDEX idx_job_items_job_id ON public.job_items USING btree (job_id);


--
-- Name: idx_job_items_po_number; Type: INDEX; Schema: public; Owner: craftmart_user
--

CREATE INDEX idx_job_items_po_number ON public.job_items USING btree (po_number);


--
-- Name: idx_job_items_salesman_id; Type: INDEX; Schema: public; Owner: craftmart_user
--

CREATE INDEX idx_job_items_salesman_id ON public.job_items USING btree (salesman_id);


--
-- Name: idx_job_items_status; Type: INDEX; Schema: public; Owner: craftmart_user
--

CREATE INDEX idx_job_items_status ON public.job_items USING btree (status);


--
-- Name: idx_job_sections_job_item_id; Type: INDEX; Schema: public; Owner: craftmart_user
--

CREATE INDEX idx_job_sections_job_item_id ON public.job_sections USING btree (job_item_id);


--
-- Name: idx_jobs_created_at; Type: INDEX; Schema: public; Owner: craftmart_user
--

CREATE INDEX idx_jobs_created_at ON public.jobs USING btree (created_at DESC);


--
-- Name: idx_jobs_customer_id; Type: INDEX; Schema: public; Owner: craftmart_user
--

CREATE INDEX idx_jobs_customer_id ON public.jobs USING btree (customer_id);


--
-- Name: idx_jobs_shops_run; Type: INDEX; Schema: public; Owner: craftmart_user
--

CREATE INDEX idx_jobs_shops_run ON public.job_items USING btree (shops_run);


--
-- Name: idx_jobs_shops_run_status; Type: INDEX; Schema: public; Owner: craftmart_user
--

CREATE INDEX idx_jobs_shops_run_status ON public.job_items USING btree (status, shops_run);


--
-- Name: idx_landing_tread_products_product_id; Type: INDEX; Schema: public; Owner: craftmart_user
--

CREATE INDEX idx_landing_tread_products_product_id ON public.landing_tread_products USING btree (product_id);


--
-- Name: idx_materials_active; Type: INDEX; Schema: public; Owner: craftmart_user
--

CREATE INDEX idx_materials_active ON public.materials USING btree (is_active);


--
-- Name: idx_products_active; Type: INDEX; Schema: public; Owner: craftmart_user
--

CREATE INDEX idx_products_active ON public.products USING btree (is_active);


--
-- Name: idx_products_type; Type: INDEX; Schema: public; Owner: craftmart_user
--

CREATE INDEX idx_products_type ON public.products USING btree (product_type);


--
-- Name: idx_quote_items_job_item_id; Type: INDEX; Schema: public; Owner: craftmart_user
--

CREATE INDEX idx_quote_items_job_item_id ON public.quote_items USING btree (job_item_id);


--
-- Name: idx_quote_items_material_id; Type: INDEX; Schema: public; Owner: craftmart_user
--

CREATE INDEX idx_quote_items_material_id ON public.quote_items USING btree (material_id);


--
-- Name: idx_quote_items_product_id; Type: INDEX; Schema: public; Owner: craftmart_user
--

CREATE INDEX idx_quote_items_product_id ON public.quote_items USING btree (product_id);


--
-- Name: idx_quote_items_stair_config; Type: INDEX; Schema: public; Owner: craftmart_user
--

CREATE INDEX idx_quote_items_stair_config ON public.quote_items USING btree (stair_config_id);


--
-- Name: idx_rail_parts_products_product_id; Type: INDEX; Schema: public; Owner: craftmart_user
--

CREATE INDEX idx_rail_parts_products_product_id ON public.rail_parts_products USING btree (product_id);


--
-- Name: idx_shop_jobs_job_id; Type: INDEX; Schema: public; Owner: craftmart_user
--

CREATE INDEX idx_shop_jobs_job_id ON public.shop_jobs USING btree (job_id);


--
-- Name: idx_shop_jobs_shop_id; Type: INDEX; Schema: public; Owner: craftmart_user
--

CREATE INDEX idx_shop_jobs_shop_id ON public.shop_jobs USING btree (shop_id);


--
-- Name: idx_shops_generated_date; Type: INDEX; Schema: public; Owner: craftmart_user
--

CREATE INDEX idx_shops_generated_date ON public.shops USING btree (generated_date);


--
-- Name: idx_shops_job_item_id; Type: INDEX; Schema: public; Owner: craftmart_user
--

CREATE INDEX idx_shops_job_item_id ON public.shops USING btree (job_item_id);


--
-- Name: idx_shops_status; Type: INDEX; Schema: public; Owner: craftmart_user
--

CREATE INDEX idx_shops_status ON public.shops USING btree (status);


--
-- Name: idx_stair_board_types_active; Type: INDEX; Schema: public; Owner: craftmart_user
--

CREATE INDEX idx_stair_board_types_active ON public.stair_board_types USING btree (is_active);


--
-- Name: idx_stair_board_types_id; Type: INDEX; Schema: public; Owner: craftmart_user
--

CREATE INDEX idx_stair_board_types_id ON public.stair_board_types USING btree (brd_typ_id);


--
-- Name: idx_stair_config_items_config; Type: INDEX; Schema: public; Owner: craftmart_user
--

CREATE INDEX idx_stair_config_items_config ON public.stair_config_items USING btree (config_id);


--
-- Name: idx_stair_config_items_type; Type: INDEX; Schema: public; Owner: craftmart_user
--

CREATE INDEX idx_stair_config_items_type ON public.stair_config_items USING btree (item_type);


--
-- Name: idx_stair_config_rough_cut; Type: INDEX; Schema: public; Owner: craftmart_user
--

CREATE INDEX idx_stair_config_rough_cut ON public.stair_configurations USING btree (rough_cut_width);


--
-- Name: idx_stair_configurations_job_item_id; Type: INDEX; Schema: public; Owner: craftmart_user
--

CREATE INDEX idx_stair_configurations_job_item_id ON public.stair_configurations USING btree (job_item_id);


--
-- Name: idx_stair_special_parts_active; Type: INDEX; Schema: public; Owner: craftmart_user
--

CREATE INDEX idx_stair_special_parts_active ON public.stair_special_parts USING btree (is_active);


--
-- Name: idx_stair_special_parts_lookup; Type: INDEX; Schema: public; Owner: craftmart_user
--

CREATE INDEX idx_stair_special_parts_lookup ON public.stair_special_parts USING btree (stpart_id, mat_seq_n);


--
-- Name: idx_users_email; Type: INDEX; Schema: public; Owner: craftmart_user
--

CREATE INDEX idx_users_email ON public.users USING btree (email);


--
-- Name: idx_users_role; Type: INDEX; Schema: public; Owner: craftmart_user
--

CREATE INDEX idx_users_role ON public.users USING btree (role);


--
-- Name: deposits_with_balance _RETURN; Type: RULE; Schema: public; Owner: craftmart_user
--

CREATE OR REPLACE VIEW public.deposits_with_balance AS
 SELECT d.id,
    d.customer_id,
    d.payment_method,
    d.reference_number,
    d.payment_date,
    d.total_amount,
    d.deposit_date,
    d.notes,
    d.created_by,
    d.created_at,
    d.updated_at,
    (d.total_amount - COALESCE(sum(da.amount), (0)::numeric)) AS unallocated_amount
   FROM (public.deposits d
     LEFT JOIN public.deposit_allocations da ON ((da.deposit_id = d.id)))
  GROUP BY d.id;


--
-- Name: deposit_allocations check_allocation_total_trigger; Type: TRIGGER; Schema: public; Owner: craftmart_user
--

CREATE TRIGGER check_allocation_total_trigger BEFORE INSERT OR UPDATE ON public.deposit_allocations FOR EACH ROW EXECUTE FUNCTION public.check_allocation_total();


--
-- Name: deposit_allocations check_item_allocation_total_trigger; Type: TRIGGER; Schema: public; Owner: craftmart_user
--

CREATE TRIGGER check_item_allocation_total_trigger BEFORE INSERT OR UPDATE ON public.deposit_allocations FOR EACH ROW EXECUTE FUNCTION public.check_item_allocation_total();


--
-- Name: job_items trg_set_invoice_dates_insert; Type: TRIGGER; Schema: public; Owner: craftmart_user
--

CREATE TRIGGER trg_set_invoice_dates_insert BEFORE INSERT ON public.job_items FOR EACH ROW EXECUTE FUNCTION public.set_invoice_dates();


--
-- Name: job_items trg_set_invoice_dates_update; Type: TRIGGER; Schema: public; Owner: craftmart_user
--

CREATE TRIGGER trg_set_invoice_dates_update BEFORE UPDATE ON public.job_items FOR EACH ROW EXECUTE FUNCTION public.set_invoice_dates();


--
-- Name: jobs trigger_update_projects_updated_at; Type: TRIGGER; Schema: public; Owner: craftmart_user
--

CREATE TRIGGER trigger_update_projects_updated_at BEFORE UPDATE ON public.jobs FOR EACH ROW EXECUTE FUNCTION public.update_projects_updated_at();


--
-- Name: deposit_allocations update_job_deposits_trigger; Type: TRIGGER; Schema: public; Owner: craftmart_user
--

CREATE TRIGGER update_job_deposits_trigger AFTER INSERT OR DELETE OR UPDATE ON public.deposit_allocations FOR EACH ROW EXECUTE FUNCTION public.update_job_deposit_totals();


--
-- Name: jobs update_projects_updated_at; Type: TRIGGER; Schema: public; Owner: craftmart_user
--

CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON public.jobs FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: deposit_allocations validate_deposit_allocation_links_trigger; Type: TRIGGER; Schema: public; Owner: craftmart_user
--

CREATE TRIGGER validate_deposit_allocation_links_trigger BEFORE INSERT OR UPDATE ON public.deposit_allocations FOR EACH ROW EXECUTE FUNCTION public.validate_deposit_allocation_links();


--
-- Name: deposit_allocations deposit_allocations_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: craftmart_user
--

ALTER TABLE ONLY public.deposit_allocations
    ADD CONSTRAINT deposit_allocations_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id);


--
-- Name: deposit_allocations deposit_allocations_deposit_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: craftmart_user
--

ALTER TABLE ONLY public.deposit_allocations
    ADD CONSTRAINT deposit_allocations_deposit_id_fkey FOREIGN KEY (deposit_id) REFERENCES public.deposits(id) ON DELETE CASCADE;


--
-- Name: deposit_allocations deposit_allocations_job_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: craftmart_user
--

ALTER TABLE ONLY public.deposit_allocations
    ADD CONSTRAINT deposit_allocations_job_id_fkey FOREIGN KEY (job_id) REFERENCES public.jobs(id) ON DELETE CASCADE;


--
-- Name: deposit_allocations deposit_allocations_job_item_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: craftmart_user
--

ALTER TABLE ONLY public.deposit_allocations
    ADD CONSTRAINT deposit_allocations_job_item_id_fkey FOREIGN KEY (job_item_id) REFERENCES public.job_items(id) ON DELETE CASCADE;


--
-- Name: deposits deposits_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: craftmart_user
--

ALTER TABLE ONLY public.deposits
    ADD CONSTRAINT deposits_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id);


--
-- Name: deposits deposits_customer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: craftmart_user
--

ALTER TABLE ONLY public.deposits
    ADD CONSTRAINT deposits_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES public.customers(id) ON DELETE CASCADE;


--
-- Name: handrail_products handrail_products_product_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: craftmart_user
--

ALTER TABLE ONLY public.handrail_products
    ADD CONSTRAINT handrail_products_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE CASCADE;


--
-- Name: job_items job_items_job_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: craftmart_user
--

ALTER TABLE ONLY public.job_items
    ADD CONSTRAINT job_items_job_id_fkey FOREIGN KEY (job_id) REFERENCES public.jobs(id) ON DELETE CASCADE;


--
-- Name: job_sections job_sections_job_item_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: craftmart_user
--

ALTER TABLE ONLY public.job_sections
    ADD CONSTRAINT job_sections_job_item_id_fkey FOREIGN KEY (job_item_id) REFERENCES public.job_items(id) ON DELETE CASCADE;


--
-- Name: job_items jobs_customer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: craftmart_user
--

ALTER TABLE ONLY public.job_items
    ADD CONSTRAINT jobs_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES public.customers(id) ON DELETE CASCADE;


--
-- Name: job_items jobs_salesman_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: craftmart_user
--

ALTER TABLE ONLY public.job_items
    ADD CONSTRAINT jobs_salesman_id_fkey FOREIGN KEY (salesman_id) REFERENCES public.salesmen(id);


--
-- Name: landing_tread_products landing_tread_products_product_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: craftmart_user
--

ALTER TABLE ONLY public.landing_tread_products
    ADD CONSTRAINT landing_tread_products_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE CASCADE;


--
-- Name: jobs projects_customer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: craftmart_user
--

ALTER TABLE ONLY public.jobs
    ADD CONSTRAINT projects_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES public.customers(id) ON DELETE RESTRICT;


--
-- Name: quote_items quote_items_job_item_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: craftmart_user
--

ALTER TABLE ONLY public.quote_items
    ADD CONSTRAINT quote_items_job_item_id_fkey FOREIGN KEY (job_item_id) REFERENCES public.job_items(id) ON DELETE CASCADE;


--
-- Name: quote_items quote_items_material_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: craftmart_user
--

ALTER TABLE ONLY public.quote_items
    ADD CONSTRAINT quote_items_material_id_fkey FOREIGN KEY (material_id) REFERENCES public.materials(id);


--
-- Name: quote_items quote_items_product_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: craftmart_user
--

ALTER TABLE ONLY public.quote_items
    ADD CONSTRAINT quote_items_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id);


--
-- Name: quote_items quote_items_section_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: craftmart_user
--

ALTER TABLE ONLY public.quote_items
    ADD CONSTRAINT quote_items_section_id_fkey FOREIGN KEY (section_id) REFERENCES public.job_sections(id) ON DELETE CASCADE;


--
-- Name: quote_items quote_items_stair_config_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: craftmart_user
--

ALTER TABLE ONLY public.quote_items
    ADD CONSTRAINT quote_items_stair_config_id_fkey FOREIGN KEY (stair_config_id) REFERENCES public.stair_configurations(id) ON DELETE SET NULL;


--
-- Name: rail_parts_products rail_parts_products_product_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: craftmart_user
--

ALTER TABLE ONLY public.rail_parts_products
    ADD CONSTRAINT rail_parts_products_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE CASCADE;


--
-- Name: shop_jobs shop_jobs_job_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: craftmart_user
--

ALTER TABLE ONLY public.shop_jobs
    ADD CONSTRAINT shop_jobs_job_id_fkey FOREIGN KEY (job_id) REFERENCES public.job_items(id) ON DELETE CASCADE;


--
-- Name: shop_jobs shop_jobs_shop_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: craftmart_user
--

ALTER TABLE ONLY public.shop_jobs
    ADD CONSTRAINT shop_jobs_shop_id_fkey FOREIGN KEY (shop_id) REFERENCES public.shops(id) ON DELETE CASCADE;


--
-- Name: shops shops_job_item_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: craftmart_user
--

ALTER TABLE ONLY public.shops
    ADD CONSTRAINT shops_job_item_id_fkey FOREIGN KEY (job_item_id) REFERENCES public.job_items(id) ON DELETE CASCADE;


--
-- Name: stair_config_items stair_config_items_board_type_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: craftmart_user
--

ALTER TABLE ONLY public.stair_config_items
    ADD CONSTRAINT stair_config_items_board_type_id_fkey FOREIGN KEY (board_type_id) REFERENCES public.stair_board_types(brd_typ_id);


--
-- Name: stair_config_items stair_config_items_config_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: craftmart_user
--

ALTER TABLE ONLY public.stair_config_items
    ADD CONSTRAINT stair_config_items_config_id_fkey FOREIGN KEY (config_id) REFERENCES public.stair_configurations(id) ON DELETE CASCADE;


--
-- Name: stair_config_items stair_config_items_material_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: craftmart_user
--

ALTER TABLE ONLY public.stair_config_items
    ADD CONSTRAINT stair_config_items_material_id_fkey FOREIGN KEY (material_id) REFERENCES public.material_multipliers(material_id);


--
-- Name: stair_configurations stair_configurations_center_stringer_material_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: craftmart_user
--

ALTER TABLE ONLY public.stair_configurations
    ADD CONSTRAINT stair_configurations_center_stringer_material_id_fkey FOREIGN KEY (center_stringer_material_id) REFERENCES public.material_multipliers(material_id);


--
-- Name: stair_configurations stair_configurations_job_item_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: craftmart_user
--

ALTER TABLE ONLY public.stair_configurations
    ADD CONSTRAINT stair_configurations_job_item_id_fkey FOREIGN KEY (job_item_id) REFERENCES public.job_items(id) ON DELETE CASCADE;


--
-- Name: stair_configurations stair_configurations_left_stringer_material_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: craftmart_user
--

ALTER TABLE ONLY public.stair_configurations
    ADD CONSTRAINT stair_configurations_left_stringer_material_id_fkey FOREIGN KEY (left_stringer_material_id) REFERENCES public.material_multipliers(material_id);


--
-- Name: stair_configurations stair_configurations_right_stringer_material_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: craftmart_user
--

ALTER TABLE ONLY public.stair_configurations
    ADD CONSTRAINT stair_configurations_right_stringer_material_id_fkey FOREIGN KEY (right_stringer_material_id) REFERENCES public.material_multipliers(material_id);


--
-- Name: stair_configurations stair_configurations_riser_material_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: craftmart_user
--

ALTER TABLE ONLY public.stair_configurations
    ADD CONSTRAINT stair_configurations_riser_material_id_fkey FOREIGN KEY (riser_material_id) REFERENCES public.material_multipliers(material_id);


--
-- Name: stair_configurations stair_configurations_stringer_material_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: craftmart_user
--

ALTER TABLE ONLY public.stair_configurations
    ADD CONSTRAINT stair_configurations_stringer_material_id_fkey FOREIGN KEY (stringer_material_id) REFERENCES public.material_multipliers(material_id);


--
-- Name: stair_configurations stair_configurations_tread_material_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: craftmart_user
--

ALTER TABLE ONLY public.stair_configurations
    ADD CONSTRAINT stair_configurations_tread_material_id_fkey FOREIGN KEY (tread_material_id) REFERENCES public.material_multipliers(material_id);


--
-- Name: stair_pricing_simple stair_pricing_simple_board_type_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: craftmart_user
--

ALTER TABLE ONLY public.stair_pricing_simple
    ADD CONSTRAINT stair_pricing_simple_board_type_id_fkey FOREIGN KEY (board_type_id) REFERENCES public.stair_board_types(brd_typ_id);


--
-- Name: stair_special_parts stair_special_parts_mat_seq_n_fkey; Type: FK CONSTRAINT; Schema: public; Owner: craftmart_user
--

ALTER TABLE ONLY public.stair_special_parts
    ADD CONSTRAINT stair_special_parts_mat_seq_n_fkey FOREIGN KEY (mat_seq_n) REFERENCES public.material_multipliers(material_id);


--
-- PostgreSQL database dump complete
--

