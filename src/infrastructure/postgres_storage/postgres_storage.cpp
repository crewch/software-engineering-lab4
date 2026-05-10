#include "postgres_storage.hpp"

#include <boost/uuid/string_generator.hpp>
#include <userver/storages/postgres/component.hpp>
#include <userver/storages/postgres/query.hpp>

namespace pg = userver::storages::postgres;

namespace car_rental::storage {

PostgresStorage::PostgresStorage(
    const userver::components::ComponentConfig& config,
    const userver::components::ComponentContext& context
)
    : ComponentBase(config, context),
      cluster_(
          context
              .FindComponent<userver::components::Postgres>("postgres-db")
              .GetCluster()
      ) {}

std::optional<domain::User> PostgresStorage::CreateUser(const domain::User& user) {
    try {
        auto res = cluster_->Execute(
            pg::ClusterHostType::kMaster,
            "INSERT INTO users(login, first_name, last_name, email, password, phone) "
            "VALUES($1,$2,$3,$4,$5,$6)"
            "RETURNING id, created_at",
            user.GetLogin(),
            user.GetFirstName(),
            user.GetLastName(),
            user.GetEmail(),
            user.GetPassword(),
            user.GetPhone()
        );

        if (res.IsEmpty()) return std::nullopt;

        return domain::User::FromDb(
            res[0]["id"].As<boost::uuids::uuid>(),
            user.GetLogin(),
            user.GetFirstName(),
            user.GetLastName(),
            user.GetEmail(),
            user.GetPassword(),
            user.GetPhone(),
            res[0]["created_at"].As<std::chrono::system_clock::time_point>()
        );
    } catch (...) {
        return std::nullopt;
    }
}

std::optional<domain::User> PostgresStorage::GetUserByLogin(const std::string& login) {
    auto res = cluster_->Execute(
        pg::ClusterHostType::kSlave,
        "SELECT * FROM users WHERE login=$1",
        login
    );

    if (res.IsEmpty()) return std::nullopt;

    const auto& row = res[0];

    return domain::User::FromDb(
        row["id"].As<boost::uuids::uuid>(),
        row["login"].As<std::string>(),
        row["first_name"].As<std::string>(),
        row["last_name"].As<std::string>(),
        row["email"].As<std::string>(),
        row["password"].As<std::string>(),
        row["phone"].As<std::optional<std::string>>(),
        row["created_at"].As<std::chrono::system_clock::time_point>()
    );
}

std::optional<domain::User> PostgresStorage::GetUserById(const std::string& id) {
    auto res = cluster_->Execute(
        pg::ClusterHostType::kSlave,
        "SELECT * FROM users WHERE id=$1",
        id
    );

    if (res.IsEmpty()) return std::nullopt;

    const auto& row = res[0];

    return domain::User::FromDb(
        row["id"].As<boost::uuids::uuid>(),
        row["login"].As<std::string>(),
        row["first_name"].As<std::string>(),
        row["last_name"].As<std::string>(),
        row["email"].As<std::string>(),
        row["password"].As<std::string>(),
        row["phone"].As<std::optional<std::string>>(),
        row["created_at"].As<std::chrono::system_clock::time_point>()
    );
}

std::vector<domain::User> PostgresStorage::SearchUsers(const std::string& mask) {
    std::vector<domain::User> result;

    auto res = cluster_->Execute(
        pg::ClusterHostType::kSlave,
        "SELECT * FROM users WHERE "
        "$1 = '' OR first_name ILIKE '%' || $1 || '%' OR last_name ILIKE '%' || $1 || '%'",
        mask
    );

    for (const auto& row : res) {
        result.emplace_back(
            domain::User::FromDb(
				row["id"].As<boost::uuids::uuid>(),
				row["login"].As<std::string>(),
				row["first_name"].As<std::string>(),
				row["last_name"].As<std::string>(),
				row["email"].As<std::string>(),
				row["password"].As<std::string>(),
				row["phone"].As<std::optional<std::string>>(),
				row["created_at"].As<std::chrono::system_clock::time_point>()
            )
        );
    }

    return result;
}

bool PostgresStorage::UserExists(const std::string& id) {
    auto res = cluster_->Execute(
        pg::ClusterHostType::kSlave,
        "SELECT 1 FROM users WHERE id=$1::uuid",
        id
    );
    return !res.IsEmpty();
}

std::optional<domain::Car> PostgresStorage::CreateCar(const domain::Car& car) {
    try {
        auto res = cluster_->Execute(
            pg::ClusterHostType::kMaster,
            "INSERT INTO cars(vin, brand, model, year, car_class, license_plate, daily_rate, available) "
            "VALUES($1,$2,$3,$4,$5::car_class_enum,$6,$7,$8)"
            "RETURNING id, created_at",
            car.GetVin(),
            car.GetBrand(),
            car.GetModel(),
            car.GetYear(),
            domain::Car::CarClassToString(car.GetCarClass()),
            car.GetLicensePlate(),
            car.GetDailyRate(),
            car.IsAvailable()
        );

        if (res.IsEmpty()) return std::nullopt;


        return domain::Car::FromDb(
            res[0]["id"].As<boost::uuids::uuid>(),
            car.GetVin(),
            car.GetBrand(),
            car.GetModel(),
            car.GetYear(),
            car.GetCarClass(),
            car.GetLicensePlate(),
            car.GetDailyRate(),
            car.IsAvailable(),
            res[0]["created_at"].As<std::chrono::system_clock::time_point>()
        );
    } catch (...) {
        return std::nullopt;
    }
}

Page<domain::Car> PostgresStorage::GetCars(
    std::optional<domain::CarClass> car_class,
    std::optional<bool> available_only,
    int limit,
    int offset
) {
    Page<domain::Car> result;

    auto res = cluster_->Execute(
        pg::ClusterHostType::kSlave,
        R"SQL(
            SELECT 
                id,
                vin,
                brand,
                model,
                year,
                car_class::text,
                license_plate,
                daily_rate::double precision,
                available,
                created_at
            FROM cars
            WHERE ($1::text IS NULL OR car_class::text = $1)
              AND ($2::bool IS NULL OR available = $2)
            ORDER BY created_at DESC
            LIMIT $3 OFFSET $4
        )SQL",
        car_class ? domain::Car::CarClassToString(*car_class) : std::optional<std::string>{},
        available_only,
        limit,
        offset
    );

