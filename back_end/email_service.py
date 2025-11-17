import os
import boto3
from botocore.exceptions import ClientError
# Sends emails using AWS SES (Simple Email Service)

# Function to send an email using AWS SES
def send_email(to_email, subject, content):
    try:
        # Get AWS credentials and region from environment variables
        aws_access_key_id = os.getenv('AWS_ACCESS_KEY_ID')
        aws_secret_access_key = os.getenv('AWS_SECRET_ACCESS_KEY')
        aws_region = os.getenv('AWS_REGION')
        sender_email = os.getenv('SES_SENDER_EMAIL')
        
        if not all([aws_access_key_id, aws_secret_access_key, aws_region, sender_email]):
            raise Exception("Missing AWS SES configuration in environment variables")
        
        # Create SES client
        ses_client = boto3.client(
            'ses',
            aws_access_key_id=aws_access_key_id,
            aws_secret_access_key=aws_secret_access_key,
            region_name=aws_region
        )
        
        # Send the email
        response = ses_client.send_email(
            Source=sender_email,
            Destination={
                'ToAddresses': [to_email]
            },
            Message={
                'Subject': {
                    'Data': subject,
                    'Charset': 'UTF-8'
                },
                'Body': {
                    'Text': {
                        'Data': content,
                        'Charset': 'UTF-8'
                    }
                }
            }
        )
        
        print(f"Email sent successfully. Message ID: {response['MessageId']}")
        return True  # Return True if email sent successfully
        
    except ClientError as e:
        error_code = e.response['Error']['Code']
        error_message = e.response['Error']['Message']
        print(f"AWS SES ClientError - Code: {error_code}, Message: {error_message}")
        return False
    except Exception as e:
        print(f"Email sending failed: {str(e)}")
        return False  # Return False if there was an error
