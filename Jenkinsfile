pipeline {
    agent any
    
    environment {
        S3_BUCKET = 'trng2309-1'
        AWS_REGION = 'us-east-2'
        EXTERNAL_PORT = '8081'
        INTERNAL_PORT = '8080'
<<<<<<< HEAD
        
=======
        CI = 'false';
>>>>>>> 6cf998befc606f507592d693d344c49a3c0873cb
    }
    
    stages {
        stage('Checkout') {
            steps {
                git branch: 'main',
                    url: 'https://github.com/revature-sam/ecom-project-front-end'
            }
        }
        
        stage('Build React Frontend') {
            steps {
                dir('front-end') {
                    sh 'npm install'
                    sh 'npm run build'
                }
            }
        }
        
        stage('Deploy Frontend to S3') {
            steps {
                dir('front-end/dist') {
                    sh 'aws s3 sync . s3://${S3_BUCKET}/ --delete --region ${AWS_REGION}'
                }
            }
        }
    }
    
    post {
        success {
            echo 'Deployment successful!'
        }
        failure {
            echo 'Deployment failed!'
        }
    }
}
