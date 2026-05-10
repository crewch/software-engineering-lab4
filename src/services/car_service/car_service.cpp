#include "car_service.hpp"

#include <boost/uuid/uuid_io.hpp>

namespace car_rental::services {

CarService::CarService(storage::PostgresStorage& storage)
    : storage_(storage) {}

namespace {

std::string dtoCarClassToString(lab2::car::CarClass сarClass) {
    switch (сarClass) {
        case lab2::car::CarClass::kEconomy:  return "economy";
        case lab2::car::CarClass::kCompact:  return "compact";
        case lab2::car::CarClass::kMidsize:  return "midsize";
        case lab2::car::CarClass::kFullsize: return "fullsize";
        case lab2::car::CarClass::kLuxury:   return "luxury";
        case lab2::car::CarClass::kSuv:      return "suv";
        case lab2::car::CarClass::kVan:      return "van";
        default: return "unknown";
    }
}
} // anonymous namespace


CarResult CarService::CreateCar(const lab2::car::CreateCarRequest& dto) {
    auto car_result = domain::Car::Create(
        dto.vin,
        dto.brand,
        dto.model,
        dto.year,
        domain::Car::CarClassFromString(dtoCarClassToString(dto.car_class)),
        dto.license_plate,
        dto.daily_rate
    );

    if (std::holds_alternative<exceptions::domain::ValidationError>(car_result)) {
        const auto& error = std::get<exceptions::domain::ValidationError>(car_result);
        return {
            CarErrorCode::VALIDATION_ERROR,
            error.message,
            std::nullopt
        };
    }

    const auto& car = std::get<domain::Car>(car_result);

    auto created_car = storage_.CreateCar(car);

    if (!created_car.has_value()) {
        return {
            CarErrorCode::CONFLICT,
            "Car with this VIN or license plate already exists",
            std::nullopt
        };
    }

    return {CarErrorCode::OK, "", std::move(created_car)};
}

CarListResult CarService::GetCars(
    std::optional<domain::CarClass> car_class,
    std::optional<bool> available_only,
    int limit,
    int offset
) {
    auto page = storage_.GetCars(car_class, available_only, limit, offset);

    return {
        CarErrorCode::OK,
        "",
        std::move(page.items),
        page.total
    };
}

} // namespace car_rental::services