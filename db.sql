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


-- public.ingredient_categories definition

-- Drop table

-- DROP TABLE public.ingredient_categories;

CREATE TABLE public.ingredient_categories (
	id int8 GENERATED ALWAYS AS IDENTITY( INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START 1 CACHE 1 NO CYCLE) NOT NULL,
	"name" varchar(100) NOT NULL,
	created_at timestamptz DEFAULT now() NOT NULL,
	CONSTRAINT ingredient_categories_name_not_blank CHECK ((length(TRIM(BOTH FROM name)) > 0)),
	CONSTRAINT ingredient_categories_name_unique UNIQUE (name),
	CONSTRAINT ingredient_categories_pkey PRIMARY KEY (id)
);


-- public.ingredients_import definition

-- Drop table

-- DROP TABLE public.ingredients_import;

CREATE TABLE public.ingredients_import (
	"name" varchar(100) NULL,
	default_unit varchar(20) NULL,
	ingredient_category varchar(100) NULL
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
	CONSTRAINT menus_dish_signature_unique UNIQUE (dish_signature),
	CONSTRAINT menus_pkey PRIMARY KEY (id),
	CONSTRAINT menus_source_check CHECK (((source)::text = ANY ((ARRAY['random'::character varying, 'manual'::character varying])::text[])))
);
CREATE UNIQUE INDEX menus_random_signature_unique ON public.menus USING btree (dish_signature) WHERE ((source)::text = 'random'::text);


-- public.units definition

-- Drop table

-- DROP TABLE public.units;

CREATE TABLE public.units (
	id int8 GENERATED ALWAYS AS IDENTITY( INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START 1 CACHE 1 NO CYCLE) NOT NULL,
	"name" varchar(50) NOT NULL,
	symbol varchar(20) NOT NULL,
	unit_type varchar(20) NOT NULL,
	created_at timestamptz DEFAULT now() NOT NULL,
	CONSTRAINT units_name_not_blank CHECK ((length(TRIM(BOTH FROM name)) > 0)),
	CONSTRAINT units_name_unique UNIQUE (name),
	CONSTRAINT units_pkey PRIMARY KEY (id),
	CONSTRAINT units_symbol_not_blank CHECK ((length(TRIM(BOTH FROM symbol)) > 0)),
	CONSTRAINT units_symbol_unique UNIQUE (symbol),
	CONSTRAINT units_type_check CHECK (((unit_type)::text = ANY ((ARRAY['mass'::character varying, 'volume'::character varying, 'count'::character varying, 'package'::character varying])::text[])))
);


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


-- public.ingredients definition

-- Drop table

-- DROP TABLE public.ingredients;

CREATE TABLE public.ingredients (
	id int8 GENERATED ALWAYS AS IDENTITY( INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START 1 CACHE 1 NO CYCLE) NOT NULL,
	"name" varchar(100) NOT NULL,
	default_unit varchar(20) DEFAULT 'g'::character varying NOT NULL,
	is_active bool DEFAULT true NOT NULL,
	created_at timestamptz DEFAULT now() NOT NULL,
	updated_at timestamptz DEFAULT now() NOT NULL,
	ingredient_category_id int8 NULL,
	default_unit_id int8 NULL,
	CONSTRAINT ingredients_default_unit_not_blank CHECK ((length(TRIM(BOTH FROM default_unit)) > 0)),
	CONSTRAINT ingredients_name_not_blank CHECK ((length(TRIM(BOTH FROM name)) > 0)),
	CONSTRAINT ingredients_name_unique UNIQUE (name),
	CONSTRAINT ingredients_pkey PRIMARY KEY (id),
	CONSTRAINT ingredients_default_unit_id_fkey FOREIGN KEY (default_unit_id) REFERENCES public.units(id) ON DELETE RESTRICT
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


-- public.ai_ingredient_labels definition

-- Drop table

-- DROP TABLE public.ai_ingredient_labels;

CREATE TABLE public.ai_ingredient_labels (
	id bigserial NOT NULL,
	"label" varchar(150) NOT NULL,
	ingredient_id int8 NULL,
	model_name varchar(150) DEFAULT 'bep-nha-ingredients'::character varying NOT NULL,
	is_active bool DEFAULT true NOT NULL,
	created_at timestamptz DEFAULT now() NOT NULL,
	updated_at timestamptz DEFAULT now() NOT NULL,
	CONSTRAINT ai_ingredient_labels_pkey PRIMARY KEY (id),
	CONSTRAINT uq_ai_label_model UNIQUE (model_name, label),
	CONSTRAINT ai_ingredient_labels_ingredient_id_fkey FOREIGN KEY (ingredient_id) REFERENCES public.ingredients(id) ON DELETE RESTRICT
);
CREATE INDEX idx_ai_ingredient_labels_active ON public.ai_ingredient_labels USING btree (model_name, is_active);
CREATE INDEX idx_ai_ingredient_labels_ingredient_id ON public.ai_ingredient_labels USING btree (ingredient_id);
CREATE UNIQUE INDEX uq_ai_ingredient_labels_model_label ON public.ai_ingredient_labels USING btree (model_name, lower((label)::text));


-- public.allergen_ingredients definition

-- Drop table

-- DROP TABLE public.allergen_ingredients;

CREATE TABLE public.allergen_ingredients (
	ingredient_id int8 NOT NULL,
	created_at timestamptz DEFAULT now() NOT NULL,
	CONSTRAINT allergen_ingredients_pkey PRIMARY KEY (ingredient_id),
	CONSTRAINT allergen_ingredients_ingredient_id_fkey FOREIGN KEY (ingredient_id) REFERENCES public.ingredients(id) ON DELETE CASCADE
);


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


-- public.dish_ingredients definition

-- Drop table

-- DROP TABLE public.dish_ingredients;

CREATE TABLE public.dish_ingredients (
	dish_id int8 NOT NULL,
	ingredient_id int8 NOT NULL,
	quantity_per_person numeric(10, 3) NOT NULL,
	unit varchar(20) NULL,
	ingredient_role varchar(10) DEFAULT 'minor'::character varying NOT NULL,
	is_optional bool DEFAULT false NOT NULL,
	preparation_note text NULL,
	created_at timestamptz DEFAULT now() NOT NULL,
	updated_at timestamptz DEFAULT now() NOT NULL,
	unit_id int8 NULL,
	CONSTRAINT dish_ingredients_pkey PRIMARY KEY (dish_id, ingredient_id),
	CONSTRAINT dish_ingredients_quantity_positive CHECK ((quantity_per_person > (0)::numeric)),
	CONSTRAINT dish_ingredients_role_check CHECK (((ingredient_role)::text = ANY ((ARRAY['main'::character varying, 'minor'::character varying])::text[]))),
	CONSTRAINT dish_ingredients_unit_not_blank CHECK ((length(TRIM(BOTH FROM unit)) > 0)),
	CONSTRAINT dish_ingredients_dish_id_fkey FOREIGN KEY (dish_id) REFERENCES public.dishes(id) ON DELETE CASCADE,
	CONSTRAINT dish_ingredients_ingredient_id_fkey FOREIGN KEY (ingredient_id) REFERENCES public.ingredients(id) ON DELETE RESTRICT,
	CONSTRAINT dish_ingredients_unit_id_fkey FOREIGN KEY (unit_id) REFERENCES public.units(id) ON DELETE RESTRICT
);
CREATE INDEX idx_dish_ingredients_ingredient_id ON public.dish_ingredients USING btree (ingredient_id);
