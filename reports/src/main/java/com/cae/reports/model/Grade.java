package com.cae.reports.model;

public enum Grade {
    GRADE_1A("1A"),
    GRADE_1B("1B"),
    GRADE_1C("1C"),
    GRADE_2A("2A"),
    GRADE_2B("2B"),
    GRADE_2C("2C"),
    GRADE_3A("3A"),
    GRADE_3B("3B"),
    GRADE_3C("3C");

    private final String value;

    Grade(String value) {
        this.value = value;
    }

    public String getValue() {
        return value;
    }

    public static Grade fromValue(String value) {
        for (Grade grade : values()) {
            if (grade.value.equals(value)) {
                return grade;
            }
        }
        throw new IllegalArgumentException("Unknown grade: " + value);
    }
}
