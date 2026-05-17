// data.js - Тестовые данные для системы аренды автомобилей
// Загрузка тестовых данных: 12 пользователей, 15 автомобилей, 18 аренд
//
// НАЗНАЧЕНИЕ: Для ручного запуска через docker exec
// ЗАПУСК: docker exec -i car-rental-mongodb mongosh -u mongo -p mongo car_rental < data.js
//
// Примечание: При автоматической инициализации этот скрипт вызывается из init-mongo.js

const db = db.getSiblingDB('car_rental')

print('Загрузка тестовых данных...')

// ============================================================================
// USERS (12 пользователей)
// ============================================================================
print('Добавление пользователей...')

const users = [
	{
		login: 'ivan_petrov',
		first_name: 'Иван',
		last_name: 'Петров',
		email: 'ivan.petrov@example.com',
		password: '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyYzS3MebAJu',
		phone: '+79991234567',
		created_at: new Date('2023-01-10T12:00:00Z'),
	},
	{
		login: 'maria_sidorova',
		first_name: 'Мария',
		last_name: 'Сидорова',
		email: 'maria.sidorova@example.com',
		password: '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyYzS3MebAJu',
		phone: '+79991234568',
		created_at: new Date('2023-02-15T09:30:00Z'),
	},
	{
		login: 'alex_smirnov',
		first_name: 'Александр',
		last_name: 'Смирнов',
		email: 'alex.smirnov@example.com',
		password: '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyYzS3MebAJu',
		phone: '+79991234569',
		created_at: new Date('2023-03-20T14:15:00Z'),
	},
	{
		login: 'elena_kozlova',
		first_name: 'Елена',
		last_name: 'Козлова',
		email: 'elena.kozlova@example.com',
		password: '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyYzS3MebAJu',
		phone: '+79991234570',
		created_at: new Date('2023-04-05T11:00:00Z'),
	},
	{
		login: 'dmitry_volkov',
		first_name: 'Дмитрий',
		last_name: 'Волков',
		email: 'dmitry.volkov@example.com',
		password: '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyYzS3MebAJu',
		phone: null,
		created_at: new Date('2023-05-12T16:45:00Z'),
	},
	{
		login: 'olga_morozova',
		first_name: 'Ольга',
		last_name: 'Морозова',
		email: 'olga.morozova@example.com',
		password: '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyYzS3MebAJu',
		phone: '+79991234572',
		created_at: new Date('2023-06-18T10:20:00Z'),
	},
	{
		login: 'sergey_novikov',
		first_name: 'Сергей',
		last_name: 'Новиков',
		email: 'sergey.novikov@example.com',
		password: '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyYzS3MebAJu',
		phone: '+79991234573',
		created_at: new Date('2023-07-22T13:30:00Z'),
	},
	{
		login: 'anna_lebedeva',
		first_name: 'Анна',
		last_name: 'Лебедева',
		email: 'anna.lebedeva@example.com',
		password: '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyYzS3MebAJu',
		phone: '+79991234574',
		created_at: new Date('2023-08-30T08:00:00Z'),
	},
	{
		login: 'maxim_kovalenko',
		first_name: 'Максим',
		last_name: 'Коваленко',
		email: 'maxim.kovalenko@example.com',
		password: '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyYzS3MebAJu',
		phone: '+79991234575',
		created_at: new Date('2023-09-14T15:10:00Z'),
	},
	{
		login: 'natasha_pavlova',
		first_name: 'Наталья',
		last_name: 'Павлова',
		email: 'natasha.pavlova@example.com',
		password: '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyYzS3MebAJu',
		phone: '+79991234576',
		created_at: new Date('2023-10-05T12:45:00Z'),
	},
	{
		login: 'pavel_fedorov',
		first_name: 'Павел',
		last_name: 'Федоров',
		email: 'pavel.fedorov@example.com',
		password: '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyYzS3MebAJu',
		phone: '+79991234577',
		created_at: new Date('2023-11-20T09:15:00Z'),
	},
	{
		login: 'ekaterina_orlova',
		first_name: 'Екатерина',
		last_name: 'Орлова',
		email: 'ekaterina.orlova@example.com',
		password: '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyYzS3MebAJu',
		phone: null,
		created_at: new Date('2023-12-01T17:30:00Z'),
	},
]

const insertedUsers = db.users.insertMany(users)
const userIds = Object.values(insertedUsers.insertedIds)

