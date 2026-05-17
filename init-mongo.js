// init-mongo.js — единый скрипт инициализации MongoDB для car_rental
// Автоматически выполняется при первом запуске контейнера MongoDB
// Запуск: docker-compose up -d mongo

const db = db.getSiblingDB('car_rental')

print('=== Инициализация MongoDB ===')
print('Database: ' + db.getName())

// ============================================================================
// 1. СОЗДАНИЕ КОЛЛЕКЦИЙ С ВАЛИДАЦИЕЙ СХЕМ
// ============================================================================
print('\n1. Создание коллекций с валидацией...')

// Drop existing collections if they exist (for re-initialization)
try {
	db.users.drop()
} catch (e) {}
try {
	db.cars.drop()
} catch (e) {}
try {
	db.rentals.drop()
} catch (e) {}

// Users collection with validation
db.createCollection('users', {
	validator: {
		$jsonSchema: {
			bsonType: 'object',
			required: ['login', 'first_name', 'last_name', 'email', 'password'],
			properties: {
				login: {
					bsonType: 'string',
					minLength: 3,
					maxLength: 50,
					pattern: '^[a-zA-Z0-9_-]+$',
					description:
						'Login must be 3-50 characters, alphanumeric with underscores or hyphens',
				},
				first_name: {
					bsonType: 'string',
					minLength: 1,
					maxLength: 100,
					description: 'First name is required',
				},
				last_name: {
					bsonType: 'string',
					minLength: 1,
					maxLength: 100,
					description: 'Last name is required',
				},
				email: {
					bsonType: 'string',
					maxLength: 255,
					description: 'Email is required',
				},
				password: {
					bsonType: 'string',
					minLength: 8,
					maxLength: 128,
					description: 'Password must be 8-128 characters',
				},
				phone: {
					bsonType: ['string', 'null'],
					pattern: '^\\+?[0-9\\s\\-()]{10,20}$',
					description: 'Phone must be 10-20 characters',
				},
				created_at: {
					bsonType: 'date',
					description: 'Creation timestamp',
				},
			},
		},
	},
	validationLevel: 'strict',
	validationAction: 'error',
})

print('Created users collection with validation')

// Cars collection with validation
db.createCollection('cars', {
	validator: {
		$jsonSchema: {
			bsonType: 'object',
			required: [
				'vin',
				'brand',
				'model',
				'year',
				'car_class',
				'license_plate',
				'daily_rate',
			],
			properties: {
				vin: {
					bsonType: 'string',
					pattern: '^[A-HJ-NPR-Z0-9]{17}$',
					description: 'VIN must be exactly 17 characters',
				},
				brand: {
					bsonType: 'string',
					minLength: 1,
					maxLength: 50,
					description: 'Brand is required',
				},
				model: {
					bsonType: 'string',
					minLength: 1,
					maxLength: 50,
					description: 'Model is required',
				},
				year: {
					bsonType: 'number',
					minimum: 1900,
					maximum: 2030,
					description: 'Year must be between 1900 and 2030',
				},
				car_class: {
					enum: [
						'economy',
						'compact',
						'midsize',
						'fullsize',
						'luxury',
						'suv',
						'van',
					],
					description: 'Car class must be one of the allowed values',
				},
				license_plate: {
					bsonType: 'string',
					description: 'License plate is required',
				},
				daily_rate: {
					bsonType: 'number',
					minimum: 0,
					description: 'Daily rate must be non-negative',
				},
				available: {
					bsonType: 'bool',
					description: 'Availability flag',
				},
				created_at: {
					bsonType: 'date',
					description: 'Creation timestamp',
				},
			},
		},
	},
	validationLevel: 'strict',
	validationAction: 'error',
})

print('Created cars collection with validation')

// Rentals collection with validation
db.createCollection('rentals', {
	validator: {
		$jsonSchema: {
			bsonType: 'object',
			required: [
				'user_id',
				'car_id',
				'start_date',
				'end_date',
				'total_cost',
				'status',
			],
			properties: {
				user_id: {
					bsonType: 'objectId',
					description: 'Reference to user',
				},
				car_id: {
					bsonType: 'objectId',
					description: 'Reference to car',
				},
				start_date: {
					bsonType: 'date',
					description: 'Rental start date',
				},
				end_date: {
					bsonType: 'date',
					description: 'Rental end date',
				},
				total_cost: {
					bsonType: 'number',
					minimum: 0,
					description: 'Total cost must be non-negative',
				},
				status: {
					enum: ['active', 'completed', 'cancelled'],
					description: 'Rental status',
				},
				created_at: {
					bsonType: 'date',
					description: 'Creation timestamp',
				},
			},
		},
	},
	validationLevel: 'strict',
	validationAction: 'error',
})

