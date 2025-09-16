package com.example.schedule.converter;

import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;

import java.time.LocalDateTime;

@Converter(autoApply = true)
public class LocalDateTimeAttributeConverter implements AttributeConverter<LocalDateTime, String> {
    @Override
    public String convertToDatabaseColumn(LocalDateTime attribute) {
        return attribute != null ? attribute.toString() : null; // This returns ISO-8601
    }

    @Override
    public LocalDateTime convertToEntityAttribute(String dbData) {
        return dbData != null ? LocalDateTime.parse(dbData) : null;
    }
}