    for (const auto& row : res) {
        result.items.emplace_back(domain::Car::FromDb(
            row["id"].As<boost::uuids::uuid>(),
            row["vin"].As<std::string>(),
            row["brand"].As<std::string>(),
            row["model"].As<std::string>(),
            row["year"].As<int>(),
            domain::Car::CarClassFromString(row["car_class"].As<std::string>()),
            row["license_plate"].As<std::string>(),
            row["daily_rate"].As<double>(),
            row["available"].As<bool>(),
            row["created_at"].As<std::chrono::system_clock::time_point>()
        ));
    }

    auto count_res = cluster_->Execute(
        pg::ClusterHostType::kSlave,
        R"SQL(
            SELECT COUNT(*)
            FROM cars
            WHERE ($1::text IS NULL OR car_class = $1::car_class_enum)
              AND ($2::bool IS NULL OR available = $2)
        )SQL",
        car_class ? domain::Car::CarClassToString(*car_class) : std::optional<std::string>{},
        available_only
    );

    result.total = count_res[0][0].As<int64_t>();

    return result;
}

std::optional<domain::Car> PostgresStorage::GetCarById(const std::string& id) {
    auto res = cluster_->Execute(
        pg::ClusterHostType::kSlave,
        R"SQL(
        SELECT 
            id,
            vin,
            brand,
            model,
            year,
            car_class::text,
            license_plate,
            daily_rate::double precision,
            available,
            created_at
        FROM cars
        WHERE id=$1::uuid
        )SQL",
        id
    );

    if (res.IsEmpty()) return std::nullopt;

    const auto& row = res[0];
    return domain::Car::FromDb(
        row["id"].As<boost::uuids::uuid>(),
        row["vin"].As<std::string>(),
        row["brand"].As<std::string>(),
        row["model"].As<std::string>(),
        row["year"].As<int>(),
        domain::Car::CarClassFromString(row["car_class"].As<std::string>()),
        row["license_plate"].As<std::string>(),
        row["daily_rate"].As<double>(),
        row["available"].As<bool>(),
        row["created_at"].As<std::chrono::system_clock::time_point>()
    );
}

std::optional<domain::Car> PostgresStorage::GetCarByVin(const std::string& vin) {
    auto res = cluster_->Execute(
        pg::ClusterHostType::kSlave,
        "SELECT * FROM cars WHERE vin=$1",
        vin
    );

    if (res.IsEmpty()) return std::nullopt;

    const auto& row = res[0];
    return domain::Car::FromDb(
        row["id"].As<boost::uuids::uuid>(),
        row["vin"].As<std::string>(),
        row["brand"].As<std::string>(),
        row["model"].As<std::string>(),
        row["year"].As<int>(),
        domain::Car::CarClassFromString(row["car_class"].As<std::string>()),
        row["license_plate"].As<std::string>(),
        row["daily_rate"].As<double>(),
        row["available"].As<bool>(),
        row["created_at"].As<std::chrono::system_clock::time_point>()
    );
}

bool PostgresStorage::UpdateCarAvailability(const std::string& id, bool available) {
    auto res = cluster_->Execute(
        pg::ClusterHostType::kMaster,
        "UPDATE cars SET available=$2 WHERE id=$1::uuid",
        id, available
    );

    return res.RowsAffected() > 0;
}

bool PostgresStorage::CarExists(const std::string& id) {
    auto res = cluster_->Execute(
        pg::ClusterHostType::kSlave,
        "SELECT 1 FROM cars WHERE id=$1::uuid",
        id
    );
    return !res.IsEmpty();
}

