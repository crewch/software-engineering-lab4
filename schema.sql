CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TYPE car_class_enum AS ENUM (
    'economy', 'compact', 'midsize', 'fullsize', 'luxury', 'suv', 'van'
);

CREATE TYPE rental_status_enum AS ENUM (
    'active', 'completed', 'cancelled'
);

CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    login VARCHAR(50) NOT NULL UNIQUE,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,

    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,

    phone VARCHAR(20),

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE cars (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    vin CHAR(17) NOT NULL UNIQUE,
    brand VARCHAR(50) NOT NULL,
    model VARCHAR(50) NOT NULL,

    year INT NOT NULL CHECK (year BETWEEN 1900 AND 2030),

    car_class car_class_enum NOT NULL,

    license_plate VARCHAR(20) NOT NULL UNIQUE,

    daily_rate DECIMAL(10,2) NOT NULL CHECK (daily_rate >= 0),

    available BOOLEAN NOT NULL DEFAULT TRUE,

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE rentals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    user_id UUID NOT NULL,
    car_id UUID NOT NULL,

    start_date TIMESTAMP NOT NULL,
    end_date TIMESTAMP NOT NULL,

    total_cost DECIMAL(10,2) NOT NULL DEFAULT 0 CHECK (total_cost >= 0),

    status rental_status_enum NOT NULL DEFAULT 'active',

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (car_id) REFERENCES cars(id) ON DELETE CASCADE,

    CHECK (end_date > start_date)
);

CREATE UNIQUE INDEX idx_users_login ON users(login);
CREATE UNIQUE INDEX idx_users_email ON users(email);
CREATE INDEX idx_cars_available ON cars(available);
CREATE INDEX idx_cars_brand_model ON cars(brand, model);
CREATE INDEX idx_rentals_user_id ON rentals(user_id);
CREATE INDEX idx_rentals_car_id ON rentals(car_id);
CREATE INDEX idx_rentals_status ON rentals(status);
CREATE INDEX idx_rentals_user_status ON rentals(user_id, status);
CREATE INDEX idx_rentals_dates ON rentals(start_date, end_date);
CREATE INDEX idx_rentals_car_dates ON rentals(car_id, start_date, end_date);
