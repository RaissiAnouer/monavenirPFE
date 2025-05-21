# Variable for Docker build number
variable "build_number" {
  description = "Build number for Docker image tag, typically set by Jenkins"
  type        = string
  default     = "1"  # Default value for local runs; Jenkins will override this
}

# Variable for resource group name
variable "resource_group_name" {
  description = "Name of the Azure resource group"
  type        = string
  default     = "devops-rg"
}

# Variable for Azure region
variable "location" {
  description = "Azure region where resources will be deployed"
  type        = string
  default     = "France Central"
}

# Variable for Nexus registry password
variable "nexus_password" {
  description = "Password for Nexus Docker registry authentication"
  type        = string
  sensitive   = true
}

# Variable for MongoDB connection string
variable "mongo_uri" {
  description = "MongoDB connection string"
  type        = string
  sensitive   = true
}

# Variable for JWT secret
variable "jwt_secret" {
  description = "Secret key for JWT token generation"
  type        = string
  sensitive   = true
}

# Variable for email configuration
variable "email_user" {
  description = "Email username for SMTP configuration"
  type        = string
  sensitive   = true
}

# Variable for email password
variable "email_pass" {
  description = "Email password for SMTP configuration"
  type        = string
  sensitive   = true
}