# Generated by Django 4.2.1 on 2023-10-23 10:54

from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('chat', '0001_initial'),
    ]

    operations = [
        migrations.RenameField(
            model_name='room',
            old_name='message',
            new_name='messages',
        ),
    ]
