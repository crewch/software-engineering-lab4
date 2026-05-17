#include "mongo_instance.hpp"

#include <mongocxx/instance.hpp>

namespace car_rental::infrastructure {

namespace {
mongocxx::instance g_instance;
}

mongocxx::instance& GetMongoInstance() {
    return g_instance;
}

}  // namespace car_rental::infrastructure
