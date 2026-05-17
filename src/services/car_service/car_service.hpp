#pragma once

#include <optional>
#include <vector>
#include <domain/car.hpp>
#include <docs/definitions/car.hpp>
#include <infrastructure/mongo_storage/mongo_storage.hpp>

namespace car_rental::services {

enum class CarErrorCode {
    OK,
    VALIDATION_ERROR,
    CONFLICT,
    NOT_FOUND,
    INTERNAL_ERROR
};

struct CarResult {
    CarErrorCode code;
    std::string message;
    std::optional<domain::Car> car;
};

struct CarListResult {
    CarErrorCode code;
    std::string message;
    std::vector<domain::Car> cars;
    int total;
};

class CarService {
public:
    explicit CarService(storage::MongoStorage& storage);

    CarResult CreateCar(const lab2::car::CreateCarRequest& dto);

    CarListResult GetCars(
        std::optional<domain::CarClass> car_class,
        std::optional<bool> available_only,
        int limit,
        int offset
    );

private:
    storage::MongoStorage& storage_;

};

} // namespace car_rental::services