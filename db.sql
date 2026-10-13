-- public.categories definition

-- Drop table

-- DROP TABLE public.categories;

CREATE TABLE public.categories (
	id int8 GENERATED ALWAYS AS IDENTITY( INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START 1 CACHE 1 NO CYCLE) NOT NULL,
	"name" varchar(100) NOT NULL,
	created_at timestamptz DEFAULT now() NOT NULL,
	CONSTRAINT categories_name_key UNIQUE (name),
	CONSTRAINT categories_pkey PRIMARY KEY (id)
);


-- public.cooking_sessions definition

-- Drop table

-- DROP TABLE public.cooking_sessions;

CREATE TABLE public.cooking_sessions (
	id int8 GENERATED ALWAYS AS IDENTITY( INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START 1 CACHE 1 NO CYCLE) NOT NULL,
	cooked_at timestamptz DEFAULT now() NOT NULL,
	created_at timestamptz DEFAULT now() NOT NULL,
	CONSTRAINT cooking_sessions_pkey PRIMARY KEY (id)
);
CREATE INDEX idx_cooking_sessions_cooked_at ON public.cooking_sessions USING btree (cooked_at);


-- public.dishes_import definition

-- Drop table

-- DROP TABLE public.dishes_import;

CREATE TABLE public.dishes_import (
	stt int4 NULL,
	"name" varchar(200) NULL,
	category varchar(100) NULL
);


-- public.menus definition

-- Drop table

-- DROP TABLE public.menus;

CREATE TABLE public.menus (
	id int8 GENERATED ALWAYS AS IDENTITY( INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START 1 CACHE 1 NO CYCLE) NOT NULL,
	dish_signature text NOT NULL,
	created_at timestamptz DEFAULT now() NOT NULL,
	"name" varchar(100) NULL,
	"source" varchar(20) DEFAULT 'random'::character varying NOT NULL,
	updated_at timestamptz DEFAULT now() NOT NULL,
	CONSTRAINT menus_pkey PRIMARY KEY (id),
	CONSTRAINT menus_source_check CHECK (((source)::text = ANY ((ARRAY['random'::character varying, 'manual'::character varying])::text[])))
);
CREATE UNIQUE INDEX menus_random_signature_unique ON public.menus USING btree (dish_signature) WHERE ((source)::text = 'random'::text);


-- public.dishes definition

-- Drop table

-- DROP TABLE public.dishes;

CREATE TABLE public.dishes (
	id int8 GENERATED ALWAYS AS IDENTITY( INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START 1 CACHE 1 NO CYCLE) NOT NULL,
	"name" varchar(200) NOT NULL,
	category_id int8 NOT NULL,
	is_active bool DEFAULT true NOT NULL,
	created_at timestamptz DEFAULT now() NOT NULL,
	meal_role varchar(20) NULL,
	CONSTRAINT dishes_meal_role_check CHECK (((meal_role)::text = ANY ((ARRAY['main'::character varying, 'vegetable'::character varying, 'soup'::character varying, 'one_dish'::character varying, 'side'::character varying])::text[]))),
	CONSTRAINT dishes_name_key UNIQUE (name),
	CONSTRAINT dishes_pkey PRIMARY KEY (id),
	CONSTRAINT dishes_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.categories(id)
);


-- public.menu_dishes definition

-- Drop table

-- DROP TABLE public.menu_dishes;

CREATE TABLE public.menu_dishes (
	menu_id int8 NOT NULL,
	dish_id int8 NOT NULL,
	"position" int4 NOT NULL,
	CONSTRAINT menu_dishes_menu_id_position_key UNIQUE (menu_id, "position"),
	CONSTRAINT menu_dishes_pkey PRIMARY KEY (menu_id, dish_id),
	CONSTRAINT menu_dishes_position_check CHECK (("position" > 0)),
	CONSTRAINT menu_dishes_dish_id_fkey FOREIGN KEY (dish_id) REFERENCES public.dishes(id),
	CONSTRAINT menu_dishes_menu_id_fkey FOREIGN KEY (menu_id) REFERENCES public.menus(id) ON DELETE CASCADE
);
CREATE INDEX idx_menu_dishes_dish_id ON public.menu_dishes USING btree (dish_id);


-- public.cooking_records definition

-- Drop table

-- DROP TABLE public.cooking_records;

CREATE TABLE public.cooking_records (
	id int8 GENERATED ALWAYS AS IDENTITY( INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START 1 CACHE 1 NO CYCLE) NOT NULL,
	dish_id int8 NOT NULL,
	cooked_on date DEFAULT CURRENT_DATE NOT NULL,
	created_at timestamptz DEFAULT now() NOT NULL,
	CONSTRAINT cooking_records_pkey PRIMARY KEY (id),
	CONSTRAINT cooking_records_dish_id_fkey FOREIGN KEY (dish_id) REFERENCES public.dishes(id)
);
CREATE INDEX idx_cooking_records_cooked_on ON public.cooking_records USING btree (cooked_on);
CREATE INDEX idx_cooking_records_dish_id_cooked_on ON public.cooking_records USING btree (dish_id, cooked_on);


-- public.cooking_session_dishes definition

-- Drop table

-- DROP TABLE public.cooking_session_dishes;

CREATE TABLE public.cooking_session_dishes (
	session_id int8 NOT NULL,
	dish_id int8 NOT NULL,
	"position" int4 NOT NULL,
	CONSTRAINT cooking_session_dishes_pkey PRIMARY KEY (session_id, dish_id),
	CONSTRAINT cooking_session_dishes_position_check CHECK (("position" > 0)),
	CONSTRAINT cooking_session_dishes_session_id_position_key UNIQUE (session_id, "position"),
	CONSTRAINT cooking_session_dishes_dish_id_fkey FOREIGN KEY (dish_id) REFERENCES public.dishes(id),
	CONSTRAINT cooking_session_dishes_session_id_fkey FOREIGN KEY (session_id) REFERENCES public.cooking_sessions(id) ON DELETE CASCADE
);
CREATE INDEX idx_cooking_session_dishes_dish_id ON public.cooking_session_dishes USING btree (dish_id);
