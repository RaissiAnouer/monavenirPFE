terraform {
  required_providers {
    azurerm = {
      source  = "hashicorp/azurerm"
      version = "~> 4.1" # Update to latest to avoid potential provider bugs
    }
  }
}

# App Service Plan
resource "azurerm_service_plan" "app_service_plan" {
  name                = "ASP-devopsrg-97c3"
  location            = "Canada Central"
  resource_group_name = "devops-rg"
  os_type             = "Linux"
  sku_name            = "S1"
}

# Frontend App Service
resource "azurerm_linux_web_app" "frontend" {
  name                = "pfe-frontend"
  location            = "Canada Central"
  resource_group_name = "devops-rg"
  service_plan_id     = azurerm_service_plan.app_service_plan.id
  https_only          = true
  enabled             = true # Set to false if you want to match the stopped state

  site_config {
    application_stack {
      docker_image_name = "nexusrepository-https.francecentral.cloudapp.azure.com:7777/monavenir/frontend:${var.build_number}"
    }
    ftps_state                   = "FtpsOnly"
    always_on                    = true
    http2_enabled                = false
    minimum_tls_version          = "1.2"
    remote_debugging_enabled     = false
    vnet_route_all_enabled       = false
    # Uncomment if VNet integration is needed
    # virtual_network_subnet_id = azurerm_subnet.app_service_subnet.id
  }

  app_settings = {
    "WEBSITES_ENABLE_APP_SERVICE_STORAGE" = "false"
    "VITE_API_BASE_URL"                   = "https://pfe-backend-hac7djg2eubjbsar.canadacentral-01.azurewebsites.net"
  }

  identity {
    type = "SystemAssigned"
  }

  # Increase timeouts to handle API issues
  timeouts {
    create = "10m"
    read   = "10m"
    update = "10m"
    delete = "10m"
  }

  depends_on = [azurerm_service_plan.app_service_plan]
}

# Backend App Service
resource "azurerm_linux_web_app" "backend" {
  name                = "pfe-backend"
  location            = "Canada Central"
  resource_group_name = "devops-rg"
  service_plan_id     = azurerm_service_plan.app_service_plan.id
  https_only          = true
  enabled             = true # Set to false if you want to match the stopped state

  site_config {
    application_stack {
      docker_image_name = "nexusrepository-https.francecentral.cloudapp.azure.com:7777/monavenir/backend:${var.build_number}"
    }
    ftps_state                   = "FtpsOnly"
    always_on                    = true
    http2_enabled                = false
    minimum_tls_version          = "1.2"
    remote_debugging_enabled     = false
    vnet_route_all_enabled       = false
    # Uncomment if VNet integration is needed
    # virtual_network_subnet_id = azurerm_subnet.app_service_subnet.id
  }

  app_settings = {
    "WEBSITES_ENABLE_APP_SERVICE_STORAGE" = "false"
    "MONGO_URI"                           = var.mongo_uri
    "FRONTEND_URL"                        = "https://pfe-frontend-gyc5frhrczdug0cy.canadacentral-01.azurewebsites.net"
    "JWT_SECRET"                          = var.jwt_secret
    "EMAIL_USER"                          = var.email_user
    "EMAIL_PASS"                          = var.email_pass
    "PORT"                                = "5000"
    "SMTP_HOST"                           = "smtp.gmail.com"
    "SMTP_PORT"                           = "465"
    "SMTP_USER"                           = var.email_user
    "SMTP_PASS"                           = var.email_pass
  }

  identity {
    type = "SystemAssigned"
  }

  # Increase timeouts to handle API issues
  timeouts {
    create = "10m"
    read   = "10m"
    update = "10m"
    delete = "10m"
  }

  depends_on = [azurerm_service_plan.app_service_plan]
}

# Output the default hostnames
output "frontend_default_hostname" {
  value = azurerm_linux_web_app.frontend.default_hostname
}

output "backend_default_hostname" {
  value = azurerm_linux_web_app.backend.default_hostname
}

# Output the VM's public IP address
output "vm_public_ip" {
  value = azurerm_public_ip.devops_public_ip.ip_address
}