# Scalable DevOps Framework for Full-Stack Applications in Azure

## 📌 Project Overview

This project delivers a complete DevOps pipeline for deploying and managing a full-stack e-learning web application using Microsoft Azure. It aims to ensure scalability, reliability, and automation across the software delivery lifecycle.

The solution is built around modern DevOps principles, including CI/CD, containerization, monitoring, and Infrastructure as Code.

---

## 🏗 Architecture Summary

- **Frontend**: React (Electron.js finalized for desktop support)
- **Backend**: Node.js + Express
- **Database**: Firebase & MongoDB Atlas
- **Cloud Platform**: Microsoft Azure
- **DevOps Tools**:
  - **Jenkins**: CI/CD pipeline (build → test → Dockerize → deploy)
  - **Nexus**: Private Docker registry (hosted at `nexus-https.francecentral.cloudapp.azure.com:8082`)
  - **SonarQube**: Code quality & unit testing
  - **Terraform**: Infrastructure provisioning
  - **Ansible**: Post-provisioning configuration
  - **Prometheus + Grafana**: Monitoring and alerting
  - **Azure Monitor + Application Insights**: Deep app observability

---

## 🔁 CI/CD Pipeline

- Triggered via GitHub Webhooks
- Steps:
  1. Checkout source code
  2. Lint and test with SonarQube
  3. Build Docker images for frontend & backend
  4. Push images to Nexus
  5. Deploy to Azure App Services (frontend and backend separately)
  6. Monitor deployment success and notify stakeholders

---

## ☁ Infrastructure Setup

- Azure Virtual Network: Isolates front and back end
- Azure DNS: Custom domain routing
- Azure VM: Hosts Jenkins, Nexus, SonarQube, Prometheus
- Azure App Services: Separate for frontend and backend
- Terraform: Used for provisioning the full infrastructure
- Ansible: Installs Docker, Jenkins, and configures VM after creation

---

## 📊 Monitoring & Observability

- **Application Insights**: Tracks frontend and backend performance
- **Grafana Dashboards**: Real-time analytics from Prometheus data
- **Alert Rules**: Set on CPU, memory, and response time thresholds

---

## 🛡 Security

- HTTPS enforced for all services
- Azure RBAC for role-based access
- Docker image scanning before pushing to Nexus
- Jenkins credentials encrypted and stored securely

---