print(`Добавлено ${userIds.length} пользователей`)

// ============================================================================
// CARS (15 автомобилей различных классов)
// ============================================================================
print('Добавление автомобилей...')

const cars = [
	{
		vin: 'WBA3A5C50CF123456',
		brand: 'BMW',
		model: '3 Series',
		year: 2022,
		car_class: 'midsize',
		license_plate: 'A123BC777',
		daily_rate: 5500.0,
		available: true,
		created_at: new Date('2023-01-15T10:00:00Z'),
	},
	{
		vin: 'WBA3A5C50CF123457',
		brand: 'Mercedes-Benz',
		model: 'C-Class',
		year: 2023,
		car_class: 'midsize',
		license_plate: 'B456CD777',
		daily_rate: 6000.0,
		available: true,
		created_at: new Date('2023-02-15T10:00:00Z'),
	},
	{
		vin: '5UXWX7C5XBA123456',
		brand: 'BMW',
		model: 'X3',
		year: 2023,
		car_class: 'suv',
		license_plate: 'K789LM777',
		daily_rate: 8500.0,
		available: true,
		created_at: new Date('2023-03-10T10:00:00Z'),
	},
	{
		vin: 'WA1LAAF77KD123456',
		brand: 'Audi',
		model: 'Q7',
		year: 2022,
		car_class: 'suv',
		license_plate: 'M012NO777',
		daily_rate: 9500.0,
		available: false,
		created_at: new Date('2023-03-20T10:00:00Z'),
	},
	{
		vin: '1HGCM82633A123456',
		brand: 'Honda',
		model: 'Accord',
		year: 2021,
		car_class: 'midsize',
		license_plate: 'P345QR777',
		daily_rate: 4500.0,
		available: true,
		created_at: new Date('2023-04-05T10:00:00Z'),
	},
	{
		vin: '1N4AL3AP8JC123456',
		brand: 'Nissan',
		model: 'Altima',
		year: 2020,
		car_class: 'midsize',
		license_plate: 'R678ST777',
		daily_rate: 4000.0,
		available: true,
		created_at: new Date('2023-04-15T10:00:00Z'),
	},
	{
		vin: '3VW2K7AJ8MM123456',
		brand: 'Volkswagen',
		model: 'Jetta',
		year: 2021,
		car_class: 'compact',
		license_plate: 'T901UV777',
		daily_rate: 3500.0,
		available: true,
		created_at: new Date('2023-05-01T10:00:00Z'),
	},
	{
		vin: '2T1BURHE5JC123456',
		brand: 'Toyota',
		model: 'Corolla',
		year: 2022,
		car_class: 'compact',
		license_plate: 'U234WX777',
		daily_rate: 3200.0,
		available: true,
		created_at: new Date('2023-05-20T10:00:00Z'),
	},
	{
		vin: '5YFBURHE8JP123456',
		brand: 'Toyota',
		model: 'Camry',
		year: 2023,
		car_class: 'fullsize',
		license_plate: 'V567YZ777',
		daily_rate: 5000.0,
		available: true,
		created_at: new Date('2023-06-10T10:00:00Z'),
	},
	{
		vin: '1G1ZD5ST8JF123456',
		brand: 'Chevrolet',
		model: 'Malibu',
		year: 2021,
		car_class: 'midsize',
		license_plate: 'W890AB777',
		daily_rate: 4200.0,
		available: false,
		created_at: new Date('2023-06-25T10:00:00Z'),
	},
	{
		vin: 'WDDGF8AB9KR123456',
		brand: 'Mercedes-Benz',
		model: 'S-Class',
		year: 2023,
		car_class: 'luxury',
		license_plate: 'X123CD777',
		daily_rate: 15000.0,
		available: true,
		created_at: new Date('2023-07-15T10:00:00Z'),
	},
	{
		vin: 'WAUZZZ4G5KN123456',
		brand: 'Audi',
		model: 'A8',
		year: 2022,
		car_class: 'luxury',
		license_plate: 'Y456EF777',
		daily_rate: 14000.0,
		available: true,
		created_at: new Date('2023-08-01T10:00:00Z'),
	},
	{
		vin: '5XYZUDLB8KH123456',
		brand: 'Hyundai',
		model: 'Santa Fe',
		year: 2021,
		car_class: 'suv',
		license_plate: 'Z789GH777',
		daily_rate: 6500.0,
		available: true,
		created_at: new Date('2023-08-20T10:00:00Z'),
	},
	{
		vin: 'KNDJN2A28K7123456',
		brand: 'Kia',
		model: 'Sorento',
		year: 2020,
		car_class: 'suv',
		license_plate: 'A012IJ777',
		daily_rate: 6000.0,
		available: true,
		created_at: new Date('2023-09-05T10:00:00Z'),
	},
	{
		vin: '2C4RDGCG8KR123456',
		brand: 'Chrysler',
		model: 'Pacifica',
		year: 2022,
		car_class: 'van',
		license_plate: 'B345KL777',
		daily_rate: 7500.0,
		available: true,
		created_at: new Date('2023-09-25T10:00:00Z'),
	},
]