print('Created rentals collection with validation')

// Create indexes for performance
print('Creating indexes...')

// Users indexes
db.users.createIndex({ login: 1 }, { unique: true })
db.users.createIndex({ email: 1 }, { unique: true })

// Cars indexes
db.cars.createIndex({ vin: 1 }, { unique: true })
db.cars.createIndex({ license_plate: 1 }, { unique: true })
db.cars.createIndex({ car_class: 1, available: 1 })
db.cars.createIndex({ available: 1 })

// Rentals indexes
db.rentals.createIndex({ user_id: 1, status: 1 })
db.rentals.createIndex({ car_id: 1, status: 1 })
db.rentals.createIndex({ user_id: 1 })
db.rentals.createIndex({ car_id: 1 })

print('Indexes created successfully')
print('Schema validation setup completed')

// ============================================================================
// 2. ЗАГРУЗКА ТЕСТОВЫХ ДАННЫХ
// ============================================================================
print('\n2. Загрузка тестовых данных...')

// USERS (12 пользователей)
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

// CARS (15 автомобилей различных классов)
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

// RENTALS (18 аренд с различными статусами)
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

// Итоговая статистика
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

// ============================================================================
// 3. CRUD ОПЕРАЦИИ (ДЕМОНСТРАЦИЯ)
// ============================================================================
print('\n=== MongoDB Запросы для Car Rental API ===\n')

// CREATE OPERATIONS
print('=== 1. CREATE OPERATIONS ===\n')

// 1.1 Вставка одного документа (insertOne)
print('1.1 Вставка нового пользователя (insertOne):')
const newUser = db.users.insertOne({
	login: 'test_user',
	first_name: 'Тест',
	last_name: 'Тестов',
	email: 'test@example.com',
	password: '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyYzS3MebAJu',
	phone: '+79990000000',
	created_at: new Date(),
})
print(`Создан пользователь с ID: ${newUser.insertedId}\n`)

// 1.2 Вставка нескольких документов (insertMany)
print('1.2 Вставка новых автомобилей (insertMany):')
const newCars = db.cars.insertMany([
	{
		vin: 'WBA8E9C50KN123458',
		brand: 'BMW',
		model: '5 Series',
		year: 2024,
		car_class: 'fullsize',
		license_plate: 'C789DE777',
		daily_rate: 7500.0,
		available: true,
		created_at: new Date(),
	},
	{
		vin: 'WAUZZZ8V8KA123459',
		brand: 'Audi',
		model: 'A4',
		year: 2023,
		car_class: 'compact',
		license_plate: 'D012FG777',
		daily_rate: 4500.0,
		available: true,
		created_at: new Date(),
	},
])
print(`Создано ${Object.keys(newCars.insertedIds).length} автомобиля\n`)

// READ OPERATIONS
print('=== 2. READ OPERATIONS ===\n')

// 2.1 Найти всех пользователей (find all)
print('2.1 Все пользователи (find all):')
const allUsers = db.users.find().limit(3).toArray()
allUsers.forEach((u) => print(`  - ${u.login}: ${u.first_name} ${u.last_name}`))
print(`  ... всего: ${db.users.countDocuments()}\n`)

// 2.2 Найти пользователя по логину ($eq)
print('2.3 Поиск пользователя по логину ($eq):')
const userByLogin = db.users.findOne({ login: 'ivan_petrov' })
if (userByLogin) {
	print(
		`  Найден: ${userByLogin.first_name} ${userByLogin.last_name} (${userByLogin.email})\n`,
	)
}

// 2.3 Поиск по маске имени и фамилии ($regex)
print('2.4 Поиск по маске имени ($regex):')
const usersByName = db.users
	.find({
		first_name: { $regex: /^А/, $options: 'i' }, // Начинается на "А"
	})
	.limit(5)
	.toArray()
print(
	`  Пользователи на "А": ${usersByName.map((u) => u.first_name).join(', ')}\n`,
)

