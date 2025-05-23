provider "azurerm" {
  features {}
  subscription_id = "e9ae547c-851b-4bd7-bacc-e72bb89c1221"
}

resource "azurerm_resource_group" "devops_rg" {
  name     = "devops-rg"
  location = "France Central"
}

resource "azurerm_virtual_network" "devops_vnet" {
  name                = "devops-vnet"
  address_space       = ["10.0.0.0/16"]
  location            = azurerm_resource_group.devops_rg.location
  resource_group_name = azurerm_resource_group.devops_rg.name
}

resource "azurerm_subnet" "devops_subnet" {
  name                 = "devops-subnet"
  resource_group_name  = azurerm_resource_group.devops_rg.name
  virtual_network_name = azurerm_virtual_network.devops_vnet.name
  address_prefixes     = ["10.0.1.0/24"]
}

resource "azurerm_subnet" "app_service_subnet" {
  name                 = "app-service-subnet"
  resource_group_name  = azurerm_resource_group.devops_rg.name
  virtual_network_name = azurerm_virtual_network.devops_vnet.name
  address_prefixes     = ["10.0.2.0/24"]

  delegation {
    name = "delegation"
    service_delegation {
      name    = "Microsoft.Web/serverFarms"
      actions = ["Microsoft.Network/virtualNetworks/subnets/action"]
    }
  }
}

resource "azurerm_network_security_group" "devops_nsg" {
  name                = "devops-nsg"
  location            = azurerm_resource_group.devops_rg.location
  resource_group_name = azurerm_resource_group.devops_rg.name

  security_rule {
    name                       = "SSH"
    priority                   = 100
    direction                  = "Inbound"
    access                     = "Allow"
    protocol                   = "Tcp"
    source_port_range          = "*"
    destination_port_range     = "22"
    source_address_prefix      = "*" # Consider restricting to specific IPs for security
    destination_address_prefix = "*"
  }

  security_rule {
    name                       = "Nexus-8081"
    priority                   = 120
    direction                  = "Inbound"
    access                     = "Allow"
    protocol                   = "Tcp"
    source_port_range          = "*"
    destination_port_range     = "8081"
    source_address_prefix      = "*"
    destination_address_prefix = "*"
  }

  security_rule {
    name                       = "Nexus-80"
    priority                   = 125
    direction                  = "Inbound"
    access                     = "Allow"
    protocol                   = "Tcp"
    source_port_range          = "*"
    destination_port_range     = "80"
    source_address_prefix      = "*"
    destination_address_prefix = "*"
  }

  security_rule {
    name                       = "Nexus-8082"
    priority                   = 121
    direction                  = "Inbound"
    access                     = "Allow"
    protocol                   = "Tcp"
    source_port_range          = "*"
    destination_port_range     = "8082"
    source_address_prefix      = "*"
    destination_address_prefix = "*"
  }

  security_rule {
    name                       = "Jenkins"
    priority                   = 140
    direction                  = "Inbound"
    access                     = "Allow"
    protocol                   = "Tcp"
    source_port_range          = "*"
    destination_port_range     = "8080"
    source_address_prefix      = "*"
    destination_address_prefix = "*"
  }

  security_rule {
    name                       = "SonarQube"
    priority                   = 160
    direction                  = "Inbound"
    access                     = "Allow"
    protocol                   = "Tcp"
    source_port_range          = "*"
    destination_port_range     = "9000"
    source_address_prefix      = "*"
    destination_address_prefix = "*"
  }

  security_rule {
    name                       = "Grafana"
    priority                   = 180
    direction                  = "Inbound"
    access                     = "Allow"
    protocol                   = "Tcp"
    source_port_range          = "*"
    destination_port_range     = "3000"
    source_address_prefix      = "*"
    destination_address_prefix = "*"
  }

  security_rule {
    name                       = "Prometheus"
    priority                   = 200
    direction                  = "Inbound"
    access                     = "Allow"
    protocol                   = "Tcp"
    source_port_range          = "*"
    destination_port_range     = "9090"
    source_address_prefix      = "*"
    destination_address_prefix = "*"
  }

  security_rule {
    name                       = "Allow-443-nexus-HTTPS"
    priority                   = 220
    direction                  = "Inbound"
    access                     = "Allow"
    protocol                   = "Tcp"
    source_port_range          = "*"
    destination_port_range     = "443"
    source_address_prefix      = "*"
    destination_address_prefix = "*"
  }

  security_rule {
    name                       = "Allow-6666--nginx"
    priority                   = 240
    direction                  = "Inbound"
    access                     = "Allow"
    protocol                   = "Tcp"
    source_port_range          = "*"
    destination_port_range     = "6666"
    source_address_prefix      = "*"
    destination_address_prefix = "*"
  }

  security_rule {
    name                       = "Allow-7777-nginx"
    priority                   = 241
    direction                  = "Inbound"
    access                     = "Allow"
    protocol                   = "Tcp"
    source_port_range          = "*"
    destination_port_range     = "7777"
    source_address_prefix      = "*"
    destination_address_prefix = "*"
  }

}

