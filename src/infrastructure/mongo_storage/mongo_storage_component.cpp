#include "infrastructure/mongo_storage/mongo_storage_component.hpp"

#include <userver/yaml_config/merge_schemas.hpp>

#include <infrastructure/mongo_storage/mongo_instance.hpp>

namespace car_rental::components {

namespace {
constexpr std::string_view kMongoUri = "mongo-uri";
}

MongoStorageComponent::MongoStorageComponent(
    const userver::components::ComponentConfig& config,
    const userver::components::ComponentContext& context
)
    : ComponentBase(config, context) {
    (void)infrastructure::GetMongoInstance();

    const auto& mongo_uri = config[kMongoUri].As<std::string>();
    storage_ = std::make_unique<storage::MongoStorage>(mongo_uri);
}

storage::MongoStorage& MongoStorageComponent::GetStorage() {
    return *storage_;
}

userver::yaml_config::Schema MongoStorageComponent::GetStaticConfigSchema() {
    return userver::yaml_config::MergeSchemas<userver::components::ComponentBase>(R"(
type: object
description: MongoDB Storage Component
additionalProperties: false
properties:
  mongo-uri:
    type: string
    description: MongoDB connection URI
required:
  - mongo-uri
)");
}

}  // namespace car_rental::components