// 2.4 Поиск доступных автомобилей
print('2.5 Доступные автомобили ($eq):')
const availableCars = db.cars.countDocuments({ available: true })
print(`  Доступно автомобилей: ${availableCars}\n`)

// 2.5 Поиск автомобилей по классу
print('2.6 Автомобили класса SUV:')
const suvCars = db.cars.find({ car_class: 'suv', available: true }).toArray()
suvCars.forEach((c) => print(`  - ${c.brand} ${c.model} (${c.license_plate})`))
print('')

// 2.6 Поиск по диапазону цен ($gte, $lte)
print('2.7 Автомобили стоимостью 5000-10000 руб/день ($gte, $lte):')
const midRangeCars = db.cars
	.find({
		daily_rate: { $gte: 5000, $lte: 10000 },
	})
	.toArray()
midRangeCars.forEach((c) =>
	print(`  - ${c.brand} ${c.model}: ${c.daily_rate} руб/день`),
)
print('')

// 2.7 Поиск по нескольким классам ($in)
print('2.8 Автомобили классов luxury или van ($in):')
const luxuryVans = db.cars
	.find({
		car_class: { $in: ['luxury', 'van'] },
	})
	.toArray()
luxuryVans.forEach((c) => print(`  - ${c.brand} ${c.model} (${c.car_class})`))
print('')

// 2.8 Поиск с исключением ($ne)
print('2.9 Автомобили НЕ класса economy ($ne):')
const notEconomy = db.cars.countDocuments({
	car_class: { $ne: 'economy' },
})
print(`  Найдено: ${notEconomy}\n`)

// 2.10 Активные аренды пользователя
print('2.10 Активные аренды пользователя (поиск по user_id):')
const ivan = db.users.findOne({ login: 'ivan_petrov' })
if (ivan) {
	const activeRentals = db.rentals
		.find({
			user_id: ivan._id,
			status: 'active',
		})
		.toArray()
	print(`  Активные аренды у ${ivan.first_name}: ${activeRentals.length}`)
	activeRentals.forEach((r) => {
		const car = db.cars.findOne({ _id: r.car_id })
		print(
			`    - ${car.brand} ${car.model} до ${r.end_date.toLocaleDateString()}`,
		)
	})
	print('')
}

// 2.11 Поиск с $and
print('2.11 Автомобили SUV доступные и дороже 7000 руб/день ($and):')
const expensiveSuvs = db.cars
	.find({
		$and: [
			{ car_class: 'suv' },
			{ available: true },
			{ daily_rate: { $gt: 7000 } },
		],
	})
	.toArray()
expensiveSuvs.forEach((c) =>
	print(`  - ${c.brand} ${c.model}: ${c.daily_rate} руб/день`),
)
print('')

// 2.12 Поиск с $or
print('2.12 Автомобили 2023 ИЛИ 2024 года ($or):')
const recentCars = db.cars
	.find({
		$or: [{ year: 2023 }, { year: 2024 }],
	})
	.limit(5)
	.toArray()
print(`  Найдено: ${recentCars.length} автомобилей`)
recentCars.forEach((c) => print(`    - ${c.brand} ${c.model} (${c.year})`))
print('')

// 2.13 Поиск с $lt (меньше чем)
print('2.13 Автомобили дешевле 4000 руб/день ($lt):')
const cheapCars = db.cars
	.find({
		daily_rate: { $lt: 4000 },
	})
	.toArray()
cheapCars.forEach((c) =>
	print(`  - ${c.brand} ${c.model}: ${c.daily_rate} руб/день`),
)
print('')

// 2.14 История аренд пользователя (все статусы)
print('2.14 История всех аренд пользователя:')
const maria = db.users.findOne({ login: 'maria_sidorova' })
if (maria) {
	const allRentals = db.rentals
		.find({
			user_id: maria._id,
		})
		.sort({ created_at: -1 })
		.toArray()
	print(`  Всего аренд у ${maria.first_name}: ${allRentals.length}`)
	allRentals.forEach((r) => {
		const car = db.cars.findOne({ _id: r.car_id })
		print(`    - [${r.status}] ${car.brand} ${car.model}: ${r.total_cost} руб`)
	})
	print('')
}

// UPDATE OPERATIONS
print('=== 3. UPDATE OPERATIONS ===\n')

