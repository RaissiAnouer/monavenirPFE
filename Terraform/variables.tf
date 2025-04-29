# Variable for Docker build number
variable "build_number" {
  description = "Build number for Docker image tag, typically set by Jenkins" # Description of the variable
  type        = string                                                       # Variable type
  # Removed default value to ensure it's provided dynamically
}

# Variable for resource group name
variable "resource_group_name" {
  description = "Name of the Azure resource group"                           # Description of the variable
  type        = string                                                       # Variable type
  default     = "devops-rg"                                                  # Default resource group name
}

# Variable for Azure region
variable "location" {
  description = "Azure region where resources will be deployed"               # Description of the variable
  type        = string                                                       # Variable type
  default     = "France Central"                                             # Default Azure region
}

# Variable for Nexus registry password
variable "nexus_password" {
  description = "Password for Nexus Docker registry authentication"           # Description of the variable
  type        = string                                                       # Variable type
  sensitive   = true                                                         # Mark as sensitive to avoid logging
}
