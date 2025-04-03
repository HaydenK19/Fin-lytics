import os
from sendgrid import SendGridAPIClient
from sendgrid.helpers.mail import Mail
# This program retrieves the SendGrid API key from a file and sends an email using the SendGrid API.

# Function to retrieve the SendGrid API key from a file
def get_api_key():
    try:
        # Open the file and check for the API key
        with open('sendgrid.env', 'r', encoding='utf-16') as file:
            for line in file:
                if 'SENDGRID_API_KEY=' in line:
                    # Extract and return the API key
                    return line.strip().split('=')[1]
        return None  # Return None if no API key is found
    except Exception as e:
        return None  # Return None if there is an error

# Function to send an email using the SendGrid API
def send_email(to_email, subject, content):
    try:
        api_key = get_api_key()  # Retrieve the API key
        if not api_key:
            raise Exception("SendGrid API key not found in sendgrid.env")  # Error if no key is found
            
        sg = SendGridAPIClient(api_key)  # Create a SendGrid client using the API key
        
        # Prepare the email
        message = Mail(
            from_email='noreply@em8484.fin-lytics.com',  # Sender's email
            to_emails=to_email,  # Recipient's email
            subject=subject,  # Subject of the email
            plain_text_content=content  # Content of the email
        )
        
        response = sg.send(message)  # Send the email
        return True  # Return True if email sent successfully
    except Exception as e:
        return False  # Return False if there was an error