pipeline {
    agent any
    environment {
        BACKEND_IMAGE = "mediscan-backend"
        FRONTEND_IMAGE = "mediscan-frontend"
        BACKEND_CONTAINER = "mediscan-backend-container"
        FRONTEND_CONTAINER = "mediscan-frontend-container"
    }
    stages {
        stage('Clone Repository') {
            steps {
                git branch: 'master', url: 'https://github.com/jashu-767/MEDICINE-DETECTOR.git'
            }
        }
        stage('Install Backend Dependencies') {
            steps {
                dir('backend') {
                    bat 'npm install'
                }
            }
        }
        stage('Build Backend Image') {
            steps {
                dir('backend') {
                    bat 'docker build -t %BACKEND_IMAGE% .'
                }
            }
        }
        stage('Build Frontend Image') {
            steps {
                dir('frontend') {
                    bat 'docker build -t %FRONTEND_IMAGE% .'
                }
            }
        }
        stage('Run Backend Container') {
            steps {
                bat '''
                    docker stop %BACKEND_CONTAINER% 2>nul
                    docker rm %BACKEND_CONTAINER% 2>nul
                    docker run -d -p 5000:5000 --name %BACKEND_CONTAINER% %BACKEND_IMAGE%
                '''
            }
        }
        stage('Run Frontend Container') {
            steps {
                bat '''
                    docker stop %FRONTEND_CONTAINER% 2>nul
                    docker rm %FRONTEND_CONTAINER% 2>nul
                    docker run -d -p 3000:80 --name %FRONTEND_CONTAINER% %FRONTEND_IMAGE%
                '''
            }
        }
    }
    post {
        success {
            echo 'Backend running at: http://localhost:5000'
            echo 'Frontend running at: http://localhost:3000'
        }
        failure {
            echo 'Pipeline failed. Check logs above.'
        }
    }
}
