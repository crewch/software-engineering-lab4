#pragma once

#include <memory>

#include <userver/components/component_base.hpp>
#include <userver/components/component_config.hpp>
#include <userver/components/component_context.hpp>
#include <userver/yaml_config/fwd.hpp>

#include <infrastructure/mongo_storage/mongo_storage.hpp>

namespace car_rental::components {

class MongoStorageComponent final : public userver::components::ComponentBase {
public:
    static constexpr std::string_view kName = "mongo-storage-component";

    MongoStorageComponent(
        const userver::components::ComponentConfig& config,
        const userver::components::ComponentContext& context
    );

    storage::MongoStorage& GetStorage();

    static userver::yaml_config::Schema GetStaticConfigSchema();

private:
    std::unique_ptr<storage::MongoStorage> storage_;
};

}  // namespace car_rental::components
