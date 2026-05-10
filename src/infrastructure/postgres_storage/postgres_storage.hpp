#pragma once

#include <userver/components/component_base.hpp>
#include <userver/components/component_config.hpp>
#include <userver/components/component_context.hpp>
#include <userver/storages/postgres/cluster.hpp>

#include <optional>
#include <vector>

#include <domain/user.hpp>
#include <domain/car.hpp>
#include <domain/rental.hpp>

namespace car_rental::storage {

template <typename T>
struct Page {
    std::vector<T> items;
    int total = 0;
};

class PostgresStorage final : public userver::components::ComponentBase {
public:
    static constexpr std::string_view kName = "postgres-storage";

    PostgresStorage(
        const userver::components::ComponentConfig& config,
        const userver::components::ComponentContext& context
    );

    std::optional<domain::User> CreateUser(const domain::User& user);
    std::optional<domain::User> GetUserByLogin(const std::string& login);
    std::optional<domain::User> GetUserById(const std::string& id);
    std::vector<domain::User> SearchUsers(const std::string& name_mask);
    bool UserExists(const std::string& id);

    std::optional<domain::Car> CreateCar(const domain::Car& car);
    Page<domain::Car> GetCars(
        std::optional<domain::CarClass> car_class,
        std::optional<bool> available_only,
        int limit,
        int offset
    );
    std::optional<domain::Car> GetCarById(const std::string& id);
    std::optional<domain::Car> GetCarByVin(const std::string& vin);
    bool UpdateCarAvailability(const std::string& id, bool available);
    bool CarExists(const std::string& id);

    std::optional<domain::Rental> CreateRental(const domain::Rental& rental);
    std::optional<domain::Rental> GetRentalById(const std::string& id);
    std::vector<domain::Rental> GetActiveRentalsByUserId(const std::string& user_id);
    std::vector<domain::Rental> GetRentalHistoryByUserId(const std::string& user_id);
    std::vector<domain::Rental> GetAllRentalsByUserId(const std::string& user_id);
    bool CompleteRental(const std::string& id);

    bool IsCarAvailable(
        const std::string& car_id,
        const std::chrono::system_clock::time_point& start,
        const std::chrono::system_clock::time_point& end
    );

    struct Stats {
        size_t user_count;
        size_t car_count;
        size_t rental_count;
    };

    Stats GetStats();

private:
    userver::storages::postgres::ClusterPtr cluster_;
};

} // namespace car_rental::storage