// 3.1 Обновление одного поля ($set)
print('3.1 Обновление статуса автомобиля ($set):')
const carToUpdate = db.cars.findOne({ vin: 'WBA3A5C50CF123456' })
if (carToUpdate) {
	db.cars.updateOne({ _id: carToUpdate._id }, { $set: { available: false } })
	const updated = db.cars.findOne({ _id: carToUpdate._id })
	print(
		`  ${updated.brand} ${updated.model}: available = ${updated.available}\n`,
	)
	// Возвращаем обратно
	db.cars.updateOne({ _id: carToUpdate._id }, { $set: { available: true } })
}

// 3.2 Обновление нескольких полей
print('3.2 Обновление нескольких полей:')
db.users.updateOne(
	{ login: 'test_user' },
	{
		$set: {
			phone: '+79991112233',
			last_name: 'Обновленов',
		},
	},
)
const updatedUser = db.users.findOne({ login: 'test_user' })
print(`  Телефон обновлен: ${updatedUser.phone}\n`)

// 3.3 Обновление по условию (множественное)
print('3.3 Повышение стоимости всех luxury на 10%:')
const luxuryResult = db.cars.updateMany(
	{ car_class: 'luxury' },
	{ $mul: { daily_rate: 1.1 } },
)
print(`  Обновлено автомобилей: ${luxuryResult.modifiedCount}`)
const luxuryCars = db.cars.find({ car_class: 'luxury' }).toArray()
luxuryCars.forEach((c) =>
	print(`    - ${c.brand} ${c.model}: ${c.daily_rate.toFixed(2)} руб/день`),
)
// Возвращаем обратно
db.cars.updateMany({ car_class: 'luxury' }, { $mul: { daily_rate: 1 / 1.1 } })
print('')

// 3.4 Инкремент числового поля ($inc)
print('3.4 Инкремент года выпуска ($inc):')
const oldCar = db.cars.findOne({ year: { $lt: 2021 } })
if (oldCar) {
	const oldYear = oldCar.year
	db.cars.updateOne({ _id: oldCar._id }, { $inc: { year: 1 } })
	const updated = db.cars.findOne({ _id: oldCar._id })
	print(`  ${updated.brand} ${updated.model}: ${oldYear} → ${updated.year}\n`)
	// Возвращаем обратно
	db.cars.updateOne({ _id: oldCar._id }, { $inc: { year: -1 } })
}

// 3.5 Добавление в массив ($push) - добавим историю изменений
print('3.5 Добавление в массив ($push):')
// Сначала добавим поле history некоторым арендам
const rentalToUpdate = db.rentals.findOne({ status: 'active' })
if (rentalToUpdate) {
	db.rentals.updateOne(
		{ _id: rentalToUpdate._id },
		{
			$push: {
				history: {
					action: 'created',
					timestamp: new Date(),
					note: 'Аренда создана',
				},
			},
		},
	)
	const updated = db.rentals.findOne(
		{ _id: rentalToUpdate._id },
		{ history: 1 },
	)
	print(`  Добавлена запись в историю: ${updated.history[0].action}\n`)
}

// 3.6 Удаление из массива ($pull)
print('3.6 Удаление из массива ($pull):')
if (rentalToUpdate) {
	db.rentals.updateOne(
		{ _id: rentalToUpdate._id },
		{ $pull: { history: { action: 'created' } } },
	)
	const updated = db.rentals.findOne(
		{ _id: rentalToUpdate._id },
		{ history: 1 },
	)
	print(
		`  История очищена, осталось записей: ${updated.history ? updated.history.length : 0}\n`,
	)
}

// 3.7 Удаление поля ($unset)
print('3.7 Удаление поля ($unset):')
db.rentals.updateOne({ _id: rentalToUpdate._id }, { $unset: { history: '' } })
print(`  Поле 'history' удалено\n`)

// ============================================================================
// 4. ДОПОЛНИТЕЛЬНЫЕ ОПЕРАТОРЫ
// ============================================================================
print('\n=== 4. ADDITIONAL OPERATORS ===\n')

// 4.1 $exists - проверка существования поля
print('4.1 Пользователи с телефоном ($exists):')
const usersWithPhone = db.users.countDocuments({
	phone: { $exists: true, $ne: null },
})
print(`  Пользователей с телефоном: ${usersWithPhone}\n`)

