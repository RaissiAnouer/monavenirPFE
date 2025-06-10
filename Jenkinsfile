pipeline {
    agent any

    environment {
        DOCKER_REGISTRY = "nexusrepository-https.francecentral.cloudapp.azure.com:6666"
        NEXUS_CREDENTIALS_ID = "nexus-credentials"
        NODE_VERSION = "22"
        IMAGE_NAME_BACKEND = "monavenir/backend"
        IMAGE_NAME_FRONTEND = "monavenir/frontend"
        IMAGE_TAG = "${BUILD_NUMBER}"
        SONARQUBE_URL = "http://4.211.109.238:9000"
        SONARQUBE_TOKEN = credentials('SonarQube')
        BACKEND_APP_NAME = "pfe-backend"
        FRONTEND_APP_NAME = "pfe-frontend"
        BACKEND_URL = "pfe-backend-hac7djg2eubjbsar.canadacentral-01.azurewebsites.net"
        FRONTEND_URL = "pfe-frontend-gyc5frhrczdug0cy.canadacentral-01.azurewebsites.net"
        RESOURCE_GROUP = "devops-rg"
        AZURE_CREDENTIALS_ID = "azure-credentials"
        AZURE_SUBSCRIPTION_ID = "e9ae547c-851b-4bd7-bacc-e72bb89c1221"
    }

    triggers {
        githubPush()
    }

    stages {
        stage('Checkout Stage') {
            steps {
                echo "Checking out the source code from the Git repository..."
                checkout scm
            }
        }

        stage('Run The Tests') {
            parallel {
                stage('Frontend Tests') {
                    steps {
                        dir('frontend') {
                            echo "Installing frontend dependencies..."
                            sh "npm install"
                            echo "Running frontend tests..."
                            sh "npm test -- --run"
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
                
                stage('Backend Tests') {
                    steps {
                        dir('server') {
                            echo "Installing backend dependencies..."
                            sh "npm install"
                            echo "Running backend tests..."
                            sh "npm test"
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

        stage('Build Application') {
            steps {
                echo "Starting the build process for the MERN e-learning platform..."

                dir('server') {
                    echo "Installing backend dependencies..."
                    sh "npm install"
                    echo "Building backend application..."
                    sh "npm run build"
                }

                dir('frontend') {
                    echo "Installing frontend dependencies..."
                    sh "npm install"
                    echo "Building frontend application..."
                    sh "npm run build"
                }

                echo "Build stage completed successfully!"
            }
        }

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
                        '''
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
                        '''
                    }
                }

                echo "SonarQube analysis is completed!"
            }
        }

        /*   stage('Quality Gate') {
            steps {
                timeout(time: 2, unit: 'MINUTES') {
                    waitForQualityGate abortPipeline: true
                }
            }
        } */

        stage('Build Docker Images') {
            steps {
                echo "Building Docker images for backend and frontend..."

                dir('server') {
                    echo "Building backend Docker image..."
                    sh "docker build -t ${IMAGE_NAME_BACKEND}:${IMAGE_TAG} ."
                }

                dir('frontend') {
                    echo "Building frontend Docker image..."
                    sh "docker build -t ${IMAGE_NAME_FRONTEND}:${IMAGE_TAG} ."
                }

                echo "Docker images built successfully!"
            }
        }


        stage('Push Docker Images to Nexus') {
            steps {
                echo "Pushing Docker images to Nexus repository..."

                withCredentials([usernamePassword(credentialsId: "${NEXUS_CREDENTIALS_ID}",
                        usernameVariable: 'NEXUS_USERNAME', passwordVariable: 'NEXUS_PASSWORD')]) {
                    script {
                        sh 'echo $NEXUS_PASSWORD | docker login -u $NEXUS_USERNAME --password-stdin $DOCKER_REGISTRY'
                    }

                    sh "docker tag ${IMAGE_NAME_BACKEND}:${IMAGE_TAG} ${DOCKER_REGISTRY}/${IMAGE_NAME_BACKEND}:${IMAGE_TAG}" 
                    sh "docker push ${DOCKER_REGISTRY}/${IMAGE_NAME_BACKEND}:${IMAGE_TAG}"

                    sh "docker tag ${IMAGE_NAME_FRONTEND}:${IMAGE_TAG} ${DOCKER_REGISTRY}/${IMAGE_NAME_FRONTEND}:${IMAGE_TAG}"
                    sh "docker push ${DOCKER_REGISTRY}/${IMAGE_NAME_FRONTEND}:${IMAGE_TAG}"
                }

                echo "Docker images pushed to Nexus successfully!"
            }
        }

        stage('Deploy to Azure App Service') {
            steps {
                echo "Deploying to Azure App Services..."

                withCredentials([
                    usernamePassword(credentialsId: "${AZURE_CREDENTIALS_ID}",
                        usernameVariable: 'AZURE_USER', passwordVariable: 'AZURE_PASSWORD'),
                    usernamePassword(credentialsId: "${NEXUS_CREDENTIALS_ID}",
                        usernameVariable: 'NEXUS_USERNAME', passwordVariable: 'NEXUS_PASSWORD')
                ]) {
                    script {
                        sh 'az login -u $AZURE_USER -p $AZURE_PASSWORD'
                        sh "az account set --subscription ${AZURE_SUBSCRIPTION_ID}"
                    }

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
     

    post {
        always {
            echo "Pipeline execution completed"
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
