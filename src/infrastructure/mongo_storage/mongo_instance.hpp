#pragma once

#include <mongocxx/instance.hpp>

namespace car_rental::infrastructure {

mongocxx::instance& GetMongoInstance();

}  // namespace car_rental::infrastructure