resource "azurerm_subnet_network_security_group_association" "devops_nsg_assoc" {
  subnet_id                 = azurerm_subnet.devops_subnet.id
  network_security_group_id = azurerm_network_security_group.devops_nsg.id
}

resource "azurerm_public_ip" "devops_public_ip" {
  name                = "devops-public-ip"
  location            = azurerm_resource_group.devops_rg.location
  resource_group_name = azurerm_resource_group.devops_rg.name
  allocation_method   = "Static"
  sku                 = "Standard"
  domain_name_label   = "nexusrepository-https"
}

resource "azurerm_network_interface" "devops_nic" {
  name                = "devops-nic"
  location            = azurerm_resource_group.devops_rg.location
  resource_group_name = azurerm_resource_group.devops_rg.name

  ip_configuration {
    name                          = "internal"
    subnet_id                     = azurerm_subnet.devops_subnet.id
    private_ip_address_allocation = "Dynamic"
    public_ip_address_id          = azurerm_public_ip.devops_public_ip.id
  }
}

resource "azurerm_linux_virtual_machine" "devops_vm" {
  name                = "devops-vm"
  resource_group_name = azurerm_resource_group.devops_rg.name
  location            = azurerm_resource_group.devops_rg.location
  size                = "Standard_B2ms"
  admin_username      = "adminuser"
  network_interface_ids = [
    azurerm_network_interface.devops_nic.id
  ]

  admin_ssh_key {
    username   = "adminuser"
    public_key = "ssh-rsa AAAAB3NzaC1yc2EAAAADAQABAAACAQC7BHhdRwKp0NvSEmUEZebicYGglljF09GN/Fu7rlmHxilUhD0efAgXfB4/K+MdrCEI2dRJUgCYVGGwA/WfbTKl3YRiIEJpih1mDbFzOBwJ26EoBUVqjgxZ8GCRdFBfMo5fhBTspVFcshM1+xigjyuciUa6GLDcMauAErQeHV/BRM+6dFjGS49ktlpVw566MceqhzbNKHsEhyp9+sx0NiflEUucH1dmQiJh+6pRlC3ucSI2WKR8yXh+9MmkLCN6ETofjen+IgtG3yPEMeA4HDBHXxcqU5eMCPhIQ0UG7SKPwGhF4uKn8CONawgb4M7IxS0QbAR8BQn30E9FIUeur7bxwLPRH8S++MEgL4BbqqQ4S5Y4k86idoivT1+UG2nMIlxD4UweU+M+TDbx9AwGhsXMPKZAMjn/mI4l+BnlxSnIJeCU8bbprMBU+DFO4sf8SXxW61vkJZmU2Zv/xJevUP6Z5PspxZHt9I/fx3jx26dcg+FObltBZOjq3Bq8N34XcSCwAkuPMK7jdAxvObfhnKgGr4BHlrQzld/sHtkUCUE0ZrFlpjB/b6CUoEZPF36W8/033CkPQavLfB+D+sl7UsEBWfSWfIipwCY8lfEsfMd68/UzPaZbKxPrHW8UettBGkCz25lj+JcyXHmpusIp/2KaHY42nSXT2rrxO24S9pirxw== sabermefteh1925@gmail.com"
  }

  os_disk {
    caching              = "ReadWrite"
    storage_account_type = "Standard_LRS"
    disk_size_gb         = 30
  }

  source_image_reference {
    publisher = "Canonical"
    offer     = "0001-com-ubuntu-server-jammy"
    sku       = "22_04-lts"
    version   = "latest"
  }

  disable_password_authentication = true
  encryption_at_host_enabled      = false
  secure_boot_enabled            = false
  vtpm_enabled                   = false
}

# Output the public IP address
output "public_ip_address" {
  value = azurerm_public_ip.devops_public_ip.ip_address
}

output "vm_details" {
  value = {
    name                = azurerm_linux_virtual_machine.devops_vm.name
    size                = azurerm_linux_virtual_machine.devops_vm.size
    location            = azurerm_linux_virtual_machine.devops_vm.location
    admin_username      = azurerm_linux_virtual_machine.devops_vm.admin_username
    public_ip           = azurerm_public_ip.devops_public_ip.ip_address
    os_disk_size_gb     = azurerm_linux_virtual_machine.devops_vm.os_disk[0].disk_size_gb
    os_disk_type        = azurerm_linux_virtual_machine.devops_vm.os_disk[0].storage_account_type
    image_publisher     = azurerm_linux_virtual_machine.devops_vm.source_image_reference[0].publisher
    image_offer         = azurerm_linux_virtual_machine.devops_vm.source_image_reference[0].offer
    image_sku           = azurerm_linux_virtual_machine.devops_vm.source_image_reference[0].sku
    image_version       = azurerm_linux_virtual_machine.devops_vm.source_image_reference[0].version
  }
  description = "Details of the VM that will be created"
}