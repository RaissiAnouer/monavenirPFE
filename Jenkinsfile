pipeline {
    agent any

    environment {
        DOCKER_REGISTRY       = "nexusrepository-https.francecentral.cloudapp.azure.com:6666"
        NEXUS_CREDENTIALS_ID  = "nexus-credentials"
        AZURE_CREDENTIALS_ID  = "azure-credentials"
        NODE_VERSION          = "22"
        IMAGE_NAME_BACKEND    = "monavenir/backend"
        IMAGE_NAME_FRONTEND   = "monavenir/frontend"
        IMAGE_TAG             = "${BUILD_NUMBER}"
        SONARQUBE_URL         = "http://4.211.109.238:9000"
        SONARQUBE_TOKEN       = credentials('SonarQube')
        BACKEND_APP_NAME      = "pfe-backend"
        FRONTEND_APP_NAME     = "pfe-frontend"
        RESOURCE_GROUP        = "devops-rg"
    }

    triggers {
        githubPush()
    }

    stages {
        stage('Checkout') {
            steps {
                echo "Checking out the source code from the Git repository."
                checkout scm
            }
        }

        stage('Run The Tests') {
            parallel {
                stage('Frontend Tests') {
                    steps {
                        dir('frontend') {
                            sh "npm install"
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
                            sh "npm install"
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
                dir('server') {
                    sh "npm install"
                    sh "npm run build"
                }
                dir('frontend') {
                    sh "npm install"
                    sh "npm run build"
                }
                echo "Build stage completed successfully!"
            }
        }

        stage('Code Analyse') {
            steps {
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
            }
        }

        /*
        stage('Quality Gate') {
            steps {
                timeout(time: 2, unit: 'MINUTES') {
                    waitForQualityGate abortPipeline: true
                }
            }
        }
        */

        stage('Build Docker Images') {
            steps {
                dir('server') {
                    sh "docker build -t ${IMAGE_NAME_BACKEND}:${IMAGE_TAG} ."
                }
                dir('frontend') {
                    sh "docker build -t ${IMAGE_NAME_FRONTEND}:${IMAGE_TAG} ."
                }
                echo "Docker images built successfully!"
            }
        }

        stage('Push Docker Images to Nexus') {
            steps {
                withCredentials([usernamePassword(
                    credentialsId: "${NEXUS_CREDENTIALS_ID}",
                    usernameVariable: 'NEXUS_USERNAME',
                    passwordVariable: 'NEXUS_PASSWORD')]) {

                    sh 'echo $NEXUS_PASSWORD | docker login -u $NEXUS_USERNAME --password-stdin $DOCKER_REGISTRY'

                    sh "docker tag ${IMAGE_NAME_BACKEND}:${IMAGE_TAG} ${DOCKER_REGISTRY}/${IMAGE_NAME_BACKEND}:${IMAGE_TAG}"
                    sh "docker push ${DOCKER_REGISTRY}/${IMAGE_NAME_BACKEND}:${IMAGE_TAG}"

                    sh "docker tag ${IMAGE_NAME_FRONTEND}:${IMAGE_TAG} ${DOCKER_REGISTRY}/${IMAGE_NAME_FRONTEND}:${IMAGE_TAG}"
                    sh "docker push ${DOCKER_REGISTRY}/${IMAGE_NAME_FRONTEND}:${IMAGE_TAG}"
                }
            }
        }

        stage('Deploy to Azure App Service') {
            steps {
                echo "Deploying to Azure App Services..."

                withCredentials([
                    string(credentialsId: 'AZURE_SUBSCRIPTION_ID', variable: 'AZ_SUBSCRIPTION'),
                    usernamePassword(credentialsId: "${AZURE_CREDENTIALS_ID}", usernameVariable: 'AZURE_USER', passwordVariable: 'AZURE_PASSWORD'),
                    usernamePassword(credentialsId: "${NEXUS_CREDENTIALS_ID}", usernameVariable: 'NEXUS_USERNAME', passwordVariable: 'NEXUS_PASSWORD')
                ]) {
                    sh 'az login -u $AZURE_USER -p $AZURE_PASSWORD'
                    sh 'az account set --subscription $AZ_SUBSCRIPTION'

                    sh '''
                        az webapp config container set \
                            --name ${BACKEND_APP_NAME} \
                            --resource-group ${RESOURCE_GROUP} \
                            --container-image-name ${DOCKER_REGISTRY}/${IMAGE_NAME_BACKEND}:${IMAGE_TAG} \
                            --container-registry-url https://${DOCKER_REGISTRY} \
                            --container-registry-user $NEXUS_USERNAME \
                            --container-registry-password $NEXUS_PASSWORD || exit 1
                    '''

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
