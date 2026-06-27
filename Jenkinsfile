pipeline {
    agent any
    
    environment {
        APP_NAME = 'node-app'
        APP_PORT = '9090'
        DOCKER_REGISTRY = '' // Leave empty if no registry
    }
    
    stages {
        stage('Checkout') {
            steps {
                checkout scm
                echo 'Code checked out successfully'
            }
        }
        
        stage('Install Dependencies') {
            steps {
                sh '''
                    npm ci
                '''
            }
        }
        
         
        stage('Stop Running Containers') {
            steps {
                script {
                    try {
                        sh 'docker stop ${APP_NAME} || true'
                        sh 'docker rm ${APP_NAME} || true'
                    } catch (err) {
                        echo 'No existing container to stop'
                    }
                }
            }
        }
        
        stage('Remove Old Images') {
            steps {
                script {
                    try {
                        sh 'docker rmi ${APP_NAME}:latest || true'
                    } catch (err) {
                        echo 'No old image to remove'
                    }
                }
            }
        }
        
        stage('Build Docker Image') {
            steps {
                sh '''
                    docker build -t ${APP_NAME}:latest .
                '''
            }
        }
        
        stage('Run New Container') {
            steps {
                sh '''
                    docker run -d \
                        --name ${APP_NAME} \
                        --restart unless-stopped \
                        -p ${APP_PORT}:${APP_PORT} \
                        -e APP_PORT=${APP_PORT} \
                        ${APP_NAME}:latest
                '''
            }
        }
        
        stage('Health Check') {
            steps {
                script {
                    sh 'sleep 5'
                    sh '''
                        if curl -f http://localhost:${APP_PORT}; then
                            echo "Application is running successfully"
                        else
                            echo "Application health check failed"
                            exit 1
                        fi
                    '''
                }
            }
        }
    }
    
    post {
        success {
            echo 'Deployment successful! Application running on port ${APP_PORT}'
        }
        failure {
            echo 'Deployment failed! Check logs for details'
        }
    }
}
