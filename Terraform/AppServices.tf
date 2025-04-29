

# Define the App Service Plan (Standard S1 to support autoscale)
resource "azurerm_service_plan" "app_service_plan" {
  name                = "monavenir-app-service-plan"
  location            = azurerm_resource_group.devops_rg.location
  resource_group_name = azurerm_resource_group.devops_rg.name
  os_type             = "Linux"
  sku_name            = "S1"
}

# Configure Autoscale Settings for the App Service Plan
resource "azurerm_monitor_autoscale_setting" "app_service_autoscale" {
  name                = "monavenir-autoscale"
  resource_group_name = azurerm_resource_group.devops_rg.name
  location            = azurerm_resource_group.devops_rg.location
  target_resource_id  = azurerm_service_plan.app_service_plan.id

  profile {
    name = "default"

    capacity {
      default = 1
      minimum = 1
      maximum = 3
    }

    rule {
      metric_trigger {
        metric_name        = "CpuPercentage"
        metric_resource_id = azurerm_service_plan.app_service_plan.id
        time_grain         = "PT1M"
        statistic          = "Average"
        time_window        = "PT5M"
        time_aggregation   = "Average"
        operator           = "GreaterThan"
        threshold          = 70
      }

      scale_action {
        direction = "Increase"
        type      = "ChangeCount"
        value     = "1"
        cooldown  = "PT5M"
      }
    }

    rule {
      metric_trigger {
        metric_name        = "CpuPercentage"
        metric_resource_id = azurerm_service_plan.app_service_plan.id
        time_grain         = "PT1M"
        statistic          = "Average"
        time_window        = "PT5M"
        time_aggregation   = "Average"
        operator           = "LessThan"
        threshold          = 30
      }

      scale_action {
        direction = "Decrease"
        type      = "ChangeCount"
        value     = "1"
        cooldown  = "PT5M"
      }
    }
  }
}

# Backend App Service Configuration
resource "azurerm_linux_web_app" "backend_app" {
  name                = "Backend-PFE"
  location            = azurerm_resource_group.devops_rg.location
  resource_group_name = azurerm_resource_group.devops_rg.name
  service_plan_id     = azurerm_service_plan.app_service_plan.id

  identity {
    type = "SystemAssigned"
  }

  app_settings = {
    "WEBSITES_PORT" = "5000"  # Port for backend application
  }

  site_config {
    always_on                 = true
    ftps_state                = "Disabled"
    http2_enabled             = false
    minimum_tls_version       = "1.2"
    ip_restriction_default_action = "Allow"
    scm_ip_restriction_default_action = "Allow"
    use_32_bit_worker         = true
    vnet_route_all_enabled    = false
    websockets_enabled        = false
    managed_pipeline_mode     = "Integrated"
    local_mysql_enabled       = false
    remote_debugging_enabled  = false

    application_stack {
      docker_image_name   = "monavenir/backend:${var.build_number}"
      docker_registry_url = "https://nexusrepository-https.francecentral.cloudapp.azure.com:7777"
    }
  }

  https_only                      = true
  client_affinity_enabled         = false
  client_certificate_enabled      = false
  client_certificate_mode         = "Required"
}

# Frontend App Service Configuration
resource "azurerm_linux_web_app" "frontend_app" {
  name                = "Frontend-PFE"
  location            = azurerm_resource_group.devops_rg.location
  resource_group_name = azurerm_resource_group.devops_rg.name
  service_plan_id     = azurerm_service_plan.app_service_plan.id

  identity {
    type = "SystemAssigned"
  }

  app_settings = {
    "WEBSITES_PORT" = "3000"  # Port for frontend application
  }

  site_config {
    always_on                 = true
    ftps_state                = "Disabled"
    http2_enabled             = false
    minimum_tls_version       = "1.2"
    ip_restriction_default_action = "Allow"
    scm_ip_restriction_default_action = "Allow"
    use_32_bit_worker         = true
    vnet_route_all_enabled    = false
    websockets_enabled        = false
    managed_pipeline_mode     = "Integrated"
    local_mysql_enabled       = false
    remote_debugging_enabled  = false

    application_stack {
      docker_image_name   = "monavenir/frontend:${var.build_number}"
      docker_registry_url = "https://nexusrepository-https.francecentral.cloudapp.azure.com:7777"
    }
  }

  https_only                      = true
  client_affinity_enabled         = false
  client_certificate_enabled      = false
  client_certificate_mode         = "Required"
}

# VNet Integration for Backend App Service
resource "azurerm_app_service_virtual_network_swift_connection" "backend_vnet_integration" {
  app_service_id = azurerm_linux_web_app.backend_app.id
  subnet_id      = azurerm_subnet.app_service_subnet.id
}

# VNet Integration for Frontend App Service
resource "azurerm_app_service_virtual_network_swift_connection" "frontend_vnet_integration" {
  app_service_id = azurerm_linux_web_app.frontend_app.id
  subnet_id      = azurerm_subnet.app_service_subnet.id
}

# Output the Backend App Service URL
output "backend_app_url" {
  value = "https://${azurerm_linux_web_app.backend_app.default_hostname}"
}

# Output the Frontend App Service URL
output "frontend_app_url" {
  value = "https://${azurerm_linux_web_app.frontend_app.default_hostname}"
}