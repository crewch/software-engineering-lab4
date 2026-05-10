INSERT INTO users (login, first_name, last_name, email, password, phone) VALUES
('user1','Ivan','Ivanov','user1@mail.com','hash1','+1234567890'),
('user2','Petr','Petrov','user2@mail.com','hash2',NULL),
('user3','Anna','Smirnova','user3@mail.com','hash3',NULL),
('user4','Olga','Sidorova','user4@mail.com','hash4',NULL),
('user5','John','Doe','user5@mail.com','hash5',NULL),
('user6','Jane','Doe','user6@mail.com','hash6',NULL),
('user7','Max','Payne','user7@mail.com','hash7',NULL),
('user8','Leo','Messi','user8@mail.com','hash8',NULL),
('user9','Cristiano','Ronaldo','user9@mail.com','hash9',NULL),
('user10','Bruce','Wayne','user10@mail.com','hash10',NULL);

INSERT INTO cars (vin, brand, model, year, car_class, license_plate, daily_rate) VALUES
('1HGCM82633A123456','Toyota','Corolla',2020,'economy','ABC123',30),
('1HGCM82633A123457','Honda','Civic',2019,'compact','DEF456',35),
('1HGCM82633A123458','BMW','X5',2022,'luxury','GHI789',120),
('1HGCM82633A123459','Audi','A6',2021,'midsize','JKL111',90),
('1HGCM82633A123460','Mercedes','E200',2023,'luxury','MNO222',150),
('1HGCM82633A123461','Ford','Focus',2018,'compact','PQR333',25),
('1HGCM82633A123462','Nissan','Altima',2020,'midsize','STU444',40),
('1HGCM82633A123463','Kia','Sportage',2021,'suv','VWX555',60),
('1HGCM82633A123464','Hyundai','Tucson',2022,'suv','YZA666',65),
('1HGCM82633A123465','VW','Passat',2019,'fullsize','BCD777',50);

INSERT INTO rentals (user_id, car_id, start_date, end_date, total_cost, status)
SELECT 
    u.id,
    c.id,
    now() - interval '1 day',
    now() + interval '2 days',
    c.daily_rate * 3,
    'active'
FROM users u
JOIN cars c ON true
LIMIT 10;
