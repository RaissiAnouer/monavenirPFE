pipeline {
    agent any // Run the pipeline on any available agent

    // Environment variables for the pipeline
    environment {
        DOCKER_REGISTRY = "nexusrepository-https.francecentral.cloudapp.azure.com:6666" // Nexus Docker registry URL
        NEXUS_CREDENTIALS_ID = "nexus-credentials" // Jenkins credentials ID for Nexus
        NODE_VERSION = "22" // Node.js version for the application
        IMAGE_NAME_BACKEND = "monavenir/backend" // Backend Docker image name
        IMAGE_NAME_FRONTEND = "monavenir/frontend" // Frontend Docker image name
        IMAGE_TAG = "${BUILD_NUMBER}" // Docker image tag (Jenkins build number)
        SONARQUBE_URL = "http://4.211.109.238:9000" // SonarQube Server URL
        SONARQUBE_TOKEN = credentials('SonarQube') // SonarQube token from Jenkins credentials
        
        // Updated app service names to match exactly what's in Azure
        BACKEND_APP_NAME = "pfe-backend" // Azure App Service name for backend
        FRONTEND_APP_NAME = "pfe-frontend" // Azure App Service name for frontend
        
        BACKEND_URL = "pfe-backend-hac7djg2eubjbsar.canadacentral-01.azurewebsites.net" // Backend URL
        FRONTEND_URL = "pfe-frontend-gyc5frhrczdug0cy.canadacentral-01.azurewebsites.net" // Frontend URL
        RESOURCE_GROUP = "devops-rg" // Azure resource group name devops-rg
        AZURE_CREDENTIALS_ID = "azure-credentials" // Jenkins credentials ID for Azure
        AZURE_SUBSCRIPTION_ID = "e9ae547c-851b-4bd7-bacc-e72bb89c1221" // Explicit subscription ID
    }

    // Trigger the pipeline on GitHub push events
    triggers {
        githubPush()
    }

    stages {
        // Stage 1: Checkout the source code
        stage('Checkout') {
            steps {
                echo "Checking out the source code from the Git repository..."
                checkout scm // Clone the repository
            }
        }

        // Stage 2: Run tests in parallel for frontend and backend
        stage('Run The Tests') {
            parallel {
                // Frontend tests
                stage('Frontend Tests') {
                    steps {
                        dir('frontend') {
                            echo "Installing frontend dependencies..."
                            sh "npm install" // Install frontend dependencies
                            echo "Running frontend tests..."
                            sh "npm test -- --run" // Run frontend tests
                        }
                    }
                    post {
                        always {
                            echo "Frontend tests completed"
                        }
                        success {
                            echo "Frontend tests passed successfully!"
                        }
                        failure {
                            echo "Frontend tests failed! Please check the test logs."
                        }
                    }
                }
                
                // Backend tests
                stage('Backend Tests') {
                    steps {
                        dir('server') {
                            echo "Installing backend dependencies..."
                            sh "npm install" // Install backend dependencies
                            echo "Running backend tests..."
                            sh "npm test" // Run backend tests
                        }
                    }
                    post {
                        always {
                            echo "Backend tests completed"
                        }
                        success {
                            echo "Backend tests passed successfully!"
                        }
                        failure {
                            echo "Backend tests failed! Please check the test logs."
                        }
                    }
                }
            }
        }

        // Stage 3: Build the application
        stage('Build Application') {
            steps {
                echo "Starting the build process for the MERN e-learning platform..."

                dir('server') {
                    echo "Installing backend dependencies..."
                    sh "npm install" // Install backend dependencies
                    echo "Building backend application..."
                    sh "npm run build" // Build backend
                }

                dir('frontend') {
                    echo "Installing frontend dependencies..."
                    sh "npm install" // Install frontend dependencies
                    echo "Building frontend application..."
                    sh "npm run build" // Build frontend
                }

                echo "Build stage completed successfully!"
            }
        }

       // Stage 4: Code Analysis
        stage('Code Analyse') {
            steps {
                echo "Running SonarQube analysis..."

                dir('server') {
                    withSonarQubeEnv('SonarQube') {
                        sh '''
                            sonar-scanner \
                            -Dsonar.projectKey=server \
                            -Dsonar.sources=. \
                            -Dsonar.host.url=$SONARQUBE_URL \
                            -Dsonar.login=$SONARQUBE_TOKEN \
                            -X
                        ''' // Run SonarQube analysis for backend
                    }
                }

                dir('frontend') {
                    withSonarQubeEnv('SonarQube') {
                        sh '''
                            sonar-scanner \
                            -Dsonar.projectKey=frontend \
                            -Dsonar.sources=src \
                            -Dsonar.host.url=$SONARQUBE_URL \
                            -Dsonar.login=$SONARQUBE_TOKEN \
                            -X
                        ''' // Run SonarQube analysis for frontend
                    }
                }

                echo "SonarQube analysis is completed!"
            }
        }

        stage('Quality Gate') {
        steps {
        timeout(time: 2, unit: 'MINUTES') {
            waitForQualityGate abortPipeline: true
                }
            }
        }

        // Stage 5: Build Docker images
        stage('Build Docker Images') {
            steps {
                echo "Building Docker images for backend and frontend..."

                dir('server') {
                    echo "Building backend Docker image..."
                    sh "docker build -t ${IMAGE_NAME_BACKEND}:${IMAGE_TAG} ." // Build backend Docker image
                }

                dir('frontend') {
                    echo "Building frontend Docker image..."
                    sh "docker build -t ${IMAGE_NAME_FRONTEND}:${IMAGE_TAG} ." // Build frontend Docker image
                }

                echo "Docker images built successfully!"
            }
        }

        // Stage 6: Push Docker images to Nexus
        stage('Push Docker Images to Nexus') {
            steps {
                echo "Pushing Docker images to Nexus repository..."

                withCredentials([usernamePassword(credentialsId: "${NEXUS_CREDENTIALS_ID}",
                        usernameVariable: 'NEXUS_USERNAME', passwordVariable: 'NEXUS_PASSWORD')]) {
                    // Login to Nexus - Use script block for secure handling of credentials
                    script {
                        sh 'echo $NEXUS_PASSWORD | docker login -u $NEXUS_USERNAME --password-stdin $DOCKER_REGISTRY'
                    }

                    // Tag and push backend image
                    sh "docker tag ${IMAGE_NAME_BACKEND}:${IMAGE_TAG} ${DOCKER_REGISTRY}/${IMAGE_NAME_BACKEND}:${IMAGE_TAG}" 
                    sh "docker push ${DOCKER_REGISTRY}/${IMAGE_NAME_BACKEND}:${IMAGE_TAG}"

                    // Tag and push frontend image
                    sh "docker tag ${IMAGE_NAME_FRONTEND}:${IMAGE_TAG} ${DOCKER_REGISTRY}/${IMAGE_NAME_FRONTEND}:${IMAGE_TAG}"
                    sh "docker push ${DOCKER_REGISTRY}/${IMAGE_NAME_FRONTEND}:${IMAGE_TAG}"
                }

                echo "Docker images pushed to Nexus successfully!"
            }
        }

        // Stage 7: Deploy to Azure App Service
        stage('Deploy to Azure App Service') {
            steps {
                echo "Deploying to Azure App Services..."

                withCredentials([
                    usernamePassword(credentialsId: "${AZURE_CREDENTIALS_ID}",
                        usernameVariable: 'AZURE_USER', passwordVariable: 'AZURE_PASSWORD'),
                    usernamePassword(credentialsId: "${NEXUS_CREDENTIALS_ID}",
                        usernameVariable: 'NEXUS_USERNAME', passwordVariable: 'NEXUS_PASSWORD')
                ]) {
                    // Login to Azure - Use script block for secure handling of credentials
                    script {
                        sh 'az login -u $AZURE_USER -p $AZURE_PASSWORD'
                        sh "az account set --subscription ${AZURE_SUBSCRIPTION_ID}"
                    }

                    // Deploy Backend - Use updated parameter names
                    script {
                        sh '''
                            az webapp config container set \
                                --name ${BACKEND_APP_NAME} \
                                --resource-group ${RESOURCE_GROUP} \
                                --container-image-name ${DOCKER_REGISTRY}/${IMAGE_NAME_BACKEND}:${IMAGE_TAG} \
                                --container-registry-url https://${DOCKER_REGISTRY} \
                                --container-registry-user $NEXUS_USERNAME \
                                --container-registry-password $NEXUS_PASSWORD || exit 1
                        '''
                    }

                    // Deploy Frontend - Use updated parameter names
                    script {
                        sh '''
                            az webapp config container set \
                                --name ${FRONTEND_APP_NAME} \
                                --resource-group ${RESOURCE_GROUP} \
                                --container-image-name ${DOCKER_REGISTRY}/${IMAGE_NAME_FRONTEND}:${IMAGE_TAG} \
                                --container-registry-url https://${DOCKER_REGISTRY} \
                                --container-registry-user $NEXUS_USERNAME \
                                --container-registry-password $NEXUS_PASSWORD || exit 1
                        '''
                    }
                }

                echo "Deployment to Azure App Services completed successfully!"
            }
        }
    }

    // Post-pipeline actions
    post {
        always {
            echo "Pipeline execution completed"
            // Clean up Docker images to free up space
            sh "docker system prune -f"
        }
        success {
            echo "Pipeline executed successfully!"
        }
        failure {
            echo "Pipeline execution failed. Please check the logs for details."
        }
    }
}