std::optional<domain::Rental> PostgresStorage::CreateRental(const domain::Rental& rental) {
    try {
        auto res = cluster_->Execute(
            pg::ClusterHostType::kMaster,
            "INSERT INTO rentals(user_id,car_id,start_date,end_date,total_cost,status) "
            "VALUES($1,$2,$3,$4,$5,$6::rental_status_enum)"
            "RETURNING id, created_at",
            rental.GetUserId(),
            rental.GetCarId(),
            userver::storages::postgres::TimePointWithoutTz{rental.GetStartDate()},
            userver::storages::postgres::TimePointWithoutTz{rental.GetEndDate()},
            rental.GetTotalCost(),
            domain::Rental::RentalStatusToString(rental.GetStatus())
        );

        if (res.IsEmpty()) return std::nullopt;

        const auto& row = res[0];
        return domain::Rental::FromDb(
            row["id"].As<boost::uuids::uuid>(),
            rental.GetUserId(),
            rental.GetCarId(),
            rental.GetStartDate(),
            rental.GetEndDate(),
            rental.GetTotalCost(),
            rental.GetStatus(),
            row["created_at"].As<std::chrono::system_clock::time_point>()
        );
    } catch (...) {
        return std::nullopt;
    }
}

std::optional<domain::Rental> PostgresStorage::GetRentalById(const std::string& id) {
    auto res = cluster_->Execute(
        pg::ClusterHostType::kSlave,
        "SELECT * FROM rentals WHERE id=$1::uuid",
        id
    );

    if (res.IsEmpty()) return std::nullopt;

    const auto& row = res[0];
    return domain::Rental::FromDb(
        row["id"].As<boost::uuids::uuid>(),
        row["user_id"].As<boost::uuids::uuid>(),
        row["car_id"].As<boost::uuids::uuid>(),
        row["start_date"].As<std::chrono::system_clock::time_point>(),
        row["end_date"].As<std::chrono::system_clock::time_point>(),
        row["total_cost"].As<double>(),
        domain::Rental::RentalStatusFromString(row["status"].As<std::string>()).value(),
        row["created_at"].As<std::chrono::system_clock::time_point>()
    );
}

std::vector<domain::Rental> PostgresStorage::GetActiveRentalsByUserId(const std::string& user_id) {
    std::vector<domain::Rental> result;

    auto res = cluster_->Execute(
        pg::ClusterHostType::kSlave,
        "SELECT * FROM rentals WHERE user_id=$1::uuid AND status='active'",
        user_id
    );

    for (const auto& row : res) {
        result.emplace_back(
            domain::Rental::FromDb(
                row["id"].As<boost::uuids::uuid>(),
                row["user_id"].As<boost::uuids::uuid>(),
                row["car_id"].As<boost::uuids::uuid>(),
                row["start_date"].As<std::chrono::system_clock::time_point>(),
                row["end_date"].As<std::chrono::system_clock::time_point>(),
                row["total_cost"].As<double>(),
                domain::Rental::RentalStatusFromString(row["status"].As<std::string>()).value(),
                row["created_at"].As<std::chrono::system_clock::time_point>()
            )
        );
    }

    return result;
}

bool PostgresStorage::CompleteRental(const std::string& id) {
    auto res = cluster_->Execute(
        pg::ClusterHostType::kMaster,
        "UPDATE rentals SET status='completed' WHERE id=$1::uuid AND status='active'",
        id
    );

    return res.RowsAffected() > 0;
}

bool PostgresStorage::IsCarAvailable(
    const std::string& car_id,
    const std::chrono::system_clock::time_point& start,
    const std::chrono::system_clock::time_point& end
) {
    auto res = cluster_->Execute(
        pg::ClusterHostType::kSlave,
        "SELECT 1 FROM rentals "
        "WHERE car_id=$1::uuid AND status='active' "
        "AND ($2 < end_date AND $3 > start_date)",
        car_id,
        userver::storages::postgres::TimePointWithoutTz{start},
        userver::storages::postgres::TimePointWithoutTz{end}
    );

    return res.IsEmpty();
}

PostgresStorage::Stats PostgresStorage::GetStats() {
    auto users = cluster_->Execute(pg::ClusterHostType::kSlave, "SELECT COUNT(*)::bigint FROM users");
    auto cars = cluster_->Execute(pg::ClusterHostType::kSlave, "SELECT COUNT(*)::bigint FROM cars");
    auto rentals = cluster_->Execute(pg::ClusterHostType::kSlave, "SELECT COUNT(*)::bigint FROM rentals");

    return Stats{
        static_cast<size_t>(users[0][0].As<int64_t>()),
        static_cast<size_t>(cars[0][0].As<int64_t>()),
        static_cast<size_t>(rentals[0][0].As<int64_t>())
    };
}

} // namespace car_rental::storage