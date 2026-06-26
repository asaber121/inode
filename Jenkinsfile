pipeline {
    agent any

    environment {
        IMAGE = "inode:latest"
        CONTAINER = "inode"
        REPO = "git@a1:asaber121/inode.git"
    }

    stages {

        stage('Checkout') {
            steps {
                git branch: 'main',
                    credentialsId: 'github-key',
                    url: "${REPO}"
            }
        }

        stage('Build Image') {
            steps {
                sh '''
                docker build -t $IMAGE .
                '''
            }
        }

        stage('Deploy') {
            steps {
                sh '''
                docker stop $CONTAINER || true
                docker rm $CONTAINER || true

                docker run -d \
                    --name $CONTAINER \
                    --restart unless-stopped \
                    -p 9090:9090 \
                    $IMAGE
                '''
            }
        }
    }
}