const insertedCars = db.cars.insertMany(cars)
const carIds = Object.values(insertedCars.insertedIds)

print(`Добавлено ${carIds.length} автомобилей`)

// ============================================================================
// RENTALS (18 аренд с различными статусами)
// ============================================================================
print('Добавление аренд...')

const rentals = [
	// Активные аренды (5)
	{
		user_id: userIds[0], // ivan_petrov
		car_id: carIds[0], // BMW 3 Series
		start_date: new Date('2024-01-05T10:00:00Z'),
		end_date: new Date('2024-01-10T10:00:00Z'),
		total_cost: 27500.0,
		status: 'active',
		created_at: new Date('2024-01-01T15:30:00Z'),
	},
	{
		user_id: userIds[1], // maria_sidorova
		car_id: carIds[2], // BMW X3
		start_date: new Date('2024-01-08T09:00:00Z'),
		end_date: new Date('2024-01-15T09:00:00Z'),
		total_cost: 59500.0,
		status: 'active',
		created_at: new Date('2024-01-03T10:00:00Z'),
	},
	{
		user_id: userIds[2], // alex_smirnov
		car_id: carIds[10], // Mercedes S-Class
		start_date: new Date('2024-01-10T14:00:00Z'),
		end_date: new Date('2024-01-12T14:00:00Z'),
		total_cost: 30000.0,
		status: 'active',
		created_at: new Date('2024-01-05T09:00:00Z'),
	},
	{
		user_id: userIds[3], // elena_kozlova
		car_id: carIds[6], // VW Jetta
		start_date: new Date('2024-01-07T11:00:00Z'),
		end_date: new Date('2024-01-14T11:00:00Z'),
		total_cost: 24500.0,
		status: 'active',
		created_at: new Date('2024-01-02T16:00:00Z'),
	},
	{
		user_id: userIds[4], // dmitry_volkov
		car_id: carIds[12], // Hyundai Santa Fe
		start_date: new Date('2024-01-09T08:00:00Z'),
		end_date: new Date('2024-01-16T08:00:00Z'),
		total_cost: 45500.0,
		status: 'active',
		created_at: new Date('2024-01-04T11:30:00Z'),
	},

	// Завершенные аренды (10)
	{
		user_id: userIds[0], // ivan_petrov
		car_id: carIds[7], // Toyota Corolla
		start_date: new Date('2023-11-01T10:00:00Z'),
		end_date: new Date('2023-11-05T10:00:00Z'),
		total_cost: 12800.0,
		status: 'completed',
		created_at: new Date('2023-10-25T12:00:00Z'),
	},
	{
		user_id: userIds[0], // ivan_petrov
		car_id: carIds[1], // Mercedes C-Class
		start_date: new Date('2023-12-10T10:00:00Z'),
		end_date: new Date('2023-12-15T10:00:00Z'),
		total_cost: 30000.0,
		status: 'completed',
		created_at: new Date('2023-12-01T09:00:00Z'),
	},
	{
		user_id: userIds[1], // maria_sidorova
		car_id: carIds[5], // Nissan Altima
		start_date: new Date('2023-10-05T09:00:00Z'),
		end_date: new Date('2023-10-12T09:00:00Z'),
		total_cost: 28000.0,
		status: 'completed',
		created_at: new Date('2023-09-28T14:00:00Z'),
	},
	{
		user_id: userIds[2], // alex_smirnov
		car_id: carIds[3], // Audi Q7
		start_date: new Date('2023-09-15T14:00:00Z'),
		end_date: new Date('2023-09-20T14:00:00Z'),
		total_cost: 47500.0,
		status: 'completed',
		created_at: new Date('2023-09-01T10:00:00Z'),
	},
	{
		user_id: userIds[5], // olga_morozova
		car_id: carIds[8], // Toyota Camry
		start_date: new Date('2023-11-20T10:00:00Z'),
		end_date: new Date('2023-11-27T10:00:00Z'),
		total_cost: 35000.0,
		status: 'completed',
		created_at: new Date('2023-11-10T11:00:00Z'),
	},
	{
		user_id: userIds[6], // sergey_novikov
		car_id: carIds[11], // Audi A8
		start_date: new Date('2023-12-01T09:00:00Z'),
		end_date: new Date('2023-12-03T09:00:00Z'),
		total_cost: 28000.0,
		status: 'completed',
		created_at: new Date('2023-11-20T15:00:00Z'),
	},
	{
		user_id: userIds[7], // anna_lebedeva
		car_id: carIds[4], // Honda Accord
		start_date: new Date('2023-10-10T11:00:00Z'),
		end_date: new Date('2023-10-17T11:00:00Z'),
		total_cost: 31500.0,
		status: 'completed',
		created_at: new Date('2023-09-30T09:30:00Z'),
	},
	{
		user_id: userIds[8], // maxim_kovalenko
		car_id: carIds[14], // Chrysler Pacifica
		start_date: new Date('2023-11-05T08:00:00Z'),
		end_date: new Date('2023-11-12T08:00:00Z'),
		total_cost: 52500.0,
		status: 'completed',
		created_at: new Date('2023-10-20T13:00:00Z'),
	},
	{
		user_id: userIds[9], // natasha_pavlova
		car_id: carIds[9], // Chevrolet Malibu
		start_date: new Date('2023-12-15T10:00:00Z'),
		end_date: new Date('2023-12-20T10:00:00Z'),
		total_cost: 21000.0,
		status: 'completed',
		created_at: new Date('2023-12-05T10:00:00Z'),
	},
	{
		user_id: userIds[10], // pavel_fedorov
		car_id: carIds[13], // Kia Sorento
		start_date: new Date('2023-12-20T09:00:00Z'),
		end_date: new Date('2023-12-27T09:00:00Z'),
		total_cost: 42000.0,
		status: 'completed',
		created_at: new Date('2023-12-10T14:00:00Z'),
	},

	// Отмененные аренды (3)
	{
		user_id: userIds[11], // ekaterina_orlova
		car_id: carIds[1], // Mercedes C-Class
		start_date: new Date('2024-01-20T10:00:00Z'),
		end_date: new Date('2024-01-25T10:00:00Z'),
		total_cost: 30000.0,
		status: 'cancelled',
		created_at: new Date('2024-01-08T11:00:00Z'),
	},
	{
		user_id: userIds[5], // olga_morozova
		car_id: carIds[11], // Audi A8
		start_date: new Date('2024-01-18T09:00:00Z'),
		end_date: new Date('2024-01-22T09:00:00Z'),
		total_cost: 56000.0,
		status: 'cancelled',
		created_at: new Date('2024-01-06T16:00:00Z'),
	},
	{
		user_id: userIds[7], // anna_lebedeva
		car_id: carIds[3], // Audi Q7
		start_date: new Date('2024-01-25T14:00:00Z'),
		end_date: new Date('2024-01-30T14:00:00Z'),
		total_cost: 47500.0,
		status: 'cancelled',
		created_at: new Date('2024-01-10T09:00:00Z'),
	},
]

const insertedRentals = db.rentals.insertMany(rentals)

print(`Добавлено ${Object.keys(insertedRentals.insertedIds).length} аренд`)

// ============================================================================
// Итоговая статистика
// ============================================================================
print('\n=== Статистика ===')
print(`Пользователей: ${db.users.countDocuments()}`)
print(`Автомобилей: ${db.cars.countDocuments()}`)
print(`Аренд: ${db.rentals.countDocuments()}`)

print('\n=== Статусы аренд ===')
print(`Активные: ${db.rentals.countDocuments({ status: 'active' })}`)
print(`Завершенные: ${db.rentals.countDocuments({ status: 'completed' })}`)
print(`Отмененные: ${db.rentals.countDocuments({ status: 'cancelled' })}`)

print('\n=== Классы автомобилей ===')
db.cars
	.aggregate([
		{ $group: { _id: '$car_class', count: { $sum: 1 } } },
		{ $sort: { count: -1 } },
	])
	.forEach((doc) => print(`${doc._id}: ${doc.count}`))

print('\nДанные успешно добавлены!')
