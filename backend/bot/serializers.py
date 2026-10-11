from rest_framework import serializers
from .models import BotConfiguration, CustomBotResponse

class BotConfigurationSerializer(serializers.ModelSerializer):
    class Meta:
        model = BotConfiguration
        fields = [
            'id',
            'bot_enabled',
            'auto_reply_enabled',
            'out_of_office_enabled',
            'trigger_schedule',
            'trigger_attendant',
            'trigger_location',
            'trigger_exit',
            'auto_greeting',
            'ignore_saved_contacts',
            'greeting_message',
            'absence_message',
            'confirmation_message',
            'reminder_message',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']

class CustomBotResponseSerializer(serializers.ModelSerializer):
    class Meta:
        model = CustomBotResponse
        fields = [
            'id',
            'trigger_keyword',
            'response_text',
            'match_type',
            'is_active',
            'created_at',
        ]
        read_only_fields = ['id', 'created_at']

