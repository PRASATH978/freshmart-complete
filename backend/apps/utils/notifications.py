import requests

def send_push_notification(user, title, body, data={}):
    from apps.users.models import PushToken
    
    tokens = PushToken.objects.filter(user=user).values_list('token', flat=True)
    
    if not tokens:
        return
    
    messages = [
        {
            'to': token,
            'sound': 'default',
            'title': title,
            'body': body,
            'data': data,
        }
        for token in tokens
    ]
    
    requests.post(
        'https://exp.host/--/api/v2/push/send',
        json=messages,
        headers={
            'Content-Type': 'application/json',
            'Accept': 'application/json',
        }
    )