// 4.2 $size - размер массива
print('4.2 Аренды с историей изменений ($size):')
const rentalsWithHistory = db.rentals.countDocuments({
	history: { $exists: true },
	$expr: { $gt: [{ $size: '$history' }, 0] },
})
print(`  Аренд с историей: ${rentalsWithHistory}\n`)

// 4.3 $type - проверка типа поля
print('4.3 Проверка типов полей ($type):')
const validDates = db.cars.countDocuments({
	created_at: { $type: 'date' },
})
print(`  Автомобилей с корректной датой: ${validDates}\n`)

// 4.4 $expr - выражения с полями
print('4.4 Аренды где end_date > start_date ($expr):')
const validRentals = db.rentals.countDocuments({
	$expr: { $gt: ['$end_date', '$start_date'] },
})
print(`  Корректных аренд: ${validRentals}\n`)

// 4.5 Сортировка и лимит
print('4.5 Топ-5 самых дорогих автомобилей:')
const topCars = db.cars.find().sort({ daily_rate: -1 }).limit(5).toArray()
topCars.forEach((c, i) =>
	print(`  ${i + 1}. ${c.brand} ${c.model}: ${c.daily_rate} руб/день`),
)
print('')

// 4.6 Проекция (выбор конкретных полей)
print('4.6 Только VIN и марка автомобилей:')
const projected = db.cars
	.find({}, { vin: 1, brand: 1, _id: 0 })
	.limit(5)
	.toArray()
projected.forEach((p) => print(`  ${p.vin}: ${p.brand}`))
print('')

// ИТОГОВАЯ СТАТИСТИКА
print('=== ИТОГОВАЯ СТАТИСТИКА ===')
print(`Пользователей: ${db.users.countDocuments()}`)
print(`Автомобилей: ${db.cars.countDocuments()}`)
print(`Аренд: ${db.rentals.countDocuments()}`)
print(`\nCRUD операции выполнены успешно!`)

// ============================================================================
// 5. AGGREGATION PIPELINES (АНАЛИТИЧЕСКИЕ ОТЧЁТЫ)
// Выполняются ПОСЛЕ CRUD, но ДО удаления тестовых данных
// ============================================================================
print('\n=== AGGREGATION PIPELINES ===\n')

// 1. Статистика по классам автомобилей
print('=== 1. СТАТИСТИКА ПО КЛАССАМ АВТОМОБИЛЕЙ ===\n')

const carClassStats = db.cars
	.aggregate([
		{ $match: { available: true } },
		{
			$group: {
				_id: '$car_class',
				count: { $sum: 1 },
				avgPrice: { $avg: '$daily_rate' },
				minPrice: { $min: '$daily_rate' },
				maxPrice: { $max: '$daily_rate' },
				totalRevenue: { $sum: '$daily_rate' },
			},
		},
		{
			$project: {
				_id: 0,
				car_class: '$_id',
				count: 1,
				avgPrice: { $round: ['$avgPrice', 2] },
				minPrice: 1,
				maxPrice: 1,
				totalRevenue: 1,
			},
		},
		{ $sort: { count: -1 } },
	])
	.toArray()

carClassStats.forEach((stat) => {
	print(`  ${stat.car_class.toUpperCase()}:`)
	print(`    Количество: ${stat.count}`)
	print(`    Средняя цена: ${stat.avgPrice} руб/день`)
	print(`    Диапазон: ${stat.minPrice} - ${stat.maxPrice} руб/день`)
	print(`    Потенциальный доход: ${stat.totalRevenue} руб/день\n`)
})

// 2. Активность пользователей
print('=== 2. АКТИВНОСТЬ ПОЛЬЗОВАТЕЛЕЙ ===\n')

const userActivity = db.rentals
	.aggregate([
		{
			$group: {
				_id: '$user_id',
				totalRentals: { $sum: 1 },
				activeRentals: { $sum: { $cond: [{ $eq: ['$status', 'active'] }, 1, 0] } },
				completedRentals: {
					$sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] },
				},
				cancelledRentals: {
					$sum: { $cond: [{ $eq: ['$status', 'cancelled'] }, 1, 0] },
				},
				totalSpent: { $sum: '$total_cost' },
			},
		},
		{
			$lookup: {
				from: 'users',
				localField: '_id',
				foreignField: '_id',
				as: 'user',
			},
		},
		{ $unwind: '$user' },
		{
			$project: {
				_id: 0,
				userId: '$_id',
				login: '$user.login',
				fullName: { $concat: ['$user.first_name', ' ', '$user.last_name'] },
				totalRentals: 1,
				activeRentals: 1,
				completedRentals: 1,
				cancelledRentals: 1,
				totalSpent: { $round: ['$totalSpent', 2] },
			},
		},
		{ $sort: { totalSpent: -1 } },
		{ $limit: 5 },
	])
	.toArray()

