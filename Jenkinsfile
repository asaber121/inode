pipeline {
    agent any
    
    parameters {
        choice(name: 'TARGET_ENV', choices: ['dev', 'staging', 'production'], description: 'Select the target environment')
    }

    stages {
        stage('Build') {
            steps {
                echo "Buidling.... ${params.TARGET_ENV}"
            }
        }
        
        stage('Test') {
            steps {
                echo "Testing.... ${params.TARGET_ENV}"
            }
        }
        
        stage('Deploy') {
            steps {
                echo "Deploying.... ${params.TARGET_ENV}"
            }
        }
    }
}
