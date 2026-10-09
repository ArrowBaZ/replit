--
-- PostgreSQL database dump
--

\restrict lEePJULApCDK5JruHGizwn9lPo54wDmr7TcpY5u9ukZ88pekcXjNYpd8CnbBADa

-- Dumped from database version 16.10
-- Dumped by pg_dump version 16.10

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

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: admin_settings; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.admin_settings (
    id integer NOT NULL,
    setting_key character varying(100) NOT NULL,
    setting_value text NOT NULL,
    description text,
    updated_by character varying,
    updated_at timestamp without time zone DEFAULT now()
);


--
-- Name: admin_settings_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.admin_settings_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: admin_settings_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.admin_settings_id_seq OWNED BY public.admin_settings.id;


--
-- Name: agreement_signatures; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.agreement_signatures (
    id integer NOT NULL,
    agreement_id integer NOT NULL,
    user_id character varying NOT NULL,
    role character varying(20) NOT NULL,
    signed_at timestamp without time zone DEFAULT now(),
    ip_address character varying(50)
);


--
-- Name: agreement_signatures_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.agreement_signatures_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: agreement_signatures_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.agreement_signatures_id_seq OWNED BY public.agreement_signatures.id;


--
-- Name: agreements; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.agreements (
    id integer NOT NULL,
    request_id integer NOT NULL,
    seller_id character varying NOT NULL,
    marchand_id character varying NOT NULL,
    status character varying(30) DEFAULT 'pending'::character varying NOT NULL,
    item_count integer NOT NULL,
    total_value numeric NOT NULL,
    items_snapshot text NOT NULL,
    fee_breakdown text,
    generated_at timestamp without time zone DEFAULT now(),
    deadline_days integer,
    deadline_date timestamp without time zone
);


--
-- Name: agreements_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.agreements_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: agreements_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.agreements_id_seq OWNED BY public.agreements.id;


--
-- Name: email_verification_codes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.email_verification_codes (
    id character varying NOT NULL,
    user_id character varying NOT NULL,
    code character varying(6) NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    expires_at timestamp without time zone NOT NULL,
    verified_at timestamp without time zone
);


--
-- Name: fee_tier_changelog; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.fee_tier_changelog (
    id integer NOT NULL,
    fee_tier_id integer,
    admin_id character varying NOT NULL,
    action character varying(20) NOT NULL,
    previous_values jsonb,
    new_values jsonb,
    changed_at timestamp without time zone DEFAULT now()
);


--
-- Name: fee_tier_changelog_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.fee_tier_changelog_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: fee_tier_changelog_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.fee_tier_changelog_id_seq OWNED BY public.fee_tier_changelog.id;


--
-- Name: fee_tiers; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.fee_tiers (
    id integer NOT NULL,
    label character varying(100) NOT NULL,
    min_price numeric NOT NULL,
    max_price numeric,
    seller_percent numeric NOT NULL,
    marchand_percent numeric NOT NULL,
    platform_percent numeric NOT NULL,
    currency_note character varying(50) DEFAULT 'EUR/CHF'::character varying,
    is_active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT now()
);


--
-- Name: fee_tiers_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.fee_tiers_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: fee_tiers_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.fee_tiers_id_seq OWNED BY public.fee_tiers.id;


--
-- Name: item_document_requests; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.item_document_requests (
    id integer NOT NULL,
    item_id integer NOT NULL,
    marchand_id character varying NOT NULL,
    created_at timestamp without time zone DEFAULT now(),
    document_type character varying(50) DEFAULT 'authenticity_certificate'::character varying,
    status character varying(20) DEFAULT 'pending'::character varying
);


--
-- Name: item_document_requests_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.item_document_requests_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: item_document_requests_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.item_document_requests_id_seq OWNED BY public.item_document_requests.id;


--
-- Name: item_documents; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.item_documents (
    id integer NOT NULL,
    item_id integer NOT NULL,
    uploader_user_id character varying NOT NULL,
    file_name character varying(255) NOT NULL,
    file_url text NOT NULL,
    file_type character varying(20) NOT NULL,
    file_size integer,
    created_at timestamp without time zone DEFAULT now()
);


--
-- Name: item_documents_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.item_documents_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: item_documents_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.item_documents_id_seq OWNED BY public.item_documents.id;


--
-- Name: item_price_offers; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.item_price_offers (
    id integer NOT NULL,
    item_id integer NOT NULL,
    proposed_by_user_id character varying NOT NULL,
    proposed_by_role character varying(20) NOT NULL,
    min_price numeric,
    max_price numeric,
    action character varying(30) NOT NULL,
    created_at timestamp without time zone DEFAULT now()
);


--
-- Name: item_price_offers_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.item_price_offers_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: item_price_offers_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.item_price_offers_id_seq OWNED BY public.item_price_offers.id;


--
-- Name: items; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.items (
    id integer NOT NULL,
    request_id integer,
    seller_id character varying NOT NULL,
    marchand_id character varying,
    title character varying(255) NOT NULL,
    description text,
    brand character varying(100),
    size character varying(50),
    category character varying(50) NOT NULL,
    condition character varying(20),
    photos text[],
    certificate_photos text[],
    material character varying(100),
    dimensions character varying(100),
    author character varying(100),
    genre character varying(100),
    language character varying(50),
    vintage character varying(50),
    age_range character varying(50),
    model character varying(100),
    device_storage character varying(50),
    ram character varying(50),
    volume character varying(50),
    frame_size character varying(50),
    instrument_type character varying(100),
    appliance_type character varying(100),
    decor_style character varying(100),
    subcategory character varying(100),
    min_price numeric,
    max_price numeric,
    approved_price numeric,
    price_approved_by_seller boolean DEFAULT false,
    marchand_price_approved boolean DEFAULT false,
    marchand_rejection_reason text,
    has_insurance boolean DEFAULT false,
    insurance_cost numeric,
    seller_counter_offer boolean DEFAULT false,
    decline_reason text,
    status character varying(20) DEFAULT 'pending_approval'::character varying NOT NULL,
    version integer DEFAULT 1 NOT NULL,
    deleted_at timestamp without time zone,
    listed_at timestamp without time zone,
    sold_at timestamp without time zone,
    sale_price numeric,
    platform_listed_on character varying(100),
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now(),
    platform_only boolean DEFAULT false,
    unsold_action character varying(20) DEFAULT 'return'::character varying
);


--
-- Name: items_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.items_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: items_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.items_id_seq OWNED BY public.items.id;


--
-- Name: meetings; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.meetings (
    id integer NOT NULL,
    request_id integer NOT NULL,
    scheduled_date timestamp without time zone NOT NULL,
    location text NOT NULL,
    duration integer DEFAULT 60,
    status character varying(20) DEFAULT 'scheduled'::character varying NOT NULL,
    notes text,
    created_at timestamp without time zone DEFAULT now()
);


--
-- Name: meetings_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.meetings_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: meetings_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.meetings_id_seq OWNED BY public.meetings.id;


--
-- Name: messages; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.messages (
    id integer NOT NULL,
    sender_id character varying NOT NULL,
    receiver_id character varying NOT NULL,
    request_id integer,
    content text NOT NULL,
    is_read boolean DEFAULT false,
    created_at timestamp without time zone DEFAULT now()
);


--
-- Name: messages_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.messages_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: messages_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.messages_id_seq OWNED BY public.messages.id;


--
-- Name: moderation_actions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.moderation_actions (
    id integer NOT NULL,
    request_id integer NOT NULL,
    admin_id character varying NOT NULL,
    action character varying(20) NOT NULL,
    reason text,
    metadata text,
    created_at timestamp without time zone DEFAULT now()
);


--
-- Name: moderation_actions_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.moderation_actions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: moderation_actions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.moderation_actions_id_seq OWNED BY public.moderation_actions.id;


--
-- Name: notifications; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.notifications (
    id integer NOT NULL,
    user_id character varying NOT NULL,
    type character varying(50) NOT NULL,
    title character varying(255) NOT NULL,
    message text NOT NULL,
    link character varying(500),
    is_read boolean DEFAULT false,
    created_at timestamp without time zone DEFAULT now()
);


--
-- Name: notifications_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.notifications_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: notifications_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.notifications_id_seq OWNED BY public.notifications.id;


--
-- Name: password_reset_tokens; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.password_reset_tokens (
    id character varying NOT NULL,
    user_id character varying NOT NULL,
    token character varying(64) NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    expires_at timestamp without time zone NOT NULL,
    used_at timestamp without time zone
);


--
-- Name: profiles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.profiles (
    id integer NOT NULL,
    user_id character varying NOT NULL,
    role character varying(20) NOT NULL,
    phone character varying(20),
    address text,
    city character varying(100),
    postal_code character varying(10),
    department character varying(100),
    bio text,
    experience text,
    siret_number character varying(20),
    vat_number character varying(20),
    dvi_number character varying(20),
    status character varying(20) DEFAULT 'approved'::character varying,
    preferred_contact_method character varying(20),
    notification_prefs jsonb,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now(),
    leboncoin_url text,
    vinted_url text,
    ricardo_url text
);


--
-- Name: profiles_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.profiles_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: profiles_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.profiles_id_seq OWNED BY public.profiles.id;


--
-- Name: requests; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.requests (
    id integer NOT NULL,
    seller_id character varying NOT NULL,
    marchand_id character varying,
    service_type character varying(20) NOT NULL,
    status character varying(20) DEFAULT 'pending'::character varying NOT NULL,
    item_count integer NOT NULL,
    estimated_value numeric,
    categories text[],
    item_condition character varying(20),
    brands text,
    meeting_location text,
    preferred_date_start timestamp without time zone,
    preferred_date_end timestamp without time zone,
    notes text,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now(),
    completed_at timestamp without time zone,
    list_ready_at timestamp without time zone,
    deadline_days integer DEFAULT 30,
    deadline_date timestamp without time zone,
    seller_counter_deadline boolean DEFAULT false,
    seller_proposed_deadline_days integer,
    marchand_counter_deadline boolean DEFAULT false,
    marchand_proposed_deadline_days integer,
    deadline_offer_count integer DEFAULT 0
);


--
-- Name: requests_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.requests_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: requests_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.requests_id_seq OWNED BY public.requests.id;


--
-- Name: reviews; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.reviews (
    id integer NOT NULL,
    request_id integer NOT NULL,
    seller_id character varying NOT NULL,
    marchand_id character varying NOT NULL,
    rating integer NOT NULL,
    comment text,
    communication_rating integer,
    reliability_rating integer,
    handling_rating integer,
    created_at timestamp without time zone DEFAULT now()
);


--
-- Name: reviews_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.reviews_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: reviews_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.reviews_id_seq OWNED BY public.reviews.id;


--
-- Name: sessions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.sessions (
    "sessionToken" text NOT NULL,
    "userId" character varying NOT NULL,
    expires timestamp without time zone NOT NULL
);