print('Топ-5 пользователей по сумме затрат:\n')
userActivity.forEach((u, i) => {
	print(`  ${i + 1}. ${u.fullName} (@${u.login})`)
	print(`     Всего аренд: ${u.totalRentals}`)
	print(
		`     Активных: ${u.activeRentals}, Завершенных: ${u.completedRentals}, Отмененных: ${u.cancelledRentals}`,
	)
	print(`     Потрачено: ${u.totalSpent} руб\n`)
})

// 3. Доход по автомобилям
print('=== 3. ДОХОД ПО АВТОМОБИЛЯМ ===\n')

const carRevenue = db.rentals
	.aggregate([
		{ $match: { status: 'completed' } },
		{
			$lookup: {
				from: 'cars',
				localField: 'car_id',
				foreignField: '_id',
				as: 'car',
			},
		},
		{ $unwind: '$car' },
		{
			$group: {
				_id: {
					carId: '$car_id',
					brand: '$car.brand',
					model: '$car.model',
					car_class: '$car.car_class',
				},
				rentalCount: { $sum: 1 },
				totalRevenue: { $sum: '$total_cost' },
				avgRentalCost: { $avg: '$total_cost' },
				totalDays: {
					$sum: {
						$divide: [
							{ $subtract: ['$end_date', '$start_date'] },
							1000 * 60 * 60 * 24,
						],
					},
				},
			},
		},
		{
			$project: {
				_id: 0,
				car: { $concat: ['$_id.brand', ' ', '$_id.model'] },
				car_class: '$_id.car_class',
				rentalCount: 1,
				totalRevenue: { $round: ['$totalRevenue', 2] },
				avgRentalCost: { $round: ['$avgRentalCost', 2] },
				totalDays: { $round: ['$totalDays', 1] },
				revenuePerDay: {
					$round: [
						{
							$cond: [
								{ $gt: ['$totalDays', 0] },
								{ $divide: ['$totalRevenue', '$totalDays'] },
								0,
							],
						},
						2,
					],
				},
			},
		},
		{ $sort: { totalRevenue: -1 } },
		{ $limit: 10 },
	])
	.toArray()

print('Топ-10 автомобилей по доходу (завершенные аренды):\n')
carRevenue.forEach((c, i) => {
	print(`  ${i + 1}. ${c.car} (${c.car_class})`)
	print(`     Аренд: ${c.rentalCount}, Дней всего: ${c.totalDays}`)
	print(`     Доход: ${c.totalRevenue} руб`)
	print(`     Средний чек: ${c.avgRentalCost} руб`)
	print(`     Доход в день: ${c.revenuePerDay} руб\n`)
})

// 4. Статусы аренд по месяцам
print('=== 4. СТАТУСЫ АРЕНД ПО МЕСЯЦАМ ===\n')

const monthlyStats = db.rentals
	.aggregate([
		{
			$group: {
				_id: {
					year: { $year: '$created_at' },
					month: { $month: '$created_at' },
					status: '$status',
				},
				count: { $sum: 1 },
			},
		},
		{
			$group: {
				_id: { year: '$_id.year', month: '$_id.month' },
				statuses: { $push: { status: '$_id.status', count: '$count' } },
				total: { $sum: '$count' },
			},
		},
		{
			$project: {
				_id: 0,
				year: '$_id.year',
				month: '$_id.month',
				total: 1,
				statuses: 1,
			},
		},
		{ $sort: { year: 1, month: 1 } },
	])
	.toArray()

print('Аренды по месяцам:\n')
monthlyStats.forEach((m) => {
	const monthName = new Date(m.year, m.month - 1).toLocaleDateString('ru-RU', {
		month: 'long',
		year: 'numeric',
	})
	print(`  ${monthName.charAt(0).toUpperCase() + monthName.slice(1)}:`)
	m.statuses.forEach((s) => {
		print(`    ${s.status}: ${s.count}`)
	})
	print(`    Итого: ${m.total}\n`)
})

