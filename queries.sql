-- 1. Создание нового пользователя
INSERT INTO users (login, first_name, last_name, email, password, phone)
VALUES ('user_new', 'First', 'Last', 'new@mail.com', 'hash_new', '+1234567890');

-- 2. Поиск пользователя по логину
SELECT * FROM users WHERE login = 'user1';

-- 3. Добавление автомобиля в парк
INSERT INTO cars (vin, brand, model, year, car_class, license_plate, daily_rate)
VALUES ('1HGCM82633A123999', 'Toyota', 'Camry', 2023, 'midsize', 'XYZ999', 70);

-- 4. Получение списка доступных автомобилей
SELECT * FROM cars WHERE available = true;

-- 5. Поиск автомобилей по классу
SELECT * FROM cars WHERE car_class = 'suv';

-- 6. Создание аренды
INSERT INTO rentals (user_id, car_id, start_date, end_date, total_cost, status)
VALUES ('USER_ID', 'CAR_ID', now(), now() + interval '3 days', 90, 'active');

-- 7. Получение активных аренд пользователя
SELECT * FROM rentals
WHERE user_id = 'USER_ID' AND status = 'active';

-- 8. Завершение аренды
UPDATE rentals
SET status = 'completed'
WHERE id = 'RENTAL_ID';

-- 9. Получение истории аренд пользователя
SELECT * FROM rentals
WHERE user_id = 'USER_ID'
ORDER BY start_date DESC;