--
-- Name: transactions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.transactions (
    id integer NOT NULL,
    item_id integer,
    request_id integer,
    seller_id character varying NOT NULL,
    marchand_id character varying NOT NULL,
    sale_price numeric NOT NULL,
    seller_earning numeric NOT NULL,
    marchand_earning numeric NOT NULL,
    platform_earning numeric,
    fee_tier_id integer,
    seller_percent numeric,
    marchand_percent numeric,
    platform_percent numeric,
    status character varying(20) DEFAULT 'completed'::character varying NOT NULL,
    created_at timestamp without time zone DEFAULT now()
);


--
-- Name: transactions_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.transactions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: transactions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.transactions_id_seq OWNED BY public.transactions.id;


--
-- Name: users; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.users (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    email character varying,
    password_hash character varying,
    first_name character varying,
    last_name character varying,
    profile_image_url character varying,
    email_verified timestamp without time zone,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


--
-- Name: admin_settings id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.admin_settings ALTER COLUMN id SET DEFAULT nextval('public.admin_settings_id_seq'::regclass);


--
-- Name: agreement_signatures id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.agreement_signatures ALTER COLUMN id SET DEFAULT nextval('public.agreement_signatures_id_seq'::regclass);


--
-- Name: agreements id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.agreements ALTER COLUMN id SET DEFAULT nextval('public.agreements_id_seq'::regclass);


--
-- Name: fee_tier_changelog id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fee_tier_changelog ALTER COLUMN id SET DEFAULT nextval('public.fee_tier_changelog_id_seq'::regclass);


--
-- Name: fee_tiers id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fee_tiers ALTER COLUMN id SET DEFAULT nextval('public.fee_tiers_id_seq'::regclass);


--
-- Name: item_document_requests id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.item_document_requests ALTER COLUMN id SET DEFAULT nextval('public.item_document_requests_id_seq'::regclass);


--
-- Name: item_documents id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.item_documents ALTER COLUMN id SET DEFAULT nextval('public.item_documents_id_seq'::regclass);


--
-- Name: item_price_offers id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.item_price_offers ALTER COLUMN id SET DEFAULT nextval('public.item_price_offers_id_seq'::regclass);


--
-- Name: items id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.items ALTER COLUMN id SET DEFAULT nextval('public.items_id_seq'::regclass);


--
-- Name: meetings id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.meetings ALTER COLUMN id SET DEFAULT nextval('public.meetings_id_seq'::regclass);


--
-- Name: messages id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.messages ALTER COLUMN id SET DEFAULT nextval('public.messages_id_seq'::regclass);


--
-- Name: moderation_actions id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.moderation_actions ALTER COLUMN id SET DEFAULT nextval('public.moderation_actions_id_seq'::regclass);


--
-- Name: notifications id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notifications ALTER COLUMN id SET DEFAULT nextval('public.notifications_id_seq'::regclass);


--
-- Name: profiles id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profiles ALTER COLUMN id SET DEFAULT nextval('public.profiles_id_seq'::regclass);


--
-- Name: requests id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.requests ALTER COLUMN id SET DEFAULT nextval('public.requests_id_seq'::regclass);


--
-- Name: reviews id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reviews ALTER COLUMN id SET DEFAULT nextval('public.reviews_id_seq'::regclass);


--
-- Name: transactions id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.transactions ALTER COLUMN id SET DEFAULT nextval('public.transactions_id_seq'::regclass);


--
-- Data for Name: admin_settings; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.admin_settings (id, setting_key, setting_value, description, updated_by, updated_at) FROM stdin;
\.


--
-- Data for Name: agreement_signatures; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.agreement_signatures (id, agreement_id, user_id, role, signed_at, ip_address) FROM stdin;
1	3	3a91fb81-f02b-4c66-8d89-d655bfcf9670	marchand	2026-06-15 13:20:22.667773	82.96.140.115
2	3	41697b1c-eb26-4e38-82e9-80c05df19249	seller	2026-06-15 13:20:55.100488	82.96.140.115
\.


--
-- Data for Name: agreements; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.agreements (id, request_id, seller_id, marchand_id, status, item_count, total_value, items_snapshot, fee_breakdown, generated_at, deadline_days, deadline_date) FROM stdin;
1	8	41697b1c-eb26-4e38-82e9-80c05df19249	3a91fb81-f02b-4c66-8d89-d655bfcf9670	pending	1	100.00	[{"id":19,"title":"Veste","approvedPrice":100,"fees":{"sellerAmount":50,"marchantAmount":40,"platformAmount":10,"sellerPct":50,"marchantPct":40,"platformPct":10}}]	[{"itemId":19,"title":"Veste","salePrice":100,"fees":{"sellerAmount":50,"marchantAmount":40,"platformAmount":10,"sellerPct":50,"marchantPct":40,"platformPct":10}}]	2026-06-09 12:23:39.263213	\N	\N
2	7	41697b1c-eb26-4e38-82e9-80c05df19249	3a91fb81-f02b-4c66-8d89-d655bfcf9670	pending	3	1950.00	[{"id":16,"title":"Vine","approvedPrice":1500,"hasInsurance":false,"insuranceCost":0,"fees":{"sellerAmount":900,"marchantAmount":450,"platformAmount":150,"sellerPct":60,"marchantPct":30,"platformPct":10}},{"id":15,"title":"aaa","approvedPrice":300,"hasInsurance":false,"insuranceCost":0,"fees":{"sellerAmount":165,"marchantAmount":105,"platformAmount":30,"sellerPct":55,"marchantPct":35,"platformPct":10}},{"id":14,"title":"cravate","approvedPrice":150,"hasInsurance":false,"insuranceCost":0,"fees":{"sellerAmount":75,"marchantAmount":60,"platformAmount":15,"sellerPct":50,"marchantPct":40,"platformPct":10}}]	[{"itemId":16,"title":"Vine","salePrice":1500,"hasInsurance":false,"insuranceCost":0,"fees":{"sellerAmount":900,"marchantAmount":450,"platformAmount":150,"sellerPct":60,"marchantPct":30,"platformPct":10}},{"itemId":15,"title":"aaa","salePrice":300,"hasInsurance":false,"insuranceCost":0,"fees":{"sellerAmount":165,"marchantAmount":105,"platformAmount":30,"sellerPct":55,"marchantPct":35,"platformPct":10}},{"itemId":14,"title":"cravate","salePrice":150,"hasInsurance":false,"insuranceCost":0,"fees":{"sellerAmount":75,"marchantAmount":60,"platformAmount":15,"sellerPct":50,"marchantPct":40,"platformPct":10}}]	2026-06-10 08:40:17.622374	\N	\N
3	9	41697b1c-eb26-4e38-82e9-80c05df19249	3a91fb81-f02b-4c66-8d89-d655bfcf9670	fully_signed	1	125.00	[{"id":20,"title":"Pull","approvedPrice":125,"hasInsurance":false,"insuranceCost":0,"fees":{"sellerAmount":62.5,"marchantAmount":50,"platformAmount":12.5,"sellerPct":50,"marchantPct":40,"platformPct":10}}]	[{"itemId":20,"title":"Pull","salePrice":125,"hasInsurance":false,"insuranceCost":0,"fees":{"sellerAmount":62.5,"marchantAmount":50,"platformAmount":12.5,"sellerPct":50,"marchantPct":40,"platformPct":10}}]	2026-06-15 13:18:15.184557	\N	\N
4	11	41697b1c-eb26-4e38-82e9-80c05df19249	3a91fb81-f02b-4c66-8d89-d655bfcf9670	pending	2	1000.00	[{"id":25,"title":"aaaa","approvedPrice":0,"hasInsurance":false,"insuranceCost":0,"fees":{"sellerAmount":0,"marchantAmount":0,"platformAmount":0,"sellerPct":50,"marchantPct":40,"platformPct":10}},{"id":24,"title":"Air max","approvedPrice":1000,"hasInsurance":false,"insuranceCost":0,"fees":{"sellerAmount":600,"marchantAmount":300,"platformAmount":100,"sellerPct":60,"marchantPct":30,"platformPct":10}}]	[{"itemId":25,"title":"aaaa","salePrice":0,"hasInsurance":false,"insuranceCost":0,"fees":{"sellerAmount":0,"marchantAmount":0,"platformAmount":0,"sellerPct":50,"marchantPct":40,"platformPct":10}},{"itemId":24,"title":"Air max","salePrice":1000,"hasInsurance":false,"insuranceCost":0,"fees":{"sellerAmount":600,"marchantAmount":300,"platformAmount":100,"sellerPct":60,"marchantPct":30,"platformPct":10}}]	2026-06-15 13:25:20.565913	\N	\N
5	13	41697b1c-eb26-4e38-82e9-80c05df19249	3a91fb81-f02b-4c66-8d89-d655bfcf9670	pending	1	200.00	[{"id":26,"title":"Air Max","approvedPrice":200,"hasInsurance":false,"insuranceCost":0,"unsoldAction":"return","fees":{"sellerAmount":110,"marchantAmount":70,"platformAmount":20,"sellerPct":55,"marchantPct":35,"platformPct":10}}]	[{"itemId":26,"title":"Air Max","salePrice":200,"hasInsurance":false,"insuranceCost":0,"unsoldAction":"return","fees":{"sellerAmount":110,"marchantAmount":70,"platformAmount":20,"sellerPct":55,"marchantPct":35,"platformPct":10}}]	2026-06-16 15:05:27.561222	\N	\N
\.


--
-- Data for Name: email_verification_codes; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.email_verification_codes (id, user_id, code, created_at, expires_at, verified_at) FROM stdin;
ca6ce0cc-4bb7-4f8d-b21d-3cd2e9320163	e760e126-819d-4bbd-a55e-0bf6ce2b387c	460102	2026-06-11 08:18:45.753691	2026-06-11 08:28:45.753	\N
\.


--
-- Data for Name: fee_tier_changelog; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.fee_tier_changelog (id, fee_tier_id, admin_id, action, previous_values, new_values, changed_at) FROM stdin;
\.


--
-- Data for Name: fee_tiers; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.fee_tiers (id, label, min_price, max_price, seller_percent, marchand_percent, platform_percent, currency_note, is_active, created_at) FROM stdin;
4	Tier 1 : 0 – 150 €	0	150	50	40	10	EUR/CHF	t	2026-05-29 08:24:09.740949
5	Tier 2 : 151 – 500 €	151	500	55	35	10	EUR/CHF	t	2026-05-29 08:24:09.740949
6	Tier 3 : 501 € +	501	\N	60	30	10	EUR/CHF	t	2026-05-29 08:24:09.740949
\.


--
-- Data for Name: item_document_requests; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.item_document_requests (id, item_id, marchand_id, created_at, document_type, status) FROM stdin;
1	13	3a91fb81-f02b-4c66-8d89-d655bfcf9670	2026-06-02 10:42:35.803912	authenticity_certificate	pending
2	20	3a91fb81-f02b-4c66-8d89-d655bfcf9670	2026-06-11 09:24:47.665611	authenticity_certificate	pending
\.


--
-- Data for Name: item_documents; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.item_documents (id, item_id, uploader_user_id, file_name, file_url, file_type, file_size, created_at) FROM stdin;
1	13	41697b1c-eb26-4e38-82e9-80c05df19249	planning-2026.pdf	/objects/uploads/9ef2b475-c52c-442a-86aa-9bda3b08bc1b	certificate	48738	2026-06-02 10:44:55.994885
2	13	41697b1c-eb26-4e38-82e9-80c05df19249	agreement-1.pdf	/objects/uploads/bfc0b2f1-2767-45b1-9117-a6979d8200cd	certificate	8220	2026-06-09 12:22:16.509035
\.


--
-- Data for Name: item_price_offers; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.item_price_offers (id, item_id, proposed_by_user_id, proposed_by_role, min_price, max_price, action, created_at) FROM stdin;
1	13	3a91fb81-f02b-4c66-8d89-d655bfcf9670	marchand	5000	6000	initial	2026-06-02 10:38:54.218222
2	14	3a91fb81-f02b-4c66-8d89-d655bfcf9670	marchand	100	150	initial	2026-06-02 10:39:20.251534
3	15	3a91fb81-f02b-4c66-8d89-d655bfcf9670	marchand	100	300	initial	2026-06-02 10:39:32.901489
4	16	3a91fb81-f02b-4c66-8d89-d655bfcf9670	marchand	1000	1500	initial	2026-06-02 10:42:15.905395
5	16	41697b1c-eb26-4e38-82e9-80c05df19249	seller	1000	1500	accepted	2026-06-02 10:50:01.738491
6	13	41697b1c-eb26-4e38-82e9-80c05df19249	seller	8000	12000	counter_offer	2026-06-02 10:50:17.164541
7	13	3a91fb81-f02b-4c66-8d89-d655bfcf9670	marchand	7000	7000	revision	2026-06-02 10:53:34.755118
8	14	41697b1c-eb26-4e38-82e9-80c05df19249	seller	100	150	accepted	2026-06-02 10:55:54.278039
9	15	41697b1c-eb26-4e38-82e9-80c05df19249	seller	100	300	accepted	2026-06-02 10:55:54.278039
10	17	3a91fb81-f02b-4c66-8d89-d655bfcf9670	marchand	100	200	initial	2026-06-02 11:09:15.839666
11	19	3a91fb81-f02b-4c66-8d89-d655bfcf9670	marchand	80	100	initial	2026-06-04 12:58:58.8613
12	19	41697b1c-eb26-4e38-82e9-80c05df19249	seller	80	100	accepted	2026-06-09 12:23:39.244897
13	20	3a91fb81-f02b-4c66-8d89-d655bfcf9670	marchand	100	120	initial	2026-06-10 14:23:17.236742
14	20	41697b1c-eb26-4e38-82e9-80c05df19249	seller	150	\N	counter_offer	2026-06-15 13:17:40.07407
15	20	3a91fb81-f02b-4c66-8d89-d655bfcf9670	marchand	125	\N	revision	2026-06-15 13:17:58.530055
16	20	41697b1c-eb26-4e38-82e9-80c05df19249	seller	125	\N	accepted	2026-06-15 13:18:15.161939
17	24	3a91fb81-f02b-4c66-8d89-d655bfcf9670	marchand	600	1000	initial	2026-06-15 13:23:38.525296
18	24	41697b1c-eb26-4e38-82e9-80c05df19249	seller	600	1000	accepted	2026-06-15 13:25:20.532712
19	25	41697b1c-eb26-4e38-82e9-80c05df19249	seller	\N	\N	accepted	2026-06-15 13:25:20.532712
20	26	3a91fb81-f02b-4c66-8d89-d655bfcf9670	marchand	120	200	initial	2026-06-16 13:16:07.327182
21	26	41697b1c-eb26-4e38-82e9-80c05df19249	seller	120	200	accepted	2026-06-16 15:05:27.402148
22	27	3a91fb81-f02b-4c66-8d89-d655bfcf9670	marchand	80	100	initial	2026-08-28 13:38:28.148775
\.


--
-- Data for Name: items; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.items (id, request_id, seller_id, marchand_id, title, description, brand, size, category, condition, photos, certificate_photos, material, dimensions, author, genre, language, vintage, age_range, model, device_storage, ram, volume, frame_size, instrument_type, appliance_type, decor_style, subcategory, min_price, max_price, approved_price, price_approved_by_seller, marchand_price_approved, marchand_rejection_reason, has_insurance, insurance_cost, seller_counter_offer, decline_reason, status, version, deleted_at, listed_at, sold_at, sale_price, platform_listed_on, created_at, updated_at, platform_only, unsold_action) FROM stdin;
7	4	41697b1c-eb26-4e38-82e9-80c05df19249	\N	Sac à main vintage en cuir	Sac de créateur authentique	Hermès	\N	maroquinerie	excellent	{https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=400}	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	sacs	150	200	\N	f	f	\N	f	\N	f	\N	pending_approval	1	\N	\N	\N	\N	\N	2026-05-29 08:24:09.808579	2026-05-29 08:24:09.808579	f	return
8	4	41697b1c-eb26-4e38-82e9-80c05df19249	\N	Foulard en soie	Foulard classique d'une marque de luxe	Hermès	\N	accessoires	excellent	{https://images.unsplash.com/photo-1601924994987-69e26d50dc26?w=400}	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	50	80	\N	f	f	\N	f	\N	f	\N	pending_approval	1	\N	\N	\N	\N	\N	2026-05-29 08:24:09.808579	2026-05-29 08:24:09.808579	f	return
9	4	41697b1c-eb26-4e38-82e9-80c05df19249	\N	Lunettes de soleil	Lunettes de créateur avec étui	Chanel	\N	accessoires	comme_neuf	{https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=400}	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	120	150	\N	f	f	\N	f	\N	f	\N	pending_approval	1	\N	\N	\N	\N	\N	2026-05-29 08:24:09.808579	2026-05-29 08:24:09.808579	f	return
10	5	73e0d5ba-c10c-4a79-afb9-07491b22298e	3a91fb81-f02b-4c66-8d89-d655bfcf9670	Apple AirPods Pro	Écouteurs sans fil, boîte d'origine	Apple	\N	electronique	excellent	{https://images.unsplash.com/photo-1600294037681-c80b4cb5b434?w=400}	\N	\N	\N	\N	\N	\N	\N	\N	AirPods Pro 2	\N	\N	\N	\N	\N	\N	\N	audio	180	220	200	t	f	\N	f	\N	f	\N	approved	1	\N	\N	\N	\N	\N	2026-05-29 08:24:09.814522	2026-05-29 08:24:09.814522	f	return
11	5	73e0d5ba-c10c-4a79-afb9-07491b22298e	3a91fb81-f02b-4c66-8d89-d655bfcf9670	Câble USB-C	Câble de charge haute qualité	Apple	\N	electronique	neuf	{https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400}	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	15	25	20	t	f	\N	f	\N	f	\N	approved	1	\N	\N	\N	\N	\N	2026-05-29 08:24:09.814522	2026-05-29 08:24:09.814522	f	return
12	6	319e610d-40fa-47ae-8a31-778ccf45a009	1842aee2-ee68-4fa3-89b6-ea3d595df4c6	Veste en cuir noir	Veste en cuir véritable, taille M	Sandro	\N	mode	tres_bon	{https://images.unsplash.com/photo-1551028719-00167b16eac5?w=400}	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	80	120	110	t	f	\N	f	\N	f	\N	sold	1	\N	\N	2026-04-10 00:00:00	110	\N	2026-05-29 08:24:09.81977	2026-05-29 08:24:09.81977	f	return
16	7	41697b1c-eb26-4e38-82e9-80c05df19249	3a91fb81-f02b-4c66-8d89-d655bfcf9670	Vine	Wine bottle Trump Tax	\N	\N	clothing	new_with_tags	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	1000	1500	\N	t	f	\N	f	\N	f	\N	approved	2	\N	\N	\N	\N	\N	2026-06-02 10:42:15.866832	2026-06-02 10:50:01.698	f	return
24	11	41697b1c-eb26-4e38-82e9-80c05df19249	3a91fb81-f02b-4c66-8d89-d655bfcf9670	Air max	\N	Nike	45	clothing	good	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	600	1000	1000	t	f	\N	f	\N	f	\N	listed	2	\N	2026-06-15 13:25:39.678	\N	\N	{"Ricardo","Wallapop"}	2026-06-15 13:23:38.509053	2026-06-15 13:25:39.678	f	return
25	11	41697b1c-eb26-4e38-82e9-80c05df19249	3a91fb81-f02b-4c66-8d89-d655bfcf9670	aaaa	aa	aaa	aa	clothing	good	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	t	f	\N	f	\N	f	\N	sold	2	\N	2026-06-15 13:25:32.945	2026-06-15 13:27:06.455	200	{"Leboncoin","Vinted"}	2026-06-15 13:24:50.682721	2026-06-15 13:27:06.455	f	return
13	7	41697b1c-eb26-4e38-82e9-80c05df19249	3a91fb81-f02b-4c66-8d89-d655bfcf9670	Rollex	prix serré	Rollex	\N	watches_jewelry	good	\N	\N	or	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	7000	7000	\N	f	f	\N	f	\N	f	j'en veux plus	returned	4	\N	\N	\N	\N	\N	2026-06-02 10:38:54.166347	2026-06-02 10:54:44.568	f	return
14	7	41697b1c-eb26-4e38-82e9-80c05df19249	3a91fb81-f02b-4c66-8d89-d655bfcf9670	cravate	Negociable	H&M	L	clothing	like_new	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	100	150	150	t	f	\N	f	\N	f	\N	approved	2	\N	\N	\N	\N	\N	2026-06-02 10:39:20.237544	2026-06-02 10:55:54.279	f	return
15	7	41697b1c-eb26-4e38-82e9-80c05df19249	3a91fb81-f02b-4c66-8d89-d655bfcf9670	aaa	\N	aaa	\N	furniture	good	\N	\N	aa	aa	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	100	300	300	t	f	\N	f	\N	f	\N	approved	2	\N	\N	\N	\N	\N	2026-06-02 10:39:32.88714	2026-06-02 10:55:54.281	f	return
17	4	41697b1c-eb26-4e38-82e9-80c05df19249	3a91fb81-f02b-4c66-8d89-d655bfcf9670	hello worl	aa	\N	\N	decoration	good	\N	\N	or	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	100	200	\N	f	f	\N	f	\N	f	\N	pending_approval	1	\N	\N	\N	\N	\N	2026-06-02 11:09:15.825791	2026-06-02 11:09:15.825791	f	return
18	4	41697b1c-eb26-4e38-82e9-80c05df19249	3a91fb81-f02b-4c66-8d89-d655bfcf9670	hello worl	aa	\N	\N	decoration	good	\N	\N	or	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	100	200	\N	f	f	\N	f	\N	f	\N	pending_approval	1	\N	\N	\N	\N	\N	2026-06-02 11:09:18.202612	2026-06-02 11:09:18.202612	f	return
19	8	41697b1c-eb26-4e38-82e9-80c05df19249	3a91fb81-f02b-4c66-8d89-d655bfcf9670	Veste	\N	Hermes 	L	clothing	good	{/objects/uploads/67e1abd6-7760-47ef-9ca9-8f3cb22158be}	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	80	100	\N	t	f	\N	f	\N	f	\N	approved	2	\N	\N	\N	\N	\N	2026-06-04 12:58:58.445476	2026-06-09 12:23:39.239	f	return
21	10	seed-seller-001	seed-marchand-001	Chanel Classic Flap Bag - Medium	Authentic Chanel Classic Flap Bag in black quilted lambskin with gold hardware. Comes with authenticity certificate.	Chanel	\N	accessories_bags	like_new	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2500	3200	\N	f	f	\N	f	\N	f	\N	pending_approval	1	\N	\N	\N	\N	\N	2026-06-11 08:15:29.253254	2026-06-11 08:15:29.253254	t	return
22	10	seed-seller-001	seed-marchand-001	Louis Vuitton Monogram Scarf	Classic LV monogram silk scarf, lightly worn.	Louis Vuitton	\N	accessories_bags	good	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	180	250	\N	f	f	\N	f	\N	f	\N	pending_approval	1	\N	\N	\N	\N	\N	2026-06-11 08:15:29.253254	2026-06-11 08:15:29.253254	f	return
23	10	seed-seller-001	seed-marchand-001	Hermès H Belt 90cm	Hermès reversible belt, 90cm, black/gold with H buckle.	Hermès	\N	accessories_bags	like_new	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	450	600	\N	f	f	\N	f	\N	f	\N	pending_approval	1	\N	\N	\N	\N	\N	2026-06-11 08:15:29.253254	2026-06-11 08:15:29.253254	t	return
27	12	41697b1c-eb26-4e38-82e9-80c05df19249	3a91fb81-f02b-4c66-8d89-d655bfcf9670	Hello wrodl	\N	Nike	L	clothing	good	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	80	100	\N	f	f	\N	f	\N	f	\N	pending_approval	1	\N	\N	\N	\N	\N	2026-08-28 13:38:27.930087	2026-08-28 13:38:27.930087	f	return
20	9	41697b1c-eb26-4e38-82e9-80c05df19249	3a91fb81-f02b-4c66-8d89-d655bfcf9670	Pull	\N	Volcom	L	clothing	new_with_tags	{/objects/uploads/605e3be0-fd87-4f5c-9510-161d6d5e4ecf}	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	125	\N	\N	t	f	\N	f	\N	f	\N	approved	4	\N	\N	\N	\N	\N	2026-06-10 14:23:17.186184	2026-06-15 13:18:15.09	t	return
28	12	41697b1c-eb26-4e38-82e9-80c05df19249	3a91fb81-f02b-4c66-8d89-d655bfcf9670	Hello wrodl	\N	Nike	L	clothing	good	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	80	100	\N	f	f	\N	f	\N	f	\N	pending_approval	2	2026-08-29 07:08:42.351	\N	\N	\N	\N	2026-08-28 13:38:29.694651	2026-08-28 13:38:29.694651	f	return
26	13	41697b1c-eb26-4e38-82e9-80c05df19249	3a91fb81-f02b-4c66-8d89-d655bfcf9670	Air Max	\N	Nike	45	clothing	good	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	120	200	\N	t	f	\N	f	\N	f	\N	approved	2	\N	\N	\N	\N	\N	2026-06-16 13:16:07.221459	2026-06-16 15:05:27.395	f	return
\.


--
-- Data for Name: meetings; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.meetings (id, request_id, scheduled_date, location, duration, status, notes, created_at) FROM stdin;
2	5	2026-06-10 14:00:00	13 Rue de la République, Marseille 13001	60	scheduled	Apporter les articles dans leur emballage d'origine.	2026-05-29 08:24:09.828903
3	7	2026-06-09 12:00:00	Annecyu	60	cancelled	Prévoir une grosse caisse de transport	2026-06-02 10:35:23.15481
\.


--
-- Data for Name: messages; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.messages (id, sender_id, receiver_id, request_id, content, is_read, created_at) FROM stdin;
3	73e0d5ba-c10c-4a79-afb9-07491b22298e	3a91fb81-f02b-4c66-8d89-d655bfcf9670	5	Bonjour, j'ai bien reçu votre confirmation. À quelle heure vous convient-il ?	t	2026-05-29 08:24:09.831918
4	3a91fb81-f02b-4c66-8d89-d655bfcf9670	73e0d5ba-c10c-4a79-afb9-07491b22298e	5	Bonjour Marie ! 14h me conviendrait parfaitement. Je serai ponctuel.	f	2026-05-29 08:24:09.831918
5	3a91fb81-f02b-4c66-8d89-d655bfcf9670	41697b1c-eb26-4e38-82e9-80c05df19249	7	📄 I'd like to request additional documentation for "Rollex". Please upload authenticity certificates, purchase receipts, or any relevant documents.	t	2026-06-02 10:42:35.812415
6	3a91fb81-f02b-4c66-8d89-d655bfcf9670	41697b1c-eb26-4e38-82e9-80c05df19249	9	📄 I'd like to request additional documentation for "Pull". Please upload authenticity certificates, purchase receipts, or any relevant documents.	f	2026-06-11 09:24:48.022579
\.


--
-- Data for Name: moderation_actions; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.moderation_actions (id, request_id, admin_id, action, reason, metadata, created_at) FROM stdin;
\.


--
-- Data for Name: notifications; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.notifications (id, user_id, type, title, message, link, is_read, created_at) FROM stdin;
3	73e0d5ba-c10c-4a79-afb9-07491b22298e	message	Nouveau message	Thomas Bernard vous a répondu concernant votre demande.	/requests/5	f	2026-05-29 08:24:09.834962
4	3a91fb81-f02b-4c66-8d89-d655bfcf9670	new_request	Nouvelle demande	Une nouvelle demande de revente est disponible.	/requests/4	f	2026-05-29 08:24:09.834962
6	41697b1c-eb26-4e38-82e9-80c05df19249	meeting_scheduled	Meeting Scheduled	A meeting has been scheduled for 09/06/2026.	/requests/7	t	2026-06-02 10:35:23.210268
5	41697b1c-eb26-4e38-82e9-80c05df19249	request_matched	Request Matched	A reseller has been assigned to your request!	/requests/7	t	2026-06-02 10:34:45.338374
7	41697b1c-eb26-4e38-82e9-80c05df19249	item_added	New Item Added	Item "Rollex" was added to your request.	/requests/7	f	2026-06-02 10:38:54.204318
8	41697b1c-eb26-4e38-82e9-80c05df19249	item_added	New Item Added	Item "cravate" was added to your request.	/requests/7	f	2026-06-02 10:39:20.246176
9	41697b1c-eb26-4e38-82e9-80c05df19249	item_added	New Item Added	Item "aaa" was added to your request.	/requests/7	f	2026-06-02 10:39:32.895247
10	41697b1c-eb26-4e38-82e9-80c05df19249	item_added	New Item Added	Item "Vine" was added to your request.	/requests/7	f	2026-06-02 10:42:15.899355
11	41697b1c-eb26-4e38-82e9-80c05df19249	document_request	Document Request	Your reseller is requesting additional documentation for "Rollex".	/requests/7	f	2026-06-02 10:42:35.828418
12	3a91fb81-f02b-4c66-8d89-d655bfcf9670	new_document	New Document Uploaded	A new document "planning-2026.pdf" was uploaded for item "Rollex".	/requests/7	f	2026-06-02 10:44:56.004003
13	41697b1c-eb26-4e38-82e9-80c05df19249	list_finalized	Item List Finalized	The reseller has finalized the item list for request #7. Please review and approve all items.	/requests/7	f	2026-06-02 10:49:34.097894
14	3a91fb81-f02b-4c66-8d89-d655bfcf9670	item_approved	Price Approved	Seller approved pricing for "Vine".	/requests/7	f	2026-06-02 10:50:01.744655
15	3a91fb81-f02b-4c66-8d89-d655bfcf9670	counter_offer	Contre-offre vendeur	Le vendeur a proposé un nouveau prix pour "Rollex" : 8000 - 12000 EUR.	/requests/7	f	2026-06-02 10:50:17.171417
16	41697b1c-eb26-4e38-82e9-80c05df19249	price_revised	Price Range Revised	The reseller has revised the price range for "Rollex": 7000 – 7000 EUR. Please review and respond.	/requests/7	f	2026-06-02 10:53:34.772021
17	3a91fb81-f02b-4c66-8d89-d655bfcf9670	item_declined	Article refusé	Le vendeur a refusé "Rollex". Raison : j'en veux plus	/requests/7	f	2026-06-02 10:54:44.611662
19	3a91fb81-f02b-4c66-8d89-d655bfcf9670	meeting_cancelled	Meeting Cancelled	A meeting scheduled for 09/06/2026 has been cancelled.	/requests/7	f	2026-06-02 10:57:00.391798
20	41697b1c-eb26-4e38-82e9-80c05df19249	request_matched	Request Matched	A reseller has been assigned to your request!	/requests/4	f	2026-06-02 11:08:50.662652
21	41697b1c-eb26-4e38-82e9-80c05df19249	item_added	New Item Added	Item "hello worl" was added to your request.	/requests/4	f	2026-06-02 11:09:15.833418
22	57fdbd7c-9e7f-4b1c-8063-44206f0ef38f	codes_reminder	Codes de vérification requis	Pour finaliser votre candidature, veuillez renseigner vos numéros SIRET, TVA et DVI dans les paramètres de votre profil.	/profile	f	2026-06-02 17:44:18.098626
18	3a91fb81-f02b-4c66-8d89-d655bfcf9670	items_bulk_approved	All Items Approved	The seller approved all 2 pending item(s) for request #7.	/requests/7	t	2026-06-02 10:55:54.317572
23	41697b1c-eb26-4e38-82e9-80c05df19249	request_matched	Request Matched	A reseller has been assigned to your request!	/requests/8	f	2026-06-04 12:38:54.87614
24	41697b1c-eb26-4e38-82e9-80c05df19249	item_added	New Item Added	Item "Veste" was added to your request.	/requests/8	f	2026-06-04 12:58:58.854155
25	3a91fb81-f02b-4c66-8d89-d655bfcf9670	new_document	New Document Uploaded	A new document "agreement-1.pdf" was uploaded for item "Rollex".	/requests/7	f	2026-06-09 12:22:16.520274
26	41697b1c-eb26-4e38-82e9-80c05df19249	list_finalized	Item List Finalized	The reseller has finalized the item list for request #8. Please review and approve all items.	/requests/8	f	2026-06-09 12:22:34.781745
27	3a91fb81-f02b-4c66-8d89-d655bfcf9670	item_approved	Price Approved	Seller approved pricing for "Veste".	/requests/8	f	2026-06-09 12:23:39.254412
28	41697b1c-eb26-4e38-82e9-80c05df19249	agreement_ready	Agreement Ready to Sign	An agreement for request #8 is ready for your signature.	/agreements/1	f	2026-06-09 12:23:39.268548
29	3a91fb81-f02b-4c66-8d89-d655bfcf9670	agreement_ready	Agreement Ready to Sign	An agreement for request #8 is ready for your signature.	/agreements/1	f	2026-06-09 12:23:39.27195
30	41697b1c-eb26-4e38-82e9-80c05df19249	agreement_ready	Agreement Ready to Sign	An agreement for request #7 is ready for your signature.	/agreements/2	f	2026-06-10 08:40:18.041984
31	3a91fb81-f02b-4c66-8d89-d655bfcf9670	agreement_ready	Agreement Ready to Sign	An agreement for request #7 is ready for your signature.	/agreements/2	f	2026-06-10 08:40:18.185664
32	41697b1c-eb26-4e38-82e9-80c05df19249	request_matched	Request Matched	A reseller has been assigned to your request!	/requests/9	f	2026-06-10 14:21:21.356165
33	41697b1c-eb26-4e38-82e9-80c05df19249	item_added	New Item Added	Item "Pull" was added to your request.	/requests/9	f	2026-06-10 14:23:17.219754
34	41697b1c-eb26-4e38-82e9-80c05df19249	document_request	Document Request	Your reseller is requesting additional documentation for "Pull".	/requests/9	f	2026-06-11 09:24:48.155699
35	41697b1c-eb26-4e38-82e9-80c05df19249	list_finalized	Item List Finalized	The reseller has finalized the item list for request #9. Please review and approve all items.	/requests/9	f	2026-06-15 13:15:44.369144
36	3a91fb81-f02b-4c66-8d89-d655bfcf9670	counter_offer	Contre-offre vendeur	Le vendeur a proposé un nouveau prix pour "Pull" : 150 -  EUR.	/requests/9	f	2026-06-15 13:17:40.154425
37	41697b1c-eb26-4e38-82e9-80c05df19249	price_revised	Price Range Revised	The reseller has revised the price range for "Pull": 125 – null EUR. Please review and respond.	/requests/9	f	2026-06-15 13:17:58.535129
38	3a91fb81-f02b-4c66-8d89-d655bfcf9670	item_approved	Price Approved	Seller approved pricing for "Pull".	/requests/9	f	2026-06-15 13:18:15.167733
39	41697b1c-eb26-4e38-82e9-80c05df19249	agreement_ready	Agreement Ready to Sign	An agreement for request #9 is ready for your signature.	/agreements/3	f	2026-06-15 13:18:15.193351
40	3a91fb81-f02b-4c66-8d89-d655bfcf9670	agreement_ready	Agreement Ready to Sign	An agreement for request #9 is ready for your signature.	/agreements/3	f	2026-06-15 13:18:15.197291
41	41697b1c-eb26-4e38-82e9-80c05df19249	agreement_signed	Agreement Partially Signed	The reseller has signed the agreement for request #9.	/agreements/3	f	2026-06-15 13:20:22.71769
42	3a91fb81-f02b-4c66-8d89-d655bfcf9670	agreement_signed	Agreement Fully Signed	Agreement for request #9 has been fully signed by both parties.	/agreements/3	f	2026-06-15 13:20:55.112256
43	41697b1c-eb26-4e38-82e9-80c05df19249	request_matched	Request Matched	A reseller has been assigned to your request!	/requests/11	f	2026-06-15 13:23:02.175365
44	41697b1c-eb26-4e38-82e9-80c05df19249	item_added	New Item Added	Item "Air max" was added to your request.	/requests/11	f	2026-06-15 13:23:38.518076
45	41697b1c-eb26-4e38-82e9-80c05df19249	item_added	New Item Added	Item "aaaa" was added to your request.	/requests/11	f	2026-06-15 13:24:50.690923
46	41697b1c-eb26-4e38-82e9-80c05df19249	list_finalized	Item List Finalized	The reseller has finalized the item list for request #11. Please review and approve all items.	/requests/11	f	2026-06-15 13:25:13.552462
47	3a91fb81-f02b-4c66-8d89-d655bfcf9670	items_bulk_approved	All Items Approved	The seller approved all 2 pending item(s) for request #11.	/requests/11	f	2026-06-15 13:25:20.549405
48	41697b1c-eb26-4e38-82e9-80c05df19249	agreement_ready	Agreement Ready to Sign	An agreement for request #11 is ready for your signature.	/agreements/4	f	2026-06-15 13:25:20.57329
49	3a91fb81-f02b-4c66-8d89-d655bfcf9670	agreement_ready	Agreement Ready to Sign	An agreement for request #11 is ready for your signature.	/agreements/4	f	2026-06-15 13:25:20.577703
50	41697b1c-eb26-4e38-82e9-80c05df19249	item_listed	Item Listed	"aaaa" has been listed on Leboncoin,Vinted.	/requests/11	f	2026-06-15 13:25:32.979669
51	41697b1c-eb26-4e38-82e9-80c05df19249	item_listed	Item Listed	"Air max" has been listed on Ricardo,Wallapop.	/requests/11	f	2026-06-15 13:25:39.683129
52	41697b1c-eb26-4e38-82e9-80c05df19249	item_sold	Item Sold!	"aaaa" sold for 200 EUR. Your earnings: 110 EUR.	/items	f	2026-06-15 13:27:06.510225
53	41697b1c-eb26-4e38-82e9-80c05df19249	request_matched	Request Matched	A reseller has been assigned to your request!	/requests/12	f	2026-06-15 13:31:53.226746
54	41697b1c-eb26-4e38-82e9-80c05df19249	request_matched	Request Matched	A reseller has been assigned to your request!	/requests/13	f	2026-06-16 13:15:38.029902
55	41697b1c-eb26-4e38-82e9-80c05df19249	item_added	New Item Added	Item "Air Max" was added to your request.	/requests/13	f	2026-06-16 13:16:07.323574
56	41697b1c-eb26-4e38-82e9-80c05df19249	list_finalized	Item List Finalized	The reseller has finalized the item list for request #13. Please review and approve all items.	/requests/13	f	2026-06-16 15:04:39.484991
57	3a91fb81-f02b-4c66-8d89-d655bfcf9670	item_approved	Price Approved	Seller approved pricing for "Air Max".	/requests/13	f	2026-06-16 15:05:27.407127
58	41697b1c-eb26-4e38-82e9-80c05df19249	agreement_ready	Agreement Ready to Sign	An agreement for request #13 is ready for your signature.	/agreements/5	f	2026-06-16 15:05:27.570632
60	41697b1c-eb26-4e38-82e9-80c05df19249	item_added	New Item Added	Item "Hello wrodl" was added to your request.	/requests/12	f	2026-08-28 13:38:28.138994
59	3a91fb81-f02b-4c66-8d89-d655bfcf9670	agreement_ready	Agreement Ready to Sign	An agreement for request #13 is ready for your signature.	/agreements/5	t	2026-06-16 15:05:27.642443
\.


--
-- Data for Name: password_reset_tokens; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.password_reset_tokens (id, user_id, token, created_at, expires_at, used_at) FROM stdin;
936c4d86-766a-42b5-9c65-55dbf331dc4c	99d23aaa-ccc1-4ff3-a5c7-3cd1cdb6e551	12e43e29d405442eb02fbf14f3d81339cb6e27955e2fa32aa007e937f39ab5fa	2026-05-29 08:25:45.922432	2026-05-29 09:25:45.921	\N
\.


--
-- Data for Name: profiles; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.profiles (id, user_id, role, phone, address, city, postal_code, department, bio, experience, siret_number, vat_number, dvi_number, status, preferred_contact_method, notification_prefs, created_at, updated_at, leboncoin_url, vinted_url, ricardo_url) FROM stdin;
12	99d23aaa-ccc1-4ff3-a5c7-3cd1cdb6e551	admin	0615067927	\N	\N	\N	\N	\N	\N	\N	\N	\N	approved	\N	{"meetings": true, "messages": true, "newRequest": true, "counterOffer": true, "itemApproved": true, "itemRejected": true, "agreementReady": true}	2026-05-29 08:24:09.748647	2026-05-29 08:24:09.748647	\N	\N	\N
13	d43d12aa-ee84-4b13-a03b-7d351d42454e	admin	0715861930	\N	\N	\N	\N	\N	\N	\N	\N	\N	approved	\N	{"meetings": true, "messages": false, "newRequest": false, "counterOffer": true, "itemApproved": true, "itemRejected": true, "agreementReady": true}	2026-05-29 08:24:09.751561	2026-05-29 08:24:09.751561	\N	\N	\N
14	1c5abf0e-75ae-4db2-b60a-4df895c398fe	admin	0727998490	\N	\N	\N	\N	\N	\N	\N	\N	\N	approved	\N	{"meetings": true, "messages": true, "newRequest": false, "counterOffer": false, "itemApproved": true, "itemRejected": true, "agreementReady": true}	2026-05-29 08:24:09.754286	2026-05-29 08:24:09.754286	\N	\N	\N
15	41697b1c-eb26-4e38-82e9-80c05df19249	seller	0780244785	27 Rue de la Paix	Bordeaux	33000	Nouvelle-Aquitaine	Vend des articles de mode haut de gamme.	\N	\N	\N	\N	approved	\N	{"meetings": true, "messages": false, "newRequest": true, "counterOffer": true, "itemApproved": true, "itemRejected": true, "agreementReady": true}	2026-05-29 08:24:09.761083	2026-05-29 08:24:09.761083	\N	\N	\N
16	73e0d5ba-c10c-4a79-afb9-07491b22298e	seller	0635593155	45 Boulevard Haussmann	Marseille	13001	Provence-Alpes-Côte d'Azur	Spécialisée en électronique et high-tech.	\N	\N	\N	\N	approved	\N	{"meetings": true, "messages": true, "newRequest": true, "counterOffer": true, "itemApproved": true, "itemRejected": true, "agreementReady": true}	2026-05-29 08:24:09.766761	2026-05-29 08:24:09.766761	\N	\N	\N
17	319e610d-40fa-47ae-8a31-778ccf45a009	seller	0718351719	3 Rue du Faubourg Saint-Antoine	Lyon	69001	Auvergne-Rhône-Alpes	Vendeur généraliste, articles variés.	\N	\N	\N	\N	approved	\N	{"meetings": true, "messages": true, "newRequest": true, "counterOffer": true, "itemApproved": true, "itemRejected": true, "agreementReady": true}	2026-05-29 08:24:09.773532	2026-05-29 08:24:09.773532	\N	\N	\N
18	ab6d4596-8cb4-4a33-8219-c67a009eadb4	seller	0621141148	27 Rue de la Paix	Lyon	69001	Auvergne-Rhône-Alpes	Vêtements enfants et jouets de qualité.	\N	\N	\N	\N	approved	\N	{"meetings": true, "messages": false, "newRequest": false, "counterOffer": true, "itemApproved": true, "itemRejected": true, "agreementReady": true}	2026-05-29 08:24:09.778735	2026-05-29 08:24:09.778735	\N	\N	\N
19	1171f07b-5bc5-4649-838f-e91ef36442ea	seller	0624622959	27 Rue de la Paix	Bordeaux	33000	Nouvelle-Aquitaine	Mobilier et décoration intérieure.	\N	\N	\N	\N	approved	\N	{"meetings": true, "messages": true, "newRequest": true, "counterOffer": false, "itemApproved": true, "itemRejected": true, "agreementReady": true}	2026-05-29 08:24:09.785709	2026-05-29 08:24:09.785709	\N	\N	\N
21	1842aee2-ee68-4fa3-89b6-ea3d595df4c6	marchand	0697793909	12 Rue de Rivoli	Toulouse	31000	Occitanie	Revendeuse secondaire, activité occasionnelle.	7 ans de revente	3112365078447	\N	\N	approved	\N	{"meetings": true, "messages": false, "newRequest": true, "counterOffer": false, "itemApproved": true, "itemRejected": true, "agreementReady": true}	2026-05-29 08:24:09.797748	2026-05-29 08:24:09.797748	\N	\N	\N
22	57fdbd7c-9e7f-4b1c-8063-44206f0ef38f	marchand	0658486642	8 Avenue des Champs-Élysées	Marseille	13001	Provence-Alpes-Côte d'Azur	Nouveau revendeur en attente de validation.	\N	\N	\N	\N	pending	\N	{"meetings": true, "messages": false, "newRequest": true, "counterOffer": true, "itemApproved": true, "itemRejected": true, "agreementReady": true}	2026-05-29 08:24:09.80294	2026-05-29 08:24:09.80294	\N	\N	\N
23	seed-marchand-001	marchand	\N	\N	Paris	\N	75	Expert fashion reseller with 5 years of experience in luxury clothing and accessories.	5 years	\N	\N	\N	approved	\N	\N	2026-06-11 08:15:29.23235	2026-06-11 08:15:29.23235	https://www.leboncoin.fr/profil/sophie-martin-reseller	https://www.vinted.fr/member/sophie-martin	https://www.ricardo.ch/sophie-martin-fashion
24	seed-seller-001	seller	\N	\N	Lyon	\N	\N	\N	\N	\N	\N	\N	approved	\N	\N	2026-06-11 08:15:29.241526	2026-06-11 08:15:29.241526	\N	\N	\N
25	e760e126-819d-4bbd-a55e-0bf6ce2b387c	seller	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	approved	email	\N	2026-06-11 08:18:45.749581	2026-06-11 08:18:45.749581	\N	\N	\N
20	3a91fb81-f02b-4c66-8d89-d655bfcf9670	marchand	0615100138	3 Rue du Faubourg Saint-Antoine	Bordeaux	33000	Nouvelle-Aquitaine	Revendeur expérimenté, 8 ans sur le marché. Service irréprochable.	8 ans de revente	3312329260590			approved	\N	{"toast_agreement_ready": true}	2026-05-29 08:24:09.792334	2026-08-29 07:07:40.902	https://www.leboncoin.fr/profile/df3b3401-7934-4475-9c2b-c0dad1605e6c/offers		
\.


--
-- Data for Name: requests; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.requests (id, seller_id, marchand_id, service_type, status, item_count, estimated_value, categories, item_condition, brands, meeting_location, preferred_date_start, preferred_date_end, notes, created_at, updated_at, completed_at, list_ready_at, deadline_days, deadline_date, seller_counter_deadline, seller_proposed_deadline_days, marchand_counter_deadline, marchand_proposed_deadline_days, deadline_offer_count) FROM stdin;
5	73e0d5ba-c10c-4a79-afb9-07491b22298e	3a91fb81-f02b-4c66-8d89-d655bfcf9670	resale	in_progress	2	\N	{electronique}	\N	\N	Marseille, 13001	\N	\N	\N	2026-05-29 08:24:09.811876	2026-05-29 08:24:09.811876	\N	\N	30	\N	f	\N	f	\N	0
6	319e610d-40fa-47ae-8a31-778ccf45a009	1842aee2-ee68-4fa3-89b6-ea3d595df4c6	resale	completed	1	\N	{mode}	\N	\N	Lyon, 69001	\N	\N	\N	2026-05-29 08:24:09.817122	2026-05-29 08:24:09.817122	2026-04-15 00:00:00	\N	30	\N	f	\N	f	\N	0
7	41697b1c-eb26-4e38-82e9-80c05df19249	3a91fb81-f02b-4c66-8d89-d655bfcf9670	classic	scheduled	4	7500	\N	good	Rollex, Apple, Guitar 	Annecy	2026-06-08 00:00:00	2026-06-14 00:00:00	Vient et on discute	2026-06-02 10:29:47.966007	2026-06-02 10:49:34.089	\N	2026-06-02 10:49:34.089	30	\N	f	\N	f	\N	0
4	41697b1c-eb26-4e38-82e9-80c05df19249	3a91fb81-f02b-4c66-8d89-d655bfcf9670	resale	matched	3	\N	{mode,accessoires}	excellent	\N	Paris, 75001	\N	\N	Articles de créateur, manipuler avec soin.	2026-05-29 08:24:09.805614	2026-06-02 11:08:50.43	\N	\N	30	\N	f	\N	f	\N	0
8	41697b1c-eb26-4e38-82e9-80c05df19249	3a91fb81-f02b-4c66-8d89-d655bfcf9670	classic	matched	1	\N	\N	like_new	Hermès 	Maison 	2026-06-05 00:00:00	\N	\N	2026-06-04 12:36:02.471943	2026-06-09 12:22:34.747	\N	2026-06-09 12:22:34.747	30	\N	f	\N	f	\N	0
10	seed-seller-001	seed-marchand-001	classic	in_progress	3	500	\N	\N	\N	Lyon 6ème	\N	\N	Luxury items including a Chanel bag, Louis Vuitton scarf, and Hermès belt.	2026-06-11 08:15:29.246362	2026-06-11 08:15:29.246362	\N	\N	30	\N	f	\N	f	\N	0
9	41697b1c-eb26-4e38-82e9-80c05df19249	3a91fb81-f02b-4c66-8d89-d655bfcf9670	classic	matched	1	200	\N	new_with_tags	VOLCOM	domicile	2026-06-10 00:00:00	2026-06-11 00:00:00	pull neuf	2026-06-10 14:20:56.413503	2026-06-15 13:15:44.362	\N	2026-06-15 13:15:44.362	30	\N	f	\N	f	\N	0
11	41697b1c-eb26-4e38-82e9-80c05df19249	3a91fb81-f02b-4c66-8d89-d655bfcf9670	classic	in_progress	1	\N	\N	new_with_tags	Nike	Annecy	2026-06-15 00:00:00	\N	aaa	2026-06-15 13:22:51.871362	2026-06-15 13:25:39.686	\N	2026-06-15 13:25:13.548	30	\N	f	\N	f	\N	0
12	41697b1c-eb26-4e38-82e9-80c05df19249	3a91fb81-f02b-4c66-8d89-d655bfcf9670	classic	matched	10	\N	\N	good	\N	Annecy	2026-06-15 00:00:00	\N	\N	2026-06-15 13:31:43.134366	2026-06-15 13:31:53.023	\N	\N	30	\N	f	\N	f	\N	0
13	41697b1c-eb26-4e38-82e9-80c05df19249	3a91fb81-f02b-4c66-8d89-d655bfcf9670	classic	matched	10	1000	\N	\N	Nike	\N	\N	\N	\N	2026-06-16 13:14:52.975519	2026-06-16 15:04:39.342	\N	2026-06-16 15:04:39.342	30	2026-07-16 13:15:38.018	f	\N	f	\N	0
\.


--
-- Data for Name: reviews; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.reviews (id, request_id, seller_id, marchand_id, rating, comment, communication_rating, reliability_rating, handling_rating, created_at) FROM stdin;
2	6	319e610d-40fa-47ae-8a31-778ccf45a009	1842aee2-ee68-4fa3-89b6-ea3d595df4c6	5	Service impeccable, vente rapide et transparente. Très satisfait !	5	5	4	2026-05-29 08:24:09.825445
\.


--
-- Data for Name: sessions; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.sessions ("sessionToken", "userId", expires) FROM stdin;
43204275-c3e4-4951-be76-20d1b25e5d23	3a91fb81-f02b-4c66-8d89-d655bfcf9670	2026-07-02 10:31:03.717
f641e07e-f73b-45db-99e8-d5d29fb38234	3a91fb81-f02b-4c66-8d89-d655bfcf9670	2026-07-03 13:36:51.419
c0084774-1ae8-4bab-9ce7-e86c47d2f319	41697b1c-eb26-4e38-82e9-80c05df19249	2026-07-04 12:44:14.154
4dacbab9-cb32-4db5-b476-1d010e4df320	3a91fb81-f02b-4c66-8d89-d655bfcf9670	2026-07-09 12:21:16.066
f65ec3fb-297a-4a99-97aa-c16e09fe6fef	3a91fb81-f02b-4c66-8d89-d655bfcf9670	2026-07-10 08:21:27.956
8206493f-dbec-4253-b139-137ebc69c4b3	3a91fb81-f02b-4c66-8d89-d655bfcf9670	2026-07-10 14:19:36.452
e7e3c299-25df-4bb7-8016-0603347bf96e	3a91fb81-f02b-4c66-8d89-d655bfcf9670	2026-07-11 07:38:11.983
73213a95-d415-4d3e-8a5b-0b3160c3212b	41697b1c-eb26-4e38-82e9-80c05df19249	2026-07-11 08:21:28.785
dbd74c29-2ee5-4d5a-a474-82e5377f29b1	3a91fb81-f02b-4c66-8d89-d655bfcf9670	2026-07-15 13:13:03.139
a0926b5b-1ed0-4a14-8c5e-625ecbd84671	3a91fb81-f02b-4c66-8d89-d655bfcf9670	2026-07-16 09:28:14.542
23d27aeb-3d6f-4667-8745-391b84c9dfb0	99d23aaa-ccc1-4ff3-a5c7-3cd1cdb6e551	2026-07-16 09:31:48.205
74b85b0e-6c5f-452f-8239-ea5a42f3237c	41697b1c-eb26-4e38-82e9-80c05df19249	2026-07-16 13:13:43.157
05ac78ea-9854-4893-90b3-c6769781737a	3a91fb81-f02b-4c66-8d89-d655bfcf9670	2026-09-27 13:37:03.496
c3feb2d3-16c0-4d4d-b986-27731a083ce0	3a91fb81-f02b-4c66-8d89-d655bfcf9670	2026-11-08 08:25:56.664
\.


--
-- Data for Name: transactions; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.transactions (id, item_id, request_id, seller_id, marchand_id, sale_price, seller_earning, marchand_earning, platform_earning, fee_tier_id, seller_percent, marchand_percent, platform_percent, status, created_at) FROM stdin;
2	12	6	319e610d-40fa-47ae-8a31-778ccf45a009	1842aee2-ee68-4fa3-89b6-ea3d595df4c6	110	55	44	11	4	50	40	10	completed	2026-05-29 08:24:09.822415
3	20	9	41697b1c-eb26-4e38-82e9-80c05df19249	3a91fb81-f02b-4c66-8d89-d655bfcf9670	125	62.5	50	12.5	4	50	40	10	completed	2026-06-15 13:20:55.122094
4	25	11	41697b1c-eb26-4e38-82e9-80c05df19249	3a91fb81-f02b-4c66-8d89-d655bfcf9670	200	110	70	20	5	55	35	10	completed	2026-06-15 13:27:06.495008
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.users (id, email, password_hash, first_name, last_name, profile_image_url, email_verified, created_at, updated_at) FROM stdin;
99d23aaa-ccc1-4ff3-a5c7-3cd1cdb6e551	admin.moreau@example.fr	$2b$10$yF8xTCmhErWHKqHFDgX0yODmuhpCAzcRgFCL5DCMKOWqQTSQcymvW	André	Moreau	https://i.pravatar.cc/150?u=admin1	2026-05-29 08:47:12.35671	2026-05-29 08:24:09.745099	2026-05-29 08:24:09.745099
d43d12aa-ee84-4b13-a03b-7d351d42454e	admin.lefevre@example.fr	$2b$10$yF8xTCmhErWHKqHFDgX0yODmuhpCAzcRgFCL5DCMKOWqQTSQcymvW	Isabelle	Lefebvre	https://i.pravatar.cc/150?u=admin2	2026-05-29 08:47:12.35671	2026-05-29 08:24:09.745099	2026-05-29 08:24:09.745099
1c5abf0e-75ae-4db2-b60a-4df895c398fe	admin.renard@example.fr	$2b$10$yF8xTCmhErWHKqHFDgX0yODmuhpCAzcRgFCL5DCMKOWqQTSQcymvW	Claude	Renard	https://i.pravatar.cc/150?u=admin3	2026-05-29 08:47:12.35671	2026-05-29 08:24:09.745099	2026-05-29 08:24:09.745099
41697b1c-eb26-4e38-82e9-80c05df19249	seller.dupont@example.fr	$2b$10$yF8xTCmhErWHKqHFDgX0yODmuhpCAzcRgFCL5DCMKOWqQTSQcymvW	Pierre	Dupont	https://i.pravatar.cc/150?u=seller1	2026-05-29 08:47:12.35671	2026-05-29 08:24:09.758338	2026-05-29 08:24:09.758338
73e0d5ba-c10c-4a79-afb9-07491b22298e	seller.martin@example.fr	$2b$10$yF8xTCmhErWHKqHFDgX0yODmuhpCAzcRgFCL5DCMKOWqQTSQcymvW	Marie	Martin	https://i.pravatar.cc/150?u=seller2	2026-05-29 08:47:12.35671	2026-05-29 08:24:09.764617	2026-05-29 08:24:09.764617
319e610d-40fa-47ae-8a31-778ccf45a009	seller.bernard@example.fr	$2b$10$yF8xTCmhErWHKqHFDgX0yODmuhpCAzcRgFCL5DCMKOWqQTSQcymvW	Jean	Bernard	https://i.pravatar.cc/150?u=seller3	2026-05-29 08:47:12.35671	2026-05-29 08:24:09.77004	2026-05-29 08:24:09.77004
ab6d4596-8cb4-4a33-8219-c67a009eadb4	seller.laurent@example.fr	$2b$10$yF8xTCmhErWHKqHFDgX0yODmuhpCAzcRgFCL5DCMKOWqQTSQcymvW	Sophie	Laurent	https://i.pravatar.cc/150?u=seller4	2026-05-29 08:47:12.35671	2026-05-29 08:24:09.776139	2026-05-29 08:24:09.776139
1171f07b-5bc5-4649-838f-e91ef36442ea	seller.leclerc@example.fr	$2b$10$yF8xTCmhErWHKqHFDgX0yODmuhpCAzcRgFCL5DCMKOWqQTSQcymvW	Marc	Leclerc	https://i.pravatar.cc/150?u=seller5	2026-05-29 08:47:12.35671	2026-05-29 08:24:09.781964	2026-05-29 08:24:09.781964
3a91fb81-f02b-4c66-8d89-d655bfcf9670	marchand.bernard@example.fr	$2b$10$yF8xTCmhErWHKqHFDgX0yODmuhpCAzcRgFCL5DCMKOWqQTSQcymvW	Thomas	Bernard	https://i.pravatar.cc/150?u=march1	2026-05-29 08:47:12.35671	2026-05-29 08:24:09.788799	2026-05-29 08:24:09.788799
1842aee2-ee68-4fa3-89b6-ea3d595df4c6	marchand.simon@example.fr	$2b$10$yF8xTCmhErWHKqHFDgX0yODmuhpCAzcRgFCL5DCMKOWqQTSQcymvW	Émilie	Simon	https://i.pravatar.cc/150?u=march2	2026-05-29 08:47:12.35671	2026-05-29 08:24:09.795346	2026-05-29 08:24:09.795346
57fdbd7c-9e7f-4b1c-8063-44206f0ef38f	marchand.rousseau@example.fr	$2b$10$yF8xTCmhErWHKqHFDgX0yODmuhpCAzcRgFCL5DCMKOWqQTSQcymvW	Nicolas	Rousseau	https://i.pravatar.cc/150?u=march3	2026-05-29 08:47:12.35671	2026-05-29 08:24:09.799967	2026-05-29 08:24:09.799967
seed-marchand-001	reseller@sellzy.demo	$2b$12$xs1xngp4e3FLzAoLXkvVb.REJPEeo29YhtC7z3fVchCUrntB7Fjrm	Sophie	Martin	\N	\N	2026-06-11 08:15:29.218097	2026-06-11 08:15:29.218097
seed-seller-001	seller@sellzy.demo	$2b$12$xs1xngp4e3FLzAoLXkvVb.REJPEeo29YhtC7z3fVchCUrntB7Fjrm	Marie	Dupont	\N	\N	2026-06-11 08:15:29.23694	2026-06-11 08:15:29.23694
e760e126-819d-4bbd-a55e-0bf6ce2b387c	baz00@hotmail.fr	$2b$12$c69k3V9FOHqMCG0MlCsPW.gAc2.KDFAbHgL0ko2hmOj8PJkqI41WK	Fab	P	\N	2026-06-11 08:18:45.714	2026-06-11 08:18:45.715143	2026-06-11 08:18:45.715143
\.


--
-- Name: admin_settings_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.admin_settings_id_seq', 1, false);


--
-- Name: agreement_signatures_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.agreement_signatures_id_seq', 2, true);


--
-- Name: agreements_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.agreements_id_seq', 5, true);


--
-- Name: fee_tier_changelog_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.fee_tier_changelog_id_seq', 1, false);


--
-- Name: fee_tiers_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.fee_tiers_id_seq', 6, true);


--
-- Name: item_document_requests_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.item_document_requests_id_seq', 2, true);


--
-- Name: item_documents_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.item_documents_id_seq', 2, true);


--
-- Name: item_price_offers_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.item_price_offers_id_seq', 22, true);


--
-- Name: items_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.items_id_seq', 28, true);


--
-- Name: meetings_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.meetings_id_seq', 3, true);


--
-- Name: messages_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.messages_id_seq', 6, true);


--
-- Name: moderation_actions_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.moderation_actions_id_seq', 1, false);


--
-- Name: notifications_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.notifications_id_seq', 60, true);


--
-- Name: profiles_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.profiles_id_seq', 25, true);


--
-- Name: requests_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.requests_id_seq', 13, true);


--
-- Name: reviews_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.reviews_id_seq', 2, true);


--
-- Name: transactions_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.transactions_id_seq', 4, true);


--
-- Name: admin_settings admin_settings_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.admin_settings
    ADD CONSTRAINT admin_settings_pkey PRIMARY KEY (id);


--
-- Name: admin_settings admin_settings_setting_key_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.admin_settings
    ADD CONSTRAINT admin_settings_setting_key_unique UNIQUE (setting_key);


--
-- Name: agreement_signatures agreement_signatures_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.agreement_signatures
    ADD CONSTRAINT agreement_signatures_pkey PRIMARY KEY (id);


--
-- Name: agreements agreements_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.agreements
    ADD CONSTRAINT agreements_pkey PRIMARY KEY (id);


--
-- Name: email_verification_codes email_verification_codes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.email_verification_codes
    ADD CONSTRAINT email_verification_codes_pkey PRIMARY KEY (id);


--
-- Name: fee_tier_changelog fee_tier_changelog_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fee_tier_changelog
    ADD CONSTRAINT fee_tier_changelog_pkey PRIMARY KEY (id);


--
-- Name: fee_tiers fee_tiers_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fee_tiers
    ADD CONSTRAINT fee_tiers_pkey PRIMARY KEY (id);


--
-- Name: item_document_requests item_document_requests_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.item_document_requests
    ADD CONSTRAINT item_document_requests_pkey PRIMARY KEY (id);


--
-- Name: item_documents item_documents_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.item_documents
    ADD CONSTRAINT item_documents_pkey PRIMARY KEY (id);


--
-- Name: item_price_offers item_price_offers_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.item_price_offers
    ADD CONSTRAINT item_price_offers_pkey PRIMARY KEY (id);


--
-- Name: items items_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.items
    ADD CONSTRAINT items_pkey PRIMARY KEY (id);


--
-- Name: meetings meetings_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.meetings
    ADD CONSTRAINT meetings_pkey PRIMARY KEY (id);


--
-- Name: messages messages_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.messages
    ADD CONSTRAINT messages_pkey PRIMARY KEY (id);


--
-- Name: moderation_actions moderation_actions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.moderation_actions
    ADD CONSTRAINT moderation_actions_pkey PRIMARY KEY (id);


--
-- Name: notifications notifications_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_pkey PRIMARY KEY (id);


--
-- Name: password_reset_tokens password_reset_tokens_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.password_reset_tokens
    ADD CONSTRAINT password_reset_tokens_pkey PRIMARY KEY (id);


--
-- Name: password_reset_tokens password_reset_tokens_token_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.password_reset_tokens
    ADD CONSTRAINT password_reset_tokens_token_unique UNIQUE (token);


--
-- Name: profiles profiles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_pkey PRIMARY KEY (id);


--
-- Name: profiles profiles_user_id_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_user_id_unique UNIQUE (user_id);


--
-- Name: requests requests_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.requests
    ADD CONSTRAINT requests_pkey PRIMARY KEY (id);


--
-- Name: reviews reviews_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reviews
    ADD CONSTRAINT reviews_pkey PRIMARY KEY (id);


--
-- Name: sessions sessions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sessions
    ADD CONSTRAINT sessions_pkey PRIMARY KEY ("sessionToken");


--
-- Name: transactions transactions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.transactions
    ADD CONSTRAINT transactions_pkey PRIMARY KEY (id);


--
-- Name: users users_email_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_unique UNIQUE (email);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: idx_agreement_sigs_agreement; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_agreement_sigs_agreement ON public.agreement_signatures USING btree (agreement_id);


--
-- Name: idx_agreement_sigs_user; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_agreement_sigs_user ON public.agreement_signatures USING btree (user_id);


--
-- Name: idx_agreements_marchand; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_agreements_marchand ON public.agreements USING btree (marchand_id);


--
-- Name: idx_agreements_request; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_agreements_request ON public.agreements USING btree (request_id);


--
-- Name: idx_agreements_seller; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_agreements_seller ON public.agreements USING btree (seller_id);


--
-- Name: idx_fee_tier_changelog_admin; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_fee_tier_changelog_admin ON public.fee_tier_changelog USING btree (admin_id);


--
-- Name: idx_fee_tier_changelog_tier; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_fee_tier_changelog_tier ON public.fee_tier_changelog USING btree (fee_tier_id);


--
-- Name: idx_fee_tiers_active; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_fee_tiers_active ON public.fee_tiers USING btree (is_active);


--
-- Name: idx_item_doc_requests_item; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_item_doc_requests_item ON public.item_document_requests USING btree (item_id);


--
-- Name: idx_item_doc_requests_marchand; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_item_doc_requests_marchand ON public.item_document_requests USING btree (marchand_id);


--
-- Name: idx_item_documents_item; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_item_documents_item ON public.item_documents USING btree (item_id);


--
-- Name: idx_item_documents_uploader; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_item_documents_uploader ON public.item_documents USING btree (uploader_user_id);


--
-- Name: idx_item_price_offers_item; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_item_price_offers_item ON public.item_price_offers USING btree (item_id);


--
-- Name: idx_items_marchand; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_items_marchand ON public.items USING btree (marchand_id);


--
-- Name: idx_items_seller; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_items_seller ON public.items USING btree (seller_id);


--
-- Name: idx_items_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_items_status ON public.items USING btree (status);


--
-- Name: idx_messages_receiver; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_messages_receiver ON public.messages USING btree (receiver_id);


--
-- Name: idx_messages_request; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_messages_request ON public.messages USING btree (request_id);


--
-- Name: idx_messages_sender; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_messages_sender ON public.messages USING btree (sender_id);


--
-- Name: idx_moderation_admin; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_moderation_admin ON public.moderation_actions USING btree (admin_id);


--
-- Name: idx_moderation_request; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_moderation_request ON public.moderation_actions USING btree (request_id);


--
-- Name: idx_notifications_user; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_notifications_user ON public.notifications USING btree (user_id);


--
-- Name: idx_requests_marchand; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_requests_marchand ON public.requests USING btree (marchand_id);


--
-- Name: idx_requests_seller; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_requests_seller ON public.requests USING btree (seller_id);


--
-- Name: idx_requests_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_requests_status ON public.requests USING btree (status);


--
-- Name: idx_reset_expiresAt; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "idx_reset_expiresAt" ON public.password_reset_tokens USING btree (expires_at);


--
-- Name: idx_reset_token; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_reset_token ON public.password_reset_tokens USING btree (token);


--
-- Name: idx_reset_userId; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "idx_reset_userId" ON public.password_reset_tokens USING btree (user_id);


--
-- Name: idx_reviews_marchand; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_reviews_marchand ON public.reviews USING btree (marchand_id);


--
-- Name: idx_reviews_request; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_reviews_request ON public.reviews USING btree (request_id);


--
-- Name: idx_reviews_seller; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_reviews_seller ON public.reviews USING btree (seller_id);


--
-- Name: idx_sessions_expires; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_sessions_expires ON public.sessions USING btree (expires);


--
-- Name: idx_sessions_userId; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "idx_sessions_userId" ON public.sessions USING btree ("userId");


--
-- Name: idx_transactions_item; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_transactions_item ON public.transactions USING btree (item_id);


--
-- Name: idx_transactions_marchand; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_transactions_marchand ON public.transactions USING btree (marchand_id);


--
-- Name: idx_transactions_seller; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_transactions_seller ON public.transactions USING btree (seller_id);


--
-- Name: idx_verification_code; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_verification_code ON public.email_verification_codes USING btree (code);


--
-- Name: idx_verification_expires_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_verification_expires_at ON public.email_verification_codes USING btree (expires_at);


--
-- Name: idx_verification_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_verification_user_id ON public.email_verification_codes USING btree (user_id);


--
-- Name: uq_agreement_sig_user; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX uq_agreement_sig_user ON public.agreement_signatures USING btree (agreement_id, user_id);


--
-- Name: uq_item_doc_request_item_marchand; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX uq_item_doc_request_item_marchand ON public.item_document_requests USING btree (item_id, marchand_id);


--
-- Name: admin_settings admin_settings_updated_by_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.admin_settings
    ADD CONSTRAINT admin_settings_updated_by_users_id_fk FOREIGN KEY (updated_by) REFERENCES public.users(id);


--
-- Name: agreement_signatures agreement_signatures_agreement_id_agreements_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.agreement_signatures
    ADD CONSTRAINT agreement_signatures_agreement_id_agreements_id_fk FOREIGN KEY (agreement_id) REFERENCES public.agreements(id);


--
-- Name: agreement_signatures agreement_signatures_user_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.agreement_signatures
    ADD CONSTRAINT agreement_signatures_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: agreements agreements_marchand_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.agreements
    ADD CONSTRAINT agreements_marchand_id_users_id_fk FOREIGN KEY (marchand_id) REFERENCES public.users(id);


--
-- Name: agreements agreements_request_id_requests_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.agreements
    ADD CONSTRAINT agreements_request_id_requests_id_fk FOREIGN KEY (request_id) REFERENCES public.requests(id);


--
-- Name: agreements agreements_seller_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.agreements
    ADD CONSTRAINT agreements_seller_id_users_id_fk FOREIGN KEY (seller_id) REFERENCES public.users(id);


--
-- Name: email_verification_codes email_verification_codes_user_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.email_verification_codes
    ADD CONSTRAINT email_verification_codes_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: fee_tier_changelog fee_tier_changelog_admin_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fee_tier_changelog
    ADD CONSTRAINT fee_tier_changelog_admin_id_users_id_fk FOREIGN KEY (admin_id) REFERENCES public.users(id);


--
-- Name: fee_tier_changelog fee_tier_changelog_fee_tier_id_fee_tiers_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fee_tier_changelog
    ADD CONSTRAINT fee_tier_changelog_fee_tier_id_fee_tiers_id_fk FOREIGN KEY (fee_tier_id) REFERENCES public.fee_tiers(id);


--
-- Name: item_document_requests item_document_requests_item_id_items_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.item_document_requests
    ADD CONSTRAINT item_document_requests_item_id_items_id_fk FOREIGN KEY (item_id) REFERENCES public.items(id);


--
-- Name: item_document_requests item_document_requests_marchand_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.item_document_requests
    ADD CONSTRAINT item_document_requests_marchand_id_users_id_fk FOREIGN KEY (marchand_id) REFERENCES public.users(id);


--
-- Name: item_documents item_documents_item_id_items_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.item_documents
    ADD CONSTRAINT item_documents_item_id_items_id_fk FOREIGN KEY (item_id) REFERENCES public.items(id);


--
-- Name: item_documents item_documents_uploader_user_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.item_documents
    ADD CONSTRAINT item_documents_uploader_user_id_users_id_fk FOREIGN KEY (uploader_user_id) REFERENCES public.users(id);


--
-- Name: item_price_offers item_price_offers_item_id_items_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.item_price_offers
    ADD CONSTRAINT item_price_offers_item_id_items_id_fk FOREIGN KEY (item_id) REFERENCES public.items(id);


--
-- Name: item_price_offers item_price_offers_proposed_by_user_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.item_price_offers
    ADD CONSTRAINT item_price_offers_proposed_by_user_id_users_id_fk FOREIGN KEY (proposed_by_user_id) REFERENCES public.users(id);


--
-- Name: items items_marchand_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.items
    ADD CONSTRAINT items_marchand_id_users_id_fk FOREIGN KEY (marchand_id) REFERENCES public.users(id);


--
-- Name: items items_request_id_requests_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.items
    ADD CONSTRAINT items_request_id_requests_id_fk FOREIGN KEY (request_id) REFERENCES public.requests(id);


--
-- Name: items items_seller_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.items
    ADD CONSTRAINT items_seller_id_users_id_fk FOREIGN KEY (seller_id) REFERENCES public.users(id);


--
-- Name: meetings meetings_request_id_requests_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.meetings
    ADD CONSTRAINT meetings_request_id_requests_id_fk FOREIGN KEY (request_id) REFERENCES public.requests(id);


--
-- Name: messages messages_receiver_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.messages
    ADD CONSTRAINT messages_receiver_id_users_id_fk FOREIGN KEY (receiver_id) REFERENCES public.users(id);


--
-- Name: messages messages_request_id_requests_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.messages
    ADD CONSTRAINT messages_request_id_requests_id_fk FOREIGN KEY (request_id) REFERENCES public.requests(id);


--
-- Name: messages messages_sender_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.messages
    ADD CONSTRAINT messages_sender_id_users_id_fk FOREIGN KEY (sender_id) REFERENCES public.users(id);


--
-- Name: moderation_actions moderation_actions_admin_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.moderation_actions
    ADD CONSTRAINT moderation_actions_admin_id_users_id_fk FOREIGN KEY (admin_id) REFERENCES public.users(id);


--
-- Name: moderation_actions moderation_actions_request_id_requests_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.moderation_actions
    ADD CONSTRAINT moderation_actions_request_id_requests_id_fk FOREIGN KEY (request_id) REFERENCES public.requests(id);


--
-- Name: notifications notifications_user_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: password_reset_tokens password_reset_tokens_user_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.password_reset_tokens
    ADD CONSTRAINT password_reset_tokens_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: profiles profiles_user_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: requests requests_marchand_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.requests
    ADD CONSTRAINT requests_marchand_id_users_id_fk FOREIGN KEY (marchand_id) REFERENCES public.users(id);


--
-- Name: requests requests_seller_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.requests
    ADD CONSTRAINT requests_seller_id_users_id_fk FOREIGN KEY (seller_id) REFERENCES public.users(id);


--
-- Name: reviews reviews_marchand_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reviews
    ADD CONSTRAINT reviews_marchand_id_users_id_fk FOREIGN KEY (marchand_id) REFERENCES public.users(id);


--
-- Name: reviews reviews_request_id_requests_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reviews
    ADD CONSTRAINT reviews_request_id_requests_id_fk FOREIGN KEY (request_id) REFERENCES public.requests(id);


--
-- Name: reviews reviews_seller_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reviews
    ADD CONSTRAINT reviews_seller_id_users_id_fk FOREIGN KEY (seller_id) REFERENCES public.users(id);


--
-- Name: sessions sessions_userId_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sessions
    ADD CONSTRAINT "sessions_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: transactions transactions_fee_tier_id_fee_tiers_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.transactions
    ADD CONSTRAINT transactions_fee_tier_id_fee_tiers_id_fk FOREIGN KEY (fee_tier_id) REFERENCES public.fee_tiers(id);


--
-- Name: transactions transactions_item_id_items_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.transactions
    ADD CONSTRAINT transactions_item_id_items_id_fk FOREIGN KEY (item_id) REFERENCES public.items(id);


--
-- Name: transactions transactions_marchand_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.transactions
    ADD CONSTRAINT transactions_marchand_id_users_id_fk FOREIGN KEY (marchand_id) REFERENCES public.users(id);


--
-- Name: transactions transactions_request_id_requests_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.transactions
    ADD CONSTRAINT transactions_request_id_requests_id_fk FOREIGN KEY (request_id) REFERENCES public.requests(id);


--
-- Name: transactions transactions_seller_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.transactions
    ADD CONSTRAINT transactions_seller_id_users_id_fk FOREIGN KEY (seller_id) REFERENCES public.users(id);


--
-- PostgreSQL database dump complete
--

\unrestrict lEePJULApCDK5JruHGizwn9lPo54wDmr7TcpY5u9ukZ88pekcXjNYpd8CnbBADa