// 5. Коэффициент использования автопарка
print('=== 5. КОЭФФИЦИЕНТ ИСПОЛЬЗОВАНИЯ АВТОПАРКА ===\n')

const utilizationStats = db.cars
	.aggregate([
		{
			$lookup: {
				from: 'rentals',
				localField: '_id',
				foreignField: 'car_id',
				as: 'rentals',
			},
		},
		{
			$project: {
				_id: 1,
				brand: 1,
				model: 1,
				car_class: 1,
				available: 1,
				rentalCount: { $size: '$rentals' },
				activeRentals: {
					$size: {
						$filter: {
							input: '$rentals',
							as: 'r',
							cond: { $eq: ['$$r.status', 'active'] },
						},
					},
				},
				totalRevenue: { $sum: '$rentals.total_cost' },
			},
		},
		{
			$group: {
				_id: '$car_class',
				totalCars: { $sum: 1 },
				availableCars: { $sum: { $cond: ['$available', 1, 0] } },
				activeRentals: { $sum: '$activeRentals' },
				totalRevenue: { $sum: '$totalRevenue' },
				avgRevenuePerCar: { $avg: '$totalRevenue' },
			},
		},
		{
			$project: {
				_id: 0,
				car_class: '$_id',
				totalCars: 1,
				availableCars: 1,
				utilizationRate: {
					$round: [
						{ $multiply: [{ $divide: ['$activeRentals', '$totalCars'] }, 100] },
						1,
					],
				},
				totalRevenue: { $round: ['$totalRevenue', 2] },
				avgRevenuePerCar: { $round: ['$avgRevenuePerCar', 2] },
			},
		},
		{ $sort: { utilizationRate: -1 } },
	])
	.toArray()

print('Использование автопарка по классам:\n')
utilizationStats.forEach((u) => {
	print(`  ${u.car_class.toUpperCase()}:`)
	print(`    Всего авто: ${u.totalCars}`)
	print(`    Доступно: ${u.availableCars}`)
	print(`    В аренде сейчас: ${u.utilizationRate}%`)
	print(`    Общий доход: ${u.totalRevenue} руб`)
	print(`    Средний доход на авто: ${u.avgRevenuePerCar} руб\n`)
})

// 6. Самые популярные автомобили
print('=== 6. САМЫЕ ПОПУЛЯРНЫЕ АВТОМОБИЛИ ===\n')

const popularCars = db.rentals
	.aggregate([
		{
			$group: {
				_id: '$car_id',
				rentalCount: { $sum: 1 },
				totalRevenue: { $sum: '$total_cost' },
				avgRating: { $avg: '$total_cost' },
			},
		},
		{
			$lookup: {
				from: 'cars',
				localField: '_id',
				foreignField: '_id',
				as: 'car',
			},
		},
		{ $unwind: '$car' },
		{
			$project: {
				_id: 0,
				carId: '$_id',
				car: { $concat: ['$car.brand', ' ', '$car.model'] },
				car_class: '$car.car_class',
				year: '$car.year',
				rentalCount: 1,
				totalRevenue: { $round: ['$totalRevenue', 2] },
				avgRentalCost: { $round: ['$avgRating', 2] },
			},
		},
		{ $sort: { rentalCount: -1 } },
		{ $limit: 5 },
	])
	.toArray()

print('Топ-5 самых популярных автомобилей:\n')
popularCars.forEach((c, i) => {
	print(`  ${i + 1}. ${c.car} (${c.year}, ${c.car_class})`)
	print(`     Аренд всего: ${c.rentalCount}`)
	print(`     Доход: ${c.totalRevenue} руб`)
	print(`     Средняя аренда: ${c.avgRentalCost} руб\n`)
})

// 7. Анализ длительности аренд
print('=== 7. АНАЛИЗ ДЛИТЕЛЬНОСТИ АРЕНД ===\n')

const rentalDuration = db.rentals
	.aggregate([
		{ $match: { status: { $in: ['completed', 'active'] } } },
		{
			$project: {
				_id: 1,
				status: 1,
				durationDays: {
					$divide: [
						{ $subtract: ['$end_date', '$start_date'] },
						1000 * 60 * 60 * 24,
					],
				},
				total_cost: 1,
				car_id: 1,
			},
		},
		{
			$lookup: {
				from: 'cars',
				localField: 'car_id',
				foreignField: '_id',
				as: 'car',
			},
		},
		{ $unwind: '$car' },
		{
			$group: {
				_id: '$car.car_class',
				avgDuration: { $avg: '$durationDays' },
				minDuration: { $min: '$durationDays' },
				maxDuration: { $max: '$durationDays' },
				totalRentals: { $sum: 1 },
				avgCostPerDay: { $avg: { $divide: ['$total_cost', '$durationDays'] } },
			},
		},
		{
			$project: {
				_id: 0,
				car_class: '$_id',
				avgDuration: { $round: ['$avgDuration', 1] },
				minDuration: { $round: ['$minDuration', 1] },
				maxDuration: { $round: ['$maxDuration', 1] },
				totalRentals: 1,
				avgCostPerDay: { $round: ['$avgCostPerDay', 2] },
			},
		},
		{ $sort: { avgDuration: -1 } },
	])
	.toArray()

print('Длительность аренд по классам автомобилей:\n')
rentalDuration.forEach((d) => {
	print(`  ${d.car_class.toUpperCase()}:`)
	print(`    Всего аренд: ${d.totalRentals}`)
	print(`    Средняя длительность: ${d.avgDuration} дн.`)
	print(`    Мин/Макс: ${d.minDuration} / ${d.maxDuration} дн.`)
	print(`    Средняя стоимость в день: ${d.avgCostPerDay} руб\n`)
})

// 8. Сводная статистика бизнеса
print('=== 8. СВОДНАЯ СТАТИСТИКА БИЗНЕСА ===\n')

const businessStats = db.rentals
	.aggregate([
		{
			$facet: {
				totalRentals: [{ $count: 'count' }],
				activeRentals: [{ $match: { status: 'active' } }, { $count: 'count' }],
				completedRentals: [
					{ $match: { status: 'completed' } },
					{ $count: 'count' },
				],
				cancelledRentals: [
					{ $match: { status: 'cancelled' } },
					{ $count: 'count' },
				],
				totalRevenue: [
					{ $group: { _id: null, sum: { $sum: '$total_cost' } } },
				],
				avgRentalCost: [
					{ $group: { _id: null, avg: { $avg: '$total_cost' } } },
				],
				uniqueCustomers: [{ $group: { _id: '$user_id' } }, { $count: 'count' }],
			},
		},
		{
			$project: {
				totalRentals: { $arrayElemAt: ['$totalRentals.count', 0] },
				activeRentals: { $arrayElemAt: ['$activeRentals.count', 0] },
				completedRentals: { $arrayElemAt: ['$completedRentals.count', 0] },
				cancelledRentals: { $arrayElemAt: ['$cancelledRentals.count', 0] },
				totalRevenue: { $arrayElemAt: ['$totalRevenue.sum', 0] },
				avgRentalCost: { $arrayElemAt: ['$avgRentalCost.avg', 0] },
				uniqueCustomers: { $arrayElemAt: ['$uniqueCustomers.count', 0] },
			},
		},
	])
	.toArray()

const stats = businessStats[0]
print('Общая статистика:')
print(`  Всего аренд: ${stats.totalRentals || 0}`)
print(`    Активных: ${stats.activeRentals || 0}`)
print(`    Завершенных: ${stats.completedRentals || 0}`)
print(`    Отмененных: ${stats.cancelledRentals || 0}`)
print(
	`  Общий доход: ${stats.totalRevenue ? stats.totalRevenue.toFixed(2) : 0} руб`,
)
print(
	`  Средняя стоимость аренды: ${stats.avgRentalCost ? stats.avgRentalCost.toFixed(2) : 0} руб`,
)
print(`  Уникальных клиентов: ${stats.uniqueCustomers || 0}`)

const carCount = db.cars.countDocuments()
const userCount = db.users.countDocuments()
print(`  Всего автомобилей: ${carCount}`)
print(`  Всего пользователей: ${userCount}`)

print('\n=== AGGREGATION PIPELINES ЗАВЕРШЕНЫ ===')

print('\n=== Инициализация завершена успешно ===')
print('Все данные загружены и доступны в коллекциях:')
print(`  - users: ${db.users.countDocuments()} документов`)
print(`  - cars: ${db.cars.countDocuments()} документов`)
print(`  - rentals: ${db.rentals.countDocuments()} документов`)
